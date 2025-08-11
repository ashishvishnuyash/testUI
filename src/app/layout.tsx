import type { Metadata } from 'next';
import { Inter as FontSans, Lora as FontSerif } from 'next/font/google'; // Using Lora for serif
import './globals.css';
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/components/auth/AuthProvider';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster" // Import Toaster
import { ThemeProvider } from '@/providers/ThemeProvider';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-geist-sans", // Keep variable name for consistency if preferred
})

const fontSerif = FontSerif({
  subsets: ["latin"],
  variable: "--font-serif", // Add serif font variable
  weight: ["400", "700"], // Include weights needed
})

export const metadata: Metadata = {
  title: 'StockWhisperer AI - Client Market Discussions', // Updated Title
  description: 'Engage in real-time market chat and insights with StockWhisperer AI.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable,

        fontSerif.variable
      )}>
        <AuthProvider>


          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
