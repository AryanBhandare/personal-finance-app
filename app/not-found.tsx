import Link from "next/link";

function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center text-center gap-6 py-24">
      <p className="text-7xl font-bold tracking-tight text-grey-300">404</p>
      <h1 className="text-3xl font-bold tracking-tight">
        This page could not be found
      </h1>
      <Link
        href="/"
        className="inline-block rounded-xl bg-grey-900 text-beige-100 px-6 py-3.5 text-sm font-semibold hover:bg-grey-900/85 transition-colors"
      >
        Go back home
      </Link>
    </main>
  );
}

export default NotFound;
