import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Srinivasa Rithik Ghantasala | AI/ML Engineer & Backend Developer",
  description:
    "Portfolio of Srinivasa Rithik Ghantasala — AI/ML Engineer and Backend Developer building production-grade AI systems and scalable backend architectures. Northeastern University MS in Information Systems.",
  keywords: [
    "AI Engineer",
    "ML Engineer",
    "Backend Developer",
    "Full-Stack Developer",
    "Python",
    "TypeScript",
    "AWS",
    "LangChain",
    "Portfolio",
  ],
  authors: [{ name: "Srinivasa Rithik Ghantasala" }],
  openGraph: {
    title: "Srinivasa Rithik Ghantasala | AI/ML Engineer",
    description:
      "Building production-grade AI systems and scalable backend architectures.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased noise-overlay">
        {children}
      </body>
    </html>
  );
}
