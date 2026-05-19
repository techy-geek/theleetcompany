"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";

// ── Types ────────────────────────────────────────────────────────────────────
interface Stats { totalQuestions: number; totalUsers: number; premiumUsers: number; totalCompanies: number; }
interface Question { _id: string; title: string; difficulty: string; frequency: number; acceptanceRate: number; link: string; topic: string[]; companies: string[]; }
interface AdminUser { _id: string; name: string; email: string; picture: string; isPremium: boolean; isAdmin: boolean; solvedCount: number; createdAt: string; }
interface CompanyBank { name: string; count: number; }

const EMPTY_Q = { title: "", difficulty: "Medium", frequency: 0, acceptanceRate: 0, link: "", topic: "", companies: "" };

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function QuestionModal({ q, onClose, onSave }: { q: any; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState(q);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">{form._id ? "Edit Question" : "Add Question"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Title</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={e => set("difficulty", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {["Easy", "Medium", "Hard"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Frequency (%)</label>
              <input type="number" value={form.frequency} onChange={e => set("frequency", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Acceptance Rate (0–1)</label>
            <input type="number" step="0.01" value={form.acceptanceRate} onChange={e => set("acceptanceRate", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">LeetCode Link</label>
            <input value={form.link} onChange={e => set("link", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none font-mono text-xs" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Topics (comma-separated)</label>
            <input value={form.topic} onChange={e => set("topic", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Array, Hash Table" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Companies (comma-separated)</label>
            <input value={form.companies} onChange={e => set("companies", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Microsoft, Google" />
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-slate-500 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(form)} className="text-sm font-semibold bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"questions" | "users" | "companies">("questions");
  const [stats, setStats] = useState<Stats | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<CompanyBank[]>([]);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiff] = useState("");
  const [compFilter, setComp] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    if (!loading && !user) router.push("/");
    if (!loading && user && !user.isAdmin) router.push("/dashboard");
  }, [user, loading, router]);

  const fetchStats = useCallback(() => {
    api.get("/admin/stats")
      .then(r => setStats(r.data))
      .catch(err => setError(`Stats: ${err.response?.status} ${err.response?.data?.message || err.message}`));
  }, []);

  useEffect(() => {
    if (loading || !user?.isAdmin) return;
    fetchStats();
  }, [user, loading, fetchStats]);

  const fetchCompanies = useCallback(() => {
    api.get("/admin/companies")
      .then(r => setCompanies(r.data.companies))
      .catch(err => setError(`Companies: ${err.response?.data?.message || err.message}`));
  }, []);

  const deleteCompanyBank = async (name: string) => {
    if (!confirm(`⚠️ Delete the entire "${name}" question bank?\n\nThis will remove all questions that belong ONLY to ${name}. Questions shared with other companies will just have ${name} removed.\n\nThis CANNOT be undone. Continue?`)) return;
    setDeleting(name);
    try {
      const r = await api.delete(`/admin/companies/${encodeURIComponent(name)}`);
      showToast(r.data.message);
      fetchCompanies();
      fetchStats();
    } catch (err: any) {
      setError(`Delete failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const fetchQuestions = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (diffFilter) params.set("difficulty", diffFilter);
    if (compFilter) params.set("company", compFilter);
    api.get(`/admin/questions?${params}`).then(r => {
      setQuestions(r.data.questions);
      setTotalPages(r.data.pages);
    }).catch(console.error);
  }, [page, search, diffFilter, compFilter]);

  const fetchUsers = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    api.get(`/admin/users?${params}`).then(r => {
      setUsers(r.data.users);
      setTotalPages(r.data.pages);
    }).catch(console.error);
  }, [page, search]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    setPage(1);
  }, [tab, search, diffFilter, compFilter, user]);

  useEffect(() => {
    if (loading || !user?.isAdmin) return;
    if (tab === "questions") fetchQuestions();
    else if (tab === "users") fetchUsers();
    else if (tab === "companies") fetchCompanies();
  }, [tab, page, fetchQuestions, fetchUsers, fetchCompanies, user, loading]);

  const saveQuestion = async (form: any) => {
    setSaving(true);
    try {
      if (form._id) await api.put(`/admin/questions/${form._id}`, form);
      else await api.post("/admin/questions", form);
      setModal(null);
      fetchQuestions();
      fetchStats();
      showToast(form._id ? "Question updated!" : "Question added!");
    } catch { showToast("Error saving question."); }
    setSaving(false);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await api.delete(`/admin/questions/${id}`);
    fetchQuestions();
    fetchStats();
    showToast("Deleted.");
  };

  const togglePremium = async (id: string) => {
    await api.put(`/admin/users/${id}/premium`, {});
    fetchUsers();
  };

  const toggleAdmin = async (id: string) => {
    await api.put(`/admin/users/${id}/admin`, {});
    fetchUsers();
  };

  const diffColors: Record<string, string> = {
    Easy: "bg-emerald-50 text-emerald-700", Medium: "bg-amber-50 text-amber-700", Hard: "bg-red-50 text-red-700",
  };

  if (loading || !user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="spin w-8 h-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Modal */}
      {modal && !saving && <QuestionModal q={modal} onClose={() => setModal(null)} onSave={saveQuestion} />}

      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">TL</span>
              </div>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">Admin Panel</span>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">← Back</Link>
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Questions" value={stats.totalQuestions} icon="📋" color="bg-blue-50" />
            <StatCard label="Companies" value={stats.totalCompanies} icon="🏢" color="bg-violet-50" />
            <StatCard label="Total Users" value={stats.totalUsers} icon="👤" color="bg-emerald-50" />
            <StatCard label="Premium Users" value={stats.premiumUsers} icon="⚡" color="bg-amber-50" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(["questions", "users", "companies"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSearch(""); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── QUESTIONS TAB ── */}
        {tab === "questions" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <input placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56" />
              <select value={diffFilter} onChange={e => setDiff(e.target.value)}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                <option value="">All Difficulties</option>
                {["Easy", "Medium", "Hard"].map(d => <option key={d}>{d}</option>)}
              </select>
              <input placeholder="Filter by company..." value={compFilter} onChange={e => setComp(e.target.value)}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none w-44" />
              <div className="flex-1" />
              <button onClick={() => setModal({ ...EMPTY_Q })}
                className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                + Add Question
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" style={{ minWidth: 700 }}>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Title", "Difficulty", "Companies", "Freq.", "Actions"].map((h, i) => (
                        <th key={i} className={`px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 leading-snug">{q.title}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {q.topic.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">{t}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {q.companies.map(c => <span key={c} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{c}</span>)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs tabular-nums">{q.frequency.toFixed(0)}%</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setModal({ ...q, topic: q.topic.join(", "), companies: q.companies.join(", ") })}
                              className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                              Edit
                            </button>
                            <button onClick={() => deleteQuestion(q._id)}
                              className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-100">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
              className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-72" />

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" style={{ minWidth: 640 }}>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["User", "Email", "Solved", "Joined", "Premium", "Admin"].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={u.picture} alt="" className="w-7 h-7 rounded-full border border-slate-200" />
                            <span className="font-medium text-slate-800 text-sm">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{u.email}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{u.solvedCount}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => togglePremium(u._id)}
                            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${u.isPremium ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-slate-50 text-slate-400 border-slate-200 hover:border-amber-200"
                              }`}>
                            {u.isPremium ? "⚡ Premium" : "Free"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleAdmin(u._id)}
                            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${u.isAdmin ? "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" : "bg-slate-50 text-slate-400 border-slate-200 hover:border-violet-200"
                              }`}>
                            {u.isAdmin ? "🔑 Admin" : "User"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPANIES TAB ── */}
        {tab === "companies" && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Company Question Banks</p>
                <p className="text-xs text-slate-400 mt-0.5">Deletes all questions that belong ONLY to that company. Shared questions have the company removed.</p>
              </div>
              <span className="text-xs font-medium bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg">{companies.length} companies</span>
            </div>
            <div className="divide-y divide-slate-50">
              {companies.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">No companies found.</div>
              ) : companies.map(c => (
                <div key={c.name} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.count} question{c.count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${Math.min((c.count / (companies[0]?.count || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => deleteCompanyBank(c.name)}
                    disabled={deleting === c.name}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                      deleting === c.name
                        ? "border-slate-200 text-slate-300 cursor-wait bg-slate-50"
                        : "border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-300"
                    }`}
                  >
                    {deleting === c.name ? "Deleting…" : "🗑 Delete Bank"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
