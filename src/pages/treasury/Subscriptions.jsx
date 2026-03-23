import React, { useEffect, useState } from 'react';
import {
    CreditCard, Calendar, Plus, Edit2, Trash2, X, Search,
    AlertCircle, CheckCircle2, Loader2, Zap, Power, ChevronDown
} from 'lucide-react';

// Import your API methods
import {
    fetchSubscriptions,
    fetchSubscriptionStats,
    createSubscription,
    deleteSubscription,
    toggleSubscription,
} from '../../services/api.jsx';

// Temporary mock for update if you haven't added it yet
const updateSubscription = async (id, data) => { console.warn("Add updateSubscription to api.js"); };
export const CATEGORY = [
    "BOOKS_READING",
    "BUSINESS_PRODUCTIVITY",
    "CLOUD_STORAGE",
    "DEVELOPER_TOOLS",
    "ENTERTAINMENT",
    "FITNESS_HEALTH",
    "FINANCE",
    "LEARNING_EDUCATION",
    "SHOPPING_DELIVERY",
    "OTHER"
];
// ============================================================================
// STYLING CONSTANTS & UTILS
// ============================================================================
// ============================================================================
// STYLING CONSTANTS & UTILS
// ============================================================================
const BORDER_STYLE = "border border-white/10";

// STATS: Flat, subtle, read-only feel. No hover lift.
const STAT_CARD_BASE = `bg-transparent border-b border-white/5 md:border-b-0 md:border-r last:border-0 rounded-none p-6 relative overflow-hidden`;

// SUBSCRIPTIONS: Interactive, slightly elevated resting background, hover lift
const SUB_CARD_BASE = `bg-zinc-900/40 border border-white/10 rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-zinc-600 hover:shadow-2xl hover:shadow-white/5 hover:bg-zinc-900/80`;

const INPUT_BASE = "w-full bg-zinc-900/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 focus:bg-zinc-900/80 focus:ring-4 focus:ring-white/5 transition-all duration-300 placeholder:text-zinc-600";

const currency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
const formatDate = (dateStr) => {
    if (!dateStr) return 'No Date';
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const Toast = ({ message, type, onClose }) => (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md z-50 animate-[slideIn_0.3s_ease-out]
        ${type === 'error' ? 'bg-red-950/90 border-red-900/50 text-red-200' : 'bg-zinc-900/95 border-zinc-700 text-white'}`}>
        {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 hover:scale-110 transition-all"><X className="w-4 h-4" /></button>
    </div>
);

const StatCard = ({ label, value, subtext }) => (
    <div className={`${STAT_CARD_BASE} group`}>
        <div className="flex items-start justify-between mb-2 relative z-10">
            <div className={`p-2 rounded-lg bg-zinc-900/50 text-zinc-500`}>
                <CreditCard className="w-4 h-4" />
            </div>
        </div>
        <div className="relative z-10">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
            {subtext && <p className="text-xs text-zinc-600 mt-2 font-medium">{subtext}</p>}
        </div>
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Subscriptions() {
    const [subs, setSubs] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const [stats, setStats] = useState({
        daily: 0, weekly: 0, monthly: 0, quarterly: 0, yearly: 0
    });

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '', amount: '', billingCycle: 'monthly', nextPaymentDate: '', category: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showToast = (message, type = 'success') => setNotification({ message, type });

    const fetchDashboardStats = async () => {
        try {
            const res = await fetchSubscriptionStats();
            const data = res.data || res;
            setStats({
                daily: data.daily || 0, weekly: data.weekly || 0,
                monthly: data.monthly || 0, quarterly: data.quarterly || 0, yearly: data.yearly || 0
            });
        } catch (err) {
            console.error("Failed to load stats", err);
        }
    };

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchDashboardStats(), fetchPageData(0)]);
        } catch (err) {
            showToast("Could not connect to server", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchPageData = async (pageNumber) => {
        const response = await fetchSubscriptions(null, pageNumber, 12);
        const data = response.data || response;

        if (data && data.content) {
            if (pageNumber === 0) setSubs(data.content);
            else setSubs(prev => [...prev, ...data.content]);
            setPage(pageNumber);
            setHasMore(!data.last);
        } else {
            setSubs(Array.isArray(data) ? data : []);
            setHasMore(false);
        }
    };

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            await fetchPageData(page + 1);
        } catch (err) {
            showToast("Failed to load more data", "error");
        } finally {
            setLoadingMore(false);
        }
    };

    const openModal = (sub = null) => {
        setEditingSub(sub);
        if (sub) {
            setFormData({
                title: sub.title, amount: sub.amount, billingCycle: sub.billingCycle,
                nextPaymentDate: sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toISOString().split('T')[0] : '',
                category: sub.category
            });
        } else {
            setFormData({
                title: '', amount: '', billingCycle: 'monthly',
                nextPaymentDate: new Date().toISOString().split('T')[0], category: ''
            });
        }
        setModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (editingSub) {
                await updateSubscription(editingSub.id, formData);
                showToast("Subscription updated");
            } else {
                await createSubscription(formData);
                showToast("Subscription added");
            }
            await loadInitialData();
            setModalOpen(false);
        } catch (err) {
            showToast("Operation failed", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggle = async (e, id) => {
        e.stopPropagation();
        const previousSubs = [...subs];
        setSubs(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

        try {
            await toggleSubscription(id);
            await fetchDashboardStats();
        } catch (err) {
            setSubs(previousSubs);
            showToast("Failed to toggle status", "error");
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteSubscription(deletingId);
            showToast("Subscription removed");
            await loadInitialData();
        } catch (err) {
            showToast("Failed to delete", "error");
        }
        setDeleteConfirmOpen(false);
    };

    const filteredSubs = subs.filter(s =>
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && subs.length === 0) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-10 font-sans">
            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

            {/* Header */}
            <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Subscriptions</h2>
                    <p className="text-zinc-500 text-lg">Manage recurring expenses</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Added Search Bar for UX */}
                    <div className="relative group">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-white" />
                        <input
                            type="text"
                            placeholder="Search subscriptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 bg-zinc-900/50 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-zinc-900 focus:ring-4 focus:ring-white/5 transition-all duration-300 placeholder:text-zinc-600"
                        />
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-95"
                    >
                        <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                        <span>Add Subscription</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="bg-zinc-950/50 border border-white/5 rounded-3xl mb-12 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-4">
                    <StatCard
                        label="Total Weekly Cost"
                        value={currency(stats.weekly)}
                        subtext={`≈ ${currency(stats.daily)} per day`}
                    />
                    <StatCard
                        label="Total Monthly Cost"
                        value={currency(stats.monthly)}
                        subtext={`≈ ${currency(stats.daily)} per day`}
                    />
                    <StatCard
                        label="Total Quarterly Cost"
                        value={currency(stats.quarterly)}
                        subtext={`≈ ${currency(stats.daily)} per day`}
                    />
                    <StatCard
                        label="Total Yearly Projection"
                        value={currency(stats.yearly)}
                        subtext={`≈ ${currency(stats.weekly)} per week`}
                    />
                </div>
            </div>

            {/* Section Divider to separate Stats from the List */}
            <div className="mb-6 border-b border-white/5 pb-4">
                <h3 className="text-xl font-semibold text-white">Subscriptions Overview</h3>
            </div>

            {/* Subscription Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubs.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10 hover:bg-zinc-900/20 transition-colors">
                        <Zap className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-xl font-bold text-zinc-300">No subscriptions found</h3>
                        <p className="text-zinc-500 mt-2 mb-6">Add your recurring bills to track them.</p>
                        <button onClick={() => openModal()} className="text-white hover:text-zinc-300 font-medium underline underline-offset-8 transition-all hover:opacity-80">Add now</button>
                    </div>
                ) : (
                    filteredSubs.map((sub) => {
                        const isActive = sub.active;
                        return (
                            <div key={sub.id} className={`${SUB_CARD_BASE} p-6 group relative ${!isActive ? 'opacity-60 grayscale-[0.4] hover:grayscale-0' : ''}`}>                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-white transition-all duration-300">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg group-hover:text-emerald-50 transition-colors">{sub.title}</h3>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider">{sub.category}</p>
                                        </div>
                                    </div>

                                    {/* Enhanced Power Button with Glow Effects */}
                                    <button
                                        onClick={(e) => handleToggle(e, sub.id)}
                                        className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-90
                                            ${isActive
                                            ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            : 'text-zinc-500 bg-zinc-900 hover:text-zinc-300 hover:bg-zinc-800'}`}
                                        title={isActive ? "Deactivate" : "Activate"}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                            {currency(sub.amount)}
                                        </span>
                                        <span className="text-sm text-zinc-500 font-medium">/ {sub.billingCycle}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                        <Calendar className="w-3 h-3" />
                                        <span>Next: {formatDate(sub.nextPaymentDate)}</span>
                                    </div>

                                    {/* Smooth Slide-up Reveal for Actions */}
                                    <div className="flex gap-2 opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <button onClick={() => openModal(sub)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-95">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setDeletingId(sub.id); setDeleteConfirmOpen(true); }} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-400 transition-all hover:scale-110 active:scale-95">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Load More Button */}
            {hasMore && !searchQuery && (
                <div className="mt-12 flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="group flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-full font-medium hover:bg-zinc-800 hover:border-zinc-600 hover:shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
                        <span>{loadingMore ? 'Loading...' : 'Load More Services'}</span>
                    </button>
                </div>
            )}

            {/* ================= MODALS ================= */}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    {/* Added slight pop-in animation via scale logic if utilizing a CSS animation, or rely on standard tailwind transition */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-[scaleIn_0.2s_ease-out]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingSub ? 'Edit Subscription' : 'New Subscription'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-all active:scale-90">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="group">
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Service Name</label>
                                <input type="text" name="title" required placeholder="e.g. Netflix" value={formData.title} onChange={handleInputChange} className={INPUT_BASE} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Amount</label>
                                    <input type="number" name="amount" required placeholder="0.00" value={formData.amount} onChange={handleInputChange} className={`${INPUT_BASE} font-mono`} />
                                </div>
                                <div className="group">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Cycle</label>
                                    <select name="billingCycle" value={formData.billingCycle} onChange={handleInputChange} className={`${INPUT_BASE} appearance-none cursor-pointer`}>
                                            <option value="DAILY">Daily</option>
                                            <option value="WEEKLY">Weekly</option>
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="QUARTERLY">Quarterly</option>
                                            <option value="ANNUAL">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className={`${INPUT_BASE} appearance-none cursor-pointer`}
                                >
                                    <option value="">Select Category</option>

                                    {CATEGORY.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <div className="group">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Next Payment</label>
                                    <input type="date" name="nextPaymentDate" value={formData.nextPaymentDate} onChange={handleInputChange} className={`${INPUT_BASE} scheme-dark cursor-pointer`} />
                                </div>
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full mt-6 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-[0.98] disabled:opacity-70">
                                {formLoading ? 'Saving...' : 'Save Subscription'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500 ring-4 ring-red-500/5">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Remove Subscription?</h3>
                        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">This will remove this service from your tracking calculations. This action cannot be undone.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setDeleteConfirmOpen(false)} className="py-3 bg-zinc-900 border border-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95">Cancel</button>
                            <button onClick={handleDelete} className="py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all active:scale-95">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add these custom keyframes to your global CSS or inside a style tag here for the modal pop animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}