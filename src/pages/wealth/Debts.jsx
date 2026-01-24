import React, { useEffect, useState } from 'react';
import {
    CreditCard,
    Home,
    Banknote,
    CalendarClock,
    Plus,
    Edit2,
    Trash2,
    X,
    Loader2,
    TrendingDown,
    RefreshCw,
    AlertCircle,
    PieChart
} from 'lucide-react';
import {
    fetchDebts,
    createDebt,
    updateDebt,
    deleteDebt,
    fetchDebtStats
} from "../../services/api.jsx";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEBT_CATEGORY_RULES = {
    CREDIT_CARD: [
        { key: 'interestRate', label: 'APR / Interest Rate (%)', type: 'number', placeholder: 'e.g. 18.5' },
        { key: 'minPayment', label: 'Min Payment', type: 'number', placeholder: 'e.g. 5000' }
    ],
    HOME_LOAN: [
        { key: 'interestRate', label: 'Interest Rate (%)', type: 'number', placeholder: 'e.g. 8.5' },
        { key: 'tenure', label: 'Tenure (Years)', type: 'number', placeholder: 'e.g. 20' }
    ],
    PERSONAL_LOAN: [
        { key: 'interestRate', label: 'Interest Rate (%)', type: 'number', placeholder: 'e.g. 12.0' },
        { key: 'emi', label: 'Monthly EMI', type: 'number', placeholder: 'e.g. 15000' }
    ],
    EMI: [
        { key: 'emiAmount', label: 'EMI Amount', type: 'number', placeholder: 'e.g. 2500' },
        { key: 'duration', label: 'Duration (Months)', type: 'number', placeholder: 'e.g. 12' }
    ]
};

const getDebtIcon = (category) => {
    switch (category) {
        case 'CREDIT_CARD': return CreditCard;
        case 'HOME_LOAN': return Home;
        case 'PERSONAL_LOAN': return Banknote;
        case 'EMI': return CalendarClock;
        default: return AlertCircle;
    }
};

const formatINR = (val) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val || 0);

// ============================================================================
// COMPONENT
// ============================================================================

export default function Debts() {
    const [debts, setDebts] = useState([]);
    // Initial state matches your API JSON structure
    const [stats, setStats] = useState({
        totalDebtAmount: 0,
        totalOutstandingAmount: 0
    });
    const [loading, setLoading] = useState(true);

    // UI State
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        outstandingAmount: '',
        dueDate: '',
        attributes: {}
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [listResponse, statsResponse] = await Promise.all([
                fetchDebts(),
                fetchDebtStats()
            ]);
            setDebts(listResponse.data || []);
            // Directly set the stats object from backend
            setStats(statsResponse.data || { totalDebtAmount: 0, totalOutstandingAmount: 0 });
        } catch (error) {
            console.error("Error fetching debt data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const openModal = (debt = null) => {
        setEditingDebt(debt);
        if (debt) {
            setFormData({
                name: debt.name,
                category: debt.category,
                outstandingAmount: debt.outstandingAmount,
                dueDate: debt.dueDate ? debt.dueDate.split('T')[0] : '',
                attributes: debt.attributes || {}
            });
        } else {
            setFormData({
                name: '',
                category: '',
                outstandingAmount: '',
                dueDate: '',
                attributes: {}
            });
        }
        setModalOpen(true);
    };

    const handleMainChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'category') {
                return { ...prev, category: value, attributes: {} };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleAttributeChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        const payload = {
            name: formData.name,
            category: formData.category,
            outstandingAmount: parseFloat(formData.outstandingAmount),
            dueDate: formData.dueDate || null,
            attributes: formData.attributes
        };

        try {
            if (editingDebt) {
                await updateDebt(editingDebt.id, payload);
            } else {
                await createDebt(payload);
            }
            await loadData();
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving debt:", error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteDebt(deletingId);
            await loadData();
        } catch (error) {
            console.error("Error deleting debt:", error);
        } finally {
            setDeleteConfirmOpen(false);
            setDeletingId(null);
        }
    };

    // --- Render ---

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2">Liabilities</h2>
                    <p className="text-zinc-500 text-lg">Track your debts and loans</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Debt</span>
                </button>
            </div>

            {/* --- Stats Cards (Raw Backend Data) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-4xl">

                {/* Card 1: Total Debt Amount (e.g., Original Principal/Limit) */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <PieChart className="w-24 h-24 text-rose-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2 text-rose-500">
                        <PieChart className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Total Liability</span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">
                        {formatINR(stats.totalDebtAmount)}
                    </div>
                    <div className="text-sm text-zinc-500">
                        Total debt value recorded
                    </div>
                </div>

                {/* Card 2: Total Outstanding (Current Pending) */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingDown className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2 text-blue-400">
                        <TrendingDown className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Current Outstanding</span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">
                        {formatINR(stats.totalOutstandingAmount)}
                    </div>
                    <div className="text-sm text-zinc-500">
                        Remaining amount to be paid
                    </div>
                </div>
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {debts.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500">You are debt free! (Or no data found)</p>
                    </div>
                ) : (
                    debts.map((debt) => {
                        const Icon = getDebtIcon(debt.category);
                        return (
                            <div key={debt.id} className="bg-black border border-white/10 rounded-2xl p-6 hover:border-rose-500/50 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-rose-500 transition-colors">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{debt.name}</h3>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 uppercase">
                                                {debt.category?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span className="text-2xl font-bold text-white">
                                        {formatINR(debt.outstandingAmount)}
                                    </span>
                                    <span className="block text-xs text-zinc-500 mt-1">Outstanding Balance</span>
                                </div>

                                {/* Attribute Preview */}
                                <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-900/20 p-3 rounded-xl border border-white/5">
                                    {debt.attributes && Object.entries(debt.attributes).map(([key, val]) => (
                                        <div key={key}>
                                            <span className="text-zinc-500 block uppercase text-[10px]">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="text-zinc-300 truncate block text-xs">{val}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Due: {debt.dueDate || 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(debt)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setDeletingId(debt.id); setDeleteConfirmOpen(true); }} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
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

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-950 pb-4 border-b border-zinc-900 z-10">
                            <h3 className="text-xl font-bold text-white">
                                {editingDebt ? 'Edit Debt' : 'New Debt'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* --- BASE FIELDS --- */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Debt Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50"
                                        placeholder="e.g. HDFC Home Loan"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 appearance-none"
                                    >
                                        <option value="">Select...</option>
                                        {Object.keys(DEBT_CATEGORY_RULES).map(cat => (
                                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Outstanding Amount</label>
                                    <input
                                        name="outstandingAmount"
                                        type="number"
                                        value={formData.outstandingAmount}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Next Due Date (Optional)</label>
                                    <input
                                        name="dueDate"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={handleMainChange}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50"
                                    />
                                </div>
                            </div>

                            {/* --- DYNAMIC ATTRIBUTES (Based on Category) --- */}
                            {formData.category && DEBT_CATEGORY_RULES[formData.category] && (
                                <div className="pt-4 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <h4 className="text-sm font-bold text-rose-500 mb-3 uppercase tracking-wider">
                                        {formData.category.replace('_', ' ')} Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {DEBT_CATEGORY_RULES[formData.category].map((field) => (
                                            <div key={field.key} className="col-span-1">
                                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type={field.type}
                                                    value={formData.attributes[field.key] || ''}
                                                    onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full mt-4 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                {formLoading ? 'Saving...' : 'Save Debt'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Liability?</h3>
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