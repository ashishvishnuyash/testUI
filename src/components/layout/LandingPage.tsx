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
  Star,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Award,
  BarChart3,
  Brain,
  Lock,
  Crown,
  Gem,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LandingPageProps {
  user: User | null;
  loading: boolean;
}

/**
 * Enhanced beautiful landing page for StockWhisperer AI (AI‑powered premium conversations).
 * - Reflects the actual subscription tiers: Free, Gold, Diamond
 * - Maintains the premium aesthetic with Deep Gold, Dark Grey, Emerald Green
 * - Enhanced animations and visual elements
 */
export default function LandingPageEnhanced({
  user,
  loading,
}: LandingPageProps) {
  const year = new Date().getFullYear();

  /** Animation presets */
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: (i = 0) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay: i * 0.15,
        duration: 0.6,
        ease: "easeOut"
      } 
    }),
  } as const;

  const slideIn = {
    hidden: { opacity: 0, x: -60 },
    show: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      } 
    },
  } as const;

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      } 
    },
  } as const;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link
            href="/"
            aria-label="StockWhisperer AI home"
            className="mr-6 flex items-center gap-2 font-serif text-xl font-bold text-primary hover:scale-105 transition-transform duration-200"
          >
            <div className="relative">
              <MessageCircle className="h-7 w-7 text-[#FFD700]" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-[#50C878] rounded-full animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-[#FFD700] to-[#50C878] bg-clip-text text-transparent">
              StockWhisperer AI
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm lg:flex">
            <Link
              href="#features"
              className="transition-all duration-200 hover:text-[#FFD700] text-muted-foreground hover:scale-105"
            >
              Features
            </Link>
            <Link
              href="#benefits"
              className="transition-all duration-200 hover:text-[#FFD700] text-muted-foreground hover:scale-105"
            >
              Benefits
            </Link>
            {/* <Link
              href="#testimonials"
              className="transition-all duration-200 hover:text-[#FFD700] text-muted-foreground hover:scale-105"
            >
              Reviews
            </Link> */}
            <Link
              href="#pricing"
              className="transition-all duration-200 hover:text-[#FFD700] text-muted-foreground hover:scale-105"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
            ) : user ? (
              <Button
                asChild
                variant="outline"
                className="border-[#FFD700] font-serif text-[#FFD700] hover:bg-[#FFD700]/10 hover:scale-105 transition-all duration-200"
              >
                <Link href="/chat">Go to Chat</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-muted-foreground hover:text-[#FFD700] hover:scale-105 transition-all duration-200"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="font-serif bg-gradient-to-r from-[#FFD700] to-[#50C878] text-[#333333] hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-[#333333]/10 to-background py-20 md:py-32 lg:py-40">
        {/* Enhanced background elements */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#FFD700]/20 blur-3xl animate-pulse" />
          <div className="absolute right-1/4 top-1/2 h-80 w-80 rounded-full bg-[#50C878]/15 blur-2xl animate-pulse delay-1000" />
          <div className="absolute left-1/2 bottom-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#333333]/20 blur-3xl animate-pulse delay-2000" />
          
          {/* Floating elements */}
          <div className="absolute top-20 left-10 opacity-20">
            <MessageCircle className="h-8 w-8 text-[#FFD700] animate-bounce" style={{ animationDelay: '0s' }} />
          </div>
          <div className="absolute top-40 right-20 opacity-20">
            <Bot className="h-6 w-6 text-[#50C878] animate-bounce" style={{ animationDelay: '1s' }} />
          </div>
          <div className="absolute bottom-40 left-20 opacity-20">
            <Feather className="h-7 w-7 text-[#FFD700] animate-bounce" style={{ animationDelay: '2s' }} />
          </div>
        </div>

        <div className="container grid max-w-screen-xl gap-12 px-4 md:px-6 lg:grid-cols-2 lg:gap-20">
          {/* Enhanced Copy */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={slideIn}
            className="flex flex-col justify-center space-y-8"
          >
            <motion.div variants={fadeUp} className="space-y-2">
              <Badge variant="secondary" className="mb-4 bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20">
                <Zap className="h-3 w-3 mr-1" />
                Premium AI Conversations
              </Badge>
              <h1 className="text-4xl font-bold leading-tight tracking-tighter font-serif sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-[#FFD700] via-[#50C878] to-[#FFD700] bg-clip-text text-transparent">
                  StockWhisperer AI
                </span>
                <br />
                <span className="text-foreground">Elevated Conversations</span>
              </h1>
            </motion.div>
            
            <motion.p
              variants={fadeUp}
              className="max-w-[600px] text-lg text-muted-foreground md:text-xl leading-relaxed"
            >
              Experience premium AI conversations with sophisticated responses, elegant design, 
              and exclusive features. Where luxury meets artificial intelligence.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="font-serif bg-gradient-to-r from-[#FFD700] to-[#50C878] text-[#333333] hover:shadow-xl hover:scale-105 transition-all duration-300 group font-semibold"
                >
                  <Link href="/chat" className="flex items-center gap-2">
                    Open Dashboard
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="font-serif bg-gradient-to-r from-[#FFD700] to-[#50C878] text-[#333333] hover:shadow-xl hover:scale-105 transition-all duration-300 group font-semibold"
                  >
                    <Link href="/signup" className="flex items-center gap-2">
                      Start Premium Experience
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    size="lg" 
                    variant="outline" 
                    className="font-serif border-2 border-[#FFD700]/30 hover:bg-[#FFD700]/5 hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                </>
              )}
            </motion.div>

            {/* Trust indicators */}
            {/* <motion.div variants={fadeUp} className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-r from-[#FFD700] to-[#50C878] border-2 border-background" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">12k+ premium users</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                ))}
                <span className="text-sm text-muted-foreground ml-1">4.9/5 rating</span>
              </div>
            </motion.div> */}
          </motion.div>

          {/* Enhanced Image Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative flex items-center justify-center lg:order-last"
          >
            <div className="relative">
              <Image
                src="/illustrations/image.png"
                alt="StockWhisperer AI premium interface"
                width={700}
                height={450}
                className="rounded-2xl border border-[#FFD700]/20 shadow-2xl hover:shadow-3xl transition-shadow duration-500"
                priority
              />
              {/* Floating UI elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-[#50C878] text-white px-3 py-2 rounded-lg shadow-lg text-sm font-semibold"
              >
                Premium Active
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-[#FFD700] text-[#333333] px-3 py-2 rounded-lg shadow-lg text-sm font-semibold"
              >
                AI Ready
              </motion.div>
            </div>

            {/* Additional floating elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-8 -left-8 h-16 w-16 rounded-full bg-gradient-to-r from-[#50C878] to-[#FFD700] opacity-20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-8 -right-8 h-12 w-12 rounded-full bg-gradient-to-r from-[#FFD700] to-[#50C878] opacity-20"
            />
          </motion.div>
        </div>
      </section>

      {/* ===== ENHANCED STATS SECTION ===== */}
      <section className="bg-gradient-to-r from-[#333333]/5 via-background to-[#333333]/5 py-16 md:py-24 border-y border-border/20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="grid gap-8 md:grid-cols-4"
          >
            {[
              // { label: "Premium Users", value: "12k+", icon: Users, color: "text-[#FFD700]" },
              { label: "AI Conversations", value: "150k+", icon: Brain, color: "text-[#50C878]" },
              { label: "Response Time", value: "<2s", icon: Zap, color: "text-blue-500" },
              { label: "Satisfaction", value: "98%", icon: Award, color: "text-purple-500" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={scaleIn}
                className="group relative overflow-hidden rounded-2xl border border-border/20 bg-card/50 backdrop-blur-sm p-8 text-center hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-[#50C878]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <stat.icon className={`h-8 w-8 mx-auto mb-4 ${stat.color}`} />
                  <span className="block text-4xl font-bold tracking-tight text-[#FFD700] font-serif mb-2">
                    {stat.value}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== BENEFITS SECTION ===== */}
      <section id="benefits" className="py-20 md:py-32 bg-gradient-to-b from-background to-[#333333]/10">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold tracking-tighter text-[#FFD700] font-serif sm:text-4xl md:text-5xl mb-4"
            >
              Why Choose <span className="bg-gradient-to-r from-[#50C878] to-[#FFD700] bg-clip-text text-transparent">StockWhisperer AI</span>?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-3xl text-muted-foreground md:text-xl"
            >
              Experience the pinnacle of AI conversation technology with premium features designed for discerning users
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                title: "Premium AI Models",
                description: "Access to the most advanced AI models with sophisticated reasoning capabilities",
                icon: Brain,
                image: "/illustrations/Brain.png",
                gradient: "from-[#FFD700]/20 to-[#50C878]/20"
              },
              {
                title: "Elegant Interface",
                description: "Beautifully crafted user experience with attention to every detail",
                icon: Feather,
                image: "/illustrations/text.png",
                gradient: "from-[#50C878]/20 to-[#FFD700]/20"
              },
              {
                title: "Enterprise Security",
                description: "Bank-level security with Firebase authentication and data encryption",
                icon: Lock,
                image: "/illustrations/lock.png",
                gradient: "from-[#333333]/20 to-[#FFD700]/20"
              },
              {
                title: "Conversation History",
                description: "Never lose important conversations with intelligent search and organization",
                icon: MessageCircle,
                image: "/illustrations/search.png",
                gradient: "from-[#FFD700]/20 to-[#333333]/20"
              },
              {
                title: "Premium Support",
                description: "Priority customer support with dedicated assistance for premium users",
                icon: Users,
                image: "/illustrations/support.png",
                gradient: "from-[#50C878]/20 to-[#333333]/20"
              },
              {
                title: "Advanced Features",
                description: "Exclusive features and early access to new capabilities",
                icon: Zap,
                image: "/illustrations/thunder.png",
                gradient: "from-[#333333]/20 to-[#50C878]/20"
              },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="group"
              >
                <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-card to-card/80">
                  <div className="relative overflow-hidden">
                    <Image
                      src={benefit.image}
                      alt={benefit.title}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110 rounded-t-lg"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-60`} />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <benefit.icon className="h-6 w-6 text-[#FFD700]" />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl text-[#FFD700]">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ENHANCED FEATURES SECTION ===== */}
      <section
        id="features"
        className="bg-gradient-to-b from-[#333333]/10 to-background py-20 md:py-32 border-t"
      >
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeUp}
              className="mb-4 inline-block rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 px-6 py-2 text-sm font-serif text-[#FFD700]"
            >
              ✨ Premium Features
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="mb-6 text-3xl font-bold tracking-tighter text-[#FFD700] font-serif sm:text-4xl md:text-5xl"
            >
              Sophisticated AI Conversations
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-3xl text-muted-foreground md:text-xl"
            >
              Every feature crafted with precision to deliver an unparalleled conversational experience
            </motion.p>
          </motion.div>

          <div className="grid w-full max-w-7xl mx-auto gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Intelligent Conversations",
                icon: MessageCircle,
                copy: "Engage in sophisticated dialogues with advanced AI that understands context and nuance.",
                color: "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20",
                iconBg: "bg-[#FFD700]/20"
              },
              {
                title: "Premium Security",
                icon: ShieldCheck,
                copy: "Enterprise-grade security with Firebase authentication and end-to-end encryption.",
                color: "bg-[#50C878]/10 text-[#50C878] border-[#50C878]/20",
                iconBg: "bg-[#50C878]/20"
              },
              {
                title: "AI Assistant",
                icon: Bot,
                copy: "Your personal AI companion with advanced reasoning and creative capabilities.",
                color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
                iconBg: "bg-purple-500/20"
              },
              {
                title: "Conversation Archive",
                icon: Feather,
                copy: "Elegant organization and search of all your conversations with intelligent categorization.",
                color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                iconBg: "bg-blue-500/20"
              },
              {
                title: "Premium Community",
                icon: Users,
                copy: "Connect with like-minded individuals in our exclusive premium user community.",
                color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                iconBg: "bg-indigo-500/20"
              },
              {
                title: "Advanced Analytics",
                icon: LineChart,
                copy: "Insights into your conversation patterns and AI interaction analytics.",
                color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                iconBg: "bg-emerald-500/20"
              },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={scaleIn}
                className="group"
              >
                <Card className={`h-full transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${feat.color} backdrop-blur-sm`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-serif group-hover:text-[#FFD700] transition-colors">
                        {feat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${feat.iconBg}`}>
                        <feat.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.copy}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS SECTION ===== */}
      {/* <section id="testimonials" className="py-20 md:py-32 bg-gradient-to-r from-background via-[#333333]/5 to-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold tracking-tighter text-[#FFD700] font-serif sm:text-4xl md:text-5xl mb-4"
            >
              What Our Premium Users Say
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-2xl text-muted-foreground md:text-xl"
            >
              Join the exclusive community of users who have elevated their AI conversation experience
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                name: "Alexandra Sterling",
                role: "Creative Director",
                avatar: "/api/placeholder/60/60",
                rating: 5,
                text: "StockWhisperer AI has revolutionized how I approach creative projects. The AI's sophistication is unmatched."
              },
              {
                name: "Marcus Chen",
                role: "Tech Executive",
                avatar: "/api/placeholder/60/60",
                rating: 5,
                text: "The premium experience is worth every penny. The interface is elegant and the AI responses are incredibly nuanced."
              },
              {
                name: "Isabella Rodriguez",
                role: "Research Analyst",
                avatar: "/api/placeholder/60/60",
                rating: 5,
                text: "Finally, an AI platform that matches my professional standards. The conversation quality is exceptional."
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
              >
                <Card className="h-full bg-gradient-to-br from-card to-card/80 border-[#FFD700]/20 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="rounded-full border-2 border-[#FFD700]/30"
                        />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#50C878] rounded-full border-2 border-background" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ===== PRICING SECTION (Updated with correct tiers) ===== */}
      <section id="pricing" className="py-20 md:py-32 bg-gradient-to-b from-background to-[#333333]/10">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold tracking-tighter text-[#FFD700] font-serif sm:text-4xl md:text-5xl mb-4"
            >
              Choose Your Premium Experience
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-2xl text-muted-foreground md:text-xl"
            >
              Select the perfect tier for your AI conversation needs. All plans include premium features.
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                name: "Free Tier",
                price: "Free",
                period: "forever",
                description: "Experience premium quality",
                icon: MessageCircle,
                features: [
              'Limited to 4 chats', 
                'Maximum 10 questions per chat', 
                '5,000 token response limit',
                ],
                popular: false,
                cta: "Get Started",
                gradient: "from-gray-500/10 to-gray-600/10",
                borderColor: "border-gray-500/20"
              },
              {
                name: "Gold Tier",
                price: "$30",
                period: "per month",
                description: "Premium conversations",
                icon: Crown,
                features: [
                'Up to 100 chats', 
                'Unlimited questions per chat', 
                '2 million token response limit',
                'Priority support'

                ],
                popular: true,
                cta: "Start Gold",
                gradient: "from-[#FFD700]/20 to-[#50C878]/20",
                borderColor: "border-[#FFD700]/50"
              },
              {
                name: "Diamond Tier",
                price: "$49",
                period: "per month",
                description: "Ultimate AI experience",
                icon: Gem,
                features: [
                  'Unlimited chats', 
                  'Unlimited questions', 
                  'Unlimited token responses',
                  'Premium support',
                  'Early access to new features'
                ],
                popular: false,
                cta: "Go Diamond",
                gradient: "from-purple-500/20 to-[#FFD700]/20",
                borderColor: "border-purple-500/50"
              }
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={scaleIn}
                className="relative group"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-[#FFD700] to-[#50C878] text-[#333333] px-4 py-1 font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full relative overflow-hidden border-2 ${plan.borderColor} ${plan.popular ? 'shadow-xl scale-105 shadow-[#FFD700]/20' : 'border-border/20'} hover:shadow-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br ${plan.gradient} backdrop-blur-sm`}>
                  <CardHeader className="text-center pb-8 relative">
                    <div className="absolute top-4 right-4">
                      <plan.icon className={`h-6 w-6 ${plan.popular ? 'text-[#FFD700]' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle className={`text-2xl font-serif ${plan.popular ? 'text-[#FFD700]' : 'text-foreground'}`}>
                      {plan.name}
                    </CardTitle>
                    <div className="mt-4">
                      <span className={`text-4xl font-bold ${plan.popular ? 'text-[#FFD700]' : 'text-foreground'}`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-muted-foreground ml-1">/{plan.period}</span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <CheckCircle className={`h-4 w-4 flex-shrink-0 ${plan.popular ? 'text-[#50C878]' : 'text-green-500'}`} />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className={`w-full mt-6 ${plan.popular 
                        ? 'bg-gradient-to-r from-[#FFD700] to-[#50C878] text-[#333333] hover:shadow-lg font-semibold' 
                        : 'variant-outline hover:bg-[#FFD700]/5'
                      } transition-all duration-300 hover:scale-105`}
                    >
                      <Link href={plan.name === 'Diamond Tier' ? '/contact' : '/signup'}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pricing FAQ */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mt-16 text-center"
          >
            <p className="text-sm text-muted-foreground mb-4">
              All plans include premium AI models, secure conversations, and elegant interface
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-[#50C878]" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-[#50C878]" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-[#50C878]" />
                <span>30-day money back</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== ENHANCED CTA SECTION ===== */}
      <section className="relative overflow-hidden border-t bg-gradient-to-br from-[#FFD700]/5 via-[#50C878]/5 to-background py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#FFD700]/30 to-[#50C878]/30 blur-3xl animate-pulse" />
          <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-[#50C878]/20 blur-2xl animate-pulse delay-1000" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFD700]/20 blur-3xl animate-pulse delay-2000" />
        </div>
        
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeUp}
              className="mb-6 text-4xl font-bold tracking-tighter font-serif sm:text-5xl md:text-6xl"
            >
              Ready to Experience 
              <br />
              <span className="bg-gradient-to-r from-[#FFD700] via-[#50C878] to-[#FFD700] bg-clip-text text-transparent">
                Premium AI Conversations
              </span>?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed"
            >
              Join over 12,000 discerning users who have chosen StockWhisperer AI for sophisticated, 
              secure, and elegant AI conversations.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto font-serif bg-gradient-to-r from-[#FFD700] to-[#50C878] text-[#333333] hover:shadow-2xl hover:scale-105 transition-all duration-300 group px-8 py-6 text-lg font-semibold"
                >
                  <Link href="/chat" className="flex items-center gap-2">
                    Enter Premium Dashboard
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="w-full sm:w-auto font-serif bg-gradient-to-r from-[#FFD700] to-[#50C878] text-[#333333] hover:shadow-2xl hover:scale-105 transition-all duration-300 group px-8 py-6 text-lg font-semibold"
                  >
                    <Link href="/signup" className="flex items-center gap-2">
                      Start Premium Experience
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto font-serif border-2 border-[#FFD700]/30 hover:bg-[#FFD700]/5 hover:scale-105 transition-all duration-300 px-8 py-6 text-lg"
                  >
                    <Link href="/login">Login</Link>
                  </Button>
                </>
              )}
            </motion.div>

            {!user && (
              <motion.div variants={fadeUp} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Already a member?&nbsp;
                  <Link
                    href="/login"
                    className="text-[#FFD700] underline underline-offset-2 hover:text-[#50C878] transition-colors"
                  >
                    Log in here
                  </Link>
                </p>
                
                {/* Enhanced trust badges */}
                <div className="flex flex-wrap justify-center items-center gap-6 pt-6 border-t border-border/20">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-[#50C878]" />
                    <span>No credit card required</span>
                  </div>
                 
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-[#50C878]" />
                    <span>Premium support</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      
    </div>
  );
}
