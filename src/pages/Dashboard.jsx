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
    Landmark,
    ShieldCheck,
    Calendar // Added Calendar icon
} from 'lucide-react';

// Import services (Removed exportTransactionsPdf)
import {
    fetchGoals,
    fetchTransactions,
    fetchAssets,
    fetchDebts,
    fetchNetWorth,
    fetchGoalStats,
    fetchTransactionNetAmount,
    fetchDebtStats,
    allAssetsAmount,
    fetchActivePolicies
} from '../services/api';

// ============================================================================
// UTILS & STYLES
// ============================================================================

const BORDER_STYLE = 'border border-zinc-800/60';
const CARD_BASE = `bg-zinc-950/50 ${BORDER_STYLE} rounded-2xl backdrop-blur-sm transition-all duration-300`;

const safeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

const formatMoney = (val) =>
    `₹${safeNumber(val).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}`;

const getTodayDateString = () => {
    const date = new Date();
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const rest = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${weekday}, ${rest}`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StatCard = ({ icon: Icon, title, value, subtitle, badge, colorTheme = 'emerald' }) => {
    const themes = {
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/30', glow: 'hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.2)]' },
        rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'hover:border-rose-500/30',    glow: 'hover:shadow-[0_8px_30px_-12px_rgba(244,63,94,0.2)]' },
        violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'hover:border-violet-500/30',  glow: 'hover:shadow-[0_8px_30px_-12px_rgba(139,92,246,0.2)]' },
        amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'hover:border-amber-500/30',   glow: 'hover:shadow-[0_8px_30px_-12px_rgba(245,158,11,0.2)]' },
        blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'hover:border-blue-500/30',    glow: 'hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.2)]' }
    };
    const theme = themes[colorTheme] || themes.emerald;

    return (
        <div className={`${CARD_BASE} p-6 ${theme.border} ${theme.glow} group relative overflow-hidden flex flex-col justify-between h-full`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                </div>
                {badge && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <div className="space-y-1.5 mt-2">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
            </div>
            {subtitle && (
                <div className="mt-4 flex items-center text-xs font-medium text-zinc-500">
                    {subtitle}
                </div>
            )}
        </div>
    );
};

const LiabilityCard = ({ debt }) => {
    const displayAmount = safeNumber(debt.amount || debt.outstandingAmount || debt.balance);

    return (
        <div className={`${CARD_BASE} p-5 hover:border-rose-500/30 hover:bg-zinc-900/50 transition-all group cursor-default`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">
                        {debt.category || 'Liability'}
                    </p>
                    <p className="text-zinc-200 font-medium group-hover:text-rose-400 transition-colors">
                        {debt.name || debt.institution}
                    </p>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
                    <CreditCard className="w-4 h-4" />
                </div>
            </div>
            <p className="text-2xl font-mono text-white tracking-tight">
                {formatMoney(displayAmount)}
            </p>
        </div>
    );
};

const TransactionRow = ({ transaction }) => {
    const isIncome = (transaction.type || '').toLowerCase() === 'income';
    const Icon = isIncome ? ArrowUp : ArrowDown;

    return (
        <div className="group flex items-center justify-between p-4 hover:bg-zinc-900/80 transition-colors cursor-pointer border-b border-white/5 last:border-0">
            <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20'} transition-colors`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {transaction.description || 'Untitled'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(transaction.date || transaction.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                </div>
            </div>
            <span className={`font-mono text-sm font-medium ${isIncome ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
            </span>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        netWorth: 0,
        cashFlow: 0,
        grossAssets: 0,
        activeInsurances: 0,
        goalProgress: { completed: 0, total: 0 },
        recentTransactions: [],
        recentGoals: [],
        recentAssets: [],
        recentDebts: [],
        debtTotal: 0
    });

    useEffect(() => {
        loadData().catch(console.error);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                fetchNetWorth(),
                fetchTransactionNetAmount(),
                allAssetsAmount(),
                fetchActivePolicies(),
                fetchGoalStats(),
                fetchTransactions("", 0),
                fetchGoals(0, 3),
                fetchAssets(),
                fetchDebts(),
                fetchDebtStats()
            ]);

            const resolve = (idx) => {
                const res = results[idx].status === 'fulfilled' ? results[idx].value : null;
                return res?.data || res;
            };

            const txnSummary = resolve(1);
            const debtStats = resolve(9);

            setData({
                netWorth: safeNumber(resolve(0)?.netWorth ?? resolve(0)),
                cashFlow: safeNumber(txnSummary?.netSavings ?? 0),
                grossAssets: safeNumber(resolve(2)?.totalValue ?? resolve(2)),
                activeInsurances: Array.isArray(resolve(3)) ? resolve(3).length : 0,
                goalProgress: {
                    completed: safeNumber(resolve(4)?.completedGoals),
                    total: safeNumber(resolve(4)?.totalGoals)
                },
                recentTransactions: resolve(5)?.content || (Array.isArray(resolve(5)) ? resolve(5).slice(0, 5) : []),
                recentGoals: resolve(6)?.content || (Array.isArray(resolve(6)) ? resolve(6) : []),
                recentAssets: Array.isArray(resolve(7)) ? resolve(7).slice(0, 4) : [],
                recentDebts: Array.isArray(resolve(8)) ? resolve(8).slice(0, 4) : [],
                debtTotal: safeNumber(debtStats?.totalOutstandingAmount ?? 0)
            });
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
            <div className="relative w-12 h-12 flex items-center justify-center mb-6">
                <div className="absolute inset-0 border-2 border-zinc-800 rounded-xl"></div>
                <div className="absolute inset-0 border-2 border-emerald-500 rounded-xl animate-[spin_2s_linear_infinite] border-t-transparent border-r-transparent"></div>
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
            </div>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em]">Syncing Treasury...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#00a0a] text-zinc-100 p-6 md:p-8 lg:p-12">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">IntelliWealth</h1>
                    <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Financial Command Center
                    </p>
                </div>

                {/* REPLACED EXPORT BUTTON WITH DATE */}
                <div className="flex flex-col items-end justify-center">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase mb-1">
                                TODAY
                    </span>
                <span className="text-base font-mono text-slate-300 tracking-tight">
                             {getTodayDateString()}
                </span>
                </div>
            </div>


            {/* TOP STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard
                    icon={Landmark}
                    title="Net Worth"
                    value={formatMoney(data.netWorth)}
                    colorTheme={data.netWorth >= 0 ? "emerald" : "rose"}
                    subtitle="Assets minus Liabilities"
                />
                <StatCard
                    icon={Activity}
                    title="Cash Flow"
                    value={formatMoney(data.cashFlow)}
                    colorTheme={data.cashFlow >= 0 ? "emerald" : "rose"}
                    subtitle="Current Month Net"
                />
                <StatCard
                    icon={PieChart}
                    title="Gross Assets"
                    value={formatMoney(data.grossAssets)}
                    colorTheme="blue"
                    subtitle="Total Wealth Value"
                />
                <StatCard
                    icon={ShieldCheck}
                    title="Insurances"
                    value={data.activeInsurances}
                    colorTheme="violet"
                    badge="Active"
                    subtitle="Protection Coverage"
                />
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-12">

                {/* Left: Transactions & Debts */}
                <div className="xl:col-span-2 space-y-12">

                    {/* RECENT ACTIVITY */}
                    <section>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                                    <div className="p-1.5 bg-zinc-900 rounded-md"><Receipt className="text-zinc-400 w-4 h-4" /></div>
                                    Recent Activity
                                </h3>
                            </div>
                            <button
                                onClick={() => navigate('/transactions')}
                                className="group flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
                            >
                                View All <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        <div className={`${CARD_BASE} overflow-hidden`}>
                            {data.recentTransactions.map(t => <TransactionRow key={t.id} transaction={t} />)}
                            {data.recentTransactions.length === 0 && (
                                <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500">
                                    <Receipt className="w-8 h-8 mb-3 opacity-20" />
                                    <p className="text-sm">No recent transactions found.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* LIABILITIES */}
                    <section>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                                    <div className="p-1.5 bg-zinc-900 rounded-md"><CreditCard className="text-zinc-400 w-4 h-4" /></div>
                                    Liabilities
                                </h3>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Total Outstanding</span>
                                <span className="text-rose-400 font-mono font-bold text-sm bg-rose-500/10 px-2 py-0.5 rounded text-right">
                                    {formatMoney(data.debtTotal)}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {data.recentDebts.length > 0 ? (
                                data.recentDebts.map(debt => (
                                    <LiabilityCard key={debt.id} debt={debt} />
                                ))
                            ) : (
                                <div className={`${CARD_BASE} p-12 col-span-2 flex flex-col items-center justify-center border-dashed border-zinc-800`}>
                                    <CreditCard className="w-8 h-8 mb-3 text-zinc-600 opacity-50" />
                                    <p className="text-zinc-500 text-sm">No active debts found.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right: Goals & Assets */}
                <div className="space-y-12">

                    {/* GOALS */}
                    <section>
                        <div className="flex justify-between items-end mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="p-1.5 bg-zinc-900 rounded-md"><Trophy className="text-zinc-400 w-4 h-4" /></div>
                                Financial Goals
                            </h3>
                            <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-full">
                                {data.goalProgress.completed}/{data.goalProgress.total} Done
                            </span>
                        </div>

                        <div className="space-y-4">
                            {data.recentGoals.map(goal => {
                                const progress = Math.min(100, (safeNumber(goal.currentAmount) / safeNumber(goal.targetAmount)) * 100);
                                return (
                                    <div key={goal.id} className={`${CARD_BASE} p-5 group`}>
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{goal.name}</span>
                                            <span className="text-emerald-400 font-mono text-sm font-bold">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out relative"
                                                style={{ width: `${progress}%` }}
                                            >
                                                <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* TOP ASSETS */}
                    <section>
                        <div className="flex justify-between items-end mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                                <div className="p-1.5 bg-zinc-900 rounded-md"><PieChart className="text-zinc-400 w-4 h-4" /></div>
                                Top Assets
                            </h3>
                        </div>

                        <div className={`${CARD_BASE} p-2`}>
                            {data.recentAssets.map(asset => (
                                <div key={asset.id} className="flex justify-between items-center p-4 rounded-xl hover:bg-zinc-900/60 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors" />
                                        <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{asset.name}</span>
                                    </div>
                                    <span className="text-sm font-mono font-medium text-white">{formatMoney(asset.value || asset.currentValue)}</span>
                                </div>
                            ))}
                            {data.recentAssets.length === 0 && (
                                <p className="p-8 text-center text-sm text-zinc-500">No assets recorded.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}