import type { Metadata } from "next";

export const metadata: Metadata = { title: "Abdullah Bokhary", robots: { index: false } };

// A bare root layout for "/", which only forwards to /en/ or /ar/.
export default function RootRedirectLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#05080A" }}>{children}</body>
    </html>
  );
}
