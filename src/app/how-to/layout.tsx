import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How To Use OpenWrit",
  description:
    "Learn how to read Scripture, navigate books and chapters, use highlights and notes, and customize your OpenWrit reading experience.",
  alternates: {
    canonical: "/how-to",
  },
};

export default function HowToLayout({ children }: { children: React.ReactNode }) {
  return children;
}
