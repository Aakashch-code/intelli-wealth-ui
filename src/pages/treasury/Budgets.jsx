import React, { useEffect, useState, useCallback } from 'react';
import {
    PieChart, Wallet, TrendingUp, Plus, Edit2, Trash2, X,
    Loader2, ShoppingBag, Car, Home, Zap, HeartPulse,
    Calendar, CheckCircle2, ChevronDown, ShoppingCart,
    Shield, Tv, Utensils, Plane, Dumbbell, Sparkles,
    PiggyBank, Landmark, CreditCard, FileText, Repeat,
    Wifi, Smartphone, GraduationCap, Baby, Gift, HandHeart,
    Briefcase, Building, AlertTriangle, HelpCircle, PlusCircle, PowerOff
} from 'lucide-react';

import {
    fetchBudgets,
    fetchBudgetSummary,
    createBudget,
    updateBudget,
    deleteBudget,
    addSpentAmount
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
    startDate: '', endDate: '', recurring: false, note: '', mode: 'ACTIVE'
};

export default function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [summary, setSummary] = useState({ totalAllocated: 0, totalSpent: 0, totalRemaining: 0 });

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [expenseTitle, setExpenseTitle] = useState("");

    // Modals state
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [spentOpen, setSpentOpen] = useState(false);

    // Selection state
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [editing, setEditing] = useState(null);

    // Form state
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [expenseAmount, setExpenseAmount] = useState("");

    const fetchDashboardStats = async () => {
        try {
            const res = await fetchBudgetSummary();
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
                // Fallback for non-paginated API responses
                const fallbackData = Array.isArray(data) ? data : (data.content || []);
                setBudgets(pageNumber === 0 ? fallbackData : [...budgets, ...fallbackData]);
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

    const openFormModal = (budget = null) => {
        setEditing(budget);
        if (budget) {
            setFormData({
                title: budget.title,
                category: budget.category,
                amountAllocated: budget.amountAllocated,
                amountSpent: budget.amountSpent,
                startDate: budget.startDate,
                endDate: budget.endDate,
                recurring: budget.recurring,
                note: budget.note || '',
                mode: budget.mode || 'ACTIVE'
            });
        } else {
            const now = new Date();
            const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setFormData({ ...INITIAL_FORM, amountSpent: 0, startDate: first, endDate: last, recurring: true, mode: 'ACTIVE' });
        }
        setModalOpen(true);
    };

    const openExpenseModal = (budget) => {
        setSelectedBudget(budget);
        setExpenseAmount("");
        setExpenseTitle("");
        setSpentOpen(true);
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

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();

        if (!expenseTitle.trim() || !expenseAmount || Number(expenseAmount) <= 0) return;
        setFormLoading(true);

        try {
            await addSpentAmount(selectedBudget.id, {
                title: expenseTitle,
                amount: parseFloat(expenseAmount)
            });

            await loadInitialData();
            setSpentOpen(false);

            // reset form
            setExpenseAmount("");
            setExpenseTitle("");
        } catch (err) {
            console.error("Add expense error:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBudget) return;
        try {
            await deleteBudget(selectedBudget.id);
            await loadInitialData();
        } finally {
            setDeleteOpen(false);
            setSelectedBudget(null);
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
                    onClick={() => openFormModal()}
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
                            onEdit={() => openFormModal(budget)}
                            onDelete={() => { setSelectedBudget(budget); setDeleteOpen(true); }}
                            onAddExpense={() => openExpenseModal(budget)}
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

            {/* CREATE / EDIT FORM MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-all animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-white/10 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex justify-between items-center p-6 pb-4 border-b border-white/5">
                            <h3 className="text-xl font-semibold text-white tracking-tight">
                                {editing ? 'Edit Budget' : 'Create Budget'}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="overflow-y-auto p-6">
                            <form id="budget-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

                                {/* Title - Full Width */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                                    <input
                                        type="text" name="title" value={formData.title} onChange={handleChange} required
                                        placeholder="e.g. Grocery Fund"
                                        className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20"
                                    />
                                </div>

                                {/* Category & Mode */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                                        <select
                                            name="category" value={formData.category} onChange={handleChange} required
                                            className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20 appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled className="text-zinc-500">Select category...</option>
                                            {BUDGET_CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value} className="bg-zinc-900">{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status Mode</label>
                                        <select
                                            name="mode" value={formData.mode} onChange={handleChange} required
                                            className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20 appearance-none cursor-pointer"
                                        >
                                            <option value="ACTIVE" className="bg-zinc-900">Active</option>
                                            <option value="SUSPENDED" className="bg-zinc-900">Suspended</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Amounts */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Allocated Amount (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">₹</span>
                                            <input
                                                type="number" name="amountAllocated" value={formData.amountAllocated} onChange={handleChange} required min="0" step="0.01"
                                                placeholder="0.00"
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-7 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20"
                                            />
                                        </div>
                                    </div>
                                    {editing && (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Already Spent (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">₹</span>
                                                <input
                                                    type="number" name="amountSpent" value={formData.amountSpent} onChange={handleChange} min="0" step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-7 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
                                        <input
                                            type="date" name="startDate" value={formData.startDate} onChange={handleChange} required
                                            className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20 [color-scheme:dark] cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">End Date</label>
                                        <input
                                            type="date" name="endDate" value={formData.endDate} onChange={handleChange} required
                                            className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20 [color-scheme:dark] cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Notes (Optional)</label>
                                    <textarea
                                        name="note" value={formData.note} onChange={handleChange} placeholder="Any details about this budget..." rows="2"
                                        className="bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20 resize-none"
                                    />
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer mt-2 w-fit group">
                                    <div className="relative flex items-center justify-center w-5 h-5">
                                        <input
                                            type="checkbox" name="recurring" checked={formData.recurring} onChange={handleChange}
                                            className="peer appearance-none w-full h-full border-2 border-zinc-700 rounded-md bg-zinc-900/50 checked:bg-violet-600 checked:border-violet-600 focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-all cursor-pointer"
                                        />
                                        <CheckCircle2 size={14} strokeWidth={3} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                    <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                        Make this a recurring budget
                                    </span>
                                </label>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-4 border-t border-white/5 bg-zinc-950/50 flex justify-end gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                form="budget-form"
                                type="submit"
                                disabled={formLoading}
                                className="flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none min-w-[130px] shadow-lg shadow-white/10"
                            >
                                {formLoading ? <Loader2 size={16} className="animate-spin text-zinc-600" /> : 'Save Budget'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ADD EXPENSE MODAL */}
            {spentOpen && selectedBudget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-all animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-white/10 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex justify-between items-center p-6 pb-4 border-b border-white/5">
                            <h3 className="text-xl font-semibold text-white tracking-tight">Add Expense</h3>
                            <button
                                onClick={() => setSpentOpen(false)}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Context Card */}
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-6 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 font-medium">Budget</span>
                                    <span className="text-zinc-200 font-semibold">{selectedBudget.title}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500 font-medium">Currently Spent</span>
                                    <span className="text-zinc-200 font-semibold">{formatINR(selectedBudget.amountSpent)}</span>
                                </div>
                            </div>

                            <form id="expense-form" onSubmit={handleExpenseSubmit} className="flex flex-col gap-4">
                                {/* TITLE */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                        Expense Title
                                    </label>
                                    <input
                                        type="text"
                                        value={expenseTitle}
                                        onChange={(e) => setExpenseTitle(e.target.value)}
                                        required
                                        placeholder="e.g. Groceries, Netflix, Food delivery"
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20"
                                    />
                                </div>

                                {/* AMOUNT */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                        Amount to Add (₹)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">₹</span>
                                        <input
                                            type="number"
                                            value={expenseAmount}
                                            onChange={(e) => setExpenseAmount(e.target.value)}
                                            required
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-7 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/80 transition-all hover:border-white/20"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-4 border-t border-white/5 bg-zinc-950/50 flex justify-end gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={() => setSpentOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                form="expense-form"
                                type="submit"
                                disabled={formLoading}
                                className="flex items-center justify-center gap-2 bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-500 hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none min-w-[130px] shadow-lg shadow-violet-900/20"
                            >
                                {formLoading ? <Loader2 size={16} className="animate-spin text-white/70" /> : 'Add Expense'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
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

function BudgetCard({ budget, onEdit, onDelete, onAddExpense }) {
    const Icon = getBudgetIcon(budget.category);
    const percent = budget.amountAllocated > 0 ? Math.min((budget.amountSpent / budget.amountAllocated) * 100, 100) : 0;

    const isSuspended = budget.mode === 'SUSPENDED';

    return (
        <div className={`bg-black border rounded-2xl p-6 hover:border-violet-500/50 group transition-colors flex flex-col h-full ${isSuspended ? 'border-zinc-800 opacity-75' : 'border-white/10'}`}>
            <div className="flex justify-between mb-4">
                <div className="flex gap-4">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-center items-center">
                        <Icon size={20} className={isSuspended ? 'text-zinc-500' : 'text-white'} />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${isSuspended ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-white'}`}>
                            {budget.title}
                        </h3>
                        <div className="flex gap-2 mt-1 flex-wrap items-center">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 uppercase">
                                {budget.category.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${isSuspended ? 'text-orange-400 border-orange-400/30 bg-orange-400/10' : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'}`}>
                                {budget.mode || 'ACTIVE'}
                            </span>
                            {budget.recurring && (
                                <span className="text-[10px] flex items-center gap-1 text-zinc-600 ml-1">
                                    <CheckCircle2 size={12} /> Recurring
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Visual Status calculated from API */}
                <div className={`px-2 py-1 h-fit text-[10px] border rounded font-bold ${getStatusColor(budget.status)}`}>
                    {budget.status || 'SAFE'}
                </div>
            </div>

            <div className="flex justify-between mb-2 mt-auto">
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
                <div className={`h-full rounded transition-all duration-500 ${isSuspended ? 'bg-zinc-600' : getProgressColor(budget.status)}`} style={{ width: `${percent}%` }} />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div>
                    <p className="font-bold">{formatINR(budget.remainingAmount)}</p>
                    <p className="text-[10px] text-zinc-500">Remaining</p>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onAddExpense}
                        disabled={isSuspended}
                        className="flex items-center gap-1 px-3 py-1.5 bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600 hover:text-white rounded-lg text-xs font-semibold transition-colors mr-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <PlusCircle size={14} /> Add
                    </button>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={onEdit} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors" title="Edit Budget">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={onDelete} className="p-2 hover:bg-red-900/20 rounded text-zinc-400 hover:text-red-400 transition-colors" title="Delete Budget">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-zinc-600 flex gap-1 items-center">
                <Calendar size={12} />
                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
            </div>

            {budget.note && (
                <div className="mt-2 text-[10px] text-zinc-500 italic truncate" title={budget.note}>
                    "{budget.note}"
                </div>
            )}
        </div>
    );
}