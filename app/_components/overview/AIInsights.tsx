"use client";

import { useEffect, useState } from "react";
import {
  LuCalendarClock,
  LuPieChart,
  LuPiggyBank,
  LuRefreshCw,
  LuShoppingBag,
  LuSparkles,
  LuTrendingUp,
} from "react-icons/lu";
import {
  getInsights,
  InsightsResult,
  InsightsSource,
  Recommendation,
} from "@/app/_lib/insights";
import { formatCurrency } from "@/app/_lib/dats-services";

const categoryStyles: Record<
  Recommendation["category"],
  { icon: JSX.Element; chip: string; label: string }
> = {
  budget: {
    icon: <LuPieChart size={18} />,
    chip: "bg-secondary-cyan/20 text-[#2c7d8f]",
    label: "Budget",
  },
  savings: {
    icon: <LuPiggyBank size={18} />,
    chip: "bg-secondary-green/10 text-secondary-green",
    label: "Savings",
  },
  bills: {
    icon: <LuCalendarClock size={18} />,
    chip: "bg-secondary-yellow/40 text-secondary-brown",
    label: "Bills",
  },
  spending: {
    icon: <LuShoppingBag size={18} />,
    chip: "bg-secondary-red/10 text-secondary-red",
    label: "Spending",
  },
  income: {
    icon: <LuTrendingUp size={18} />,
    chip: "bg-secondary-purple/10 text-secondary-purple",
    label: "Income",
  },
};

const sourceLabels: Record<InsightsSource, string> = {
  claude: "Powered by Claude",
  gemini: "Powered by Gemini",
  openrouter: "Powered by OpenRouter",
  rules: "Smart tips",
};

const priorityStyles: Record<Recommendation["priority"], string> = {
  high: "bg-secondary-red/10 text-secondary-red",
  medium: "bg-secondary-yellow/40 text-secondary-brown",
  low: "bg-beige-100 text-grey-500",
};

function AIInsights() {
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Show a cached result without triggering a new (billed) generation.
  useEffect(() => {
    getInsights({ cachedOnly: true })
      .then((cached) => cached && setResult(cached))
      .catch(() => {});
  }, []);

  async function generate(force = false) {
    setLoading(true);
    try {
      setResult(await getInsights({ force }));
    } catch {
      setResult({ ok: false, error: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  }

  const hasInsights = result?.ok === true;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-secondary-white border border-grey-900/[0.04] shadow-card p-5 md:p-6">
      <span className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-secondary-green/10 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#1d5e5b] to-[#3a9a8f] text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_-8px_rgba(39,124,120,0.8)]">
            <LuSparkles size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-grey-900">
              AI Insights
            </h3>
            <p className="text-xs text-grey-500">
              {hasInsights
                ? `${sourceLabels[result.source]} · Updated ${new Date(
                    result.generatedAt,
                  ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : "Personalised tips based on your budgets, pots and bills"}
            </p>
          </div>
        </div>

        {hasInsights ? (
          <button
            onClick={() => generate(true)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-grey-900/10 px-3.5 py-2 text-sm font-semibold text-grey-900 hover:bg-beige-100 disabled:opacity-50 transition-colors"
          >
            <LuRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        ) : (
          <button
            onClick={() => generate()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-grey-900 px-4 py-2.5 text-sm font-semibold text-beige-100 shadow-sm hover:bg-grey-900/85 disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            <LuSparkles size={16} className={loading ? "animate-pulse" : ""} />
            {loading ? "Analysing…" : "Get recommendations"}
          </button>
        )}
      </div>

      <div className="relative">
        {loading ? (
          <LoadingState />
        ) : result && !result.ok ? (
          <p className="mt-5 rounded-xl bg-secondary-red/10 px-4 py-3 text-sm text-secondary-red">
            {result.error}
          </p>
        ) : hasInsights ? (
          <div className="animate-fade-up">
            {result.notice ? (
              <p className="mt-5 rounded-xl bg-secondary-yellow/25 px-4 py-3 text-xs leading-relaxed text-secondary-brown">
                {result.notice}
              </p>
            ) : null}
            <p className="mt-5 text-sm leading-relaxed text-grey-500">
              {result.summary}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {result.recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))}
            </div>
            <p className="mt-4 text-[11px] text-grey-300">
              {result.source === "rules"
                ? "Calculated from your account data."
                : "Generated by AI from your account data."}{" "}
              General guidance, not financial advice.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const style = categoryStyles[rec.category] ?? categoryStyles.spending;
  return (
    <article className="flex gap-4 rounded-2xl bg-beige-100/70 p-4 transition-colors hover:bg-beige-100">
      <span
        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${style.chip}`}
      >
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-bold text-grey-900">{rec.title}</h4>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              priorityStyles[rec.priority]
            }`}
          >
            {rec.priority}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-grey-500">
          {rec.detail}
        </p>
        {rec.estimated_monthly_savings ? (
          <p className="mt-2 text-xs font-bold text-secondary-green">
            Save ~{formatCurrency(rec.estimated_monthly_savings)}/month
          </p>
        ) : null}
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="mt-5">
      <div className="h-3.5 w-3/4 rounded-full bg-beige-100 animate-pulse" />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-4 rounded-2xl bg-beige-100/70 p-4 animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <span className="h-10 w-10 rounded-xl bg-beige-100 shrink-0" />
            <div className="flex-1 space-y-2.5 py-1">
              <div className="h-3 w-2/3 rounded-full bg-beige-100" />
              <div className="h-2.5 w-full rounded-full bg-beige-100" />
              <div className="h-2.5 w-5/6 rounded-full bg-beige-100" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-grey-500">
        Reviewing your budgets, pots and bills. This can take up to a minute.
      </p>
    </div>
  );
}

export default AIInsights;
