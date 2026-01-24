import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    HomeIcon, WalletIcon, FlagIcon, CurrencyDollarIcon, DocumentTextIcon,
    ChatBubbleLeftRightIcon, ReceiptPercentIcon, BuildingOfficeIcon, ShieldCheckIcon,
    ChartBarIcon, BanknotesIcon, ArrowTrendingUpIcon, ScaleIcon, DocumentDuplicateIcon,
    CalculatorIcon, CreditCardIcon, UserGroupIcon, BellAlertIcon, ClockIcon, GlobeAltIcon,
    AcademicCapIcon, HeartIcon, TrophyIcon, BuildingLibraryIcon, SparklesIcon, ShoppingBagIcon,
    ChevronDownIcon, ChevronRightIcon, Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

// Organize links into logical groups
const MENU_GROUPS = [
    {
        title: "Treasury",
        items: [
            { to: "/", icon: HomeIcon, label: "Dashboard" },
            { to: "/transactions", icon: DocumentTextIcon, label: "Transactions" },
            { to: "/budgets", icon: WalletIcon, label: "Budgets" },
            { to: "/goals", icon: FlagIcon, label: "Goals" },
            { to: "/subscriptions", icon: CurrencyDollarIcon, label: "Subscriptions" },
        ]
    },
    {
        title: "Wealth",
        items: [
            { to: "/net-worth", icon: ScaleIcon, label: "Net Worth" },
            { to: "/assets", icon: ReceiptPercentIcon, label: "Assets" },
            { to: "/debts", icon: BanknotesIcon, label: "Debt Manager" },
        ]
    },
    {
        title: "Protection",
        items: [
            { to: "/insurance", icon: ShieldCheckIcon, label: "Insurances" },
            { to: "/contingency", icon: BellAlertIcon, label: "Contingency" }
        ]
    },
    {
        title: "Investments",
        items: [
            { to: "/portfolio", icon: ChartBarIcon, label: "Portfolio" },
            { to: "/stocks", icon: BuildingLibraryIcon, label: "Stocks & ETFs" },
            { to: "/crypto", icon: GlobeAltIcon, label: "Cryptocurrency" },
            { to: "/investments", icon: ArrowTrendingUpIcon, label: "General Invest" },
            { to: "/retirement", icon: ClockIcon, label: "Retirement" },
        ]
    },
    {
        title: "Tools & Insights",
        items: [
            { to: "/tax-planning", icon: CalculatorIcon, label: "Tax Planning" },
            { to: "/cash-flow", icon: ArrowTrendingUpIcon, label: "Cash Flow" },
            { to: "/expense-analyzer", icon: ChartBarIcon, label: "Analyzer" },
            { to: "/smart-recommendations", icon: SparklesIcon, label: "Smart Recs" },
            { to: "/shopping-insights", icon: ShoppingBagIcon, label: "Shopping" },
            { to: "/family-accounts", icon: UserGroupIcon, label: "Family" },
        ]
    }
];

// Special item for AI
const AI_ITEM = { to: "/fynix", icon: ChatBubbleLeftRightIcon, label: "Ask Fynix AI" };

export default function Sidebar() {
    // --- State ---
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({ "Treasury": true, "Wealth": true });
    const [userName, setUserName] = useState("Guest User"); // Default state

    const navigate = useNavigate();

    // --- Effects ---
    useEffect(() => {
        // Fetch the name stored in localStorage during Login
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    // --- Handlers ---
    const toggleGroup = (title) => {
        setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
    };

    const closeMobile = () => setIsMobileOpen(false);

    const handleLogout = () => {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    // --- Helper for Initials ---
    const getInitials = (name) => {
        if (!name) return "GU";
        return name.slice(0, 2).toUpperCase();
    };

    // --- Sub-Components ---
    const NavItem = ({ item, isSpecial = false }) => {
        const Icon = item.icon;
        return (
            <NavLink
                to={item.to}
                onClick={closeMobile}
                className={({ isActive }) => `
                    group flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 mb-1
                    ${isSpecial
                    ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 hover:text-white"
                    : isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                }
                `}
            >
                <Icon className={`w-5 h-5 ${isSpecial ? "text-indigo-400" : ""}`} />
                <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
        );
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-black border-r border-white/10">
            {/* Header */}
            <div className="p-6 flex items-center gap-3 sticky top-0 bg-black/95 backdrop-blur-sm z-10 border-b border-white/5">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    <span className="text-black font-bold text-lg">I</span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                    Intelli<span className="text-emerald-500">Wealth</span>
                </h1>
            </div>

            {/* Scrollable Nav Area */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

                {/* Special AI Button */}
                <div className="mb-6">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3 px-2">Assistant</p>
                    <NavItem item={AI_ITEM} isSpecial={true} />
                </div>

                {/* Menu Groups */}
                {MENU_GROUPS.map((group) => (
                    <div key={group.title}>
                        <button
                            onClick={() => toggleGroup(group.title)}
                            className="w-full flex items-center justify-between text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2 px-2 hover:text-zinc-400 transition-colors"
                        >
                            {group.title}
                            {expandedGroups[group.title] ? (
                                <ChevronDownIcon className="w-3 h-3" />
                            ) : (
                                <ChevronRightIcon className="w-3 h-3" />
                            )}
                        </button>

                        <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${expandedGroups[group.title] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            {group.items.map((item) => (
                                <NavItem key={item.to} item={item} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / User Profile Snippet */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors group text-left"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
                         <span className="text-xs font-bold text-white">
                            {getInitials(userName)}
                         </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                            {userName}
                        </p>
                        <p className="text-xs text-zinc-500 truncate flex items-center gap-1">
                            Sign out
                        </p>
                    </div>
                    <ArrowRightOnRectangleIcon className="w-5 h-5 text-zinc-500 group-hover:text-red-400 transition-colors" />
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Trigger Button (Visible only on small screens) */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-white"
            >
                <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Desktop Sidebar (Hidden on mobile, Block on lg) */}
            <div className="hidden lg:block w-64 h-screen fixed left-0 top-0">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar Drawer (Overlay) */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={closeMobile}
                    />

                    {/* Drawer */}
                    <div className="absolute inset-y-0 left-0 w-64 bg-black border-r border-white/10 shadow-2xl transform transition-transform duration-300">
                        <button
                            onClick={closeMobile}
                            className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-white"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    );
}