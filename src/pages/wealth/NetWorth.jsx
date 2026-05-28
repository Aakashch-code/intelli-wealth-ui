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
    fetchDebts,
    fetchMainCategoryTotals,
    fetchEmiStats
} from "../../services/api.jsx";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

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

// Chart Colors
const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

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

    // Chart & List States
    const [topAssets, setTopAssets] = useState([]);
    const [topDebts, setTopDebts] = useState([]);
    const [assetCategories, setAssetCategories] = useState([]);
    const [emiData, setEmiData] = useState([]); // Will hold the 5-month array

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Parallel Fetch
            const [
                netWorthRes,
                assetsTotalRes,
                debtStatsRes,
                assetsListRes,
                debtsListRes,
                assetCategoryRes,
                emiStatsRes
            ] = await Promise.all([
                fetchNetWorth(),
                allAssetsAmount(),
                fetchDebtStats(),
                fetchAssets(),
                fetchDebts(),
                fetchMainCategoryTotals().catch(() => ({ data: {} })),
                fetchEmiStats().catch(() => ({ data: [] })) // Default to empty array if fails
            ]);

            // 1. Core Financials
            const netWorthVal = typeof netWorthRes.data === 'object' ? netWorthRes.data.netWorth : netWorthRes.data;
            const assetTotalVal = typeof assetsTotalRes.data === 'object' ? assetsTotalRes.data.totalValue : assetsTotalRes.data;
            const debtTotalVal = debtStatsRes.data?.totalOutstandingAmount || 0;

            setFinancials({
                netWorth: netWorthVal || 0,
                totalAssets: assetTotalVal || 0,
                totalDebt: debtTotalVal || 0
            });

            // 2. Safely extract arrays for Lists
            const assetsArray = Array.isArray(assetsListRes.data)
                ? assetsListRes.data
                : (assetsListRes.data?.content || assetsListRes.data?.data || []);

            const debtsArray = Array.isArray(debtsListRes.data)
                ? debtsListRes.data
                : (debtsListRes.data?.content || debtsListRes.data?.data || []);

            // 3. Process Top 5 Assets
            const sortedAssets = [...assetsArray]
                .sort((a, b) => (b.currentValue || b.value || 0) - (a.currentValue || a.value || 0))
                .slice(0, 5);
            setTopAssets(sortedAssets);

            // 4. Process Top 5 Debts
            const sortedDebts = [...debtsArray]
                .sort((a, b) => (b.outstandingAmount || 0) - (a.outstandingAmount || 0))
                .slice(0, 5);
            setTopDebts(sortedDebts);

            // 5. Extract Object for Categories
            let formattedCategories = [];
            const catData = assetCategoryRes.data;
            if (catData && typeof catData === 'object' && !Array.isArray(catData)) {
                formattedCategories = Object.entries(catData).map(([key, value]) => ({
                    name: key,
                    value: Number(value)
                }));
            } else if (Array.isArray(catData)) {
                formattedCategories = catData.map(item => ({
                    name: item.mainCategory || item.category || item.name || 'Unknown',
                    value: Number(item.totalValue || item.totalAmount || item.value || 0)
                }));
            }
            setAssetCategories(formattedCategories);

            // 6. Extract Real Data for EMI (Handling the 5-month response)
            let parsedEmi = [];
            const rawEmi = emiStatsRes.data;

            // Handles if API returns { "Jan": 2000, "Feb": 5000 }
            if (rawEmi && typeof rawEmi === 'object' && !Array.isArray(rawEmi)) {
                parsedEmi = Object.entries(rawEmi).map(([key, value]) => ({
                    name: key,
                    value: Number(value)
                }));
            }
            // Handles if API returns [{ month: "Jan", amount: 2000 }, { month: "Feb", amount: 5000 }]
            else if (Array.isArray(rawEmi)) {
                parsedEmi = rawEmi.map(item => ({
                    name: item.month || item.category || item.name || 'Unknown',
                    value: Number(item.amount || item.emi || item.value || 0)
                }));
            }
            setEmiData(parsedEmi);

        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate current EMI for the badge (Grabs the value of the last month in the array)
    const currentEmiTotal = emiData.length > 0 ? emiData[emiData.length - 1].value : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans selection:bg-zinc-800">

            {/* Header */}
            <div className="mb-10">
                <h2 className="text-4xl font-bold tracking-tight mb-2">Net Worth</h2>
                <p className="text-zinc-500 text-lg">Your financial health summary</p>
            </div>

            {/* --- STAT CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

                {/* 1. Net Worth */}
                <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.07)] hover:shadow-[0_0_30px_rgba(99,102,241,0.12)] transition-shadow duration-300">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Wallet className="w-32 h-32 text-indigo-500" />
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
                        <p className="mt-4 text-zinc-600 text-sm">Assets minus Liabilities</p>
                    </div>
                </div>

                {/* 2. Total Assets */}
                <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-shadow duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold bg-[#0a0a0a] px-3 py-1 rounded-full text-zinc-500 border border-[#222]">ASSETS</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white block mb-1">{formatINR(financials.totalAssets)}</span>
                        <span className="text-sm text-zinc-600">Total Asset Value</span>
                    </div>
                </div>

                {/* 3. Total Liabilities */}
                <div className="bg-black border border-[#1a1a1a] rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_20px_rgba(244,63,94,0.05)] hover:shadow-[0_0_30px_rgba(244,63,94,0.1)] transition-shadow duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold bg-[#0a0a0a] px-3 py-1 rounded-full text-zinc-500 border border-[#222]">DEBTS</span>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-white block mb-1">{formatINR(financials.totalDebt)}</span>
                        <span className="text-sm text-zinc-600">Outstanding Amount</span>
                    </div>
                </div>
            </div>

            {/* --- CHARTS SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

                {/* Asset Pie Chart */}
                <div className="bg-black border border-[#1a1a1a] rounded-3xl p-6 shadow-[0_0_15px_rgba(255,255,255,0.02)] min-w-0 flex flex-col">
                    <h3 className="text-lg font-bold mb-6 text-zinc-200">Asset Composition</h3>

                    {assetCategories.length > 0 ? (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 flex-1">
                            {/* LEFT SIDE: The Chart */}
                            <div className="h-[260px] min-h-[260px] w-full md:w-1/2">
                                <ResponsiveContainer width="99%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={assetCategories}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            stroke="none"
                                        >
                                            {assetCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value) => formatINR(value)}
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#222', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff', textTransform: 'capitalize' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* RIGHT SIDE: Custom Info / Legend */}
                            <div className="w-full md:w-1/2 space-y-3 max-h-[260px] overflow-y-auto pr-2">
                                {assetCategories.map((category, index) => {
                                    const percent = calculatePercentage(category.value, financials.totalAssets);

                                    return (
                                        <div key={index} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] hover:border-zinc-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                                />
                                                <span className="text-sm font-medium text-zinc-300 capitalize">
                                                    {category.name.toLowerCase()}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-white">
                                                    {formatINR(category.value)}
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                                                    {percent}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center text-zinc-600 italic text-sm">
                            No category data available.
                        </div>
                    )}
                </div>

                {/* Debt EMI Trend Chart (Point Style) */}
                <div className="bg-black border border-[#1a1a1a] rounded-3xl p-6 shadow-[0_0_15px_rgba(255,255,255,0.02)] min-w-0 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-zinc-200">Total EMI Trend</h3>
                        <span className="text-xs font-bold bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full border border-rose-500/20">
                            Current: {formatINR(currentEmiTotal)}
                        </span>
                    </div>

                    {emiData.length > 0 ? (
                        <div className="h-[260px] min-h-[260px] w-full">
                            <ResponsiveContainer width="99%" height={260}>
                                <LineChart data={emiData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                                    <XAxis
                                        dataKey="name" // Mapped dynamically to the month string from your API
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `₹${(val / 1000)}k`}
                                        dx={-10}
                                    />
                                    <RechartsTooltip
                                        formatter={(value) => formatINR(value)}
                                        contentStyle={{ backgroundColor: '#000', borderColor: '#222', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value" // Mapped dynamically to the amount from your API
                                        stroke="#f43f5e"
                                        strokeWidth={3}
                                        dot={{ r: 6, fill: '#000', stroke: '#f43f5e', strokeWidth: 3 }}
                                        activeDot={{ r: 8, fill: '#f43f5e', stroke: 'none' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center text-zinc-600 italic text-sm">
                            No EMI data available.
                        </div>
                    )}
                </div>
            </div>

            {/* --- LISTS GRID (Top 5) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Assets */}
                <div className="bg-black border border-[#1a1a1a] rounded-3xl p-6 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-500" />
                            Greatest Assets
                        </h3>
                        <button
                            onClick={() => navigate("/assets")}
                            className="text-sm text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            View All <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {topAssets.length > 0 ? (
                            topAssets.map((asset, i) => (
                                <div key={asset.id || i} className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-xl flex justify-between items-center hover:border-zinc-800 transition-colors">
                                    <div>
                                        <div className="font-bold text-white">{asset.name}</div>
                                        <div className="text-xs text-zinc-600 uppercase font-bold mt-1">
                                            {asset.category?.replace('_', ' ') || 'Uncategorized'}
                                        </div>
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
                <div className="bg-black border border-[#1a1a1a] rounded-3xl p-6 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
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
                    <div className="space-y-3">
                        {topDebts.length > 0 ? (
                            topDebts.map((debt, i) => (
                                <div key={debt.id || i} className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded-xl flex justify-between items-center hover:border-zinc-800 transition-colors">
                                    <div>
                                        <div className="font-bold text-white">{debt.name}</div>
                                        <div className="text-xs text-zinc-600 uppercase font-bold mt-1">
                                            {debt.category?.replace('_', ' ') || 'Uncategorized'}
                                        </div>
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