"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  Users, CheckCircle, XCircle, Clock, Search, 
  ExternalLink, Download, LogOut, ChevronLeft, 
  ChevronRight, Filter, MoreHorizontal, MessageSquare,
  ShieldCheck, Loader2, AlertCircle
} from "lucide-react";
import { cn, formatAddress } from "@/lib/utils";
import { format } from "date-fns";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const pageSize = 10;

  useEffect(() => {
    const session = sessionStorage.getItem("admin_auth");
    if (session === "true") {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [filter, page, search]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      sessionStorage.setItem("admin_auth_pass", password);
      setIsAuthenticated(true);
      fetchData();
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const storedPass = sessionStorage.getItem("admin_auth_pass");
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'x-admin-password': storedPass || '' }
      });
      if (statsRes.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem("admin_auth_pass");
        return;
      }
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch list
      const listRes = await fetch(`/api/admin/list?filter=${filter}&search=${search}&page=${page}&pageSize=${pageSize}`, {
        headers: { 'x-admin-password': storedPass || '' }
      });
      const listData = await listRes.json();
      
      setSubmissions(listData.submissions || []);
      setTotalPages(listData.totalPages || 1);
    } catch (err) {
      console.error("Admin Data Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected', note?: string) => {
    setIsUpdating(id);
    const storedPass = sessionStorage.getItem("admin_auth_pass");
    try {
      const response = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': storedPass || '' 
        },
        body: JSON.stringify({ id, status: newStatus, admin_note: note }),
      });

      if (!response.ok) throw new Error("Failed to update");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setIsUpdating(null);
    }
  };

  const exportCSV = async () => {
    const storedPass = sessionStorage.getItem("admin_auth_pass");
    try {
      const response = await fetch('/api/admin/export', {
        headers: { 'x-admin-password': storedPass || '' }
      });

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 max-w-sm w-full space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
            >
              Unlock Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Sidebar / Top Nav */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">P</div>
            <h2 className="font-bold hidden sm:block">Quest Admin</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={exportCSV}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_auth");
                setIsAuthenticated(false);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="text-blue-400" />} label="Total" value={stats.total} />
          <StatCard icon={<Clock className="text-amber-400" />} label="Pending" value={stats.pending} />
          <StatCard icon={<CheckCircle className="text-emerald-400" />} label="Approved" value={stats.approved} />
          <StatCard icon={<XCircle className="text-red-400" />} label="Rejected" value={stats.rejected} />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden self-start">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFilter(t); setPage(1); }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                  filter === t ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search Twitter or Wallet..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Submissions Table */}
        <div className="glass-card overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User Info</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quest Entry</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 opacity-50" />
                      <p className="mt-2 text-slate-500 text-sm">Loading submissions...</p>
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-800/50">
                        <Users className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-slate-400 font-medium text-lg">No submissions found</p>
                      <p className="text-slate-500 text-sm">Try adjusting your filters or search query.</p>
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{sub.twitter_username}</span>
                          <span className="text-xs font-mono text-slate-500">{formatAddress(sub.wallet_address)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a 
                          href={sub.tweet_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          View Tweet <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          sub.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          sub.status === 'rejected' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {format(new Date(sub.created_at), 'MMM d, yyyy')}<br/>
                        {format(new Date(sub.created_at), 'HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {sub.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(sub.id, 'approved')}
                                disabled={!!isUpdating}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(sub.id, 'rejected')}
                                disabled={!!isUpdating}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-all"
                            onClick={() => {
                              const note = prompt("Add admin note:", sub.admin_note || "");
                              if (note !== null) updateStatus(sub.id, sub.status as 'approved' | 'rejected', note);
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
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
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-800 disabled:opacity-30 hover:bg-slate-900 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-slate-800 disabled:opacity-30 hover:bg-slate-900 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="glass-card p-5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-2xl font-bold font-mono tracking-tight">{value}</span>
      </div>
      <p className="text-xs text-slate-500 uppercase font-semibold tracking-widest">{label}</p>
    </div>
  );
}
