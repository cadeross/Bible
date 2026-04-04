import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About OpenWrit",
  description:
    "Learn about OpenWrit's mission to make Bible reading simple, beautiful, and focused.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
