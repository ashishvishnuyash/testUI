import type { Metadata } from 'next';
import { Inter as FontSans, Lora as FontSerif } from 'next/font/google'; // Using Lora for serif
import './globals.css';
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from "@/components/ui/toaster" // Import Toaster

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
  title: 'TradeChat - Client Market Discussions', // Updated Title
  description: 'Engage in real-time market chat and insights with TradeChat.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable,
        fontSerif.variable // Include serif font variable
      )}>
        <AuthProvider>
          {children}
          <Toaster /> {/* Add Toaster component here */}
        </AuthProvider>
      </body>
    </html>
  );
}
