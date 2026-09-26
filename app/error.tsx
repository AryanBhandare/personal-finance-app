"use client";

type props = {
  error: Error;
  reset: () => void;
};

export default function Error({ error, reset }: props) {
  return (
    <main className="flex justify-center items-center flex-col gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        Something went wrong!
      </h1>
      <p className="text-grey-500 max-w-md">{error.message}</p>

      <button
        className="mt-2 inline-block rounded-xl bg-grey-900 text-beige-100 px-6 py-3.5 text-sm font-semibold hover:bg-grey-900/85 transition-colors"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  );
}
