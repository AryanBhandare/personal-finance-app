import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/app/_styles/globals.css";
import MainClient from "./_components/ui/MainClient";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata = {
  title: {
    template: "%s · Coinsight",
    default: "Coinsight · Smart personal finance",
  },
  description:
    "Track budgets, savings pots and bills, with AI insights on where your money goes.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${font.className} min-h-screen`}>
        <MainClient>{children}</MainClient>
      </body>
    </html>
  );
}
