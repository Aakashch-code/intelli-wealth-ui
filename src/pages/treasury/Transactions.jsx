import React, { useEffect, useState, useCallback } from 'react';
import {
    ArrowUp, ArrowDown, Plus, Search, Filter, X, Edit2, Trash2, Wallet,
    ArrowUpRight, ArrowDownLeft, Loader2, ChevronDown, PiggyBank
} from 'lucide-react';

import {
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactionNetAmount
} from '../../services/api.jsx';

/* ===========================
   CONSTANTS & ENUMS
=========================== */
export const TRANSACTION_CATEGORIES = [
    'GROCERIES', 'RENT', 'UTILITIES', 'TRANSPORT', 'DINING',
    'ENTERTAINMENT', 'SHOPPING', 'HEALTHCARE', 'EDUCATION',
    'INVESTMENT', 'SALARY', 'OTHER'
];

export const TRANSACTION_SOURCES = [
    'UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING',
    'WALLET', 'CASH', 'BANK_TRANSFER', 'OTHER'
];

/* ===========================
   STYLING CONSTANTS
=========================== */
const INPUT_BASE = "w-full bg-zinc-900/30 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-white/30 focus:bg-zinc-900/80 focus:ring-4 focus:ring-white/5 transition-all duration-300 placeholder:text-zinc-600";

/* ===========================
   FORMATTERS
=========================== */
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

const formatEnumText = (text) => {
    if (!text) return '';
    return text
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/* ===========================
   STAT CARD
=========================== */
const StatCard = ({ label, value, type }) => {
    // Default styling (Net Position)
    let color = 'text-white-400 group-hover:text-cyan-300';
    let bg = 'bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25 group-hover:text-cyan-300';
    let Icon = PiggyBank ;

    if (type === 'INCOME') {
        color = 'text-white-400 group-hover:text-emerald-300';
        bg = 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25 group-hover:text-emerald-300';
        Icon = ArrowUpRight;
    }

    if (type === 'EXPENSE') {
        color = 'text-white-400 group-hover:text-rose-300';
        bg = 'bg-rose-500/15 text-rose-400 group-hover:bg-rose-500/25 group-hover:text-rose-300';
        Icon = ArrowDownLeft;
    }

    if (type === 'ALLOCATED') {
        color = 'text-white-400 group-hover:text-blue-300';
        bg = 'bg-blue-500/15 text-blue-400 group-hover:bg-blue-500/25 group-hover:text-blue-300';
        Icon = Wallet;
    }
    return (
        <div className="bg-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1.5 hover:border-zinc-700 hover:shadow-2xl hover:shadow-white/5 hover:bg-zinc-950/50">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl inline-block transition-all duration-300 group-hover:scale-110 ${bg}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-zinc-500 text-xs uppercase mb-1 font-medium group-hover:text-zinc-400 transition-colors">{label}</p>
                <p className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${color}`}>
                    {formatCurrency(value)}
                </p>
            </div>
        </div>
    );
};

/* ===========================
   MAIN COMPONENT
=========================== */
export default function Transactions() {
    /* -------------------------
       STATES
    ------------------------- */
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, totalAllocated: 0, netSavings: 0 });

    const [isLoading, setIsLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    /* -------------------------
       FORM
    ------------------------- */
    const initialForm = {
        type: 'EXPENSE', description: '', amount: '',
        category: 'OTHER', source: 'CASH',
        transactionDate: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState(initialForm);

    /* -------------------------
       FETCH DATA
    ------------------------- */
    const fetchDashboardStats = async () => {
        try {
            const res = await fetchTransactionNetAmount();
            const data = res.data || res;
            setStats({
                totalIncome: data.totalIncome || 0,
                totalExpense: data.totalExpense || 0,
                totalAllocated: data.totalAllocated || 0,
                netSavings: data.netSavings || 0
            });
        } catch (err) {
            console.error('API Error (Stats):', err);
        }
    };

    const fetchPageData = async (keyword, pageNumber) => {
        try {
            const res = await fetchTransactions(keyword, pageNumber, 20);
            const data = res.data || res;

            if (data && data.content) {
                if (pageNumber === 0) setTransactions(data.content);
                else setTransactions(prev => [...prev, ...data.content]);
                setPage(pageNumber);
                setHasMore(!data.last);
            } else {
                setTransactions(Array.isArray(data) ? data : []);
                setHasMore(false);
            }
        } catch (err) {
            console.error('API Error (List):', err);
        }
    };

    const loadInitialData = useCallback(async (keyword = '') => {
        setIsLoading(true);
        await Promise.all([fetchDashboardStats(), fetchPageData(keyword, 0)]);
        setIsLoading(false);
    }, []);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchPageData(searchKeyword, page + 1);
        setLoadingMore(false);
    };
    const TYPE_STYLES = {
        INCOME: 'text-emerald-400 group-hover:text-emerald-300',
        EXPENSE: 'text-red-600 group-hover:text-red-500',
        ALLOCATION: 'text-blue-400 group-hover:text-blue-300'
    };
    const TYPE_SYMBOL = {
        INCOME: '+',
        EXPENSE: '-',
        ALLOCATION: ''
    };
    /* -------------------------
       SEARCH DEBOUNCE
    ------------------------- */
    useEffect(() => {
        const timer = setTimeout(() => loadInitialData(searchKeyword), 500);
        return () => clearTimeout(timer);
    }, [searchKeyword, loadInitialData]);

    /* -------------------------
       HANDLERS
    ------------------------- */
    const openModal = (txn = null) => {
        if (txn) {
            setEditingId(txn.id);
            setFormData({
                type: txn.type, description: txn.description, amount: txn.amount,
                category: txn.category || 'OTHER', source: txn.source || 'CASH',
                transactionDate: txn.transactionDate ? new Date(txn.transactionDate).toISOString().split('T')[0] : ''
            });
        } else {
            setEditingId(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, amount: parseFloat(formData.amount) };
            if (editingId) await updateTransaction(editingId, payload);
            else await createTransaction(payload);
            setIsModalOpen(false);
            await loadInitialData(searchKeyword);
        } catch {
            alert('Failed to save transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await deleteTransaction(id);
            await loadInitialData(searchKeyword);
        } catch {
            alert('Failed to delete');
        }
    };

    /* ===========================
       RENDER
    ============================ */
    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-10 font-sans">
            {/* HEADER */}
            <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold mb-2 tracking-tight text-white">Transactions</h2>
                    <p className="text-zinc-500 text-lg">Overview of your financial activity</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Added Search Bar */}
                    <div className="relative group">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-white" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="w-full sm:w-64 bg-zinc-900/50 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-zinc-900 focus:ring-4 focus:ring-white/5 transition-all duration-300 placeholder:text-zinc-600"
                        />
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="group flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-95"
                    >
                        <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                        <span>Add Entry</span>
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div className="grid md:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Income" value={stats.totalIncome} type="INCOME" />
                <StatCard label="Total Expense" value={stats.totalExpense} type="EXPENSE" />
                <StatCard label="Total Stashes" value={stats.totalAllocated} type="ALLOCATED" />
                <StatCard label="Net Position" value={stats.netSavings} />
            </div>

            {/* LIST */}
            <div className="space-y-3 mt-8">
                <h3 className="text-xl font-semibold text-white mb-6 border-b border-white/5 pb-4">
                    Transaction History
                </h3>

                {isLoading && page === 0 ? (
                    <div className="h-40 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-16 flex flex-col justify-center items-center text-zinc-600 border-dashed border border-zinc-800 rounded-2xl bg-zinc-900/20">
                        <Filter size={32} className="mb-3 opacity-50" />
                        <p className="font-medium text-zinc-400">No transactions found</p>
                        <p className="text-sm mt-1">Try adjusting your search or add a new entry.</p>
                    </div>
                ) : (
                    transactions.map((txn) => {
                        const isIncome = txn.type === 'INCOME';
                        const isAllocated = txn.type === 'ALLOCATED';
                        return (
                            <div
                                key={txn.id}
                                className="group relative bg-zinc-900/30 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/70 hover:border-white/10 hover:shadow-xl hover:shadow-black/50 transition-all duration-300 overflow-hidden"
                            >
                                {/* Left Color Accent Bar */}
                                <div
                                    className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${
                                        isAllocated
                                            ? 'bg-cyan-500/40 group-hover:bg-cyan-400'
                                            : isIncome
                                                ? 'bg-emerald-500/40 group-hover:bg-emerald-400'
                                                : 'bg-rose-500/40 group-hover:bg-rose-400'
                                    }`}
                                />
                                <div className="flex items-center gap-4 pl-2">
                                    {/* Icon Container */}
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shadow-inner ${
                                            isAllocated
                                                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20'
                                                : isIncome
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20'
                                                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20'
                                    
                                    }`}>
                                        {isIncome ? (
                                            <ArrowUp size={20} strokeWidth={2.5} />
                                        ) : isAllocated ? (
                                            <Wallet size={20} strokeWidth={2.5} />
                                        ) : (
                                            <ArrowDown size={20} strokeWidth={2.5} />
                                        )}                                    </div>

                                    {/* Transaction Details */}
                                    <div>
                                        <p className="font-bold text-white text-lg group-hover:text-zinc-100 transition-colors">
                                            {txn.description}
                                        </p>
                                        <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1 font-medium tracking-wide">
                                            <span className="bg-black/50 px-2 py-0.5 rounded-md border border-white/5">
                                                {formatDate(txn.transactionDate)}
                                            </span>
                                            <span className="opacity-50">•</span>
                                            <span className="uppercase text-[10px] tracking-wider text-zinc-400">
                                                {formatEnumText(txn.category)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount & Actions */}
                                <div className="flex items-center justify-between sm:justify-end gap-6 pl-16 sm:pl-0">
                                    <span
                                       className={`font-mono text-xl font-bold tracking-tight transition-colors duration-300 ${
                                             TYPE_STYLES[txn.type] || 'text-blue-300'
                                       }`}
                                    >
                                        {TYPE_SYMBOL[txn.type]}{formatCurrency(txn.amount)}
                                    </span>

                                    {/* Reveal Actions on Hover */}
                                    <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:-translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                        <button
                                            onClick={() => openModal(txn)}
                                            className="p-2.5 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95 border border-white/5"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(txn.id)}
                                            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-500 hover:text-rose-400 transition-all hover:scale-105 active:scale-95 border border-rose-500/10"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {/* LOAD MORE BUTTON */}
            {hasMore && (
                <div className="mt-8 flex justify-center pb-8">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="group flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-full font-medium hover:bg-zinc-800 hover:border-zinc-600 hover:shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
                        <span>{loadingMore ? 'Loading...' : 'Load Older Transactions'}</span>
                    </button>
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingId ? 'Edit Transaction' : 'New Transaction'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Type Toggle */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/50 border border-white/5 rounded-xl mb-6">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'EXPENSE' })} className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${formData.type === 'EXPENSE' ? 'bg-zinc-800 text-rose-400 shadow-md ring-1 ring-white/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
                                    Expense
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'INCOME' })} className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${formData.type === 'INCOME' ? 'bg-zinc-800 text-emerald-400 shadow-md ring-1 ring-white/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
                                    Income
                                </button>
                            </div>

                            {/* Description */}
                            <div className="group">
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Description</label>
                                <input required placeholder="e.g. Salary, Groceries" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={INPUT_BASE} />
                            </div>

                            {/* Amount & Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Amount</label>
                                    <input required type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className={`${INPUT_BASE} font-mono`} />
                                </div>
                                <div className="group">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Date</label>
                                    <input required type="date" value={formData.transactionDate} onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })} className={`${INPUT_BASE} scheme-dark cursor-pointer`} />
                                </div>
                            </div>

                            {/* Category & Source */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Category</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className={`${INPUT_BASE} appearance-none cursor-pointer`}
                                    >
                                        {TRANSACTION_CATEGORIES.map(category => (
                                            <option key={category} value={category} className="bg-zinc-900 text-white">
                                                {formatEnumText(category)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="group">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block group-focus-within:text-zinc-300 transition-colors">Source</label>
                                    <select
                                        required
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className={`${INPUT_BASE} appearance-none cursor-pointer`}
                                    >
                                        {TRANSACTION_SOURCES.map(source => (
                                            <option key={source} value={source} className="bg-zinc-900 text-white">
                                                {formatEnumText(source)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black py-3.5 rounded-xl font-bold mt-6 hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom keyframes for smooth modal entry */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}} />
        </div>
    );
}