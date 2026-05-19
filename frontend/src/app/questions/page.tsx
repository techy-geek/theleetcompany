"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";
import PaymentButton from "../../components/PaymentButton";
import UserAvatar from "../../components/UserAvatar";

interface Question {
  _id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  frequency: number;
  acceptanceRate: number;
  link: string;
  topic: string[];
}

interface QuestionsResponse {
  questions: Question[];
  total: number;
  hasMore: boolean;
  freeLimit: number;
  isPremium: boolean;
  locked?: boolean;
  message?: string;
}

type Difficulty = "All" | "Easy" | "Medium" | "Hard";

const COMPANY_DOMAINS: Record<string, string> = {
  Microsoft: "microsoft.com", Meta: "meta.com", Google: "google.com",
  Amazon: "amazon.com", Apple: "apple.com", Netflix: "netflix.com",
  Adobe: "adobe.com", LinkedIn: "linkedin.com", Uber: "uber.com",
  Airbnb: "airbnb.com", Twitter: "twitter.com", Salesforce: "salesforce.com",
  Oracle: "oracle.com", Nvidia: "nvidia.com", Atlassian: "atlassian.com",
  PayPal: "paypal.com", TikTok: "tiktok.com", Bloomberg: "bloomberg.com",
  AMD: "amd.com", Intel: "intel.com", IBM: "ibm.com", Samsung: "samsung.com",
  Goldman: "goldmansachs.com", Spotify: "spotify.com", Snapchat: "snapchat.com",
  Pinterest: "pinterest.com", Dropbox: "dropbox.com", Stripe: "stripe.com",
  Shopify: "shopify.com", Zoom: "zoom.us", Lyft: "lyft.com", Walmart: "walmart.com",
};

function getDomain(name: string): string {
  return COMPANY_DOMAINS[name] ?? name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
}

function CompanyLogo({ name, size = 18 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return (
    <span className="rounded flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: Math.max(size * 0.5, 8), background: "#CBD5E1" }}>
      {name[0]}
    </span>
  );
  return (
    <img src={`https://www.google.com/s2/favicons?domain=${getDomain(name)}&sz=64`}
      alt={name} width={size} height={size}
      className="rounded object-contain shrink-0" onError={() => setFailed(true)} />
  );
}

const PAGE_SIZE = 10;

export default function QuestionsPage() {
  const { user, loading: authLoading, login } = useAuth();

  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("All");
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [companySearch, setCompanySearch] = useState("");

  const isPremium = user?.isPremium ?? false;

  const filtered = useMemo(() =>
    questions.filter(q =>
      q.title.toLowerCase().includes(search.toLowerCase()) &&
      (difficulty === "All" || q.difficulty === difficulty)
    ), [questions, search, difficulty]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const visibleCompanies = useMemo(() =>
    allCompanies.filter(c => c.toLowerCase().includes(companySearch.toLowerCase())),
    [allCompanies, companySearch]);

  // Reset page when filters/company change
  useEffect(() => { setPage(1); }, [search, difficulty, selectedCompany]);

  useEffect(() => {
    if (!user) return;
    api.get("/progress").then(r => setSolvedIds(new Set(r.data.solvedIds))).catch(console.error);
  }, [user]);

  const toggleSolved = async (questionId: string) => {
    if (!user || togglingId) return;
    setTogglingId(questionId);
    try {
      await api.post(`/progress/toggle/${questionId}`);
      setSolvedIds(prev => {
        const next = new Set(prev);
        if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
        return next;
      });
    } catch (e) { console.error(e); }
    finally { setTogglingId(null); }
  };

  useEffect(() => {
    api.get("/questions/companies").then(r => {
      const data = r.data;
      const companies = Array.isArray(data) ? data : (data.companies ?? []);
      setAllCompanies(companies);
      setSelectedCompany(companies[0] ?? "");
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    setLoading(true); setSearch(""); setDifficulty("All");
    api.get<QuestionsResponse>(`/questions?company=${selectedCompany}`)
      .then(r => {
        setQuestions(r.data.questions || []);
        setHasMore(r.data.hasMore || false);
        setTotalCount(r.data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCompany]);

  const diffColors: Record<string, string> = {
    Easy: "bg-emerald-50 text-emerald-700",
    Medium: "bg-amber-50 text-amber-700",
    Hard: "bg-red-50 text-red-700",
  };
  const pillBase = "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer";
  const pillActive: Record<Difficulty, string> = {
    All: "bg-slate-900 text-white border-slate-900",
    Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Hard: "bg-red-50 text-red-700 border-red-200",
  };
  const pillIdle = "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600";

  if (authLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="spin w-8 h-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── TOPBAR ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">TL</span>
            </div>
            <span className="font-semibold text-sm text-slate-900 hidden sm:block">TheLeetCompany</span>
          </Link>

          <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search problems..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-8 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-300" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs">✕</button>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                {!isPremium && <div className="hidden sm:block"><PaymentButton /></div>}
                {isPremium && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-1.5 rounded-full">
                    ⚡ Premium
                  </span>
                )}
                <Link href="/dashboard" className="flex items-center gap-2 group">
                  <div className="hidden md:block text-right">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-400">Profile</p>
                  </div>
                  <UserAvatar name={user.name} size={32} className="ring-2 ring-slate-200 group-hover:ring-blue-400 transition-all" />
                </Link>
              </>
            ) : (
              <button onClick={login} className="text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── PAGE BODY ── */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-5 gap-5">

        {/* ── SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 gap-3">

          {/* Company search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Filter companies..." value={companySearch}
              onChange={e => setCompanySearch(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder-slate-300" />
          </div>

          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-0.5">
            Companies · {allCompanies.length}
          </p>

          {/* Scrollable company list */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-0.5" style={{ scrollbarWidth: "thin" }}>
            <div className="flex flex-col gap-0.5">
              {allCompanies.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-9 bg-slate-100 rounded-lg" />
                  ))
                : visibleCompanies.map(c => {
                    const active = selectedCompany === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedCompany(c)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all border flex items-center gap-2 ${
                          active
                            ? "bg-blue-50 text-blue-700 font-semibold border-blue-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
                        }`}
                      >
                        <CompanyLogo name={c} size={16} />
                        <span className="flex-1 truncate">{c}</span>
                      </button>
                    );
                  })
              }
              {visibleCompanies.length === 0 && companySearch && (
                <p className="text-[10px] text-slate-400 text-center py-4">No match for "{companySearch}"</p>
              )}
            </div>
          </div>

          {/* Free plan notice */}
          {!isPremium && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl shrink-0">
              <p className="text-[10px] font-semibold text-blue-700 mb-0.5">Free Plan</p>
              <p className="text-[10px] text-blue-500 leading-snug">
                All companies · first 10 free with links
              </p>
              <Link href="/#pricing" className="text-[10px] text-blue-600 font-semibold mt-1 block hover:underline">
                Upgrade for all →
              </Link>
            </div>
          )}
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mobile company picker */}
            <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}
              className="lg:hidden text-sm bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 focus:outline-none">
              {allCompanies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex gap-1.5 flex-wrap">
              {(["All","Easy","Medium","Hard"] as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`${pillBase} ${difficulty === d ? pillActive[d] : pillIdle}`}>
                  {d}
                </button>
              ))}
            </div>

            {!loading && (
              <span className="ml-auto text-xs text-slate-400">
                <span className="text-slate-700 font-semibold">{filtered.length}</span>
                {hasMore && !isPremium && <span className="text-slate-400"> of {totalCount}</span>}
                <span className="text-slate-400"> problems</span>
              </span>
            )}
          </div>

          {/* Title */}
          <div className="flex items-center gap-2.5">
            <CompanyLogo name={selectedCompany} size={22} />
            <div>
              <h1 className="text-base font-bold text-slate-900">{selectedCompany} Interview Problems</h1>
              {!loading && (
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="text-emerald-600 font-medium">{filtered.filter(q => q.difficulty === "Easy").length} Easy</span>
                  {" · "}
                  <span className="text-amber-600 font-medium">{filtered.filter(q => q.difficulty === "Medium").length} Medium</span>
                  {" · "}
                  <span className="text-red-600 font-medium">{filtered.filter(q => q.difficulty === "Hard").length} Hard</span>
                  {hasMore && !isPremium && <span> · showing first 10 of {totalCount}</span>}
                </p>
              )}
            </div>
          </div>

          {/* ── TABLE ── */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: 600 }}>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["#","Problem","Difficulty","Acceptance","Frequency","Status",""].map((h, i) => (
                      <th key={i} className={`px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap ${i === 6 ? "text-center" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="px-4 py-3.5"><div className="skeleton h-3 w-5 bg-slate-100 rounded" /></td>
                          <td className="px-4 py-3.5">
                            <div className="skeleton h-3.5 w-48 bg-slate-100 rounded mb-2" />
                            <div className="skeleton h-2.5 w-28 bg-slate-50 rounded" />
                          </td>
                          <td className="px-4 py-3.5"><div className="skeleton h-5 w-14 bg-slate-100 rounded-full" /></td>
                          <td className="px-4 py-3.5"><div className="skeleton h-3 w-20 bg-slate-100 rounded" /></td>
                          <td className="px-4 py-3.5"><div className="skeleton h-3 w-20 bg-slate-100 rounded" /></td>
                          <td className="px-4 py-3.5"><div className="skeleton h-6 w-6 bg-slate-100 rounded-full mx-auto" /></td>
                          <td className="px-4 py-3.5"><div className="skeleton h-7 w-16 bg-slate-100 rounded-lg ml-auto" /></td>
                        </tr>
                      ))
                    : paginated.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-14 text-center">
                          <p className="text-sm font-medium text-slate-500 mb-1">No problems found</p>
                          <p className="text-xs text-slate-400">{search ? `No results for "${search}"` : "Try a different filter"}</p>
                        </td>
                      </tr>
                    )
                    : paginated.map((q, i) => (
                      <tr key={q._id} className={`border-b border-slate-50 transition-colors ${solvedIds.has(q._id) ? "bg-emerald-50/40" : "hover:bg-slate-50/70"}`}>
                        <td className="px-4 py-3.5 text-xs text-slate-300 font-mono tabular-nums">
                          {(page - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <a href={q.link} target="_blank" rel="noreferrer" className={`font-medium text-sm leading-snug mb-1.5 hover:text-blue-600 hover:underline transition-colors block ${solvedIds.has(q._id) ? "text-slate-400 line-through" : "text-slate-800"}`}>{q.title}</a>
                          <div className="flex gap-1 flex-wrap">
                            {q.topic.slice(0, 2).map(t => (
                              <span key={t} className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                            ))}
                            {q.topic.length > 2 && <span className="text-[10px] text-slate-300">+{q.topic.length - 2}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(q.acceptanceRate * 100).toFixed(0)}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 tabular-nums">{(q.acceptanceRate * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${q.frequency}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 tabular-nums">{q.frequency.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {user ? (
                            <button onClick={() => toggleSolved(q._id)} disabled={togglingId === q._id}
                              title={solvedIds.has(q._id) ? "Mark as unsolved" : "Mark as solved"}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${
                                togglingId === q._id ? "border-slate-200 bg-slate-50 cursor-wait"
                                : solvedIds.has(q._id) ? "border-emerald-500 bg-emerald-500 hover:bg-emerald-400"
                                : "border-slate-200 bg-white hover:border-emerald-400"
                              }`}>
                              {solvedIds.has(q._id) && (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          ) : <span className="text-[10px] text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <a href={q.link} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap">
                            Solve ↗
                          </a>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* ── PAGINATION ── */}
            {!loading && filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-slate-400">
                  Page <span className="font-semibold text-slate-600">{page}</span> of <span className="font-semibold text-slate-600">{totalPages}</span>
                  {" · "}showing <span className="font-semibold text-slate-600">{paginated.length}</span> of <span className="font-semibold text-slate-600">{filtered.length}</span> problems
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300">
                    ← Previous
                  </button>

                  {/* Page number pills */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === "..." ? (
                          <span key={`dots-${idx}`} className="text-xs text-slate-300 px-1">…</span>
                        ) : (
                          <button key={p}
                            onClick={() => setPage(p as number)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                              page === p
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}>
                            {p}
                          </button>
                        )
                      )
                    }
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300">
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Upgrade CTA for free users after limit */}
            {!loading && hasMore && !isPremium && (
              <div className="border-t border-slate-100 bg-gradient-to-b from-white to-slate-50 px-6 py-8 text-center">
                <div className="text-2xl mb-3">🚀</div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{totalCount - 10} more problems available</p>
                <p className="text-xs text-slate-500 mb-5">
                  Upgrade to Premium to unlock all <strong>{totalCount}</strong> {selectedCompany} problems + every other company.
                </p>
                <PaymentButton />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
