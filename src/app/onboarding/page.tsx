"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { auth, googleProvider } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";

/* ── Scroll reveal hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    const items = el.querySelectorAll(".reveal");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Navbar ── */
function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-[#F5F7FB]/80 backdrop-blur-md border-b border-[#E5E7EB]/60">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#60A5FA] to-[#2563EB] flex items-center justify-center">
            <span className="text-white font-bold text-sm">PF</span>
          </div>
          <span className="font-semibold text-[#111827] text-[15px]">PrepFit</span>
        </Link>
        <Link
          href="/signin"
          className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          Sign In
        </Link>
      </div>
    </nav>
  );
}

/* ── Hero ── */
function Hero({ onStartFree }: { onStartFree: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-32 text-center">
        {/* Tag pill */}
        <div className="animate-fade-in mb-6">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-[#EFF6FF] text-[#2563EB] rounded-full border border-[#2563EB]/20">
            AI-Powered Interview Prep Software
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in delay-100 text-[32px] md:text-[48px] font-bold text-[#111827] leading-[1.15] tracking-tight max-w-3xl mx-auto mb-5">
          Prepare for interviews faster
          <span className="block text-[#2563EB]">— and with confidence</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in delay-200 text-[15px] md:text-[17px] text-[#6B7280] leading-relaxed max-w-2xl mx-auto mb-8">
          PrepFit analyzes your resume against any job description, generates tailored
          interview questions, and gives AI-powered feedback so you walk in ready.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <button
            onClick={onStartFree}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#2563EB] text-white font-semibold rounded-[14px] hover:bg-[#1D4ED8] transition-all hover:scale-[1.02] text-sm shadow-lg shadow-[#2563EB]/25"
          >
            Start Free
          </button>
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full sm:w-auto px-8 py-3.5 border border-[#E5E7EB] text-[#374151] font-medium rounded-[14px] hover:bg-white transition-colors text-sm"
          >
            See How It Works
          </button>
        </div>

        {/* Mockup visual */}
        <div className="animate-fade-in delay-400 relative max-w-2xl mx-auto">
          {/* Floating cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <MockCard
              icon="📊"
              label="Match Score"
              value="87%"
              color="#2563EB"
              floatDelay="0s"
            />
            <MockCard
              icon="💡"
              label="Strengths"
              value="5 found"
              color="#22C55E"
              floatDelay="1.5s"
            />
            <MockCard
              icon="🎯"
              label="Questions"
              value="10 ready"
              color="#8B5CF6"
              floatDelay="3s"
            />
          </div>
          {/* Background glow */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#2563EB]/5 to-transparent blur-3xl rounded-full" />
        </div>
      </div>
    </section>
  );
}

function MockCard({ icon, label, value, color, floatDelay }: {
  icon: string; label: string; value: string; color: string; floatDelay: string;
}) {
  return (
    <div
      className="animate-float bg-white rounded-[14px] p-3 md:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB] text-center"
      style={{ animationDelay: floatDelay }}
    >
      <div className="text-xl md:text-2xl mb-1">{icon}</div>
      <div className="text-[11px] md:text-xs text-[#9CA3AF] mb-0.5">{label}</div>
      <div className="text-sm md:text-base font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

/* ── How It Works ── */
const steps = [
  { num: 1, icon: "📄", title: "Upload Resume", desc: "Paste your resume or upload a PDF. We extract and clean the text automatically." },
  { num: 2, icon: "📋", title: "Add Job Description", desc: "Paste the job posting you're targeting. We analyze the match." },
  { num: 3, icon: "🔍", title: "Get AI Analysis", desc: "See your match score, strengths, missing keywords, and improvement tips." },
  { num: 4, icon: "💬", title: "Practice Questions", desc: "Review tailored interview questions with guided answer frameworks." },
  { num: 5, icon: "📈", title: "Improve with Feedback", desc: "Track weak areas, practice mock interviews, and build confidence." },
];

function HowItWorks() {
  const ref = useScrollReveal();
  return (
    <section id="how-it-works" className="bg-white py-16 md:py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="reveal text-center mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#111827] mb-3">How PrepFit Works</h2>
          <p className="text-[15px] text-[#6B7280] max-w-lg mx-auto">
            Five simple steps from resume to interview-ready
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className="reveal bg-[#F5F7FB] rounded-[16px] p-5 text-center hover:shadow-md transition-shadow duration-300"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-sm">
                {s.num}
              </div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <h3 className="text-sm font-semibold text-[#111827] mb-1">{s.title}</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ── */
const features = [
  { icon: "📊", title: "Resume Match Analysis", desc: "See how well your resume matches any job description with a percentage score and detailed breakdown.", premium: false },
  { icon: "🎯", title: "Interview Question Generator", desc: "Get 8-12 tailored questions across technical, behavioral, and HR categories ordered by relevance.", premium: false },
  { icon: "🎤", title: "Mock Interviews", desc: "Practice with our AI interviewer. Answer questions and get instant scoring on clarity, confidence, and structure.", premium: true },
  { icon: "⭐", title: "AI Answer Scoring", desc: "Every answer is evaluated on clarity, relevance, confidence, and structure with actionable feedback.", premium: true },
  { icon: "📈", title: "Weak Area Tracking", desc: "See recurring patterns across sessions. Know exactly what to work on to improve faster.", premium: true },
  { icon: "📋", title: "Progress Reports", desc: "Get a complete report after each mock interview with scores, tips, and next steps.", premium: true },
];

function Features() {
  const ref = useScrollReveal();
  return (
    <section className="py-16 md:py-24" ref={ref}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="reveal text-center mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#111827] mb-3">Everything you need to prepare</h2>
          <p className="text-[15px] text-[#6B7280] max-w-lg mx-auto">
            Built specifically for entry-level job seekers and fresh graduates
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="reveal bg-white rounded-[16px] p-5 border border-[#E5E7EB] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{f.icon}</div>
                {f.premium && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                    PREMIUM
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-[#111827] mb-1">{f.title}</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ── */
function Pricing({ onStartFree }: { onStartFree: () => void }) {
  const ref = useScrollReveal();
  return (
    <section className="bg-white py-16 md:py-24" ref={ref}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="reveal text-center mb-12">
          <h2 className="text-[28px] md:text-[36px] font-bold text-[#111827] mb-3">Simple, affordable pricing</h2>
          <p className="text-[15px] text-[#6B7280] max-w-lg mx-auto">
            Start free. Upgrade when you&apos;re ready for more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Free */}
          <div className="reveal bg-[#F5F7FB] rounded-[20px] p-6 border border-[#E5E7EB]">
            <h3 className="text-[18px] font-semibold text-[#111827] mb-1">Free</h3>
            <div className="mb-4">
              <span className="text-[32px] font-bold text-[#111827]">$0</span>
              <span className="text-sm text-[#6B7280] ml-1">forever</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-[#6B7280]">
              <li className="flex gap-2"><span className="text-green-500">✓</span> 3 analyses / day</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> 4 interview prep questions</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Question bookmarking</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Daily question</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Basic prep tools</li>
            </ul>
            <button
              onClick={onStartFree}
              className="w-full py-2.5 border border-[#E5E7EB] text-[#111827] font-medium rounded-[12px] hover:bg-white transition-colors text-sm"
            >
              Get Started
            </button>
          </div>

          {/* Premium */}
          <div className="reveal bg-gradient-to-b from-[#EFF6FF] to-white rounded-[20px] p-6 border-2 border-[#2563EB] shadow-lg shadow-[#2563EB]/10 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2563EB] text-white text-[10px] font-semibold rounded-full">
              EARLY ADOPTER PRICE
            </span>
            <h3 className="text-[18px] font-semibold text-[#111827] mb-1 mt-1">Premium</h3>
            <div className="mb-4">
              <span className="text-[14px] text-[#9CA3AF] line-through mr-2">$5.99</span>
              <span className="text-[32px] font-bold text-[#2563EB]">$2.99</span>
              <span className="text-sm text-[#6B7280] ml-1">/mo</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-[#6B7280]">
              <li className="flex gap-2"><span className="text-[#2563EB]">✓</span> Everything in Free</li>
              <li className="flex gap-2"><span className="text-[#2563EB]">✓</span> Unlimited analyses</li>
              <li className="flex gap-2"><span className="text-[#2563EB]">✓</span> Full interview prep access</li>
              <li className="flex gap-2"><span className="text-[#2563EB]">✓</span> Mock interviews with AI scoring</li>
              <li className="flex gap-2"><span className="text-[#2563EB]">✓</span> Weak area tracking</li>
              <li className="flex gap-2"><span className="text-[#2563EB]">✓</span> PDF exports</li>
              <li className="flex gap-2"><span className="text-[#2563EB]">✓</span> Advanced feedback</li>
            </ul>
            <button
              onClick={onStartFree}
              className="w-full py-2.5 bg-[#2563EB] text-white font-semibold rounded-[12px] hover:bg-[#1D4ED8] transition-colors text-sm"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Auth Section ── */
function AuthSection() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  async function handleGoogleSignUp() {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      router.push("/dashboard");
    } catch (e: any) {
      if (e.code === "auth/popup-closed-by-user") {
        /* dismissed */
      } else {
        console.error("Google sign-in error:", e);
        setGoogleError(e.message || "Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const ref = useScrollReveal();
  return (
    <section className="py-16 md:py-24" ref={ref} id="get-started">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="reveal mb-8">
          <h2 className="text-[24px] md:text-[28px] font-bold text-[#111827] mb-2">Ready to prepare smarter?</h2>
          <p className="text-sm text-[#6B7280]">Join thousands of entry-level job seekers using PrepFit.</p>
        </div>

        <div className="reveal space-y-3">
          <button
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] text-[#111827] font-medium rounded-[14px] py-3 hover:bg-gray-50 transition-colors text-sm shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>
          {googleError && <p className="text-red-500 text-sm">{googleError}</p>}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E7EB]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#F5F7FB] px-3 text-[#9CA3AF]">or</span></div>
          </div>

          <Link
            href="/register"
            className="block w-full py-3 bg-[#2563EB] text-white font-semibold rounded-[14px] hover:bg-[#1D4ED8] transition-colors text-sm"
          >
            Create Free Account
          </Link>

          <p className="text-xs text-[#9CA3AF]">
            Already have an account?{" "}
            <Link href="/signin" className="text-[#2563EB] font-medium hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="mt-6 text-xs text-[#9CA3AF]">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-[#2563EB] hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#2563EB] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </section>
  );
}

/* ── Main Page ── */
export default function OnboardingPage() {
  const scrollToAuth = () => {
    document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <Navbar />
      <Hero onStartFree={scrollToAuth} />
      <HowItWorks />
      <Features />
      <Pricing onStartFree={scrollToAuth} />
      <AuthSection />
    </div>
  );
}
