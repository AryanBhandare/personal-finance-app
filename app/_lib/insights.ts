"use server";

import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { getTransaction } from "./actions";
import { getSessionUserId } from "./supabase/server";

const CATEGORIES = [
  "budget",
  "savings",
  "bills",
  "spending",
  "income",
] as const;
const PRIORITIES = ["high", "medium", "low"] as const;

// Enums are plain strings in the schema (not every provider enforces them),
// then normalised below so one odd value can't fail the whole response.
const InsightsSchema = z.object({
  summary: z.string(),
  recommendations: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      category: z.string().describe(`One of: ${CATEGORIES.join(", ")}`),
      priority: z.string().describe(`One of: ${PRIORITIES.join(", ")}`),
      estimated_monthly_savings: z.number().nullable(),
    }),
  ),
});

type ParsedInsights = z.infer<typeof InsightsSchema>;

export type Recommendation = {
  title: string;
  detail: string;
  category: (typeof CATEGORIES)[number];
  priority: (typeof PRIORITIES)[number];
  estimated_monthly_savings: number | null;
};

export type InsightsSource = "claude" | "gemini" | "openrouter" | "rules";

export type InsightsResult =
  | {
      ok: true;
      summary: string;
      recommendations: Recommendation[];
      generatedAt: string;
      source: InsightsSource;
      notice?: string;
    }
  | { ok: false; error: string };

type Trx = {
  name: string;
  category?: string;
  date: string;
  amount: number;
  recurring?: boolean;
};
type Budget = { category: string; maximum: number };
type Pot = { name: string; target: number; total: number };
type Snapshot = ReturnType<typeof buildSnapshot>;

const SYSTEM_PROMPT = `You are a personal finance coach inside a budgeting app. You receive a JSON snapshot of one user's finances: balances, budgets with what they've spent per category over the last 30 days of activity, savings pots, recurring bills, and recent transactions. Amounts are in US dollars; negative transaction amounts are money spent.

Give 3 to 4 specific, actionable recommendations grounded in the numbers in the snapshot. Reference the actual categories, merchants, pots, and dollar amounts. Prefer changes the user can make in this app: adjusting a budget limit, moving money into a pot, reviewing a recurring bill, cutting a spending category. Order them by priority. Keep each title under 60 characters and each detail to 1-2 sentences. Set estimated_monthly_savings only when you can derive a figure from the data; otherwise null. The summary is one sentence describing the overall picture.

This is general guidance, not regulated financial advice: don't recommend specific investment products.`;

// Per-user cache so re-opening the overview doesn't re-run the same snapshot.
const cache = new Map<string, { hash: string; result: InsightsResult }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

const round = (n: number) => Math.round(n * 100) / 100;

function normalise(rec: ParsedInsights["recommendations"][number]) {
  const category = rec.category.toLowerCase();
  const priority = rec.priority.toLowerCase();
  return {
    ...rec,
    category: (CATEGORIES as readonly string[]).includes(category)
      ? (category as Recommendation["category"])
      : "spending",
    priority: (PRIORITIES as readonly string[]).includes(priority)
      ? (priority as Recommendation["priority"])
      : "medium",
  } satisfies Recommendation;
}

function buildSnapshot(data: {
  balance?: { current: number; income: number; expenses: number };
  transactions?: Trx[];
  budgets?: Budget[];
  pots?: Pot[];
}) {
  const transactions = [...(data.transactions ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Budgets are monthly, so compare them against the latest 30 days of
  // activity rather than all-time totals.
  const latest = transactions[0] ? new Date(transactions[0].date).getTime() : 0;
  const windowStart = latest - 30 * 24 * 60 * 60 * 1000;

  const spentByCategory = new Map<string, number>();
  for (const trx of transactions) {
    if (
      trx.amount < 0 &&
      trx.category &&
      new Date(trx.date).getTime() >= windowStart
    ) {
      spentByCategory.set(
        trx.category,
        (spentByCategory.get(trx.category) ?? 0) + Math.abs(trx.amount),
      );
    }
  }

  const recurring = new Map<string, Trx>();
  for (const trx of transactions) {
    if (trx.recurring && !recurring.has(trx.name)) recurring.set(trx.name, trx);
  }

  const budgets = data.budgets ?? [];

  return {
    today: new Date().toISOString().slice(0, 10),
    balance: data.balance,
    budgets: budgets.map((b) => ({
      category: b.category,
      limit: b.maximum,
      spent_last_30_days: round(spentByCategory.get(b.category) ?? 0),
    })),
    unbudgeted_spending_last_30_days: Array.from(spentByCategory.entries())
      .filter(([cat]) => !budgets.some((b) => b.category === cat))
      .map(([category, spent]) => ({ category, spent: round(spent) }))
      .sort((a, b) => b.spent - a.spent),
    pots: (data.pots ?? []).map((p) => ({
      name: p.name,
      saved: p.total,
      target: p.target,
    })),
    recurring_bills: Array.from(recurring.values()).map((t) => ({
      name: t.name,
      amount: Math.abs(t.amount),
      last_paid: t.date.slice(0, 10),
    })),
    recent_transactions: transactions.slice(0, 40).map((t) => ({
      name: t.name,
      category: t.category,
      amount: t.amount,
      date: t.date.slice(0, 10),
    })),
  };
}

function snapshotPrompt(snapshot: Snapshot) {
  return `Here is my financial snapshot:\n\n${JSON.stringify(snapshot)}`;
}

async function askClaude(snapshot: Snapshot): Promise<ParsedInsights> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: betaZodOutputFormat(InsightsSchema),
    },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: snapshotPrompt(snapshot) }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Claude returned no insights (${response.stop_reason})`);
  }
  return response.parsed_output;
}

async function askGemini(snapshot: Snapshot): Promise<ParsedInsights> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    contents: snapshotPrompt(snapshot),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(InsightsSchema),
    },
  });

  if (!response.text) throw new Error("Gemini returned an empty response");
  return InsightsSchema.parse(JSON.parse(response.text));
}

class OpenRouterError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Free chat models that support structured output, tried in order. Free
// models are often briefly overloaded or rate-limited, so we keep several.
// The generic "openrouter/free" router is left out: it can land on tiny or
// non-chat models that don't produce usable recommendations.
const OPENROUTER_FREE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "qwen/qwen3.8-27b:free",
  "dots-studio/dots-3-note-preview:free",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class UnreadableResponseError extends Error {}

// OpenRouter has no official JS SDK; its API is a plain HTTPS endpoint.
async function askOpenRouterModel(
  model: string,
  snapshot: Snapshot,
): Promise<ParsedInsights> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Personal Finance App",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: snapshotPrompt(snapshot) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "insights",
          strict: true,
          schema: z.toJSONSchema(InsightsSchema),
        },
      },
      provider: { require_parameters: true },
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    throw new OpenRouterError(
      body?.error?.code ?? res.status,
      body?.error?.message ?? `OpenRouter request failed (${res.status})`,
    );
  }

  const text: string | undefined = body?.choices?.[0]?.message?.content;
  if (!text) throw new UnreadableResponseError(`${model}: empty response`);
  // Some free models wrap JSON in a code fence despite the schema.
  const json = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return InsightsSchema.parse(JSON.parse(json));
  } catch {
    throw new UnreadableResponseError(
      `${model}: response wasn't valid insights JSON: ${text.slice(0, 80)}`,
    );
  }
}

async function askOpenRouter(snapshot: Snapshot): Promise<ParsedInsights> {
  const models = process.env.OPENROUTER_MODEL
    ? [process.env.OPENROUTER_MODEL]
    : OPENROUTER_FREE_MODELS;

  // Stop trying after a minute so the fallback tips appear in reasonable time.
  const deadline = Date.now() + 60_000;
  const errors: unknown[] = [];
  for (const model of models) {
    if (Date.now() > deadline) break;
    // One quick retry when a model is momentarily overloaded.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await askOpenRouterModel(model, snapshot);
      } catch (error) {
        // A bad key won't work for any model; stop instead of retrying.
        if (
          error instanceof OpenRouterError &&
          [401, 402, 403].includes(error.status)
        ) {
          throw error;
        }
        console.error(`OpenRouter model ${model} failed:`, error);
        errors.push(error);
        const overloaded =
          error instanceof OpenRouterError &&
          (error.status === 502 || error.status === 503);
        if (!overloaded || Date.now() > deadline) break;
        await sleep(1500);
      }
    }
  }

  // Report "busy" over "unreadable" so the notice reflects the main cause.
  throw (
    errors.find(
      (e) => e instanceof OpenRouterError && [429, 502, 503].includes(e.status),
    ) ?? errors[errors.length - 1]
  );
}

function ruleBasedInsights(snapshot: Snapshot): ParsedInsights {
  const recs: ParsedInsights["recommendations"] = [];
  const { balance, budgets, pots, recurring_bills } = snapshot;

  if (balance && balance.expenses > balance.income) {
    recs.push({
      title: "You're spending more than you earn",
      detail: `Expenses of $${round(balance.expenses)} are above income of $${round(balance.income)}. Look at your largest categories below for places to cut back.`,
      category: "income",
      priority: "high",
      estimated_monthly_savings: round(balance.expenses - balance.income),
    });
  }

  const overBudget = budgets
    .filter((b) => b.limit > 0 && b.spent_last_30_days > b.limit)
    .sort(
      (a, b) =>
        b.spent_last_30_days - b.limit - (a.spent_last_30_days - a.limit),
    );
  for (const b of overBudget.slice(0, 2)) {
    const over = round(b.spent_last_30_days - b.limit);
    recs.push({
      title: `${b.category} is $${over} over budget`,
      detail: `You've spent $${b.spent_last_30_days} against a $${b.limit} limit in the last 30 days. Trim spending here or raise the limit to something realistic.`,
      category: "budget",
      priority: "high",
      estimated_monthly_savings: over,
    });
  }

  const nearLimit = budgets.find(
    (b) =>
      b.limit > 0 &&
      b.spent_last_30_days <= b.limit &&
      b.spent_last_30_days / b.limit >= 0.8,
  );
  if (nearLimit) {
    const pct = Math.round(
      (nearLimit.spent_last_30_days / nearLimit.limit) * 100,
    );
    recs.push({
      title: `${nearLimit.category} budget is ${pct}% used`,
      detail: `Only $${round(nearLimit.limit - nearLimit.spent_last_30_days)} left of your $${nearLimit.limit} ${nearLimit.category} budget. Hold off on extra spending here for now.`,
      category: "budget",
      priority: "medium",
      estimated_monthly_savings: null,
    });
  }

  const topUnbudgeted = snapshot.unbudgeted_spending_last_30_days[0];
  if (topUnbudgeted && topUnbudgeted.spent >= 50) {
    recs.push({
      title: `Set a budget for ${topUnbudgeted.category}`,
      detail: `You spent $${topUnbudgeted.spent} on ${topUnbudgeted.category} in the last 30 days without a budget. A limit makes this easier to keep in check.`,
      category: "spending",
      priority: "medium",
      estimated_monthly_savings: null,
    });
  }

  const behindPot = pots
    .filter((p) => p.target > 0 && p.saved / p.target < 0.5)
    .sort((a, b) => a.saved / a.target - b.saved / b.target)[0];
  if (behindPot) {
    const pct = Math.round((behindPot.saved / behindPot.target) * 100);
    recs.push({
      title: `Top up your ${behindPot.name} pot`,
      detail: `It's ${pct}% of the way to its $${behindPot.target} target. Moving a fixed amount in each month keeps it on track.`,
      category: "savings",
      priority: "low",
      estimated_monthly_savings: null,
    });
  }

  const priciestBill = [...recurring_bills].sort(
    (a, b) => b.amount - a.amount,
  )[0];
  if (priciestBill) {
    recs.push({
      title: `Review your ${priciestBill.name} bill`,
      detail: `At $${round(priciestBill.amount)} it's your largest recurring bill. Check whether a cheaper plan or cancelling makes sense.`,
      category: "bills",
      priority: "low",
      estimated_monthly_savings: null,
    });
  }

  const onTrack =
    overBudget.length === 0 && balance && balance.expenses <= balance.income;
  return {
    summary: onTrack
      ? "You're within your budgets overall. A few small tweaks could help you save more."
      : "Some of your spending is running ahead of your plan. Start with the high-priority items below.",
    recommendations: recs.slice(0, 4),
  };
}

function errorStatus(error: unknown) {
  if (error instanceof Anthropic.APIError) return error.status;
  if (error instanceof ApiError || error instanceof OpenRouterError) {
    return error.status;
  }
  return undefined;
}

function describeAiError(error: unknown) {
  const status = errorStatus(error);
  const fallback = "so these tips come from your numbers directly.";
  if (status === 429 || status === 502 || status === 503) {
    return `The free AI models are busy right now, ${fallback} Try Refresh in a minute.`;
  }
  if (status === 401 || status === 402 || status === 403) {
    return `The AI service rejected the API key, ${fallback} Check the key in .env.local.`;
  }
  if (status === 400 || status === 404) {
    return `The AI service rejected the request (check the model name in .env.local), ${fallback}`;
  }
  if (error instanceof UnreadableResponseError) {
    return `The AI model sent back a reply the app couldn't read, ${fallback} Try Refresh.`;
  }
  return `The AI service couldn't be reached, ${fallback}`;
}

export async function getInsights({
  force = false,
  cachedOnly = false,
} = {}): Promise<InsightsResult | null> {
  const userId = await getSessionUserId();
  if (!userId) {
    return cachedOnly
      ? null
      : { ok: false, error: "You need to be logged in." };
  }

  const data = await getTransaction();
  if (!data) {
    return cachedOnly
      ? null
      : { ok: false, error: "Add some transactions first." };
  }

  const snapshot = buildSnapshot(data);
  const { today, ...stable } = snapshot;
  const hash = createHash("sha256")
    .update(JSON.stringify(stable))
    .digest("hex");

  const cached = cache.get(userId);
  const fresh =
    cached?.hash === hash &&
    cached.result.ok &&
    Date.now() - new Date(cached.result.generatedAt).getTime() < CACHE_TTL_MS;
  if (fresh && !force) return cached!.result;
  if (cachedOnly) return null;

  // Try each configured provider in order, then fall back to local rules.
  const providers: [
    InsightsSource,
    (s: Snapshot) => Promise<ParsedInsights>,
  ][] = [];
  if (process.env.ANTHROPIC_API_KEY) providers.push(["claude", askClaude]);
  if (process.env.GEMINI_API_KEY) providers.push(["gemini", askGemini]);
  if (process.env.OPENROUTER_API_KEY) {
    providers.push(["openrouter", askOpenRouter]);
  }

  let parsed: ParsedInsights | undefined;
  let source: InsightsSource = "rules";
  let notice: string | undefined;

  for (const [name, ask] of providers) {
    try {
      parsed = await ask(snapshot);
      source = name;
      notice = undefined;
      break;
    } catch (error) {
      console.error(`Insights (${name}) failed:`, error);
      notice = describeAiError(error);
    }
  }

  if (!parsed) {
    parsed = ruleBasedInsights(snapshot);
    notice ??=
      "These tips come from your numbers directly. Add GEMINI_API_KEY or OPENROUTER_API_KEY to .env.local for AI-written recommendations.";
  }

  const result: InsightsResult = {
    ok: true,
    summary: parsed.summary,
    recommendations: parsed.recommendations.slice(0, 4).map(normalise),
    generatedAt: new Date().toISOString(),
    source,
    notice,
  };
  // Only cache AI results; rule-based tips are free to recompute and
  // shouldn't hide a newly added key.
  if (source !== "rules") cache.set(userId, { hash, result });
  return result;
}
