"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  Feather,
  ShieldCheck,
  Users,
  TrendingUp,
  MessageCircle,
  LineChart,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LandingPageProps {
  user: User | null;
  loading: boolean;
}

/**
 * Enhanced landing page for TradeChat (AI‑powered trading & finance advice).
 * - Retains existing design tokens/theme classes (bg‑background, text‑primary, etc.).
 * - Adds subtle Framer Motion animations, gradient accents & stat section.
 * - Fully responsive & accessible.
 */
export default function LandingPageEnhanced({
  user,
  loading,
}: LandingPageProps) {
  const year = new Date().getFullYear();

  /** Utility animation presets */
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15 } }),
  } as const;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link
            href="/"
            aria-label="TradeChat home"
            className="mr-6 flex items-center gap-2 font-serif text-xl font-semibold text-primary"
          >
            <TrendingUp className="h-6 w-6" />
            <span>TradeChat</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm lg:flex">
            <Link
              href="#features"
              className="transition-colors hover:text-primary/90 text-muted-foreground"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="transition-colors hover:text-primary/90 text-muted-foreground"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <Button
                asChild
                variant="outline"
                className="border-primary font-serif text-primary hover:bg-primary/10"
              >
                <Link href="/chat">Go to Chat</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary/90"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="font-serif bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/30 to-background py-24 md:py-40 lg:py-48">
        {/* blurred gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-accent/20 blur-2xl" />
        </div>

        <div className="container grid max-w-screen-lg gap-12 px-4 md:px-6 lg:grid-cols-2 lg:gap-16 xl:max-w-screen-xl">
          {/* Copy */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
            className="flex flex-col justify-center space-y-6"
          >
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold leading-tight tracking-tighter text-primary font-serif sm:text-5xl md:text-6xl"
            >
              AI‑Driven Trading Insights&nbsp;
              <br className="hidden md:block" /> for Every Investor
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="max-w-[600px] text-muted-foreground md:text-xl"
            >
              TradeChat lets you chat with an AI analyst, discover actionable
              ideas, and stay ahead of market moves — all in one secure place.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="font-serif bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/chat">Open Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="font-serif bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Link href="/signup">Get Started Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="font-serif">
                    <Link href="/login">Login</Link>
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Image Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6 } }}
            viewport={{ once: true }}
            className="mx-auto flex items-center justify-center lg:order-last"
          >
            <Image
              src="/illustrations/trading-dashboard.png" // ↳ replace with your asset
              alt="Trading dashboard screenshot"
              width={700}
              height={450}
              className="rounded-xl border border-border/20 shadow-lg"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="bg-background py-12 md:py-20">
        <div className="container grid gap-8 md:grid-cols-3">
          {[
            { label: "Active Users", value: "12k+" },
            { label: "AI‑Generated Ideas", value: "150k" },
            { label: "Avg. Response Time", value: "&lt;2s" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeUp}
              className="flex flex-col items-center rounded-lg border border-border/20 bg-secondary/10 p-8 text-center backdrop-blur"
            >
              <span className="text-4xl font-bold tracking-tight text-primary font-serif">
                {stat.value}
              </span>
              <span className="mt-2 text-sm font-medium text-muted-foreground">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section
        id="features"
        className="bg-background py-16 md:py-28 lg:py-32 border-t"
      >
        <div className="container flex flex-col items-center text-center">
          <motion.span
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-3 inline-block rounded-full bg-muted px-4 py-1 text-sm font-serif"
          >
            Product Highlights
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mb-4 text-3xl font-bold tracking-tighter text-primary font-serif sm:text-4xl"
          >
            Everything You Need to Trade Smarter
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto max-w-2xl text-muted-foreground md:text-xl"
          >
            Our AI assistant & real‑time data tools keep you informed, organised
            and ahead of the curve.
          </motion.p>

          {/* Feature cards */}
          <div className="mt-12 grid w-full max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Real‑Time Chat",
                icon: MessageCircle,
                copy: "Discuss live market moves & get instant feedback from AI & community.",
              },
              {
                title: "Secure Client‑Only Access",
                icon: ShieldCheck,
                copy: "Powered by Firebase auth + row‑level DB security.",
              },
              {
                title: "AI Market Analyst",
                icon: Bot,
                copy: "Summaries, sentiment & risk insights generated on demand.",
              },
              {
                title: "Conversation History",
                icon: Feather,
                copy: "Never lose track — every chat is archived & searchable.",
              },
              {
                title: "Team Collaboration",
                icon: Users,
                copy: "Create separate threads for portfolios, sectors or clients.",
              },
              {
                title: "Pro‑Grade Charts",
                icon: LineChart,
                copy: "Interactive visualisations right inside the discussion.",
              },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
              >
                <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-serif">
                      {feat.title}
                    </CardTitle>
                    <feat.icon className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{feat.copy}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative overflow-hidden border-t bg-gradient-to-tr from-background via-secondary/40 to-background py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="container flex flex-col items-center text-center">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeUp}
            className="mb-6 text-3xl font-bold tracking-tighter text-primary font-serif sm:text-4xl"
          >
            Ready to Elevate Your Portfolio?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mb-8 max-w-xl text-muted-foreground md:text-xl"
          >
            Join thousands of investors leveraging TradeChat for sharper
            decision‑making.
          </motion.p>

          {user ? (
            <Button
              asChild
              size="lg"
              className="w-full max-w-xs font-serif bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/chat">Enter Dashboard</Link>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="w-full max-w-xs font-serif bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/signup">Create Free Account</Link>
            </Button>
          )}

          {!user && (
            <p className="mt-2 text-xs text-muted-foreground">
              Already a member?&nbsp;
              <Link
                href="/login"
                className="underline underline-offset-2 hover:text-primary/90"
              >
                Log in
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t bg-background py-6">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} TradeChat. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:underline underline-offset-4"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
