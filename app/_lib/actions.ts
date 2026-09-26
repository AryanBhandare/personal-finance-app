"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateUniqueId, getData } from "./dats-services";
import { createClient, requireUserId } from "./supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

type BalanceType = {
  current: number;
  income: number;
  expenses: number;
};

type Pot = { id: string; name: string; target: number; total: number };
type Budget = { id: string; category: string; maximum: number };

const THEMES = [
  "green",
  "yellow",
  "cyan",
  "navy",
  "red",
  "purple",
  "lightPurple",
  "turquoise",
  "brown",
  "magenta",
  "blue",
  "navyGrey",
  "amyGreen",
  "gold",
  "orange",
] as const;

const money = z.coerce.number().finite().positive().max(10_000_000);

const fail = (error: string): ActionResult => ({ ok: false, error });

// ---------------------------------------------------------------------------
// Account setup
// ---------------------------------------------------------------------------

// Creates the user's profile and finance rows on first sign-in. Profile
// details come from the metadata stored at sign-up.
async function ensureAccount(userId: string) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("owners")
    .select("user_id, isDemo")
    .eq("user_id", userId)
    .maybeSingle();

  let isDemo = profile?.isDemo ?? false;

  if (!profile) {
    const { data: auth } = await supabase.auth.getUser();
    const meta = auth.user?.user_metadata ?? {};
    isDemo = Boolean(meta.isDemo);

    const { error } = await supabase.from("owners").insert([
      {
        user_id: userId,
        email: auth.user?.email,
        name: meta.name ?? auth.user?.email?.split("@")[0] ?? "",
        avatar: meta.avatar ?? "",
        isDemo,
      },
    ]);
    if (error) console.error("Error creating profile:", error.message);
  }

  const { data: account } = await supabase
    .from("accountsTrx")
    .select("owners_id")
    .eq("owners_id", userId)
    .maybeSingle();

  if (!account) {
    const demo = getData();
    const { error } = await supabase.from("accountsTrx").insert([
      isDemo && demo
        ? {
            owners_id: userId,
            transactions: demo.transactions,
            budgets: demo.budgets,
            balance: demo.balance,
            pots: demo.pots,
          }
        : {
            owners_id: userId,
            transactions: [],
            budgets: [],
            balance: { income: 10000, current: 10000, expenses: 0 },
            pots: [],
          },
    ]);
    if (error) console.error("Error creating account:", error.message);
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getTransaction() {
  const userId = await requireUserId();
  const supabase = createClient();

  const select = () =>
    supabase
      .from("accountsTrx")
      .select("*")
      .eq("owners_id", userId)
      .maybeSingle();

  let { data, error } = await select();
  if (!data && !error) {
    await ensureAccount(userId);
    ({ data, error } = await select());
  }

  if (error) console.error("Error fetching account:", error.message);
  return data;
}

export async function getUser() {
  const userId = await requireUserId();
  const supabase = createClient();

  const select = () =>
    supabase.from("owners").select("*").eq("user_id", userId).maybeSingle();

  let { data } = await select();
  if (!data) {
    await ensureAccount(userId);
    ({ data } = await select());
  }

  return data;
}

// Only a receiver's public details, via a database function (see
// supabase/migrations), since row-level security hides other users' rows.
export async function getReceiver(id: string) {
  await requireUserId();
  const { data, error } = await createClient().rpc("get_receiver", {
    receiver_id: id.trim(),
  });

  if (error) {
    console.error("Error looking up receiver:", error.message);
    return null;
  }
  return data?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

export async function createTrx(
  receiverId: string,
  amount: number,
  category: string,
): Promise<ActionResult> {
  await requireUserId();

  const parsed = z
    .object({
      receiverId: z.string().trim().min(1),
      amount: money,
      category: z.string().trim().min(1).max(40),
    })
    .safeParse({ receiverId, amount, category });
  if (!parsed.success) return fail("Check the account ID and amount.");

  // Validation, balance checks and both account updates happen atomically
  // inside the database function.
  const { error } = await createClient().rpc("transfer_money", {
    receiver_id: parsed.data.receiverId,
    amount: parsed.data.amount,
    category: parsed.data.category,
  });

  if (error) {
    console.error("Transfer failed:", error.message);
    if (error.code === "PGRST202") {
      return fail(
        "Transfers aren't set up yet. Run the SQL in supabase/migrations first.",
      );
    }
    return fail(error.message || "Transfer failed. Try again.");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

async function getOwnAccount<T extends string>(columns: T) {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accountsTrx")
    .select(columns)
    .eq("owners_id", userId)
    .single();
  return { userId, supabase, data: data as Record<string, any> | null, error };
}

async function updateOwnAccount(fields: Record<string, unknown>) {
  const userId = await requireUserId();
  return createClient()
    .from("accountsTrx")
    .update(fields)
    .eq("owners_id", userId);
}

const newBudgetSchema = z.object({
  category: z.string().trim().min(1).max(40),
  maximum: money,
  theme: z.enum(THEMES),
});

export async function createBudget(input: unknown): Promise<ActionResult> {
  const parsed = newBudgetSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a category, amount and theme.");

  const { data, error } = await getOwnAccount("budgets");
  if (error || !data) return fail("Couldn't load your budgets.");

  const budgets: Budget[] = data.budgets ?? [];
  if (budgets.some((b) => b.category === parsed.data.category)) {
    return fail("You already have a budget for this category.");
  }

  const { error: updateError } = await updateOwnAccount({
    budgets: [...budgets, { ...parsed.data, id: generateUniqueId(8) }],
  });
  if (updateError) return fail("Couldn't save the budget.");

  revalidatePath("/budgets");
  revalidatePath("/");
  return { ok: true };
}

export async function editBudget(
  budId: string | undefined,
  input: unknown,
): Promise<ActionResult> {
  const parsed = z.object({ maximum: money }).safeParse(input);
  if (!budId || !parsed.success) return fail("Enter a valid amount.");

  const { data, error } = await getOwnAccount("budgets");
  if (error || !data) return fail("Couldn't load your budgets.");

  const budgets: Budget[] = data.budgets ?? [];
  if (!budgets.some((b) => b.id === budId)) return fail("Budget not found.");

  const { error: updateError } = await updateOwnAccount({
    budgets: budgets.map((b) =>
      b.id === budId ? { ...b, maximum: parsed.data.maximum } : b,
    ),
  });
  if (updateError) return fail("Couldn't update the budget.");

  revalidatePath("/budgets");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBudget(
  budId: string | undefined,
): Promise<ActionResult> {
  const { data, error } = await getOwnAccount("budgets");
  if (error || !data) return fail("Couldn't load your budgets.");

  const budgets: Budget[] = data.budgets ?? [];
  if (!budgets.some((b) => b.id === budId)) return fail("Budget not found.");

  const { error: updateError } = await updateOwnAccount({
    budgets: budgets.filter((b) => b.id !== budId),
  });
  if (updateError) return fail("Couldn't delete the budget.");

  revalidatePath("/budgets");
  revalidatePath("/");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Pots
// ---------------------------------------------------------------------------

const potSchema = z.object({
  name: z.string().trim().min(1).max(30),
  target: money,
  theme: z.enum(THEMES),
});

export async function createPots(input: unknown): Promise<ActionResult> {
  const parsed = potSchema.safeParse(input);
  if (!parsed.success) return fail("Enter a name, target and theme.");

  const { data, error } = await getOwnAccount("pots");
  if (error || !data) return fail("Couldn't load your pots.");

  const { error: updateError } = await updateOwnAccount({
    pots: [
      ...(data.pots ?? []),
      { ...parsed.data, id: generateUniqueId(9), total: 0 },
    ],
  });
  if (updateError) return fail("Couldn't create the pot.");

  revalidatePath("/pots");
  revalidatePath("/");
  return { ok: true };
}

export async function editPot(
  potId: string | undefined,
  input: unknown,
): Promise<ActionResult> {
  const parsed = potSchema.safeParse(input);
  if (!potId || !parsed.success) return fail("Enter a name, target and theme.");

  const { data, error } = await getOwnAccount("pots");
  if (error || !data) return fail("Couldn't load your pots.");

  const pots: Pot[] = data.pots ?? [];
  if (!pots.some((p) => p.id === potId)) return fail("Pot not found.");

  const { error: updateError } = await updateOwnAccount({
    pots: pots.map((p) => (p.id === potId ? { ...p, ...parsed.data } : p)),
  });
  if (updateError) return fail("Couldn't update the pot.");

  revalidatePath("/pots");
  revalidatePath("/");
  return { ok: true };
}

export async function deletePots(potId: string): Promise<ActionResult> {
  const { data, error } = await getOwnAccount("pots");
  if (error || !data) return fail("Couldn't load your pots.");

  const pots: Pot[] = data.pots ?? [];
  const pot = pots.find((p) => p.id === potId);
  if (!pot) return fail("Pot not found.");
  if (pot.total > 0) return fail("Withdraw the savings before deleting.");

  const { error: updateError } = await updateOwnAccount({
    pots: pots.filter((p) => p.id !== potId),
  });
  if (updateError) return fail("Couldn't delete the pot.");

  revalidatePath("/pots");
  revalidatePath("/");
  return { ok: true };
}

// Moves money between the main balance and a pot. Positive `delta` adds to
// the pot, negative withdraws. Pots, balance and the activity entry are
// written in a single update.
async function movePotMoney(
  potId: string,
  delta: number,
): Promise<ActionResult> {
  const { data, error } = await getOwnAccount("pots, balance, transactions");
  if (error || !data) return fail("Couldn't load your account.");

  const pots: Pot[] = data.pots ?? [];
  const balance: BalanceType = data.balance;
  const pot = pots.find((p) => p.id === potId);
  if (!pot) return fail("Pot not found.");

  if (delta > 0 && balance.current < delta) {
    return fail("Insufficient balance.");
  }
  if (delta > 0 && pot.total + delta > pot.target) {
    return fail("That's more than the pot needs to reach its target.");
  }
  if (delta < 0 && pot.total < -delta) {
    return fail("The pot doesn't have that much saved.");
  }

  const user = await getUser();
  const { error: updateError } = await updateOwnAccount({
    pots: pots.map((p) =>
      p.id === potId ? { ...p, total: p.total + delta } : p,
    ),
    balance: { ...balance, current: balance.current - delta },
    transactions: [
      ...(data.transactions ?? []),
      {
        id: generateUniqueId(10),
        date: new Date().toISOString(),
        name: `${delta > 0 ? "Saved to" : "Withdrew from"} ${pot.name}`,
        amount: -delta,
        avatar: user?.avatar ?? "",
        category: "General",
        recurring: false,
      },
    ],
  });
  if (updateError) return fail("Couldn't update the pot.");

  revalidatePath("/pots");
  revalidatePath("/");
  return { ok: true };
}

export async function addMoneyToPot(
  potsId: string,
  amount: number,
): Promise<ActionResult> {
  const parsed = money.safeParse(amount);
  if (!parsed.success) return fail("Enter an amount greater than zero.");
  return movePotMoney(potsId, parsed.data);
}

export async function withdrawFromPot(
  potsId: string,
  amount: number,
): Promise<ActionResult> {
  const parsed = money.safeParse(amount);
  if (!parsed.success) return fail("Enter an amount greater than zero.");
  return movePotMoney(potsId, -parsed.data);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

type SignupData = {
  name?: string;
  email: string;
  password: string;
  isDemo?: boolean;
  avatar?: string;
};

export async function signup(formData: SignupData): Promise<ActionResult> {
  const { email, password, name, isDemo, avatar } = formData;

  // Profile details are kept in the auth user's metadata and turned into a
  // profile row on first sign-in, when row-level security allows the insert.
  const { error } = await createClient().auth.signUp({
    email,
    password,
    options: { data: { name, isDemo: Boolean(isDemo), avatar: avatar ?? "" } },
  });

  if (error) return fail(error.message);
  redirect("/login");
}

type SignInFormData = {
  email: string;
  password: string;
};

export async function signInAction(
  formData: SignInFormData,
): Promise<ActionResult> {
  const { data, error } = await createClient().auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error || !data.user) {
    return fail(
      error?.code === "email_not_confirmed"
        ? "Confirm your email address, then log in."
        : "Invalid email or password.",
    );
  }

  // Remove the insecure cookie used by earlier versions of the app.
  cookies().delete("user");

  await ensureAccount(data.user.id);
  redirect("/");
}

type UserUpdate = {
  name?: string;
  avatar?: string;
};

export async function updateUser(userObj: UserUpdate): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = z
    .object({
      name: z.string().trim().min(1).max(60).optional(),
      avatar: z.string().max(500).optional(),
    })
    .safeParse(userObj);
  if (!parsed.success) return fail("Check your name and avatar.");

  const { error } = await createClient()
    .from("owners")
    .update(parsed.data)
    .eq("user_id", userId);

  if (error) return fail("Couldn't update your profile.");

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOutAction() {
  await createClient().auth.signOut();
  cookies().delete("user");
  redirect("/login");
}
