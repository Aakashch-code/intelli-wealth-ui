import React, { useEffect, useState, useCallback } from 'react';
import {
    ArrowUp, ArrowDown, Plus, Search, Filter, X, Edit2, Trash2,
    Wallet, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

// API Imports
import {
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactionNetAmount
} from '../../services/api.jsx';

// ============================================================================
// FORMATTERS (Strictly Presentation Only)
// ============================================================================

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount || 0);

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

// ============================================================================
// COMPONENTS
// ============================================================================

const StatCard = ({ label, value, type }) => {
    let colorClass = 'text-white';
    let bgClass = 'bg-zinc-900';
    let Icon = Wallet;

    if (type === 'INCOME') {
        colorClass = 'text-emerald-400';
        bgClass = 'bg-emerald-500/10 text-emerald-400';
        Icon = ArrowUpRight;
    } else if (type === 'EXPENSE') {
        colorClass = 'text-rose-400';
        bgClass = 'bg-rose-500/10 text-rose-400';
        Icon = ArrowDownLeft;
    }

    return (
        <div className="bg-black border border-white/10 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${bgClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>
                    {formatCurrency(value)}
                </p>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function Transactions() {
    // --- Data State (Directly populated from API) ---
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0
    });

    // --- UI State ---
    const [isLoading, setIsLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null); // If null, mode is CREATE

    // --- Form State ---
    const initialFormState = {
        type: 'EXPENSE', // Default to Java Enum Value
        description: '',
        amount: '',
        category: 'OTHER',
        source: 'CASH',
        transactionDate: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState(initialFormState);

    // --- Data Fetching ---

    const refreshData = useCallback(async (keyword = '') => {
        setIsLoading(true);
        try {
            // Execute in parallel: Get List AND Get Calculated Totals
            const [listResponse, statsResponse] = await Promise.all([
                fetchTransactions(keyword),      // Server handles filtering & sorting
                fetchTransactionNetAmount()      // Server handles summation
            ]);

            setTransactions(listResponse.data || []);
            setStats(statsResponse.data || { totalIncome: 0, totalExpense: 0, netSavings: 0 });
        } catch (error) {
            console.error("API Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial Load & Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            refreshData(searchKeyword);
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [searchKeyword, refreshData]);

    // --- Handlers ---

    const handleOpenModal = (txn = null) => {
        if (txn) {
            setEditingId(txn.id);
            setFormData({
                type: txn.type,
                description: txn.description,
                amount: txn.amount,
                category: txn.category || 'OTHER',
                source: txn.source || 'CASH',
                transactionDate: txn.transactionDate
            });
        } else {
            setEditingId(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Payload matches Java DTO exactly
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount) // Ensure Number format
            };

            if (editingId) {
                await updateTransaction(editingId, payload);
            } else {
                await createTransaction(payload);
            }

            setIsModalOpen(false);
            refreshData(searchKeyword); // Reload data from server
        } catch (error) {
            alert("Failed to save transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteTransaction(id);
            refreshData(searchKeyword); // Reload data from server
        } catch (error) {
            alert("Failed to delete");
        }
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-10 font-sans">

            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Transactions</h2>
                    <p className="text-zinc-500">Overview of your financial activity</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-bold hover:bg-zinc-200 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Entry
                </button>
            </div>

            {/* Server-Side Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatCard label="Total Income" value={stats.totalIncome} type="INCOME" />
                <StatCard label="Total Expense" value={stats.totalExpense} type="EXPENSE" />
                <StatCard label="Net Position" value={stats.netSavings} type="NET" />
            </div>

            {/* Search / Filter Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                />
            </div>

            {/* Transaction List */}
            <div className="bg-black border border-white/10 rounded-2xl overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                        <Filter className="w-8 h-8 mb-3 opacity-50" />
                        <p>No transactions found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-900">
                        {transactions.map((txn) => (
                            <div key={txn.id} className="p-4 hover:bg-zinc-900/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                                        txn.type === 'INCOME'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                            : 'bg-rose-500/10 border-rose-500/20 text-white'
                                    }`}>
                                        {txn.type === 'INCOME' ? <ArrowUp className="w-4 h-4"/> : <ArrowDown className="w-4 h-4"/>}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{txn.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                            <span>{formatDate(txn.transactionDate)}</span>
                                            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                            <span className="uppercase">{txn.category}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <span className={`font-mono font-bold ${
                                        txn.type === 'INCOME' ? 'text-emerald-400' : 'text-white'
                                    }`}>
                                        {txn.type === 'INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
                                    </span>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenModal(txn)}
                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(txn.id)}
                                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingId ? 'Edit Transaction' : 'New Transaction'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Type Toggle */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl">
                                {['EXPENSE', 'INCOME'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: t })}
                                        className={`py-2 text-sm font-bold rounded-lg transition-all ${
                                            formData.type === t
                                                ? (t === 'INCOME' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-rose-900/40 text-rose-400')
                                                : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({...formData, amount: e.target.value})}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-white/20 outline-none"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-white/20 outline-none"
                                    placeholder="e.g. Grocery"
                                />
                            </div>

                            {/* Date & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.transactionDate}
                                        onChange={e => setFormData({...formData, transactionDate: e.target.value})}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none scheme-dark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none appearance-none"
                                    >
                                        <option value="GROCERIES">Groceries</option>
                                        <option value="RENT">Rent</option>
                                        <option value="SALARY">Salary</option>
                                        <option value="INVESTMENT">Investment</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 mt-4 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : 'Save Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}