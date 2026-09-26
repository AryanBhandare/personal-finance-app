"use client";

import { useForm } from "react-hook-form";
import { Input } from "../budgets/BudgtForm";
import Button from "../ui/Button";
import Link from "next/link";
import { useState } from "react";
import {
  signInAction,
  signup,
  updateUser,
  // uploadImage,
} from "@/app/_lib/actions";
import SpinnerMini from "../ui/SpinnerMini";
// import { uploadImage } from "@/app/_lib/upload";
import { uploadImage } from "@/app/_lib/dats-services";
import { usePathname } from "next/navigation";

type FormValues = {
  name?: string;
  email: string;
  password: string;
  isDemo?: boolean;
  user_id?: string | undefined;
  avatar?: string;
  // imageUrl?: string;
};

type EditData = {
  name: string;
  email: string;
  avatar: string;
};

type pageName = {
  pageName: "login" | "signup" | "";
  type?: "edit";
  userData?: EditData;
};

function AuthItem({ pageName, type, userData }: pageName) {
  const { register, handleSubmit, formState, setValue } = useForm<FormValues>();
  const { errors } = formState;
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [failError, setFailError] = useState("");
  async function onSubmit(data: FormValues) {
    const dataAv = {
      name: data.name,
      email: data.email,
      password: data.password,
      isDemo: data.isDemo,
      avatar: "",
    };
    setLoading(true);

    try {
      if (pageName === "signup") {
        await signup(dataAv);
      } else if (pageName === "login") {
        await signInAction(data);
      } else if (type === "edit") {
        const editData = {
          ...userData,
          name: data.name,
          avatar: data.avatar,
        };

        let avatarUrl = userData?.avatar || ""; // Default to existing avatar URL

        // Check if `data.avatar` is a `FileList`
        if (data.avatar && typeof data.avatar !== "string" && data.avatar[0]) {
          avatarUrl = await uploadImage(data.avatar[0]);
        }

        const dataObj = {
          ...editData,
          avatar: avatarUrl,
        };

        // console.log(dataObj.avatar);
        await updateUser(dataObj);
      }
    } catch (error: any) {
      console.error(error?.message);
      pageName === "login"
        ? setFailError("Invalid credentials")
        : pathname === "signup"
          ? setFailError("User Already exists")
          : setFailError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-5 sm:gap-6 w-full max-w-[520px] p-5 sm:p-8 md:p-10 bg-white rounded-3xl shadow-card-hover border border-grey-900/[0.04] animate-fade-up">
      <h1 className="font-bold tracking-tight text-[28px] md:text-[32px] leading-tight">
        {pageName === "login"
          ? "Login"
          : pageName === "signup"
            ? "Sign Up"
            : "Update your credentials"}
      </h1>
      {pageName === "signup" || type === "edit" ? (
        <Input label="Name">
          <input
            placeholder="Michael king"
            className="h-full w-full outline-none"
            type="text"
            id="maximum"
            {...register("name", {
              required: "Full name is required",
              minLength: {
                value: 5,
                message: "Full name must be at least 5 characters",
              },
              maxLength: {
                value: 60,
                message: "Full name cannot exceed 60 characters",
              },
              pattern: {
                value:
                  /^[A-Za-z]+(?:[' -][A-Za-z]+)* [A-Za-z]+(?:[' -][A-Za-z]+)*$/,
                message: "Please enter a valid full name (e.g., John Doe)",
              },
            })}
            defaultValue={userData?.name}
          />
          {errors?.name?.message ? (
            <span className="text-secondary-red text-sm flex items-center justify-end my-2">
              {errors?.name?.message}
            </span>
          ) : null}
        </Input>
      ) : null}

      {type === "edit" ? null : (
        <Input label="Email">
          <input
            placeholder="michael@mail.com"
            className={`h-full w-full outline-none ${
              type === "edit" ? "cursor-not-allowed" : ""
            }`}
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Enter a valid email address",
              },
            })}
            defaultValue={userData?.email}
            // disabled={type === "edit"}
          />
          {errors?.email?.message ? (
            <span className="text-secondary-red text-sm flex items-center justify-end my-2">
              {errors?.email?.message}
            </span>
          ) : null}
        </Input>
      )}
      {type === "edit" ? null : (
        <Input label={pageName === "login" ? "Password" : "Create password"}>
          <input
            className="h-full w-full outline-none"
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
              pattern: {
                value:
                  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must include letters, numbers, and special characters",
              },
            })}
          />
          {errors?.password?.message ? (
            <span className="text-secondary-red text-sm flex items-center justify-end my-2">
              {errors?.password?.message}
            </span>
          ) : (
            <p
              className={`text-xs w-full mt-2 text-grey-500 ${
                pageName === "login" ? "hidden" : "flex"
              }`}
            >
              Passwords must be at least 8 characters
            </p>
          )}
        </Input>
      )}

      {type === "edit" ? (
        <Input label="Avatar">
          <input
            type="file"
            accept="image/*"
            className="cursor-pointer w-full text-sm text-grey-500 py-[9px] file:mr-3 file:rounded-lg file:border-0 file:bg-beige-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-grey-900 hover:file:bg-grey-100"
            // onChange={handleFileUpload}
            id="imageUrl"
            {...register("avatar", {
              required: "Please upload an image file (JPG, PNG)",
            })}
            // defaultValue={userData?.avatar}
          />
        </Input>
      ) : null}

      {pageName === "signup" ? (
        <label className="flex items-center gap-3 rounded-xl bg-beige-100 px-4 py-3 text-sm text-grey-500 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-secondary-green"
            // checked={isChecked}
            // onChange={handleCheckboxChange}

            {...register("isDemo")}
          />
          <p>Start with demo transactions</p>
        </label>
      ) : null}

      {failError && (
        <p className="text-sm text-center text-secondary-red bg-secondary-red/10 rounded-xl py-3 px-4">
          {failError}
        </p>
      )}
      <Button
        className="flex justify-center mt-2"
        onClick={handleSubmit(onSubmit)}
      >
        {loading ? (
          <SpinnerMini />
        ) : pageName === "login" ? (
          "Login"
        ) : pageName === "signup" ? (
          "Create Account"
        ) : (
          "Update"
        )}
      </Button>

      {pageName === "" ? null : (
        <span className="flex flex-wrap items-center justify-center text-center w-full text-sm text-grey-500 gap-x-2 gap-y-1">
          <p>
            {pageName === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>
          <Link
            href={pageName === "login" ? "/signup" : "/login"}
            className="font-bold text-grey-900 underline underline-offset-4 hover:text-secondary-green transition-colors"
          >
            {pageName === "login" ? "Sign up" : "Login"}
          </Link>
        </span>
      )}
    </form>
  );
}

export default AuthItem;
