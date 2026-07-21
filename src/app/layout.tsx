import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppHeader } from "@/components/ui/AppHeader";
import { getServerLocale } from "@/lib/locale/getServerLocale";
import { getMessages } from "@/i18n/getMessages";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Metadata follows the reader's chosen app language: the title/description come
 * from the locale resolved on the server (nvq_locale cookie), so the browser tab
 * and share preview are English for an English user and German for a German user.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  return {
    title: messages.metadata.title,
    description: messages.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The document language follows the chosen explanation language (en/de) — this is
  // what screen readers use to pick pronunciation rules for the UI text. Japanese
  // words are shown as content within that UI, not as the document language. The
  // value is resolved from the nvq_locale cookie on the server so the first paint
  // already matches what the client LanguageProvider will use (no hydration flip).
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders initialLocale={locale}>
          <AppHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
