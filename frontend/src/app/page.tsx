"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: "🏢", title: "Company-specific questions", desc: "Filter by Microsoft, Meta, Google and more. Practice exactly what your target company asks in real interviews." },
  { icon: "📊", title: "Ranked by frequency",        desc: "Questions sorted by how often they appear. Focus on problems that actually show up, not random noise." },
  { icon: "🔍", title: "Smart search & filters",     desc: "Filter Easy, Medium, Hard. Search by problem name. Find what you need in seconds." },
  { icon: "⚡", title: "One-click LeetCode access",  desc: "Premium members get a direct link to every LeetCode problem with a single click." },
];

const PREVIEW = [
  { n: 1, title: "Two Sum",              diff: "Easy",   freq: 100 },
  { n: 2, title: "Merge Intervals",      diff: "Medium", freq: 84  },
  { n: 3, title: "Merge k Sorted Lists", diff: "Hard",   freq: 77  },
  { n: 4, title: "3Sum",                diff: "Medium", freq: 76  },
  { n: 5, title: "Valid Parentheses",    diff: "Easy",   freq: 71  },
];

const DIFF: Record<string, string> = {
  Easy:   "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  Hard:   "bg-red-50 text-red-700",
};

const TOP_COMPANIES = [
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Meta",      domain: "meta.com" },
  { name: "Google",    domain: "google.com" },
  { name: "Amazon",    domain: "amazon.com" },
  { name: "Apple",     domain: "apple.com" },
  { name: "Netflix",   domain: "netflix.com" },
  { name: "Adobe",     domain: "adobe.com" },
  { name: "Uber",      domain: "uber.com" },
  { name: "Airbnb",    domain: "airbnb.com" },
  { name: "Twitter",   domain: "twitter.com" },
  { name: "Nvidia",    domain: "nvidia.com" },
  { name: "Stripe",    domain: "stripe.com" },
];

export default function HomePage() {
  const { user, login } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">TL</span>
            </div>
            <span className="font-semibold text-sm text-slate-900">TheLeetCompany</span>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/questions" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">Questions</Link>
            <a href="#pricing" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">Pricing</a>
            {user ? (
              <Link href="/questions" className="text-xs sm:text-sm font-semibold bg-slate-900 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shrink-0">
                Open App
              </Link>
            ) : (
              <button onClick={login} className="text-xs sm:text-sm font-semibold bg-slate-900 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shrink-0">
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-24 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6 sm:mb-8">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              200+ real interview questions
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-5 sm:mb-6">
              Crack your<br />
              <span className="text-blue-600">dream company</span><br />
              interview.
            </h1>

            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-7 sm:mb-8 max-w-md">
              Stop grinding random problems. Get the exact questions asked by top tech companies, sorted by how often they actually appear.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <Link href="/questions" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                  Start practicing free →
                </Link>
              ) : (
                <button onClick={login} className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                  Start practicing free →
                </button>
              )}
              <a href="#pricing" className="inline-flex items-center justify-center bg-white text-slate-700 font-medium text-sm px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                View pricing
              </a>
            </div>
          </div>

          {/* Right: preview card */}
          <div className="w-full border border-slate-200 rounded-2xl overflow-hidden shadow-md">
            {/* Browser bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
              </div>
              <span className="text-[11px] text-slate-400 font-mono">theleetcompany.com/questions</span>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ minWidth: 380 }}>
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Problem</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Difficulty</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Freq.</th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW.map(row => (
                    <tr key={row.n} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 text-slate-300 font-mono">{row.n}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.title}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DIFF[row.diff]}`}>{row.diff}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.freq}%` }} />
                          </div>
                          <span className="text-slate-400">{row.freq}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPANIES STRIP (MARQUEE) ── */}
      <section className="border-y border-slate-100 bg-slate-50 py-8 sm:py-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center mb-6">
          <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-widest">
            Questions from the world&apos;s top companies
          </p>
        </div>
        
        {/* Marquee Container */}
        <div className="relative w-full flex">
          {/* Left/Right fading gradients */}
          <div className="absolute top-0 left-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

          {/* Scrolling Content */}
          <div className="flex w-max animate-marquee gap-4 sm:gap-6 px-3">
            {[...TOP_COMPANIES, ...TOP_COMPANIES].map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm shrink-0 hover:shadow-md hover:border-slate-300 transition-all cursor-default">
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`} 
                  alt={c.name} 
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded object-contain shrink-0" 
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-sm sm:text-base font-bold text-slate-800">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Everything you need to prepare smarter</h2>
          <p className="text-slate-500 text-sm sm:text-base">Built for engineers who take their preparation seriously.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-1.5 text-sm sm:text-base">{f.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Simple, honest pricing</h2>
          <p className="text-slate-500 text-sm sm:text-base">One-time payment. No subscriptions. No tricks.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">

          {/* Free card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Free</p>
            <p className="text-4xl font-extrabold text-slate-900 mb-1">₹0</p>
            <p className="text-xs text-slate-400 mb-6">Forever free</p>
            <ul className="space-y-2.5 mb-7">
              {["First 20 questions per company","3 companies included","Difficulty filters","Search"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <span className="text-emerald-500 font-bold text-base leading-none">✓</span>{f}
                </li>
              ))}
              {["All companies unlocked","Direct LeetCode links","Priority support"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="font-bold text-base leading-none">✗</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/questions" className="block text-center text-sm font-semibold bg-slate-50 border border-slate-200 text-slate-800 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
              Get started free
            </Link>
          </div>

          {/* Premium card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Premium</p>
            <p className="text-4xl font-extrabold text-white mb-1">₹49</p>
            <p className="text-xs text-slate-500 mb-6">One-time · Lifetime access</p>
            <ul className="space-y-2.5 mb-7">
              {["Everything in Free","Direct LeetCode links","All company banks","Acceptance rate data","Lifetime access"].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
                  <span className="text-blue-500 font-bold text-base leading-none">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/questions" className="block text-center text-sm font-semibold bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              Upgrade to Premium
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-white mt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">TL</span>
            </div>
            <span className="font-semibold text-sm text-slate-900">TheLeetCompany</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} TheLeetCompany. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/questions" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Questions</Link>
            <a href="#pricing" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
