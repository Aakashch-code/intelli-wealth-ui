import React, { useEffect, useState, useMemo } from 'react';
import {
    CreditCard,
    Calendar,
    Plus,
    Edit2,
    Trash2,
    X,
    Search,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Zap,
    Power
} from 'lucide-react';

// Import the methods from your api.js
// Note: Ensure updateSubscription is added to your API file if you want the Edit feature to work
import {
    fetchSubscriptions,
    createSubscription,
    // updateSubscription, // Add this to your api.js: (id, data) => api.put(`/subscriptions/${id}`, data)
    deleteSubscription,
    toggleSubscription,
} from '../../services/api.jsx';

// You might need to add this manually to your api.js if it's missing
// Temporary mock for update to prevent crash if you haven't added it yet
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
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Toast = ({ message, type, onClose }) => (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 z-50
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
    // Data State
    const [subs, setSubs] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
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
        title: '',
        amount: '',
        billingCycle: 'monthly',
        nextPaymentDate: '',
        category: ''
    });

    // --- Lifecycle ---

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showToast = (message, type = 'success') => setNotification({ message, type });

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch list - api.get('/subscriptions')
            const response = await fetchSubscriptions();
            // Handle both structure possibilities: response.data or response directly
            const data = response.data || response;
            setSubs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading data:", err);
            showToast("Could not connect to server", "error");
            setSubs([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Computed ---

    // 1. Calculate Total Cost locally since no API endpoint was provided for it
    const totalMonthlyCost = useMemo(() => {
        return subs
            .filter(s => s.active) // Only count active subs
            .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    }, [subs]);

    // 2. Count Active Services
    const activeCount = useMemo(() => {
        return subs.filter(s => s.active).length;
    }, [subs]);

    // 3. Search Filter
    const filteredSubs = useMemo(() => {
        return subs.filter(s =>
            s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [subs, searchQuery]);


    // --- Handlers ---

    const openModal = (sub = null) => {
        setEditingSub(sub);
        if (sub) {
            setFormData({
                title: sub.title,
                amount: sub.amount,
                billingCycle: sub.billingCycle,
                // Ensure date format matches input type="date" (YYYY-MM-DD)
                nextPaymentDate: sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toISOString().split('T')[0] : '',
                category: sub.category
            });
        } else {
            setFormData({
                title: '',
                amount: '',
                billingCycle: 'monthly',
                nextPaymentDate: new Date().toISOString().split('T')[0],
                category: ''
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
                // Assuming you add updateSubscription to api.js
                await updateSubscription(editingSub.id, formData);
                showToast("Subscription updated");
            } else {
                await createSubscription(formData);
                showToast("Subscription added");
            }
            await loadData();
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            showToast("Operation failed", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggle = async (e, id) => {
        e.stopPropagation();
        // Optimistic UI Update
        const previousSubs = [...subs];
        setSubs(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

        try {
            await toggleSubscription(id);
            // No need to reload data if optimistic update worked,
            // but usually safe to reload in bg to ensure sync
        } catch (err) {
            console.error(err);
            setSubs(previousSubs); // Revert on failure
            showToast("Failed to toggle status", "error");
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteSubscription(deletingId);
            setSubs(prev => prev.filter(s => s.id !== deletingId)); // Optimistic delete
            showToast("Subscription removed");
        } catch (err) {
            console.error(err);
            showToast("Failed to delete", "error");
            await loadData(); // Revert/Reload
        }
        setDeleteConfirmOpen(false);
    };

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

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <StatCard
                    label="Total Monthly Cost"
                    value={currency(totalMonthlyCost)}
                    subtext="Calculated from active subscriptions"
                />
                <StatCard
                    label="Active Services"
                    value={activeCount}
                    subtext={`${subs.length - activeCount} currently paused`}
                />
            </div>

            {/* Controls */}
            <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search services..."
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

                                {/* Header Row */}
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

                                {/* Cost Block */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-3xl font-bold tracking-tight ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                            {currency(sub.amount)}
                                        </span>
                                        <span className="text-sm text-zinc-500 font-medium">/ {sub.billingCycle}</span>
                                    </div>
                                </div>

                                {/* Footer Info & Actions */}
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
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="e.g. Netflix"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={INPUT_BASE}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        required
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        className={`${INPUT_BASE} font-mono`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Cycle</label>
                                    <select
                                        name="billingCycle"
                                        value={formData.billingCycle}
                                        onChange={handleInputChange}
                                        className={`${INPUT_BASE} appearance-none`}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        placeholder="e.g. Software"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className={INPUT_BASE}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Next Payment</label>
                                    <input
                                        type="date"
                                        name="nextPaymentDate"
                                        value={formData.nextPaymentDate}
                                        onChange={handleInputChange}
                                        className={`${INPUT_BASE} scheme-dark`}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full mt-4 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-70"
                            >
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
                            <button
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}