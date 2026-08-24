import type { Metadata } from "next";
import "./globals.css";
import StudentVocabulary from "./StudentVocabulary";

export const metadata: Metadata = {
  title: "Librimania — English exam practice",
  description: "Interactive English learning materials, writing trainers, curated bundles, and games.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <StudentVocabulary />
      </body>
    </html>
  );
}

