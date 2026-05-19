"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";
import PaymentButton from "../../components/PaymentButton";
import UserAvatar from "../../components/UserAvatar";

interface ProgressStats {
  total:  number;
  easy:   number;
  medium: number;
  hard:   number;
  solvedIds: string[];
}

// Simple SVG donut ring
function DonutRing({ value, max, color, radius = 36 }: { value: number; max: number; color: string; radius?: number }) {
  const circumference = 2 * Math.PI * radius;
  const pct    = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);
  return (
    <svg width={radius * 2 + 16} height={radius * 2 + 16} viewBox={`0 0 ${radius * 2 + 16} ${radius * 2 + 16}`}>
      <circle cx={radius + 8} cy={radius + 8} r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
      <circle
        cx={radius + 8} cy={radius + 8} r={radius} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${radius + 8} ${radius + 8})`}
        style={{ transition: "stroke-dashoffset 0.7s ease" }}
      />
    </svg>
  );
}

// Horizontal bar stat
function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-xs text-slate-400">{value} solved</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats]     = useState<ProgressStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/questions");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.get<ProgressStats>("/progress/stats")
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [user]);

  if (loading || !user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="spin w-8 h-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">TL</span>
            </div>
            <span className="font-semibold text-sm hidden sm:block">TheLeetCompany</span>
          </Link>
          <div className="flex items-center gap-3">
            {user.isAdmin && (
              <Link href="/admin" className="text-xs font-semibold bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors">
                🔑 Admin Panel
              </Link>
            )}
            <Link href="/questions" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              ← Questions
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ── PROFILE CARD ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-sm">
          <div className="relative shrink-0">
            <UserAvatar name={user.name} size={80} className="ring-4 ring-slate-100" />
            {user.isPremium && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-50 border-2 border-white rounded-full flex items-center justify-center text-sm">⚡</div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">{user.name}</h1>
              {user.isPremium
                ? <span className="inline-flex self-center items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">⚡ Premium</span>
                : <span className="inline-flex self-center items-center bg-slate-50 border border-slate-200 text-slate-400 text-xs font-medium px-2.5 py-1 rounded-full">Free Plan</span>
              }
            </div>
            <p className="text-sm text-slate-400 mb-4">{user.email}</p>
            <button onClick={logout} className="text-xs font-medium text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">
              Sign out
            </button>
          </div>
        </div>

        {/* ── PROGRESS CARD ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-5">Your Progress</h2>

          {statsLoading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-8 bg-slate-100 rounded-lg" />)}
            </div>
          ) : stats && stats.total > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Left: donut + total */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="relative">
                  <DonutRing value={stats.total} max={Math.max(stats.total + 20, 50)} color="#2563EB" radius={52} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
                    <span className="text-xs text-slate-400">Solved</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  {stats.easy + stats.medium + stats.hard} total problems marked
                </p>
              </div>

              {/* Right: breakdown bars */}
              <div className="flex flex-col justify-center gap-5">
                <StatBar label="Easy"   value={stats.easy}   total={stats.total} color="#059669" />
                <StatBar label="Medium" value={stats.medium} total={stats.total} color="#D97706" />
                <StatBar label="Hard"   value={stats.hard}   total={stats.total} color="#DC2626" />

                {/* Pill badges */}
                <div className="flex gap-2 flex-wrap pt-1">
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                    {stats.easy} Easy
                  </span>
                  <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                    {stats.medium} Medium
                  </span>
                  <span className="text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                    {stats.hard} Hard
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-sm font-medium text-slate-600 mb-1">No problems solved yet</p>
              <p className="text-xs text-slate-400 mb-5">Go to the Questions page and click the ✓ button to mark problems as solved.</p>
              <Link href="/questions" className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                Start Practicing →
              </Link>
            </div>
          )}
        </div>

        {/* ── ACCOUNT + MEMBERSHIP GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Account details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Account</h2>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider mb-1">Name</p>
                <p className="text-sm font-semibold">{user.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider mb-1">Auth Provider</p>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-semibold">Google</span>
                </div>
              </div>
            </div>
          </div>

          {/* Membership */}
          <div className={`rounded-2xl p-6 shadow-sm border ${user.isPremium ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Membership</h2>

            {user.isPremium ? (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl">⚡</div>
                  <div>
                    <p className="font-bold text-amber-900">Premium Plan</p>
                    <p className="text-xs text-amber-700">All features unlocked</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {["All company banks", "Unlimited LeetCode links", "Lifetime access"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-amber-800">
                      <span className="text-emerald-500 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">🔒</div>
                  <div>
                    <p className="font-bold text-slate-900">Free Plan</p>
                    <p className="text-xs text-slate-400">3 companies · 20 questions</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-5">
                  {["All company banks locked", "LeetCode links locked"].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="text-red-300 font-bold">✗</span> {f}
                    </li>
                  ))}
                </ul>
                <PaymentButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
