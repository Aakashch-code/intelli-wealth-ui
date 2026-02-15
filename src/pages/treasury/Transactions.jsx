import React, { useEffect, useState, useCallback } from 'react';
import {
    ArrowUp, ArrowDown, Plus, Search, Filter, X, Edit2, Trash2, Wallet,
    ArrowUpRight, ArrowDownLeft, Loader2, ChevronDown
} from 'lucide-react';

import {
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactionNetAmount
} from '../../services/api.jsx';

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

/* ===========================
   STAT CARD
=========================== */
const StatCard = ({ label, value, type }) => {
    let color = 'text-white';
    let bg = 'bg-zinc-900';
    let Icon = Wallet;

    if (type === 'INCOME') {
        color = 'text-emerald-400';
        bg = 'bg-emerald-500/10 text-emerald-400';
        Icon = ArrowUpRight;
    }

    if (type === 'EXPENSE') {
        color = 'text-rose-400';
        bg = 'bg-rose-500/10 text-rose-400';
        Icon = ArrowDownLeft;
    }

    return (
        <div className="bg-black border border-white/10 rounded-2xl p-6">
            <div className="mb-4">
                <div className={`p-2.5 rounded-lg inline-block ${bg}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-zinc-500 text-xs uppercase mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>
                {formatCurrency(value)}
            </p>
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
    // Pagination Data
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    // Server Stats
    const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, netSavings: 0 });

    // UI States
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
        type: 'EXPENSE', description: '', amount: '', category: 'OTHER',
        source: 'CASH', transactionDate: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState(initialForm);

    /* -------------------------
       FETCH DATA
    ------------------------- */
    const fetchDashboardStats = async () => {
        try {
            const res = await fetchTransactionNetAmount();
            const data = res.data || res;

            // Safely map the Spring Boot JSON exactly to the React state
            setStats({
                totalIncome: data.totalIncome || 0,
                totalExpense: data.totalExpense || 0,
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
                if (pageNumber === 0) {
                    setTransactions(data.content); // Replace list on new search or init
                } else {
                    setTransactions(prev => [...prev, ...data.content]); // Append on Load More
                }
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
        await Promise.all([
            fetchDashboardStats(),
            fetchPageData(keyword, 0)
        ]);
        setIsLoading(false);
    }, []);

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchPageData(searchKeyword, page + 1);
        setLoadingMore(false);
    };

    /* -------------------------
       SEARCH DEBOUNCE
    ------------------------- */
    // This effect handles BOTH the initial mount load AND typing in the search bar
    useEffect(() => {
        const timer = setTimeout(() => {
            loadInitialData(searchKeyword);
        }, 500);
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
            if (editingId) {
                await updateTransaction(editingId, payload);
            } else {
                await createTransaction(payload);
            }
            setIsModalOpen(false);
            await loadInitialData(searchKeyword); // Reload from page 0 to show changes
        } catch {
            alert('Failed to save transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteTransaction(id);
            await loadInitialData(searchKeyword); // Reload from page 0
        } catch {
            alert('Failed to delete');
        }
    };

    /* ===========================
       RENDER
    ============================ */
    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-10">

            {/* HEADER */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold mb-2 tracking-tight">Transactions</h2>
                    <p className="text-zinc-500 text-lg">Overview of your financial activity</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
                >
                    <Plus size={18} /> Add Entry
                </button>
            </div>

            {/* STATS */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
                <StatCard label="Total Income" value={stats.totalIncome} type="INCOME" />
                <StatCard label="Total Expense" value={stats.totalExpense} type="EXPENSE" />
                <StatCard label="Net Position" value={stats.netSavings} />
            </div>

            {/* SEARCH */}
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search transactions..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-11 py-3.5 text-white outline-none focus:border-white/20 transition-colors placeholder:text-zinc-600"
                />
            </div>

            {/* LIST */}
            <div className="bg-black border border-white/10 rounded-2xl overflow-hidden">
                {isLoading && page === 0 ? (
                    <div className="h-64 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="h-64 flex flex-col justify-center items-center text-zinc-600 border-dashed border border-zinc-800 m-4 rounded-xl bg-zinc-900/20">
                        <Filter size={32} className="mb-3 opacity-50" />
                        <p className="font-medium">No transactions found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {transactions.map((txn) => (
                            <div key={txn.id} className="p-5 flex justify-between items-center hover:bg-zinc-900/40 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${txn.type === 'INCOME' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                        {txn.type === 'INCOME' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-base">{txn.description}</p>
                                        <div className="text-xs text-zinc-500 flex gap-2 mt-1 font-medium tracking-wide">
                                            <span>{formatDate(txn.transactionDate)}</span>
                                            <span>•</span>
                                            <span>{txn.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className={`font-mono text-lg font-bold ${txn.type === 'INCOME' ? 'text-emerald-400' : 'text-white'}`}>
                                        {txn.type === 'INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(txn)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(txn.id)} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* LOAD MORE BUTTON */}
            {hasMore && (
                <div className="mt-8 flex justify-center pb-8">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-full font-medium hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{loadingMore ? 'Loading...' : 'Load Older Transactions'}</span>
                    </button>
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingId ? 'Edit Transaction' : 'New Transaction'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* NEW: Type Toggle */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl mb-4">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'EXPENSE' })} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'EXPENSE' ? 'bg-zinc-800 text-rose-400 shadow-sm' : 'text-zinc-500 hover:text-white'}`}>
                                    Expense
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'INCOME' })} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'INCOME' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-white'}`}>
                                    Income
                                </button>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Description</label>
                                <input required placeholder="e.g. Salary, Groceries" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-zinc-900/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-white/20" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Amount</label>
                                    <input required type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-zinc-900/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-white/20 font-mono" />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Date</label>
                                    <input required type="date" value={formData.transactionDate} onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })} className="w-full bg-zinc-900/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-white/20 scheme-dark" />
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black py-3.5 rounded-xl font-bold mt-4 hover:bg-zinc-200 transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}