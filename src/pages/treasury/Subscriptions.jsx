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

// ============================================================================
// STYLING CONSTANTS & UTILS
// ============================================================================
const BORDER_STYLE = "border border-white/10";
const CARD_BASE = `bg-black ${BORDER_STYLE} rounded-2xl transition-all duration-300`;
const INPUT_BASE = "w-full bg-zinc-900/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 focus:bg-zinc-900/50 transition-all placeholder:text-zinc-600";

const currency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
const formatDate = (dateStr) => {
    if (!dateStr) return 'No Date';
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const Toast = ({ message, type, onClose }) => (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md z-50
        ${type === 'error' ? 'bg-red-950/80 border-red-900/50 text-red-200' : 'bg-zinc-900/90 border-zinc-800 text-white'}`}>
        {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
);

const StatCard = ({ label, value, subtext }) => (
    <div className={`${CARD_BASE} p-6 relative overflow-hidden group`}>
        <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-lg bg-zinc-900 text-zinc-400 group-hover:bg-zinc-800 transition-colors`}>
                <CreditCard className="w-5 h-5" />
            </div>
        </div>
        <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
            {subtext && <p className="text-xs text-zinc-600 mt-2">{subtext}</p>}
        </div>
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Subscriptions() {
    // Data & Pagination State
    const [subs, setSubs] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    // Server-side Stats State (Populated from /stat endpoint)
    // Server-side Stats State (Populated from /stat endpoint)
    const [stats, setStats] = useState({
        daily: 0,
        weekly: 0,
        monthly: 0,
        quarterly: 0,
        yearly: 0
    });

    // UI State
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        title: '', amount: '', billingCycle: 'monthly', nextPaymentDate: '', category: ''
    });

    // --- Lifecycle ---

    // The empty array [] ensures this runs EXACTLY ONCE on mount, preventing the infinite loop
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

    // --- Data Fetching ---

    const fetchDashboardStats = async () => {
        try {
            const res = await fetchSubscriptionStats();
            const data = res.data || res;

            // Map the new Spring Boot DTO properties to local state
            setStats({
                daily: data.daily || 0,
                weekly: data.weekly || 0,
                monthly: data.monthly || 0,
                quarterly: data.quarterly || 0,
                yearly: data.yearly || 0
            });
        } catch (err) {
            console.error("Failed to load stats", err);
        }
    };
    const loadInitialData = async () => {
        setLoading(true);
        try {
            // Fetch stats and page 0 simultaneously
            await Promise.all([
                fetchDashboardStats(),
                fetchPageData(0)
            ]);
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
            if (pageNumber === 0) {
                setSubs(data.content); // Reset list on page 0
            } else {
                setSubs(prev => [...prev, ...data.content]); // Append on Load More
            }
            setPage(pageNumber);
            setHasMore(!data.last); // Spring Boot tells us if this is the last page
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

    // --- Handlers ---

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
            // Reload everything to sync with backend pagination
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
        // Optimistic UI update for the grid
        setSubs(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

        try {
            await toggleSubscription(id);
            await fetchDashboardStats(); // Refresh stats from backend to update Totals
        } catch (err) {
            setSubs(previousSubs); // Revert on failure
            showToast("Failed to toggle status", "error");
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteSubscription(deletingId);
            showToast("Subscription removed");
            await loadInitialData(); // Refresh list and stats entirely
        } catch (err) {
            showToast("Failed to delete", "error");
        }
        setDeleteConfirmOpen(false);
    };

    // Frontend Search Filter (Only filters currently loaded pages)
    const filteredSubs = subs.filter(s =>
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Render ---

    if (loading && subs.length === 0) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-10 font-sans">
            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Subscriptions</h2>
                    <p className="text-zinc-500 text-lg">Manage recurring expenses</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => openModal()}
                        className="group flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-medium hover:bg-zinc-200 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        <span>Add Subscription</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview - Powered by the new Backend DTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <StatCard
                    label="Total Monthly Cost"
                    value={currency(stats.monthly)}
                    subtext={`≈ ${currency(stats.daily)} per day`}
                />
                <StatCard
                    label="Total Yearly Projection"
                    value={currency(stats.yearly)}
                    subtext={`≈ ${currency(stats.weekly)} per week`}
                />
            </div>

            {/* Controls */}
            <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search loaded services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${INPUT_BASE} pl-10 bg-black`}
                />
            </div>

            {/* Subscription Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubs.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                        <Zap className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-xl font-bold text-zinc-300">No subscriptions found</h3>
                        <p className="text-zinc-500 mt-2 mb-6">Add your recurring bills to track them.</p>
                        <button onClick={() => openModal()} className="text-white hover:text-zinc-300 font-medium underline underline-offset-4">Add now</button>
                    </div>
                ) : (
                    filteredSubs.map((sub) => {
                        const isActive = sub.active;
                        return (
                            <div key={sub.id} className={`${CARD_BASE} p-6 group relative hover:border-zinc-700 ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-400`}>
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{sub.title}</h3>
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider">{sub.category}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleToggle(e, sub.id)}
                                        className={`p-2 rounded-full transition-all ${isActive ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-zinc-600 bg-zinc-900 hover:text-zinc-400'}`}
                                        title={isActive ? "Deactivate" : "Activate"}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-3xl font-bold tracking-tight ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                            {currency(sub.amount)}
                                        </span>
                                        <span className="text-sm text-zinc-500 font-medium">/ {sub.billingCycle}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>Next: {formatDate(sub.nextPaymentDate)}</span>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(sub)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setDeletingId(sub.id); setDeleteConfirmOpen(true); }} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
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
                <div className="mt-10 flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-full font-medium hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{loadingMore ? 'Loading...' : 'Load More Services'}</span>
                    </button>
                </div>
            )}

            {/* ================= MODALS ================= */}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingSub ? 'Edit Subscription' : 'New Subscription'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Service Name</label>
                                <input type="text" name="title" required placeholder="e.g. Netflix" value={formData.title} onChange={handleInputChange} className={INPUT_BASE} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Amount</label>
                                    <input type="number" name="amount" required placeholder="0.00" value={formData.amount} onChange={handleInputChange} className={`${INPUT_BASE} font-mono`} />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Cycle</label>
                                    <select name="billingCycle" value={formData.billingCycle} onChange={handleInputChange} className={`${INPUT_BASE} appearance-none`}>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Category</label>
                                    <input type="text" name="category" placeholder="e.g. Software" value={formData.category} onChange={handleInputChange} className={INPUT_BASE} />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Next Payment</label>
                                    <input type="date" name="nextPaymentDate" value={formData.nextPaymentDate} onChange={handleInputChange} className={`${INPUT_BASE} scheme-dark`} />
                                </div>
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full mt-4 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-70">
                                {formLoading ? 'Saving...' : 'Save Subscription'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Remove Subscription?</h3>
                        <p className="text-zinc-500 text-sm mb-6">This will remove this service from your tracking calculations.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setDeleteConfirmOpen(false)} className="py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}