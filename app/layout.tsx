import { ThemeProvider } from "@/components/theme-provider";
import { CopilotWrapper } from "@/components/copilot/copilot-wrapper";
import { Inter } from "next/font/google";
import { AlertProvider } from "./context/alert.context";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} h-screen overflow-hidden bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AlertProvider>
            {children}
            <CopilotWrapper />
            <Toaster />
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
