"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, CheckCircle, XCircle, Clock, Search, 
  ExternalLink, Download, LogOut, ChevronLeft, 
  ChevronRight, Filter, MoreHorizontal, MessageSquare,
  ShieldCheck, Loader2, AlertCircle, Mail, Lock,
  ChevronDown, Trash2
} from "lucide-react";
import { cn, formatAddress } from "@/lib/utils";
import { format } from "date-fns";
import { Navigation } from "@/components/Navigation";

type Submission = {
  id: string;
  twitter_username: string;
  wallet_address: string;
  tweet_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const pageSize = 10;

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setIsAuthenticated(true);
        checkAdmin(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin, filter, page, search]);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsAuthenticated(true);
      checkAdmin(session.user.id);
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }

  async function checkAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Server Login Success:", result.user?.email);
        router.refresh();
        await checkUser();
      } else {
        setLoginError(result.error || "Login failed");
      }

    } catch (err: any) {
      console.error("Login Network Error:", err);
      setLoginError("A network error occurred. Please check your connection.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      router.replace('/admin'); // Redirect back to login state
      router.refresh();
    } catch (err) {
      console.error("Logout Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch the submissions list
      const listRes = await fetch(`/api/admin/list?filter=${filter}&search=${search}&page=${page}&pageSize=${pageSize}`, { cache: 'no-store' });
      
      if (!listRes.ok) {
        const err = await listRes.json();
        console.error("List Fetch Error:", err.error);
        setIsLoading(false);
        return;
      }

      const res = await listRes.json();
      
      // 2. Set table rows = res.submissions
      const rows = res.submissions || [];
      setSubmissions(rows);
      setTotalPages(res.totalPages || 1);

      // 3. Set stats counters from res.count or compute from res.submissions by status
      // We prioritize showing the counts accurately for the current filter if appropriate,
      // but also try to fetch global stats if available.
      setStats({
        total: res.count || rows.length,
        pending: rows.filter((s: Submission) => s.status === 'pending').length,
        approved: rows.filter((s: Submission) => s.status === 'approved').length,
        rejected: rows.filter((s: Submission) => s.status === 'rejected').length
      });

      // 4. Attempt to get global stats for a more complete dashboard
      const statsRes = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData && typeof statsData.total === 'number') {
          setStats(statsData);
        }
      }
    } catch (err) {
      console.error("Admin Data Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected', note?: string) => {
    setIsUpdating(id);
    try {
      const response = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, admin_note: note }),
      });

      if (!response.ok) throw new Error("Failed to update");
      setSelectedSubmission(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setIsUpdating(null);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch('/api/admin/export');
      if (response.status === 404) {
        alert("No approved wallets to export.");
        return;
      }
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `approved_wallets_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export CSV.");
    }
  };

  if (isAuthenticated === null || (isAuthenticated && isAdmin === null)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a] text-white">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="product-card p-10 max-w-md w-full space-y-8 bg-[#0d0d0d]/40 backdrop-blur-md"
        >
          <div className="text-center space-y-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Services</h1>
            <p className="text-neutral-500 font-medium">
              {!isAuthenticated 
                ? "Enter your credentials to access the terminal" 
                : "You do not have administrative privileges."}
            </p>
          </div>

          {!isAuthenticated ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500 flex items-center space-x-2">
                    <Mail className="h-3 w-3" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@popeth.xyz"
                    className="product-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500 flex items-center space-x-2">
                    <Lock className="h-3 w-3" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="product-input"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg flex items-start space-x-3 text-red-500 text-xs font-bold uppercase tracking-tight">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn-primary w-full py-4 text-base"
              >
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Authorize Session"}
              </button>
            </form>
          ) : (
            <button
               onClick={handleLogout}
               className="btn-secondary w-full py-4 uppercase font-black tracking-widest text-xs"
            >
              Log Out
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <nav className="border-b border-white/5 bg-[#0d0d0d]/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center font-black text-white text-xl">P</div>
              <h2 className="font-bold tracking-tight text-xl hidden sm:block">Control Center</h2>
            </div>
            
            <div className="hidden lg:flex items-center space-x-1 h-10 p-1 bg-white/5 rounded-xl border border-white/5">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setFilter(t); setPage(1); }}
                  className={cn(
                    "px-4 h-full rounded-lg text-[10px] uppercase font-black tracking-widest transition-all",
                    filter === t ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={exportCSV}
              className="btn-secondary hidden sm:flex items-center space-x-2 px-6 py-2.5 text-[10px] uppercase font-black tracking-widest border border-white/5"
            >
              <Download className="h-3.5 w-3.5 text-blue-500" />
              <span>Export</span>
            </button>
            <div className="h-8 w-[1px] bg-white/5 mx-2" />
            <button
              onClick={handleLogout}
              className="p-3 rounded-xl hover:bg-white/5 text-neutral-500 hover:text-white transition-all group"
              title="Logout"
            >
              <LogOut className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto w-full p-6 md:p-10 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Users className="text-blue-500" />} label="Submissions" value={stats.total} />
          <StatCard icon={<Clock className="text-amber-500" />} label="In Queue" value={stats.pending} />
          <StatCard icon={<CheckCircle className="text-emerald-500" />} label="Whitelisted" value={stats.approved} />
          <StatCard icon={<XCircle className="text-red-500" />} label="Denied" value={stats.rejected} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
               <h3 className="text-xl font-bold tracking-tight">Vetting Queue</h3>
               <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-black text-neutral-500 uppercase">Live Index</span>
            </div>

            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Query identifier (Handle or Wallet)..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full product-input pl-12 py-3 bg-[#0d0d0d]/40 backdrop-blur-md"
              />
            </div>
          </div>

          <div className="product-card overflow-hidden border-white/5 bg-[#0d0d0d]/40 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Task Proof</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Disposition</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500">Timestamp</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading && submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-500 opacity-20" />
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">Retrieving Records...</p>
                      </td>
                    </tr>
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center">
                        <Users className="h-12 w-12 mx-auto text-neutral-800 mb-6" />
                        <p className="text-lg font-bold">No Records Found</p>
                        <p className="text-neutral-500 font-medium">No submissions matching current filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <div className="font-bold text-white text-sm">{sub.twitter_username}</div>
                            <div className="text-[11px] font-mono text-neutral-500 flex items-center space-x-1.5 grayscale hover:grayscale-0 transition-all cursor-copy">
                               {formatAddress(sub.wallet_address)}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <a 
                            href={sub.tweet_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Verify Link <ExternalLink className="ml-1.5 h-3 w-3" />
                          </a>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                            sub.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            sub.status === 'rejected' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-amber-500/5 text-amber-500 border-amber-500/20"
                          )}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">
                            {format(new Date(sub.created_at), 'MMM d, yyyy')}
                           </div>
                           <div className="text-[10px] text-neutral-600 font-medium tracking-tight">
                            {format(new Date(sub.created_at), 'HH:mm:ss')}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end space-x-2">
                             <button
                               onClick={() => {
                                 setSelectedSubmission(sub);
                                 setNoteInput(sub.admin_note || "");
                               }}
                               className="p-3 rounded-xl hover:bg-white/5 text-neutral-500 hover:text-white transition-all"
                               title="Notes"
                             >
                               <MessageSquare className="h-4 w-4" />
                             </button>
                            
                            {sub.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(sub.id, 'approved')}
                                  disabled={!!isUpdating}
                                  className="p-3 rounded-xl bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 transition-all border border-emerald-500/10"
                                  title="Approve"
                                >
                                  {isUpdating === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => updateStatus(sub.id, 'rejected')}
                                  disabled={!!isUpdating}
                                  className="p-3 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10"
                                  title="Reject"
                                >
                                  {isUpdating === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="px-8 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Page {page} / {totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-3 rounded-xl border border-white/5 disabled:opacity-20 hover:bg-white/5 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-3 rounded-xl border border-white/5 disabled:opacity-20 hover:bg-white/5 transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Note Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="product-card p-10 max-w-lg w-full space-y-8 bg-[#0d0d0d] border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-2xl font-bold tracking-tight">Admin Note</h4>
                  <p className="text-neutral-500 text-sm font-medium">
                    Internal metadata for <span className="text-white font-bold">{selectedSubmission.twitter_username}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 transition-all"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Ex. Duplicate wallet found / Suspicious activity..."
                className="product-input min-h-[160px] resize-none py-4 text-sm"
              />

              <div className="flex gap-4">
                <button
                   onClick={() => setSelectedSubmission(null)}
                   className="btn-secondary flex-1 py-4 uppercase font-black tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button
                   onClick={() => updateStatus(selectedSubmission.id, selectedSubmission.status as 'approved' | 'rejected', noteInput)}
                   disabled={!!isUpdating}
                   className="btn-primary flex-1 py-4 text-sm"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="product-card p-8 bg-[#0d0d0d]/40 backdrop-blur-md border-white/5 space-y-6">
      <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{label}</p>
        <div className="text-4xl font-black tracking-tighter">{value}</div>
      </div>
    </div>
  );
}
