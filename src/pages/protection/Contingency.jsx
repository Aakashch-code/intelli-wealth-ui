import React, { useEffect, useState } from 'react';
import {
    ShieldCheck,
    AlertTriangle,
    Wallet,
    Hourglass,
    Activity,
    Loader2,
    CheckCircle2,
    Info,
    Target,
    TrendingUp
} from 'lucide-react';
import { fetchFinancialHealth } from "../../services/api.jsx";

// ============================================================================
// UTILS
// ============================================================================

const formatINR = (val) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val || 0);

// Helper: 6 Months is standard "100%" health
const calculateHealthScore = (months) => {
    if (!months) return 0;
    // Cap at 100 if > 6 months
    return Math.min(Math.round((months / 6) * 100), 100);
};

const getHealthColor = (months) => {
    if (months >= 6) return 'text-emerald-500'; // Healthy
    if (months >= 3) return 'text-amber-500';   // Moderate
    return 'text-red-500';                      // Critical
};

const getHealthLabel = (status) => {
    return (status || 'UNKNOWN').replace('_', ' ');
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function Contingency() {
    const [loading, setLoading] = useState(true);

    // Exact match to your JSON structure
    const [data, setData] = useState({
        totalMonthlyBurn: 0,
        totalLiquidAssets: 0,
        monthsOfRunway: 0,
        recommendedGap: 0,
        status: 'ANALYZING'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await fetchFinancialHealth();
            const resData = response.data || {};

            setData({
                totalMonthlyBurn: resData.totalMonthlyBurn || 0,
                totalLiquidAssets: resData.totalLiquidAssets || 0,
                monthsOfRunway: resData.monthsOfRunway || 0,
                recommendedGap: resData.recommendedGap || 0,
                status: resData.status || 'NO DATA'
            });
        } catch (error) {
            console.error("Error fetching contingency data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Derived Visual Calculations
    const healthScore = calculateHealthScore(data.monthsOfRunway);
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (healthScore / 100) * circumference;

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">

            {/* Header */}
            <div className="mb-10">
                <h2 className="text-4xl font-bold tracking-tight mb-2">Contingency Planning</h2>
                <p className="text-zinc-500 text-lg">Financial immunity and emergency preparedness</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- LEFT COLUMN: Health Gauge (Calculated) --- */}
                <div className="col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ShieldCheck className="w-40 h-40 text-white" />
                    </div>

                    <h3 className="text-zinc-500 uppercase tracking-widest font-bold text-sm mb-8">Immunity Score</h3>

                    {/* SVG Gauge */}
                    <div className="relative w-64 h-64 mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                            {/* Background Circle */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                stroke="#27272a"
                                strokeWidth="15"
                            />
                            {/* Progress Circle */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="15"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out ${getHealthColor(data.monthsOfRunway)}`}
                            />
                        </svg>

                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className={`text-6xl font-bold ${getHealthColor(data.monthsOfRunway)}`}>
                                {healthScore}
                            </span>
                            <span className="text-zinc-500 text-sm mt-1 font-medium">
                                / 100
                            </span>
                        </div>
                    </div>

                    <div className={`px-4 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-sm font-bold uppercase ${getHealthColor(data.monthsOfRunway)}`}>
                        {getHealthLabel(data.status)}
                    </div>
                </div>

                {/* --- RIGHT COLUMN: Metrics & Runway --- */}
                <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">

                    {/* Top Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Metric 1: Monthly Burn */}
                        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2 text-red-400">
                                <Activity className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Monthly Burn</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{formatINR(data.totalMonthlyBurn)}</div>
                        </div>

                        {/* Metric 2: Liquid Assets */}
                        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2 text-amber-500">
                                <Wallet className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Liquid Assets</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{formatINR(data.totalLiquidAssets)}</div>
                        </div>

                        {/* Metric 3: Gap / Shortfall */}
                        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2 text-blue-400">
                                <Target className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Gap to Goal</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {data.recommendedGap <= 0
                                    ? <span className="text-emerald-500 flex items-center gap-1 text-lg"><CheckCircle2 className="w-4 h-4"/> Fully Funded</span>
                                    : formatINR(data.recommendedGap)
                                }
                            </div>
                        </div>
                    </div>

                    {/* Runway Visualization */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex-1">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Hourglass className="w-5 h-5 text-amber-500" />
                                    Survival Runway
                                </h3>
                                <p className="text-zinc-500 text-sm mt-1">
                                    Time you can survive without income based on current burn.
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-bold text-white">{data.monthsOfRunway}</span>
                                <span className="text-zinc-500 text-sm ml-1">Months</span>
                            </div>
                        </div>

                        {/* Visual Bar */}
                        <div className="relative pt-6 pb-2">
                            <div className="flex justify-between text-xs font-bold text-zinc-600 mb-2 uppercase tracking-wider">
                                <span>0 Months</span>
                                <span>Target: 6 Months</span>
                                <span>12+ Months</span>
                            </div>

                            {/* Bar Track */}
                            <div className="h-6 w-full bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden relative">
                                {/* Fill */}
                                <div
                                    className={`h-full transition-all duration-1000 ease-out ${
                                        data.monthsOfRunway >= 6 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                            data.monthsOfRunway >= 3 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                                                'bg-gradient-to-r from-red-600 to-red-400'
                                    }`}
                                    style={{ width: `${Math.min(data.monthsOfRunway * (100/12), 100)}%` }}
                                ></div>

                                {/* Target Line Marker (at 50% assuming 12 month scale) */}
                                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 border-r border-black/50 border-dashed"></div>
                            </div>

                            {/* Context Message */}
                            <div className="mt-6 flex gap-3 items-start bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                {data.monthsOfRunway >= 6 ? (
                                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                )}
                                <div className="text-sm text-zinc-400">
                                    {data.monthsOfRunway >= 6
                                        ? "Excellent. Your emergency fund covers more than 6 months of expenses, providing strong financial immunity."
                                        : `You are short by ${formatINR(data.recommendedGap)}. Consider liquidating non-essential assets or increasing savings to reach the 6-month safety target.`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend / Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-sm">
                    <div className="flex items-center gap-2 mb-2 text-zinc-300 font-bold">
                        <TrendingUp className="w-4 h-4" />
                        <span>Calculation Logic</span>
                    </div>
                    Runway = Total Liquid Assets / Total Monthly Burn.
                    A healthy financial plan requires at least 6 months of runway to handle job loss or medical emergencies.
                </div>
                <div className="p-6 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-sm">
                    <div className="flex items-center gap-2 mb-2 text-zinc-300 font-bold">
                        <Info className="w-4 h-4" />
                        <span>What is Liquid?</span>
                    </div>
                    Assets categorized as 'CASH', 'SAVINGS', or 'FD' (Fixed Deposits) are automatically summed up to calculate your total liquid assets.
                </div>
            </div>
        </div>
    );
}