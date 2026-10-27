import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PocketSeculex — A stronger line of defense",
  description: "A bag-attached personal safety research prototype connecting deliberate emergency alerts, GNSS location, and AI-assisted LGU response.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
