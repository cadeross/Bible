import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liturgical Calendar",
  description:
    "View the Catholic liturgical calendar with seasons, feast days, and daily observances.",
  alternates: {
    canonical: "/calendar",
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
