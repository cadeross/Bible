import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenWrit Updates",
  description:
    "Track the latest OpenWrit releases, feature updates, fixes, and improvements.",
  alternates: {
    canonical: "/updates",
  },
};

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
