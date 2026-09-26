"use server";

import { revalidatePath } from "next/cache";
import { generateUniqueId, getData } from "./dats-services";
import { supabase } from "./supabase";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { transactionsProp } from "../_components/overview/Transactions";

export async function createDummyData(owners_id: string) {
  const dataRaw = getData();
  const sendAbleData = {
    owners_id: owners_id,
    transactions: dataRaw?.transactions,
    budgets: dataRaw?.budgets,
    balance: dataRaw?.balance,
    pots: dataRaw?.pots,
  };
  const { data, error } = await supabase
    .from("accountsTrx")
    .insert([sendAbleData])
    .select();

  if (error) {
    console.error("Error inserting data:", error);
  }

  return data;
}

export async function createEmptyData(owners_id: string) {
  const sendAbleData = {
    owners_id: owners_id,
    transactions: [],
    budgets: [],
    balance: { income: 10000, current: 10000, expenses: 0 },
    pots: [],
  };
  const { data, error } = await supabase
    .from("accountsTrx")
    .insert([sendAbleData])
    .select();

  if (error) {
    console.error("Error inserting data:", error);
  }

  return data;
}

type mainTrx = {
  transactions: transactionsProp[];
};

export async function getTransactions() {
  const { data: transactions, error } = await supabase
    .from("accountsTrx")
    .select("*");

  if (error) {
    console.error("Error fetching transactions:", error);
    throw new Error("Error fetching transactions");
  }

  return transactions;
}

export async function getTransaction() {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, ""); // Remove extra quotes

  if (!user) {
    throw new Error("User not authenticated");
  }
  const { data: transactions, error } = await supabase
    .from("accountsTrx")
    .select("*")
    .eq("owners_id", userId)
    .single();

  if (error) {
    console.error("Error fetching transactions:", error);
    // throw new Error("Error fetching transactions");
  }

  return transactions;
}

type transactionType = {
  name: string;
  id: string;
  amount: number;
  date: string;
  category: string;
  avatar: string;
  recurring?: boolean;
};

export async function createTrx(id: string, newTrx: transactionType) {
  // Fetch the current senders trx
  const user = await getUser();

  // if (id === user.user_id) {
  //   throw new Error("You cant money to yourself");
  //   return;
  // }
  const { data: accountsTrx, error: fetchError } = await supabase
    .from("accountsTrx")
    .select("transactions, balance")
    .eq("owners_id", user.user_id)
    .single();

  if (fetchError) {
    console.error("Error fetching tasks:", fetchError);
    return;
  }

  // receiver
  const { data: RecTrx, error: RecError } = await supabase
    .from("accountsTrx")
    .select("transactions, balance")
    .eq("owners_id", id)
    .single();

  if (RecError) {
    console.error("Error fetching tasks:", fetchError);
    return;
  }

  // Append the new task to the tasks array

  const trxData = {
    ...newTrx,
    name: user.name,
    avatar: user.avatar,
  };
  const updatedTrx = [...RecTrx.transactions, trxData];

  // Update the tasks array for receiver in the board
  const { data, error } = await supabase
    .from("accountsTrx")
    .update({ transactions: updatedTrx })
    .eq("owners_id", id);

  // update receiver balance
  const updatedBalance: BalanceType = {
    ...RecTrx.balance,
    current: RecTrx.balance.current + newTrx.amount,
    income: RecTrx.balance.income + newTrx.amount, // Add the amount to income
  };

  const { data: inc, error: incErr } = await supabase
    .from("accountsTrx")
    .update({ balance: updatedBalance })
    .eq("owners_id", id);

  //  sender
  const sedTrx = {
    ...trxData,
    amount: -newTrx.amount,
    name: newTrx.name,
    avatar: newTrx.avatar,
  };

  const updateSenderTrx = [...accountsTrx.transactions, sedTrx];
  // update sender tasks array
  const { data: snd, error: sendErr } = await supabase
    .from("accountsTrx")
    .update({ transactions: updateSenderTrx })
    .eq("owners_id", user.user_id);

  const updateBalance: BalanceType = {
    ...accountsTrx.balance,
    current: accountsTrx.balance.current - newTrx.amount,
    expenses: accountsTrx.balance.expenses + newTrx.amount, // Add the amount to income
  };

  const { data: incD, error: incErrD } = await supabase
    .from("accountsTrx")
    .update({ balance: updateBalance })
    .eq("owners_id", user.user_id);

  if (error) {
    console.error("Error adding transaction:", error);
  } else {
    console.log("Transaction added successfully:", data);
  }
  revalidatePath(`/`);
  return data;
}

type budType = {
  id: string;
  total?: number;
};

type stBud = {
  id: string;
};

export async function editBudget(budId: string | undefined, newTask: object) {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, ""); // Remove extra quotes
  // Fetch the current budgets
  const { data: accountsTrx, error: fetchError } = await supabase
    .from("accountsTrx") // Ensure you're fetching from the correct table
    .select("budgets")
    .eq("owners_id", userId)
    .single(); // Fetch a single record by id

  if (fetchError) {
    console.error("Error fetching budgets:", fetchError);
    return;
  }

  // Find the index of the budget to edit
  const budgetIndex = accountsTrx.budgets.findIndex(
    (budg: budType) => budg.id === budId
  );

  if (budgetIndex === -1) {
    console.error("Budget not found");
    return;
  }

  // Update the specific budget in the array
  const updatedBudgets = accountsTrx.budgets.map(
    (budget: budType, index: number) =>
      index === budgetIndex ? { ...budget, ...newTask } : budget
  );

  // Update the budgets array in the accountsTrx table
  const { data, error } = await supabase
    .from("accountsTrx") // Update the correct table
    .update({ budgets: updatedBudgets }) // Update the budgets field
    .eq("owners_id", userId); // Ensure the correct record is updated

  if (error) {
    console.error("Error updating budget:", error);
  }

  // Revalidate the page if using a static site generation approach
  revalidatePath(`/budgets`);

  return data;
}

export async function createBudget(newTrx: object) {
  // Fetch the current tasks
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, "");

  const { data: accountsTrx, error: fetchError } = await supabase
    .from("accountsTrx")
    .select("budgets")
    .eq("owners_id", userId)
    .single();

  if (fetchError) {
    console.error("Error fetching tasks:", fetchError);
    return;
  }

  // Append the new task to the tasks array
  const updatedTrx = [...accountsTrx.budgets, newTrx];

  // Update the tasks array in the board
  const { data, error } = await supabase
    .from("accountsTrx")
    .update({ budgets: updatedTrx })
    .eq("owners_id", userId);

  if (error) {
    console.error("Error adding transaction:", error);
  } else {
    console.log("Budgets added successfully:");
  }
  revalidatePath(`/budgets`);
  return data;
}

export async function deleteBudget(budId: string | undefined) {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, "");
  // Fetch the current budgets
  const { data: accountsTrx, error: fetchError } = await supabase
    .from("accountsTrx") // Ensure fetching from the correct table
    .select("budgets")
    .eq("ownes_id", userId)
    .single(); // Fetch a single record by id

  if (fetchError) {
    console.error("Error fetching budgets:", fetchError);
    return;
  }

  // Find the index of the budget to delete
  const budgetIndex = accountsTrx.budgets.findIndex(
    (budg: budType) => budg.id === budId
  );

  if (budgetIndex === -1) {
    console.error("Budget not found");
    return;
  }

  // Remove the specific budget from the array
  const updatedBudgets = accountsTrx.budgets.filter(
    (budget: budType) => budget.id !== budId
  );

  // Update the budgets array in the accountsTrx table
  const { data, error } = await supabase
    .from("accountsTrx") // Update the correct table
    .update({ budgets: updatedBudgets }) // Update with the filtered budgets array
    .eq("ownes_id", userId); // Ensure the correct record is updated

  if (error) {
    console.error("Error deleting budget:", error);
  } else {
    console.log("Budget deleted successfully:");
  }

  // Revalidate the page if using a static site generation approach
  revalidatePath(`/budgets`);

  return data;
}

// POTS
export async function createPots(potsData: object) {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, "");
  const { data: accountsTrx, error: fetchError } = await supabase
    .from("accountsTrx") // Ensure fetching from the correct table
    .select("pots")
    .eq("owners_id", userId)
    .single(); // Fetch a single record by id

  if (fetchError) {
    console.error("Error fetching pots:", fetchError);
    return;
  }

  // Append the new task to the tasks array
  const updatedTrx = [...accountsTrx.pots, potsData];

  // Update the tasks array in the board
  const { data, error } = await supabase
    .from("accountsTrx")
    .update({ pots: updatedTrx })
    .eq("owners_id", userId);

  if (error) {
    console.error("Error adding transaction:", error);
  }
  revalidatePath(`/pots`);
  return data;
}

export async function editPot(potId: string | undefined, newPot: object) {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, "");
  const { data: accountsTrx, error: fetchError } = await supabase
    .from("accountsTrx") // Ensure fetching from the correct table
    .select("pots")
    .eq("owners_id", userId)
    .single(); // Fetch a single record by id

  if (fetchError) {
    console.error("Error fetching budgets:", fetchError);
    return;
  }

  // Find the index of the budget to edit
  const budgetIndex = accountsTrx.pots.findIndex(
    (budg: budType) => budg.id === potId
  );

  if (budgetIndex === -1) {
    console.error("Pot not found");
    return;
  }

  // Update the specific budget in the array
  const updatedBudgets = accountsTrx.pots.map((pot: budType, index: number) =>
    index === budgetIndex ? { ...pot, ...newPot } : pot
  );

  // Update the budgets array in the accountsTrx table
  const { data, error } = await supabase
    .from("accountsTrx") // Update the correct table
    .update({ pots: updatedBudgets }) // Update the budgets field
    .eq("owners_id", userId); // Ensure the correct record is updated

  if (error) {
    console.error("Error updating budget:", error);
  }

  // Revalidate the page if using a static site generation approach
  revalidatePath(`/pots`);

  return data;
}
export async function deletePots(potId: string) {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, "");
  const { data: accountsTrx, error: fetchError } = await supabase
    .from("accountsTrx") // Ensure fetching from the correct table
    .select("pots")
    .eq("owners_id", userId)
    .single(); // Fetch a single record by id

  if (fetchError) {
    console.error("Error fetching budgets:", fetchError);
    return;
  }

  // Find the index of the budget to edit
  const budgetIndex = accountsTrx.pots.findIndex(
    (budg: budType) => budg.id === potId
  );

  if (budgetIndex === -1) {
    console.error("Pot not found");
    return;
  }

  // Remove the specific budget from the array
  const updatedBudgets = accountsTrx.pots.filter(
    (budget: budType) => budget.id !== potId
  );

  // Update the budgets array in the accountsTrx table
  const { data, error } = await supabase
    .from("accountsTrx") // Update the correct table
    .update({ pots: updatedBudgets }) // Update with the filtered budgets array
    .eq("owners_id", userId); // Ensure the correct record is updated

  if (error) {
    console.error("Error deleting pots:", error);
  }

  // Revalidate the page if using a static site generation approach
  revalidatePath(`/pots`);

  return data;
}

type pottype = {
  id: string;
  total: number;
};

type BalanceType = {
  current: number;
  income: number;
  expenses: number;
};
// POTS

export async function addMoneyToPot(potsId: string, amount: number) {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, "");

  try {
    const user = await getUser();
    // 1. Fetch the user's account transaction
    const { data: accountsTrx, error: fetchError } = await supabase
      .from("accountsTrx")
      .select("pots, balance, transactions")
      .eq("owners_id", userId)
      .single(); // Fetch a single record by id

    if (fetchError || !accountsTrx) {
      throw new Error("Error fetching account data or no data found");
    }

    // 2. Find the specific pot to add money to
    const budgetIndex = accountsTrx.pots.findIndex(
      (pot: pottype) => pot.id === potsId
    );

    if (budgetIndex === -1) {
      throw new Error("Pot not found");
    }

    // 3. Update the pot total and the account balance
    const updatedPots = accountsTrx.pots.map((pot: pottype, index: number) =>
      index === budgetIndex ? { ...pot, total: pot.total + amount } : pot
    );

    const updatedBalance: BalanceType = {
      ...accountsTrx.balance,
      current: accountsTrx.balance.current - amount, // Deduct the amount from balance
    };

    // 4. Use a transaction to update both pots and balance
    const { error: updateError } = await supabase
      .from("accountsTrx")
      .update({
        pots: updatedPots,
        balance: updatedBalance,
      })
      .eq("owners_id", userId);

    if (updateError) {
      throw new Error("Error updating pots or balance: " + updateError.message);
    }

    //5. register activity as a transaction

    const trx = {
      id: generateUniqueId(10),
      date: new Date().toISOString(),
      name: user.name,
      amount: -amount,
      avatar: user.avatar,
      category: "General",
      recurring: false,
    };

    const updatedTx = [...accountsTrx.transactions, trx];

    const { error: trxErr } = await supabase
      .from("accountsTrx")
      .update({
        transactions: updatedTx,
        // balance: updatedBalance,
      })
      .eq("owners_id", userId);

    console.log("Successfully updated pot and balance.");
  } catch (error) {
    console.error(error || "An unknown error occurred");
  }

  revalidatePath("/pots");
  revalidatePath("/");
}

export async function withdrawFromPot(potsId: string, amount: number) {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, "");

  try {
    const user = await getUser();
    // 1. Fetch the user's account transaction
    const { data: accountsTrx, error: fetchError } = await supabase
      .from("accountsTrx")
      .select("pots, balance, transactions")
      .eq("owners_id", userId)
      .single(); // Fetch a single record by id

    if (fetchError || !accountsTrx) {
      throw new Error("Error fetching account data or no data found");
    }

    // 2. Find the specific pot to withdraw money from
    const budgetIndex = accountsTrx.pots.findIndex(
      (pot: pottype) => pot.id === potsId
    );

    if (budgetIndex === -1) {
      throw new Error("Pot not found");
    }

    const selectedPot = accountsTrx.pots[budgetIndex];

    // 3. Check if the pot has enough balance for the withdrawal
    if (selectedPot.total < amount) {
      throw new Error(
        `Insufficient funds in pot. Available: ${selectedPot.total}`
      );
    }

    // 4. Update the pot total and the account balance
    const updatedPots = accountsTrx.pots.map((pot: pottype, index: number) =>
      index === budgetIndex ? { ...pot, total: pot.total - amount } : pot
    );

    const updatedBalance: BalanceType = {
      ...accountsTrx.balance,
      current: accountsTrx.balance.current + amount, // Add the amount back to the balance
    };

    // 5. Use a transaction-like behavior to update both pots and balance
    const { error: updateError } = await supabase
      .from("accountsTrx")
      .update({
        pots: updatedPots,
        balance: updatedBalance,
      })
      .eq("owners_id", userId);

    if (updateError) {
      throw new Error("Error updating pots or balance: " + updateError.message);
    }

    //6. register activity as a transaction

    const trx = {
      id: generateUniqueId(10),
      date: new Date().toISOString(),
      name: user.name,
      amount: amount,
      avatar: user.avatar,
      category: "General",
      recurring: false,
    };

    const updatedTx = [...accountsTrx.transactions, trx];

    const { error: trxErr } = await supabase
      .from("accountsTrx")
      .update({
        transactions: updatedTx,
        // balance: updatedBalance,
      })
      .eq("owners_id", userId);

    console.log("Successfully withdrew from pot and updated balance.");
  } catch (error) {
    console.error(error || "An unknown error occurred");
  }

  revalidatePath("/");
  revalidatePath("/pots");
}

type FormValues = {
  name?: string;
  email: string;
  password: string;
  isDemo?: boolean;
  user_id?: string | undefined;
  avatar: string;
};

export async function signup(formData: FormValues) {
  const { email, password } = formData;

  // Sign up user via Supabase auth
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  // Create user data for the owners table
  const userData = {
    avatar: formData.avatar,
    name: formData.name,
    email: formData.email,
    isDemo: formData.isDemo,
    user_id: data?.user?.id, // Supabase user ID
  };

  // Insert user data into the owners table
  const { data: user, error: userError } = await supabase
    .from("owners")
    .insert([userData])
    .select();

  if (userError) {
    console.error(userError.message);
    throw new Error(userError.message);
  }

  // Redirect to login page after successful signup
  redirect("/login");
}

export async function getUser() {
  const user = cookies().get("user");
  const userId = user?.value.replace(/"/g, "");
  const { data, error } = await supabase
    .from("owners")
    .select("*")
    .eq("user_id", userId)
    .single();

  // if (error) {
  //   console.error(error);
  //   throw new error(error, "Unable to get user");
  // }

  if (!data) {
    cookies().delete("user");
    redirect("/login");
  }

  return data;
}

export async function getReceiver(id: string) {
  const { data, error } = await supabase
    .from("owners")
    .select("*")
    .eq("user_id", id)
    .single();

  // if (error) {
  //   console.error(error);
  //   throw new error(error, "Unable to get user");
  // }

  return data;
}

type SignInFormData = {
  email: string;
  password: string;
};

export type ownerdata = {
  owners_id: string;
  transactions: [];
  pots: [];
  balance: {
    current: number;
    income: number;
    expenses: number;
  };
  budgets: [];
};

export async function signInAction(formData: SignInFormData) {
  const { email, password } = formData;

  // try {
  // 1. Sign in user using Supabase authentication
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // 2. Handle errors during sign-in
    cookies()?.delete("user"); // Clear cookies on error
    console.error("Error signing in:", error.message);
    throw new Error(error.message);
  }

  // 3. Set a secure cookie with the user's ID
  const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
  cookies().set("user", JSON.stringify(data?.user?.id), {
    path: "/",
    httpOnly: true, // Make the cookie inaccessible to client-side JavaScript
    secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
    maxAge: oneDay, // Cookie will expire after one day
  });

  // 4. Fetch the current user data
  const curUser = await getUser();

  // 5. fetch and check uf the user already has a row in the table

  const allData = await getTransactions();

  const isAlreadyExist = allData?.find(
    (data: ownerdata) => data.owners_id === curUser.user_id
  );

  // 6. If the user is a demo user, generate dummy data
  if (!isAlreadyExist && curUser.isDemo) {
    await createDummyData(curUser?.user_id);
  } else if (!isAlreadyExist && !curUser.isDemo) {
    await createEmptyData(curUser?.user_id);
  }

  // 7. Return the authentication data
  redirect("/");
  return data;
  // } catch (err) {
  //   console.error("Sign-in failed:", err);
  // }
}

type User = {
  user_Id: string;
  name: string;
  email: string;
  avatar?: string;
  isDemo?: boolean;
  // Add any other fields that exist in your "owners" table
};

type UserUpdate = {
  name?: string;
  email?: string;
  avatar?: string;
  // Other fields you might want to allow for updating
};

export async function updateUser(userObj: UserUpdate) {
  const user = await getUser();

  let userData;
  if (user?.avatar && userObj?.avatar?.includes("undfined"))
    userData = { ...userObj, avatar: user.avatar };

  if (!user?.avatar && userObj?.avatar?.includes("undfined"))
    userData = { ...userObj, avatar: "" };
  else userData = { ...userObj };
  const { data, error } = await supabase
    .from("owners")
    .update(userData)
    .eq("user_id", user.user_id)
    .select();

  if (error) {
    console.error("Error updating user:", error.message);
    throw new Error(error.message);
  }

  // Revalidate the path if necessary
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function signOutAction() {
  cookies()?.delete("user");
  redirect("/login");
}
