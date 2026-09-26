import { ReactNode } from "react";
import { LuArrowDownLeft, LuSparkles, LuWallet } from "react-icons/lu";
import Logo from "../ui/Logo";

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth xl:grid xl:grid-cols-[minmax(460px,600px),1fr]">
      <div className="h-dvh sticky top-0 hidden xl:flex p-4">
        <BrandPanel />
      </div>

      <div className="flex flex-col items-center justify-center gap-8 w-full min-h-dvh px-4 py-10">
        <Logo tone="dark" size={36} className="xl:hidden" />
        {children}
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <section className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-grey-900 via-grey-900 to-[#16312f] p-10 shadow-pop">
      <span className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-secondary-green/30 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-secondary-yellow/10 blur-3xl" />
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <Logo size={36} className="relative" />

      <div className="relative mx-auto w-full max-w-[380px]">
        <PreviewCards />
      </div>

      <div className="relative">
        <h2 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-white">
          See where your money goes,
          <span className="block text-secondary-cyan">
            and where it could grow.
          </span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
          Budgets, savings pots and bills in one place, with AI insights that
          point out what to change next.
        </p>
      </div>
    </section>
  );
}

// A static preview of the app's own cards, so the login page shows the
// product rather than a stock illustration.
function PreviewCards() {
  return (
    <div className="relative h-[380px]">
      <div className="absolute left-0 top-0 w-[78%] -rotate-3 rounded-3xl bg-gradient-to-br from-[#1d5e5b] via-secondary-green to-[#3a9a8f] p-5 shadow-[0_24px_60px_-20px_rgba(39,124,120,0.8)]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
          <LuWallet size={16} />
        </span>
        <p className="mt-5 text-xs font-medium text-white/75">
          Current Balance
        </p>
        <p className="mt-1.5 text-[28px] font-extrabold leading-none tracking-tight text-white tabular-nums">
          $4,836.00
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-white/80">
          <LuArrowDownLeft size={14} />
          <span className="tabular-nums">+$3,814.25 income this month</span>
        </div>
      </div>

      <div className="absolute right-0 top-[175px] w-[82%] rotate-2 rounded-3xl bg-white p-5 shadow-pop">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#1d5e5b] to-[#3a9a8f] text-white">
            <LuSparkles size={13} />
          </span>
          <p className="text-xs font-bold text-grey-900">AI Insights</p>
          <span className="ml-auto rounded-full bg-secondary-red/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-secondary-red">
            High
          </span>
        </div>
        <p className="mt-3 text-sm font-bold text-grey-900">
          Dining Out is $129 over budget
        </p>
        <p className="mt-1 text-xs leading-relaxed text-grey-500">
          You spent $204 against a $75 limit. Cooking twice more a week gets you
          back on track.
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-beige-100">
          <div className="h-full w-full rounded-full bg-secondary-red/80" />
        </div>
        <p className="mt-2 text-xs font-bold text-secondary-green">
          Save ~$129/month
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
