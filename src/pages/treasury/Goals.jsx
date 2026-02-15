import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Target, Trophy, Calendar, Plus, Edit2, Trash2, X, Search,
    AlertCircle, CheckCircle2, Loader2, Flag, ChevronDown,TrendingUp, Wallet
} from 'lucide-react';

import {
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    fetchGoalStats
} from '../../services/api.jsx';

/* ===========================
   STYLES & UTILS
=========================== */
const BORDER_STYLE = "border border-white/10";
const CARD_BASE = `bg-black ${BORDER_STYLE} rounded-2xl transition-all duration-300`;
const INPUT_BASE =
    "w-full bg-zinc-900/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 focus:bg-zinc-900/50 transition-all placeholder:text-zinc-600";

const currency = (val) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val || 0);

const formatDate = (dateStr) => {
    if (!dateStr) return 'No Deadline';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
};

/* ===========================
   SUB COMPONENTS
=========================== */
const Toast = ({ message, type, onClose }) => (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md z-50
    ${type === 'error' ? 'bg-red-950/80 border-red-900/50 text-red-200' : 'bg-zinc-900/90 border-zinc-800 text-white'}`}>
        {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} className="text-cyan-400" />}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={16} /></button>
    </div>
);

const StatCard = ({ label, value, icon: Icon, subtext }) => (
    <div className={`${CARD_BASE} p-6 group`}>
        <div className="mb-4">
            <div className="p-2.5 rounded-lg bg-zinc-900 text-cyan-400 inline-block">
                <Icon size={20} />
            </div>
        </div>
        <p className="text-zinc-500 text-xs uppercase mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtext && <p className="text-xs text-zinc-600 mt-2">{subtext}</p>}
    </div>
);

/* ===========================
   MAIN COMPONENT
=========================== */
export default function Goals() {
    /* -------------------------
       STATES
    ------------------------- */
    // Pagination Data
    const [goals, setGoals] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    // Server-side Stats matching your backend JSON
    const [stats, setStats] = useState({
        totalGoals: 0,
        completedGoals: 0,
        totalTarget: 0,
        totalCurrent: 0,
        totalMonthlyRequired: 0
    });


    // UI State
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    /* -------------------------
       FORM
    ------------------------- */
    const initialForm = { name: '', targetAmount: '', currentAmount: '', deadline: '', status: 'IN_PROGRESS' };
    const [formData, setFormData] = useState(initialForm);

    /* -------------------------
       TOAST
    ------------------------- */
    const showToast = (msg, type = 'success') => setNotification({ message: msg, type });

    useEffect(() => {
        if (!notification) return;
        const t = setTimeout(() => setNotification(null), 3000);
        return () => clearTimeout(t);
    }, [notification]);

    /* -------------------------
       LOAD DATA
    ------------------------- */
    const fetchDashboardStats = async () => {
        try {
            const res = await fetchGoalStats();
            const data = res.data || res;
            setStats({
                totalGoals: data.totalGoals || 0,
                completedGoals: data.completedGoals || 0,
                totalTarget: data.totalTarget || 0,
                totalCurrent: data.totalCurrent || 0,
                totalMonthlyRequired: data.totalMonthlyRequired || 0
            });
        } catch (err) {
            console.error("Fetch stats error:", err);
        }
    };

    const fetchPageData = async (pageNumber) => {
        try {
            const res = await fetchGoals(pageNumber, 12);
            const data = res.data || res;

            if (data && data.content) {
                if (pageNumber === 0) {
                    setGoals(data.content);
                } else {
                    setGoals(prev => [...prev, ...data.content]);
                }
                setPage(pageNumber);
                setHasMore(!data.last);
            } else {
                setGoals(Array.isArray(data) ? data : []);
                setHasMore(false);
            }
        } catch (err) {
            console.error("Fetch page error:", err);
        }
    };

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchDashboardStats(),
                fetchPageData(0)
            ]);
        } catch (err) {
            showToast("Could not connect to server", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    // Empty array ensures this runs exactly once on mount
    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchPageData(page + 1);
        setLoadingMore(false);
    };

    /* -------------------------
       COMPUTED (Client-side Search)
    ------------------------- */
    const filteredGoals = useMemo(() => {
        return goals.filter(g => g.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [goals, searchQuery]);

    /* -------------------------
       HANDLERS
    ------------------------- */
    const openModal = (goal = null) => {
        setEditingGoal(goal);
        if (goal) {
            setFormData({
                name: goal.name, targetAmount: goal.targetAmount, currentAmount: goal.currentAmount || 0,
                deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '', status: goal.status
            });
        } else {
            setFormData(initialForm);
        }
        setModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const payload = { ...formData, targetAmount: parseFloat(formData.targetAmount), currentAmount: parseFloat(formData.currentAmount || 0) };
            if (editingGoal) {
                await updateGoal(editingGoal.id, payload);
                showToast("Goal updated");
            } else {
                await createGoal(payload);
                showToast("Goal created");
            }
            await loadInitialData(); // Reloads stats and jumps back to page 0
            setModalOpen(false);
        } catch (err) {
            showToast("Operation failed", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteGoal(deletingId);
            showToast("Goal deleted");
            await loadInitialData(); // Reloads stats and jumps back to page 0
        } catch (err) {
            showToast("Delete failed", "error");
        } finally {
            setDeleteOpen(false);
            setDeletingId(null);
        }
    };

    /* ===========================
       RENDER
    ============================ */
    if (loading && goals.length === 0) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center">
                <Loader2 className="animate-spin text-cyan-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-10">
            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

            {/* HEADER */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold mb-2">Financial Goals</h2>
                    <p className="text-zinc-500 text-lg">Dream big, plan smart</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors">
                    <Plus size={18} /> New Goal
                </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    label="Goals Progress"
                    value={`${stats.completedGoals} / ${stats.totalGoals}`}
                    icon={Trophy}
                    subtext="Goals completely funded"
                />
                <StatCard
                    label="Total Saved"
                    value={currency(stats.totalCurrent)}
                    icon={Wallet}
                    subtext="Currently stashed away"
                />
                <StatCard
                    label="Total Target"
                    value={currency(stats.totalTarget)}
                    icon={Target}
                    subtext="Cumulative goal value"
                />
                <StatCard
                    label="Monthly Required"
                    value={currency(stats.totalMonthlyRequired)}
                    icon={TrendingUp}
                    subtext="To stay on track for deadlines"
                />
            </div>
            {/* SEARCH */}
            <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search loaded goals..." className={`${INPUT_BASE} pl-11 bg-black`} />
            </div>

            {/* GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGoals.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                        <Flag size={64} className="mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-xl font-bold text-zinc-300">No goals set</h3>
                        <p className="text-zinc-500 mt-2 mb-6">Create a savings goal to start tracking.</p>
                        <button onClick={() => openModal()} className="underline hover:text-white transition-colors">Set a goal</button>
                    </div>
                ) : filteredGoals.map(goal => {
                    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                    const done = progress >= 100;

                    return (
                        <div key={goal.id} className={`${CARD_BASE} p-6 group hover:border-zinc-700`}>
                            <div className="flex justify-between mb-6">
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex justify-center items-center border border-zinc-800 bg-zinc-900 ${done ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                        {done ? <Trophy size={20} /> : <Target size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{goal.name}</h3>
                                        <p className={`text-xs uppercase font-bold ${done ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                            {done ? 'Completed' : 'In Progress'}
                                        </p>
                                    </div>
                                </div>
                                {done && <CheckCircle2 size={20} className="text-emerald-500" />}
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-zinc-400">Saved</span>
                                    <span className="font-bold">{progress}%</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                                    <div className={`h-full rounded transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${progress}%` }} />
                                </div>
                            </div>

                            <div className="flex justify-between mb-6">
                                <div>
                                    <p className="text-xs text-zinc-500">Current</p>
                                    <p className="text-xl font-bold">{currency(goal.currentAmount)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-zinc-500">Target</p>
                                    <p className="text-lg text-zinc-400">{currency(goal.targetAmount)}</p>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t border-white/5">
                                <div className="flex gap-2 text-xs text-zinc-500 items-center">
                                    <Calendar size={12} />
                                    Target: {formatDate(goal.deadline)}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(goal)} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => { setDeletingId(goal.id); setDeleteOpen(true); }} className="p-2 hover:bg-red-900/20 rounded text-zinc-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* LOAD MORE BUTTON */}
            {hasMore && !searchQuery && (
                <div className="mt-10 flex justify-center pb-8">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-full font-medium hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{loadingMore ? 'Loading...' : 'Load More Goals'}</span>
                    </button>
                </div>
            )}

            {/* ================= MODALS ================= */}
            {/* ADD / EDIT */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Goal Name</label>
                                <input name="name" required placeholder="e.g. Emergency Fund" value={formData.name} onChange={handleChange} className={INPUT_BASE} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Target Amount</label>
                                    <input name="targetAmount" type="number" required placeholder="0.00" value={formData.targetAmount} onChange={handleChange} className={`${INPUT_BASE} font-mono`} />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Currently Saved</label>
                                    <input name="currentAmount" type="number" placeholder="0.00" value={formData.currentAmount} onChange={handleChange} className={`${INPUT_BASE} font-mono`} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Target Date</label>
                                <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} className={`${INPUT_BASE} scheme-dark`} />
                            </div>
                            <button disabled={formLoading} className="w-full bg-white text-black py-3.5 mt-2 rounded-xl font-bold hover:bg-zinc-200 transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {formLoading ? 'Saving...' : 'Save Goal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE */}
            {deleteOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Goal?</h3>
                        <p className="text-zinc-500 text-sm mb-6">This will permanently remove this goal from your dashboard.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setDeleteOpen(false)} className="py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}