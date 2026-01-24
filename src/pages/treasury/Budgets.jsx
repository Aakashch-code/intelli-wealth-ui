import React, { useEffect, useState } from 'react';
import {
    PieChart,
    Wallet,
    TrendingUp,
    Plus,
    Edit2,
    Trash2,
    X,
    Loader2,
    ShoppingBag,
    Coffee,
    Car,
    Home,
    Zap,
    HeartPulse,
    LayoutGrid,
    Calendar,
    CheckCircle2
} from 'lucide-react';
import {
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget
} from "../../services/api.jsx";

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUDGET_CATEGORIES = [
    { value: 'HOUSING', label: 'Housing & Rent', icon: Home },
    { value: 'TRANSPORTATION', label: 'Transportation', icon: Car },
    { value: 'FOOD', label: 'Food & Dining', icon: Coffee },
    { value: 'UTILITIES', label: 'Utilities', icon: Zap },
    { value: 'HEALTH', label: 'Health & Fitness', icon: HeartPulse },
    { value: 'SHOPPING', label: 'Shopping', icon: ShoppingBag },
    { value: 'GROCERIES', label: 'Groceries', icon: ShoppingBag },
    { value: 'LIFESTYLE', label: 'Lifestyle & Entertainment', icon: LayoutGrid },
    { value: 'OTHER', label: 'Miscellaneous', icon: PieChart }
];

const getBudgetIcon = (catString) => {
    const found = BUDGET_CATEGORIES.find(c => c.value === catString);
    return found ? found.icon : Wallet;
};

const formatINR = (val) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val || 0);

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const getStatusColor = (status) => {
    switch (status) {
        case 'SAFE': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        case 'WARNING': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        case 'DANGER': return 'text-red-500 bg-red-500/10 border-red-500/20';
        default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
};

const getProgressBarColor = (status) => {
    switch (status) {
        case 'SAFE': return 'bg-emerald-500';
        case 'WARNING': return 'bg-orange-500';
        case 'DANGER': return 'bg-red-500';
        default: return 'bg-violet-500';
    }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function Budgets() {
    // Data State
    const [budgets, setBudgets] = useState([]);
    const [summary, setSummary] = useState({
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0
    });
    const [loading, setLoading] = useState(true);

    // UI State
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        amountAllocated: '',
        amountSpent: '', // Empty string for cleaner input
        startDate: '',
        endDate: '',
        recurring: false,
        note: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const listRes = await fetchBudgets();
            const budgetList = listRes.data || [];
            setBudgets(budgetList);

            // Calculate totals for the summary cards
            const stats = budgetList.reduce((acc, curr) => ({
                totalAllocated: acc.totalAllocated + (curr.amountAllocated || 0),
                totalSpent: acc.totalSpent + (curr.amountSpent || 0),
                totalRemaining: acc.totalRemaining + (curr.remainingAmount || 0)
            }), { totalAllocated: 0, totalSpent: 0, totalRemaining: 0 });

            setSummary(stats);

        } catch (error) {
            console.error("Error fetching budget data:", error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (budget = null) => {
        setEditingBudget(budget);
        if (budget) {
            setFormData({
                title: budget.title,
                category: budget.category,
                amountAllocated: budget.amountAllocated,
                amountSpent: budget.amountSpent,
                startDate: budget.startDate,
                endDate: budget.endDate,
                recurring: budget.recurring,
                note: budget.note || ''
            });
        } else {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

            setFormData({
                title: '',
                category: '',
                amountAllocated: '',
                amountSpent: 0, // Default 0 for new budget
                startDate: firstDay,
                endDate: lastDay,
                recurring: true,
                note: ''
            });
        }
        setModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        const payload = {
            title: formData.title,
            category: formData.category,
            amountAllocated: parseFloat(formData.amountAllocated),
            // ✅ MANUAL LOGIC: User inputs spent amount, we send it to backend
            amountSpent: parseFloat(formData.amountSpent),
            startDate: formData.startDate,
            endDate: formData.endDate,
            recurring: formData.recurring,
            note: formData.note
        };

        try {
            if (editingBudget) {
                await updateBudget(editingBudget.id, payload);
            } else {
                await createBudget(payload);
            }
            await loadData();
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving budget:", error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteBudget(deletingId);
            await loadData();
        } catch (error) {
            console.error("Error deleting budget:", error);
        } finally {
            setDeleteConfirmOpen(false);
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2">Budgets</h2>
                    <p className="text-zinc-500 text-lg">Manage allocations and track spending</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Budget</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Allocated */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                        <Wallet className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Allocated</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {formatINR(summary.totalAllocated)}
                    </div>
                </div>

                {/* Spent */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2 text-violet-400">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Spent</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {formatINR(summary.totalSpent)}
                    </div>
                </div>

                {/* Remaining */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2 text-emerald-400">
                        <PieChart className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Remaining</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {formatINR(summary.totalRemaining)}
                    </div>
                </div>
            </div>

            {/* Budget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500">No active budgets found.</p>
                    </div>
                ) : (
                    budgets.map((budget) => {
                        const Icon = getBudgetIcon(budget.category);
                        const percent = budget.amountAllocated > 0
                            ? Math.min((budget.amountSpent / budget.amountAllocated) * 100, 100)
                            : 0;

                        return (
                            <div key={budget.id} className="bg-black border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{budget.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 uppercase">
                                                    {budget.category}
                                                </span>
                                                {budget.recurring && (
                                                    <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3"/> Recurring
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(budget.status)}`}>
                                        {budget.status}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-2xl font-bold text-white block">
                                            {formatINR(budget.amountSpent)}
                                        </span>
                                        <span className="text-xs text-zinc-500">Spent</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-zinc-400 block">
                                            {formatINR(budget.amountAllocated)}
                                        </span>
                                        <span className="text-xs text-zinc-500">Allocated</span>
                                    </div>
                                </div>

                                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-4">
                                    <div
                                        className={`h-full transition-all duration-500 ${getProgressBarColor(budget.status)}`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">
                                            {formatINR(budget.remainingAmount)}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">Remaining</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(budget)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setDeletingId(budget.id); setDeleteConfirmOpen(true); }} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-600">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3"/>
                                        {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                                    </div>
                                </div>
                                {budget.note && (
                                    <div className="mt-2 text-[10px] text-zinc-500 italic truncate">
                                        "{budget.note}"
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingBudget ? 'Edit Budget' : 'New Budget'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Title</label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                                        placeholder="e.g. Protein Supp"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 appearance-none"
                                    >
                                        <option value="">Select...</option>
                                        {BUDGET_CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* MANUAL INPUT ENABLED */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Allocated (₹)</label>
                                    <input
                                        name="amountAllocated"
                                        type="number"
                                        value={formData.amountAllocated}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                                        placeholder="70000"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Spent So Far (₹)</label>
                                    <input
                                        name="amountSpent"
                                        type="number"
                                        value={formData.amountSpent}
                                        onChange={handleInputChange}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Start Date</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">End Date</label>
                                    <input
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Notes (Optional)</label>
                                <textarea
                                    name="note"
                                    value={formData.note}
                                    onChange={handleInputChange}
                                    rows="2"
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 resize-none"
                                    placeholder="Add details..."
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    name="recurring"
                                    id="recurring"
                                    checked={formData.recurring}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500 focus:ring-offset-black"
                                />
                                <label htmlFor="recurring" className="text-sm text-zinc-300 select-none cursor-pointer">
                                    Recurring Budget (Monthly)
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full mt-4 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                {formLoading ? 'Saving...' : 'Save Budget'}
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
                        <h3 className="text-lg font-bold text-white mb-2">Delete Budget?</h3>
                        <p className="text-zinc-500 text-sm mb-6">This action cannot be undone.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
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