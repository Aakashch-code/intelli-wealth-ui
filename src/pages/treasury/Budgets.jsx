import React, { useEffect, useState, useCallback } from 'react';
import {
    PieChart, Wallet, TrendingUp, Plus, Edit2, Trash2, X,
    Loader2, ShoppingBag, Car, Home, Zap, HeartPulse,
    Calendar, CheckCircle2, ChevronDown, ShoppingCart, 
    Shield, Tv, Utensils, Plane, Dumbbell, Sparkles, 
    PiggyBank, Landmark, CreditCard, FileText, Repeat, 
    Wifi, Smartphone, GraduationCap, Baby, Gift, HandHeart, 
    Briefcase, Building, AlertTriangle, HelpCircle
} from 'lucide-react';

import {
    fetchBudgets,
    fetchBudgetStats,
    createBudget,
    updateBudget,
    deleteBudget
} from "../../services/api.jsx";

const BUDGET_CATEGORIES = [
    { value: 'GROCERIES', label: 'Groceries', icon: ShoppingCart },
    { value: 'RENT', label: 'Rent', icon: Home },
    { value: 'UTILITIES', label: 'Utilities', icon: Zap },
    { value: 'TRANSPORT', label: 'Transport', icon: Car },
    { value: 'HEALTHCARE', label: 'Healthcare', icon: HeartPulse },
    { value: 'INSURANCE', label: 'Insurance', icon: Shield },
    { value: 'ENTERTAINMENT', label: 'Entertainment', icon: Tv },
    { value: 'DINING', label: 'Dining', icon: Utensils },
    { value: 'SHOPPING', label: 'Shopping', icon: ShoppingBag },
    { value: 'TRAVEL', label: 'Travel', icon: Plane },
    { value: 'FITNESS', label: 'Fitness', icon: Dumbbell },
    { value: 'PERSONAL_CARE', label: 'Personal Care', icon: Sparkles },
    { value: 'SAVINGS', label: 'Savings', icon: PiggyBank },
    { value: 'INVESTMENTS', label: 'Investments', icon: TrendingUp },
    { value: 'LOANS', label: 'Loans', icon: Landmark },
    { value: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
    { value: 'TAXES', label: 'Taxes', icon: FileText },
    { value: 'SUBSCRIPTIONS', label: 'Subscriptions', icon: Repeat },
    { value: 'INTERNET', label: 'Internet', icon: Wifi },
    { value: 'MOBILE_RECHARGE', label: 'Mobile Recharge', icon: Smartphone },
    { value: 'EDUCATION', label: 'Education', icon: GraduationCap },
    { value: 'CHILDCARE', label: 'Childcare', icon: Baby },
    { value: 'GIFTS', label: 'Gifts', icon: Gift },
    { value: 'DONATIONS', label: 'Donations', icon: HandHeart },
    { value: 'OFFICE_EXPENSES', label: 'Office Expenses', icon: Briefcase },
    { value: 'BUSINESS', label: 'Business', icon: Building },
    { value: 'EMERGENCY', label: 'Emergency', icon: AlertTriangle },
    { value: 'MISCELLANEOUS', label: 'Miscellaneous', icon: HelpCircle }
];

const getBudgetIcon = (cat) => BUDGET_CATEGORIES.find(c => c.value === cat)?.icon || Wallet;

const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

const getStatusColor = (status) => {
    switch (status) {
        case 'SAFE': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        case 'WARNING': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        case 'DANGER': return 'text-red-500 bg-red-500/10 border-red-500/20';
        default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
};

const getProgressColor = (status) => {
    switch (status) {
        case 'SAFE': return 'bg-emerald-500';
        case 'WARNING': return 'bg-orange-500';
        case 'DANGER': return 'bg-red-500';
        default: return 'bg-violet-500';
    }
};

const INITIAL_FORM = {
    title: '', category: '', amountAllocated: '', amountSpent: '',
    startDate: '', endDate: '', recurring: false, note: ''
};

export default function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [summary, setSummary] = useState({ totalAllocated: 0, totalSpent: 0, totalRemaining: 0 });

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM);

    const fetchDashboardStats = async () => {
        try {
            const res = await fetchBudgetStats();
            const data = res.data || res;
            setSummary({
                totalAllocated: data.totalAllocated || 0,
                totalSpent: data.totalSpent || 0,
                totalRemaining: data.totalRemaining || 0
            });
        } catch (err) {
            console.error("Fetch stats error:", err);
        }
    };

    const fetchPageData = async (pageNumber) => {
        try {
            const res = await fetchBudgets(pageNumber, 12);
            const data = res.data || res;

            if (data && data.content) {
                setBudgets(prev => pageNumber === 0 ? data.content : [...prev, ...data.content]);
                setPage(pageNumber);
                setHasMore(!data.last);
            } else {
                setBudgets(Array.isArray(data) ? data : []);
                setHasMore(false);
            }
        } catch (err) {
            console.error("Fetch page error:", err);
        }
    };

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([fetchDashboardStats(), fetchPageData(0)]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchPageData(page + 1);
        setLoadingMore(false);
    };

    const openModal = (budget = null) => {
        setEditing(budget);
        if (budget) {
            setFormData({
                title: budget.title, category: budget.category, amountAllocated: budget.amountAllocated,
                amountSpent: budget.amountSpent, startDate: budget.startDate, endDate: budget.endDate,
                recurring: budget.recurring, note: budget.note || ''
            });
        } else {
            const now = new Date();
            const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setFormData({ ...INITIAL_FORM, amountSpent: 0, startDate: first, endDate: last, recurring: true });
        }
        setModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        const payload = {
            ...formData,
            amountAllocated: parseFloat(formData.amountAllocated),
            amountSpent: parseFloat(formData.amountSpent) || 0
        };

        try {
            if (editing) await updateBudget(editing.id, payload);
            else await createBudget(payload);
            await loadInitialData();
            setModalOpen(false);
        } catch (err) {
            console.error("Save error:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteBudget(deletingId);
            await loadInitialData();
        } finally {
            setDeleteOpen(false);
            setDeletingId(null);
        }
    };

    if (loading && budgets.length === 0) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center text-white">
                <Loader2 className="animate-spin text-violet-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold mb-2">Budgets</h2>
                    <p className="text-zinc-500 text-lg">Manage allocations and track spending</p>
                </div>
                <button 
                    onClick={() => openModal()} 
                    className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                >
                    <Plus size={20} /> Create Budget
                </button>
            </header>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <SummaryCard icon={Wallet} label="Total Allocated" value={summary.totalAllocated} />
                <SummaryCard icon={TrendingUp} label="Total Spent" value={summary.totalSpent} color="text-violet-400" />
                <SummaryCard icon={PieChart} label="Total Remaining" value={summary.totalRemaining} color="text-emerald-400" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500">No active budgets found.</p>
                    </div>
                ) : (
                    budgets.map(budget => (
                        <BudgetCard 
                            key={budget.id} 
                            budget={budget} 
                            onEdit={() => openModal(budget)} 
                            onDelete={() => { setDeletingId(budget.id); setDeleteOpen(true); }} 
                        />
                    ))
                )}
            </div>

            {hasMore && (
                <div className="mt-10 flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-full font-medium hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{loadingMore ? 'Loading...' : 'Load More Budgets'}</span>
                    </button>
                </div>
            )}

            {/* RENDER FORM MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editing ? 'Edit Budget' : 'Create Budget'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Title & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase">Title</label>
                                    <input 
                                        type="text" 
                                        name="title" 
                                        value={formData.title} 
                                        onChange={handleChange} 
                                        required
                                        placeholder="e.g. Grocery Fund"
                                        className="bg-black border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase">Category</label>
                                    <select 
                                        name="category" 
                                        value={formData.category} 
                                        onChange={handleChange} 
                                        required
                                        className="bg-black border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                                    >
                                        <option value="" disabled>Select...</option>
                                        {BUDGET_CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Amount Allocated & Spent */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase">Allocated Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        name="amountAllocated" 
                                        value={formData.amountAllocated} 
                                        onChange={handleChange} 
                                        required min="0" step="0.01"
                                        placeholder="0.00"
                                        className="bg-black border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                                    />
                                </div>
                                {editing && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase">Already Spent (₹)</label>
                                        <input 
                                            type="number" 
                                            name="amountSpent" 
                                            value={formData.amountSpent} 
                                            onChange={handleChange} 
                                            min="0" step="0.01"
                                            className="bg-black border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Start & End Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase">Start Date</label>
                                    <input 
                                        type="date" 
                                        name="startDate" 
                                        value={formData.startDate} 
                                        onChange={handleChange} 
                                        required
                                        className="bg-black border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase">End Date</label>
                                    <input 
                                        type="date" 
                                        name="endDate" 
                                        value={formData.endDate} 
                                        onChange={handleChange} 
                                        required
                                        className="bg-black border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-zinc-400 uppercase">Notes (Optional)</label>
                                <textarea 
                                    name="note" 
                                    value={formData.note} 
                                    onChange={handleChange}
                                    placeholder="Any details about this budget..."
                                    rows="2"
                                    className="bg-black border border-zinc-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
                                />
                            </div>

                            {/* Recurring Checkbox */}
                            <label className="flex items-center gap-3 cursor-pointer mt-2 w-fit">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        name="recurring" 
                                        checked={formData.recurring} 
                                        onChange={handleChange}
                                        className="peer appearance-none w-5 h-5 border border-zinc-700 rounded bg-black checked:bg-violet-500 checked:border-violet-500 transition-all"
                                    />
                                    <CheckCircle2 size={14} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                <span className="text-sm font-medium text-zinc-300">Make this a recurring budget</span>
                            </label>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-800">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={formLoading} className="flex items-center justify-center gap-2 bg-white text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 min-w-[120px]">
                                    {formLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Budget'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RENDER DELETE MODAL */}
            {deleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center">
                        <h3 className="text-xl font-bold mb-2 text-red-500">Delete Budget?</h3>
                        <p className="text-sm text-zinc-400 mb-6">This action cannot be undone. Are you sure you want to remove this budget?</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setDeleteOpen(false)} className="px-6 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ icon: Icon, label, value, color = 'text-white' }) {
    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <div className={`flex items-center gap-3 mb-2 ${color}`}>
                <Icon size={20} />
                <span className="text-xs font-bold uppercase">{label}</span>
            </div>
            <p className="text-3xl font-bold">{formatINR(value)}</p>
        </div>
    );
}

function BudgetCard({ budget, onEdit, onDelete }) {
    const Icon = getBudgetIcon(budget.category);
    const percent = budget.amountAllocated > 0 ? Math.min((budget.amountSpent / budget.amountAllocated) * 100, 100) : 0;

    return (
        <div className="bg-black border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 group transition-colors">
            <div className="flex justify-between mb-4">
                <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-center items-center">
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{budget.title}</h3>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 uppercase">{budget.category.replace(/_/g, ' ')}</span>
                            {budget.recurring && (
                                <span className="text-[10px] flex items-center gap-1 text-zinc-600">
                                    <CheckCircle2 size={12} /> Recurring
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`px-2 py-1 h-fit text-[10px] border rounded font-bold ${getStatusColor(budget.status)}`}>
                    {budget.status}
                </div>
            </div>

            <div className="flex justify-between mb-2">
                <div>
                    <span className="text-2xl font-bold">{formatINR(budget.amountSpent)}</span>
                    <p className="text-xs text-zinc-500">Spent</p>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold text-zinc-400">{formatINR(budget.amountAllocated)}</span>
                    <p className="text-xs text-zinc-500">Allocated</p>
                </div>
            </div>

            <div className="h-2 bg-zinc-800 rounded mb-4 overflow-hidden">
                <div className={`h-full rounded transition-all duration-500 ${getProgressColor(budget.status)}`} style={{ width: `${percent}%` }} />
            </div>

            <div className="flex justify-between pt-4 border-t border-white/5">
                <div>
                    <p className="font-bold">{formatINR(budget.remainingAmount)}</p>
                    <p className="text-[10px] text-zinc-500">Remaining</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={onDelete} className="p-2 hover:bg-red-900/20 rounded text-zinc-400 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-zinc-600 flex gap-1 items-center">
                <Calendar size={12} />
                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
            </div>

            {budget.note && (
                <div className="mt-2 text-[10px] text-zinc-500 italic truncate">
                    "{budget.note}"
                </div>
            )}
        </div>
    );
}