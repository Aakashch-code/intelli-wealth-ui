import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard,
    Target,
    Receipt,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    Activity,
    Trophy,
    PieChart,
    Landmark
} from 'lucide-react';

// Import services
import {
    fetchGoals,
    fetchSubscriptions,
    fetchTransactions,
    fetchAssets,
    fetchNetWorth,
    fetchGoalStats,
    fetchTransactionNetAmount,
    fetchDebts
} from '../services/api';

// ============================================================================
// UTILS & STYLES
// ============================================================================

const BORDER_STYLE = 'border border-white/10';
const CARD_BASE = `bg-black ${BORDER_STYLE} rounded-2xl transition-all duration-300`;

// HELPER: Forces any input (null, undefined, string, NaN) to a valid number or 0
const safeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

const formatMoney = (val) =>
    `₹${safeNumber(val).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}`;

const unwrap = (res) => (res && res.data ? res.data : res || []);

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StatCard = ({ icon: Icon, title, value, subtitle, badge, colorTheme = 'emerald' }) => {
    const themes = {
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/50', glow: 'hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]' },
        rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'hover:border-rose-500/50',    glow: 'hover:shadow-[0_0_30px_-10px_rgba(244,63,94,0.3)]' },
        violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'hover:border-violet-500/50',  glow: 'hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)]' },
        amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'hover:border-amber-500/50',   glow: 'hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]' },
        blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'hover:border-blue-500/50',    glow: 'hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]' }
    };

    const theme = themes[colorTheme] || themes.emerald;

    return (
        <div className={`${CARD_BASE} p-6 ${theme.border} ${theme.glow} group cursor-pointer relative overflow-hidden`}>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-2.5 rounded-lg ${theme.bg} ${theme.text}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-800 px-2 py-1 rounded-md">
                        {badge}
                    </span>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide">{title}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            </div>
            <div className="mt-4 flex items-center text-xs text-zinc-500">{subtitle}</div>
        </div>
    );
};

const TransactionRow = ({ transaction }) => {
    const type = (transaction.type || '').toLowerCase();
    const isIncome = type === 'income';
    const Icon = isIncome ? ArrowUp : ArrowDown;
    const dateStr = transaction.date || transaction.createdAt;

    return (
        <div className="group flex items-center justify-between p-4 hover:bg-zinc-900/50 rounded-xl transition-colors border border-transparent hover:border-zinc-800 cursor-pointer">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center bg-black ${isIncome ? 'group-hover:border-emerald-500/30' : 'group-hover:border-rose-500/30'} transition-colors`}>
                    <Icon className={`w-4 h-4 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-white group-hover:text-zinc-200 transition-colors">
                        {transaction.description || 'Untitled Transaction'}
                    </p>
                    <p className="text-xs text-zinc-600">
                        {dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '-'}
                    </p>
                </div>
            </div>
            <span className={`font-mono font-medium ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
            </span>
        </div>
    );
};

const GoalBar = ({ goal }) => {
    const current = safeNumber(goal.currentAmount || goal.savedAmount);
    const target = safeNumber(goal.targetAmount);
    // Prevent division by zero if target is missing
    const safeTarget = target === 0 ? 1 : target;

    const percentage = Math.min(100, Math.round((current / safeTarget) * 100));

    return (
        <div className="group p-4 border border-zinc-900 hover:border-zinc-700 bg-zinc-950/30 rounded-xl transition-all">
            <div className="flex justify-between items-end mb-3">
                <div>
                    <h4 className="text-sm font-medium text-white mb-1">{goal.name}</h4>
                    <p className="text-xs text-zinc-500">
                        Target: <span className="text-zinc-300">{formatMoney(target)}</span>
                    </p>
                </div>
                <span className={`text-xs font-mono px-2 py-1 rounded ${percentage >= 100 ? 'text-emerald-400 bg-emerald-900/20' : 'text-blue-400 bg-blue-900/20'}`}>
                    {percentage}%
                </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ease-out ${percentage >= 100 ? 'bg-emerald-400' : 'bg-blue-500'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const FinanceItemRow = ({ item, type = 'asset' }) => {
    const isDebt = type === 'debt';
    const Icon = isDebt ? CreditCard : PieChart;
    const value = safeNumber(item.value || item.currentValue || item.amount);

    return (
        <div className="flex items-center justify-between p-3 hover:bg-zinc-900/50 rounded-lg transition-colors border border-transparent hover:border-zinc-800 group">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded bg-zinc-900 flex items-center justify-center ${isDebt ? 'text-rose-400' : 'text-emerald-400'} group-hover:text-white transition-colors`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-200">{item.name || item.institution || 'Unnamed Item'}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.category || item.type || type}</p>
                </div>
            </div>
            <p className="text-sm font-mono text-white">{formatMoney(value)}</p>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [dashboardData, setDashboardData] = useState({
        netWorth: 0,
        netAmount: 0,
        activeSubscriptions: 0,
        subscriptionCost: 0,
        goalStats: { completed: 0, total: 0 },
        recentTransactions: [],
        goals: [],
        assets: [],
        debts: [],
        grossAssets: 0
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Lists & Basics
            const [
                txnsRes,
                goalsRes,
                assetsRes,
                debtsRes,
                subsRes
            ] = await Promise.all([
                fetchTransactions().catch(e => []), // Catch individual failures
                fetchGoals().catch(e => []),
                fetchAssets().catch(e => []),
                fetchDebts().catch(e => []),
                fetchSubscriptions().catch(e => [])
            ]);

            // 2. Fetch Summaries & Analytics
            const [
                netWorthRes,
                txnSummaryRes,
                goalStatsRes
            ] = await Promise.allSettled([
                fetchNetWorth(),
                fetchTransactionNetAmount(),
                fetchGoalStats()
            ]);

            // --- Process Lists (Unwrap safely) ---
            const txns = unwrap(txnsRes);
            const goals = unwrap(goalsRes);
            const assets = unwrap(assetsRes);
            const debts = unwrap(debtsRes);
            const subs = unwrap(subsRes);

            // --- Robust Calculations (No NaN) ---

            // 1. Debts Total
            const totalDebtsValue = Array.isArray(debts)
                ? debts.reduce((acc, curr) => acc + safeNumber(curr.amount || curr.value), 0)
                : 0;

            // 2. Assets Total (From List)
            let totalAssetsFromList = Array.isArray(assets)
                ? assets.reduce((acc, curr) => acc + safeNumber(curr.value || curr.amount || curr.currentValue), 0)
                : 0;

            // 3. Net Worth (Prefer API, Strict Fallback)
            let netWorth = 0;
            if (netWorthRes.status === 'fulfilled') {
                const nwData = unwrap(netWorthRes.value);
                // Handle if nwData is an object { netWorth: 1000 } or just a number 1000
                const rawVal = nwData?.netWorth !== undefined ? nwData.netWorth : nwData;
                netWorth = safeNumber(rawVal);
            } else {
                // Fallback: Assets - Debts
                netWorth = totalAssetsFromList - totalDebtsValue;
            }

            // 4. Gross Assets (Assets = Net Worth + Liabilities)
            let grossAssets = totalAssetsFromList;
            if (grossAssets === 0 && netWorth !== 0) {
                grossAssets = netWorth + totalDebtsValue;
            }
            grossAssets = safeNumber(grossAssets);

            // 5. Cash Flow (Net Amount)
            let netAmount = 0;
            if (txnSummaryRes.status === 'fulfilled') {
                const data = unwrap(txnSummaryRes.value);
                if (data?.balance !== undefined) netAmount = safeNumber(data.balance);
                else if (typeof data === 'number') netAmount = data;
                else netAmount = 0; // Ensure it doesn't stay undefined
            }

            // Fallback for Cash Flow if API returned 0 or failed, try calculating manually
            if (netAmount === 0 && Array.isArray(txns) && txns.length > 0) {
                const income = txns
                    .filter(t => (t.type || '').toLowerCase() === 'income')
                    .reduce((acc, t) => acc + safeNumber(t.amount), 0);
                const expense = txns
                    .filter(t => (t.type || '').toLowerCase() === 'expense')
                    .reduce((acc, t) => acc + safeNumber(t.amount), 0);
                netAmount = income - expense;
            }

            // 6. Subscriptions
            const activeSubsList = Array.isArray(subs) ? subs.filter(s => s.active) : [];
            const subscriptionCost = activeSubsList.reduce((acc, curr) => acc + safeNumber(curr.amount), 0);

            // 7. Goal Stats
            const gStats = goalStatsRes.status === 'fulfilled' ? unwrap(goalStatsRes.value) : {};
            const goalCompleted = safeNumber(gStats.completedGoals);
            const goalTotal = safeNumber(gStats.totalGoals) || (Array.isArray(goals) ? goals.length : 0);

            setDashboardData({
                netWorth,
                netAmount,
                activeSubscriptions: activeSubsList.length,
                subscriptionCost,
                goalStats: { completed: goalCompleted, total: goalTotal },
                recentTransactions: Array.isArray(txns) ? txns.slice(0, 5) : [],
                goals: Array.isArray(goals) ? goals.slice(0, 3) : [],
                assets: Array.isArray(assets) ? assets.slice(0, 4) : [],
                debts: Array.isArray(debts) ? debts.slice(0, 4) : [],
                grossAssets
            });

        } catch (error) {
            console.error("Dashboard Load Error:", error);
            // Even on error, ensure we show 0, not NaN
            setDashboardData(prev => ({ ...prev, netWorth: 0, netAmount: 0 }));
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black p-6 md:p-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-zinc-500 animate-pulse font-mono text-sm">Syncing Wealth Data...</p>
            </div>
        </div>
    );

    const {
        netWorth, netAmount,
        goalStats, recentTransactions,
        goals, assets, debts, grossAssets
    } = dashboardData;

    const isPositiveCashFlow = netAmount >= 0;

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-10 font-sans selection:bg-emerald-500/30">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Dashboard</h2>
                    <p className="text-zinc-500 text-lg">Financial Overview</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs text-zinc-600 uppercase tracking-widest font-bold mb-1">Today</p>
                    <p className="text-zinc-400 font-mono">{new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* TOP STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    icon={Landmark}
                    title="Net Worth"
                    value={formatMoney(netWorth)}
                    badge="Total Wealth"
                    colorTheme={netWorth >= 0 ? 'emerald' : 'rose'}
                    subtitle={<span className="text-zinc-500">Assets - Liabilities</span>}
                />

                <StatCard
                    icon={Activity}
                    title="Cash Flow"
                    value={(isPositiveCashFlow ? '+' : '') + formatMoney(netAmount)}
                    badge="Monthly Net"
                    colorTheme={isPositiveCashFlow ? 'emerald' : 'rose'}
                    subtitle={isPositiveCashFlow ? 'Surplus Income' : 'Deficit Spending'}
                />

                <StatCard
                    icon={PieChart}
                    title="Gross Assets"
                    value={formatMoney(grossAssets)}
                    badge="Total Holdings"
                    colorTheme="blue"
                    subtitle={<span className="text-zinc-500">Before Debt Deduction</span>}
                />
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Activity & Liabilities (2/3 width) */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Recent Transactions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-zinc-500" /> Recent Activity
                            </h3>
                            <button onClick={() => navigate('/transactions')} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                                View All <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className={`${CARD_BASE} p-2 min-h-[250px]`}>
                            {recentTransactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                                    <Receipt className="w-10 h-10 mb-3 opacity-20" />
                                    <p className="text-sm">No recent transactions</p>
                                </div>
                            ) : (
                                recentTransactions.map(txn => (
                                    <TransactionRow key={txn.id} transaction={txn} />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Debt/Liabilities Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-zinc-500" /> Liabilities & Debt
                            </h3>
                            <button onClick={() => navigate('/debts')} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                                Manage Debts <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className={`${CARD_BASE} p-2`}>
                            {debts.length === 0 ? (
                                <div className="p-6 text-center">
                                    <p className="text-xs text-zinc-500">Debt free! No liabilities recorded.</p>
                                </div>
                            ) : (
                                debts.map(debt => <FinanceItemRow key={debt.id} item={debt} type="debt" />)
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Assets & Goals (1/3 width) */}
                <div className="xl:col-span-1 space-y-8">

                    {/* Goals Widget */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-zinc-500" /> Goals
                            </h3>
                            <span className="text-xs text-zinc-500">{goalStats.completed} Completed</span>
                        </div>
                        <div className="space-y-3">
                            {goals.length === 0 ? (
                                <div className={`${CARD_BASE} p-6 text-center border-dashed border-zinc-800`}>
                                    <Target className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-xs text-zinc-500">No active goals</p>
                                </div>
                            ) : (
                                goals.map(goal => <GoalBar key={goal.id} goal={goal} />)
                            )}
                        </div>
                    </div>

                    {/* Assets Widget */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-zinc-500" /> Assets
                            </h3>
                            <button onClick={() => navigate('/assets')} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                                View All <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className={`${CARD_BASE} p-2`}>
                            {assets.length === 0 ? (
                                <div className="p-6 text-center">
                                    <p className="text-xs text-zinc-500">No assets recorded</p>
                                </div>
                            ) : (
                                assets.map(asset => <FinanceItemRow key={asset.id} item={asset} type="asset" />)
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}