import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Building2,
    CreditCard,
    ArrowRight,
    Loader2,
    Activity
} from 'lucide-react';
import {
    fetchNetWorth,
    allAssetsAmount,
    fetchDebtStats,
    fetchAssets,
    fetchDebts
} from "../../services/api.jsx";

// ============================================================================
// UTILS
// ============================================================================

const formatINR = (val) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val || 0);

const calculatePercentage = (part, total) => {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100);
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function NetWorth() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Financial State
    const [financials, setFinancials] = useState({
        netWorth: 0,
        totalAssets: 0,
        totalDebt: 0
    });

    // Lists for "Top Movers" preview
    const [topAssets, setTopAssets] = useState([]);
    const [topDebts, setTopDebts] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Parallel Fetch for maximum speed
            const [
                netWorthRes,
                assetsTotalRes,
                debtStatsRes,
                assetsListRes,
                debtsListRes
            ] = await Promise.all([
                fetchNetWorth(),
                allAssetsAmount(),
                fetchDebtStats(),
                fetchAssets(),
                fetchDebts()
            ]);

            // Handle potential data shapes (object vs raw number)
            const netWorthVal = typeof netWorthRes.data === 'object' ? netWorthRes.data.netWorth : netWorthRes.data;
            const assetTotalVal = typeof assetsTotalRes.data === 'object' ? assetsTotalRes.data.totalValue : assetsTotalRes.data;

            // For debts, we specifically want "totalOutstandingAmount"
            const debtTotalVal = debtStatsRes.data?.totalOutstandingAmount || 0;

            setFinancials({
                netWorth: netWorthVal || 0,
                totalAssets: assetTotalVal || 0,
                totalDebt: debtTotalVal || 0
            });

            // Process Top 3 Assets (Sort by highest value)
            const sortedAssets = (assetsListRes.data || [])
                .sort((a, b) => (b.currentValue || b.value) - (a.currentValue || a.value))
                .slice(0, 3);
            setTopAssets(sortedAssets);

            // Process Top 3 Debts (Sort by highest outstanding)
            const sortedDebts = (debtsListRes.data || [])
                .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
                .slice(0, 3);
            setTopDebts(sortedDebts);

        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Derived Math for Visuals ---
    const totalVolume = financials.totalAssets + financials.totalDebt;
    const assetPercent = calculatePercentage(financials.totalAssets, totalVolume);
    const debtPercent = calculatePercentage(financials.totalDebt, totalVolume);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">

            {/* Header */}
            <div className="mb-10">
                <h2 className="text-4xl font-bold tracking-tight mb-2">Net Worth</h2>
                <p className="text-zinc-500 text-lg">Your financial health summary</p>
            </div>

            {/* --- HERO SECTION: The Big Numbers --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

                {/* 1. Net Worth (Main KPI) */}
                <div className="col-span-1 md:col-span-3 lg:col-span-1 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Wallet className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">Net Worth</span>
                        </div>
                        <div className="text-5xl font-bold text-white tracking-tight">
                            {formatINR(financials.netWorth)}
                        </div>
                        <p className="mt-4 text-zinc-500 text-sm">
                            Assets minus Liabilities
                        </p>
                    </div>
                </div>

                {/* 2. Total Assets */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold bg-zinc-950 px-3 py-1 rounded-full text-zinc-500 border border-zinc-800">ASSETS</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white block mb-1">{formatINR(financials.totalAssets)}</span>
                        <span className="text-sm text-zinc-500">Total Asset Value</span>
                    </div>
                </div>

                {/* 3. Total Liabilities */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between group hover:border-rose-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold bg-zinc-950 px-3 py-1 rounded-full text-zinc-500 border border-zinc-800">DEBTS</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white block mb-1">{formatINR(financials.totalDebt)}</span>
                        <span className="text-sm text-zinc-500">Outstanding Debt</span>
                    </div>
                </div>
            </div>

            {/* --- RATIO BAR (Assets vs Debt) --- */}
            <div className="mb-12">
                <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Composition</span>
                    <div className="flex gap-4 text-xs font-mono">
                        <span className="text-emerald-500">{assetPercent}% Assets</span>
                        <span className="text-rose-500">{debtPercent}% Debt</span>
                    </div>
                </div>
                {/* The Bar */}
                <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                        style={{ width: `${assetPercent}%` }}
                    />
                    <div
                        className="h-full bg-rose-500 transition-all duration-1000 ease-out"
                        style={{ width: `${debtPercent}%` }}
                    />
                </div>
            </div>

            {/* --- LISTS GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Top Assets */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-500" />
                            Largest Assets
                        </h3>

                        <button
                            onClick={() => navigate("/assets")}
                            className="text-sm text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {topAssets.length > 0 ? (
                            topAssets.map(asset => (
                                <div key={asset.id} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-white">{asset.name}</div>
                                        <div className="text-xs text-zinc-500 uppercase font-bold mt-1">{asset.category?.replace('_', ' ')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-emerald-400">{formatINR(asset.currentValue || asset.value)}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-zinc-600 italic text-sm py-4">No assets recorded yet.</div>
                        )}
                    </div>
                </div>

                {/* Top Debts */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-rose-500" />
                            Highest Liabilities
                        </h3>
                        <button
                            onClick={() => navigate("/debt")}
                            className="text-sm text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {topDebts.length > 0 ? (
                            topDebts.map(debt => (
                                <div key={debt.id} className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-white">{debt.name}</div>
                                        <div className="text-xs text-zinc-500 uppercase font-bold mt-1">{debt.category?.replace('_', ' ')}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-rose-400">{formatINR(debt.outstandingAmount)}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-zinc-600 italic text-sm py-4">Debt free! No records found.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}