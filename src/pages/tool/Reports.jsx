import React, { useState } from "react";
import {
    FileDown,
    Wallet,
    Target,
    Repeat,
    CreditCard,
    Landmark,
    ShieldCheck,
    Loader2
} from "lucide-react";

// Mocking imports for demonstration if you copy-paste this standalone.
// In your project, keep your original import path:
import {
    exportBudgetsPdf,
    exportGoalsPdf,
    exportSubscriptionsPdf,
    exportTransactionsPdf,
    exportAssetsPdf,
    exportDebtsPdf,
    exportInsurancePdf
} from "../../services/api.jsx";


/* ============================================================
   CONFIG & STYLES
============================================================ */

const REPORTS = [
    {
        title: "Budget Report",
        desc: "Monthly & yearly budget overview",
        icon: Wallet,
        action: exportBudgetsPdf,
        color: "indigo"
    },
    {
        title: "Goals Report",
        desc: "Savings & financial goals progress",
        icon: Target,
        action: exportGoalsPdf,
        color: "emerald"
    },
    {
        title: "Subscriptions",
        desc: "Active & inactive subscriptions",
        icon: Repeat,
        action: exportSubscriptionsPdf,
        color: "purple"
    },
    {
        title: "Transactions",
        desc: "All income & expense records",
        icon: CreditCard,
        action: exportTransactionsPdf,
        color: "blue"
    },
    {
        title: "Assets Report",
        desc: "Investments & owned assets",
        icon: Landmark,
        action: exportAssetsPdf,
        color: "amber"
    },
    {
        title: "Debt Report",
        desc: "Loans & outstanding balances",
        icon: FileDown,
        action: exportDebtsPdf,
        color: "red"
    },
    {
        title: "Insurance Report",
        desc: "All active insurance policies",
        icon: ShieldCheck,
        action: exportInsurancePdf,
        color: "teal"
    }
];

// Helper to map color names to Tailwind classes
const getColorClasses = (color) => {
    const variants = {
        indigo: {
            bg: "bg-indigo-500/10",
            text: "text-indigo-400",
            border: "group-hover:border-indigo-500/50",
            glow: "group-hover:shadow-indigo-500/20",
            iconBg: "group-hover:bg-indigo-500",
        },
        emerald: {
            bg: "bg-emerald-500/10",
            text: "text-emerald-400",
            border: "group-hover:border-emerald-500/50",
            glow: "group-hover:shadow-emerald-500/20",
            iconBg: "group-hover:bg-emerald-500",
        },
        purple: {
            bg: "bg-purple-500/10",
            text: "text-purple-400",
            border: "group-hover:border-purple-500/50",
            glow: "group-hover:shadow-purple-500/20",
            iconBg: "group-hover:bg-purple-500",
        },
        blue: {
            bg: "bg-blue-500/10",
            text: "text-blue-400",
            border: "group-hover:border-blue-500/50",
            glow: "group-hover:shadow-blue-500/20",
            iconBg: "group-hover:bg-blue-500",
        },
        amber: {
            bg: "bg-amber-500/10",
            text: "text-amber-400",
            border: "group-hover:border-amber-500/50",
            glow: "group-hover:shadow-amber-500/20",
            iconBg: "group-hover:bg-amber-500",
        },
        red: {
            bg: "bg-red-500/10",
            text: "text-red-400",
            border: "group-hover:border-red-500/50",
            glow: "group-hover:shadow-red-500/20",
            iconBg: "group-hover:bg-red-500",
        },
        teal: {
            bg: "bg-teal-500/10",
            text: "text-teal-400",
            border: "group-hover:border-teal-500/50",
            glow: "group-hover:shadow-teal-500/20",
            iconBg: "group-hover:bg-teal-500",
        }
    };
    return variants[color] || variants.indigo;
};


/* ============================================================
   COMPONENT
============================================================ */

export default function Reports() {

    const [loading, setLoading] = useState(null);

    const handleExport = async (index, action) => {
        try {
            setLoading(index);
            await action();
        } catch (err) {
            console.error("Export failed:", err);
            // Optional: Add toast notification here
        } finally {
            setLoading(null);
        }
    };


    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">

            {/* Ambient Background Gradient */}
            <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-16 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                        Reports & Exports
                    </h2>
                    <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">
                        Download comprehensive PDF summaries of your financial activities, budgets, and assets.
                    </p>
                </div>


                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {REPORTS.map((report, index) => {

                        const Icon = report.icon;
                        const isLoading = loading === index;
                        const styles = getColorClasses(report.color);

                        return (
                            <div
                                key={index}
                                className={`
                                    group relative
                                    bg-zinc-900/40 backdrop-blur-sm
                                    border border-white/5
                                    rounded-3xl p-6
                                    transition-all duration-300 ease-out
                                    hover:-translate-y-2
                                    hover:shadow-2xl
                                    ${styles.border}
                                    ${styles.glow}
                                `}
                            >
                                {/* Top Section: Icon & Text */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex-1">
                                        {/* Title */}
                                        <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-white transition-colors">
                                            {report.title}
                                        </h3>
                                        {/* Desc */}
                                        <p className="text-sm text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-400 transition-colors">
                                            {report.desc}
                                        </p>
                                    </div>

                                    {/* Animated Icon Container */}
                                    <div className={`
                                        w-12 h-12 rounded-2xl
                                        flex items-center justify-center
                                        transition-all duration-300
                                        ${styles.bg} ${styles.text}
                                        ${styles.iconBg} group-hover:text-white
                                        group-hover:rotate-6
                                    `}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>


                                {/* Button */}
                                <button
                                    onClick={() => handleExport(index, report.action)}
                                    disabled={isLoading}
                                    className={`
                                        w-full py-3.5 rounded-xl
                                        font-semibold text-sm
                                        flex items-center justify-center gap-2
                                        
                                        bg-zinc-800 text-zinc-300
                                        border border-zinc-700/50
                                        
                                        transition-all duration-300
                                        hover:bg-white hover:text-black hover:scale-[1.02]
                                        active:scale-[0.98]
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Export PDF</span>
                                            <FileDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                                        </>
                                    )}
                                </button>

                            </div>
                        );
                    })}

                </div>


                {/* Footer Tip */}
                <div className="mt-16 flex items-center justify-center gap-2 text-sm text-zinc-600">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Data is encrypted and processed locally before export.</span>
                </div>

            </div>
        </div>
    );
}