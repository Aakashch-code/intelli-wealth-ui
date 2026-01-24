import React, { useEffect, useState, useMemo } from 'react';
import {
    Target,
    Trophy,
    Calendar,
    Plus,
    Edit2,
    Trash2,
    X,
    Search,
    AlertCircle,
    CheckCircle2,
    Loader2,
    TrendingUp,
    Flag
} from 'lucide-react';

// Import API methods
import {
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    fetchGoalStats
} from '../../services/api.jsx';

// ============================================================================
// STYLES & UTILS
// ============================================================================

const BORDER_STYLE = "border border-white/10";
const CARD_BASE = `bg-black ${BORDER_STYLE} rounded-2xl transition-all duration-300`;
const INPUT_BASE = "w-full bg-zinc-900/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 focus:bg-zinc-900/50 transition-all placeholder:text-zinc-600";

const currency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const formatDate = (dateStr) => {
    if (!dateStr) return 'No Deadline';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Toast = ({ message, type, onClose }) => (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 z-50
        ${type === 'error' ? 'bg-red-950/80 border-red-900/50 text-red-200' : 'bg-zinc-900/90 border-zinc-800 text-white'}`}>
        {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
);

const StatCard = ({ label, value, icon: Icon, subtext }) => (
    <div className={`${CARD_BASE} p-6 relative overflow-hidden group`}>
        <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-lg bg-zinc-900 text-cyan-400 group-hover:bg-cyan-900/20 transition-colors`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
            {subtext && <p className="text-xs text-zinc-600 mt-2">{subtext}</p>}
        </div>
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Goals() {
    // Data State
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState({ totalGoals: 0, completedGoals: 0, totalTargetValue: 0 });

    // UI State
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        status: 'IN_PROGRESS'
    });

    // --- Lifecycle ---

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showToast = (message, type = 'success') => setNotification({ message, type });

    const loadData = async () => {
        setLoading(true);
        try {
            const [listRes, statsRes] = await Promise.all([
                fetchGoals(),
                fetchGoalStats()
            ]);
            setGoals(listRes.data || []);
            setStats(statsRes.data || { totalGoals: 0, completedGoals: 0, totalTargetValue: 0 });
        } catch (err) {
            console.error("Error loading goals:", err);
            showToast("Could not connect to server", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Computed ---

    const filteredGoals = useMemo(() => {
        return goals.filter(g =>
            g.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [goals, searchQuery]);

    // --- Handlers ---

    const openModal = (goal = null) => {
        setEditingGoal(goal);
        if (goal) {
            setFormData({
                name: goal.name,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount || 0,
                deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
                status: goal.status
            });
        } else {
            setFormData({
                name: '',
                targetAmount: '',
                currentAmount: '',
                deadline: '',
                status: 'IN_PROGRESS'
            });
        }
        setModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const payload = {
                ...formData,
                targetAmount: parseFloat(formData.targetAmount),
                currentAmount: parseFloat(formData.currentAmount || 0)
            };

            if (editingGoal) {
                await updateGoal(editingGoal.id, payload);
                showToast("Goal updated");
            } else {
                await createGoal(payload);
                showToast("Goal created");
            }
            await loadData();
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            showToast("Operation failed", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteGoal(deletingId);
            setGoals(prev => prev.filter(g => g.id !== deletingId));
            showToast("Goal deleted");
            // Reload stats to keep sync
            const statsRes = await fetchGoalStats();
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
            showToast("Failed to delete", "error");
            await loadData();
        }
        setDeleteConfirmOpen(false);
    };

    // --- Render ---

    if (loading && goals.length === 0) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 md:p-10 font-sans">
            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Financial Goals</h2>
                    <p className="text-zinc-500 text-lg">Dream big, plan smart</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => openModal()}
                        className="group flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-medium hover:bg-zinc-200 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        <span>New Goal</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <StatCard
                    label="Goals Achieved"
                    value={`${stats.completedGoals} / ${stats.totalGoals}`}
                    icon={Trophy}
                    subtext="Keep pushing your limits"
                />
                <StatCard
                    label="Total Target Volume"
                    value={currency(stats.totalTargetValue)}
                    icon={Target}
                    subtext="Total value of all active goals"
                />
            </div>

            {/* Controls */}
            <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${INPUT_BASE} pl-10 bg-black`}
                />
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGoals.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                        <Flag className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-xl font-bold text-zinc-300">No goals set</h3>
                        <p className="text-zinc-500 mt-2 mb-6">Create a savings goal to start tracking.</p>
                        <button onClick={() => openModal()} className="text-white hover:text-zinc-300 font-medium underline underline-offset-4">Set a goal</button>
                    </div>
                ) : (
                    filteredGoals.map((goal) => {
                        const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                        const isCompleted = progress >= 100;

                        return (
                            <div key={goal.id} className={`${CARD_BASE} p-6 group relative hover:border-zinc-700`}>
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-zinc-800 bg-zinc-900 ${isCompleted ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                            {isCompleted ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{goal.name}</h3>
                                            <p className={`text-xs uppercase tracking-wider font-bold ${isCompleted ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                                {isCompleted ? 'Completed' : 'In Progress'}
                                            </p>
                                        </div>
                                    </div>
                                    {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                </div>

                                {/* Progress Section */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-zinc-400">Saved</span>
                                        <span className="text-white font-bold">{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Amount Details */}
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase">Current</p>
                                        <p className="text-xl font-bold text-white">{currency(goal.currentAmount)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500 uppercase">Target</p>
                                        <p className="text-lg font-medium text-zinc-400">{currency(goal.targetAmount)}</p>
                                    </div>
                                </div>

                                {/* Footer Info & Actions */}
                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>Target: {formatDate(goal.deadline)}</span>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(goal)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setDeletingId(goal.id); setDeleteConfirmOpen(true); }} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ================= MODALS ================= */}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingGoal ? 'Edit Goal' : 'New Goal'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Goal Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="e.g. New Car"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={INPUT_BASE}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Target Amount</label>
                                    <input
                                        type="number"
                                        name="targetAmount"
                                        required
                                        placeholder="0.00"
                                        value={formData.targetAmount}
                                        onChange={handleInputChange}
                                        className={`${INPUT_BASE} font-mono`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Saved So Far</label>
                                    <input
                                        type="number"
                                        name="currentAmount"
                                        placeholder="0.00"
                                        value={formData.currentAmount}
                                        onChange={handleInputChange}
                                        className={`${INPUT_BASE} font-mono`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Target Date</label>
                                <input
                                    type="date"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleInputChange}
                                    className={`${INPUT_BASE} scheme-dark`}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full mt-4 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-70"
                            >
                                {formLoading ? 'Saving...' : 'Save Goal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Goal?</h3>
                        <p className="text-zinc-500 text-sm mb-6">This will remove the goal and its progress tracking.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}