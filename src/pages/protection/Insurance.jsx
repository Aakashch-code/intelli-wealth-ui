import React, { useEffect, useState } from 'react';
import {
    Shield,
    Heart,
    Car,
    Home,
    Plane,
    Plus,
    Edit2,
    Trash2,
    X,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    BriefcaseMedical
} from 'lucide-react';
import {
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    fetchActivePolicies,
    fetchExpiringPolicies
} from "../../services/api.jsx"; // Ensure path matches

// ============================================================================
// CONFIGURATION (Matches Backend Domain Rules)
// ============================================================================

const INSURANCE_CATEGORY_RULES = {
    LIFE: [
        { key: 'policyType', label: 'Policy Type', type: 'select', options: ['TERM', 'ENDOWMENT', 'ULIP', 'WHOLE_LIFE'] },
        { key: 'nominee', label: 'Nominee Name', type: 'text', placeholder: 'e.g. Spouse Name' },
        { key: 'sumAssured', label: 'Sum Assured', type: 'number', placeholder: 'e.g. 10000000' }
    ],
    HEALTH: [
        { key: 'membersCovered', label: 'Members Covered', type: 'text', placeholder: 'e.g. Self, Spouse, 2 Kids' },
        { key: 'waitingPeriod', label: 'Waiting Period (Years)', type: 'number', placeholder: 'e.g. 2' },
        { key: 'networkHospitals', label: 'Network Hospitals', type: 'text', placeholder: 'e.g. Apollo, Fortis' }
    ],
    VEHICLE: [
        { key: 'vehicleNumber', label: 'Vehicle Number', type: 'text', placeholder: 'MH-12-XX-1234' },
        { key: 'idv', label: 'IDV Value', type: 'number', placeholder: 'Current Market Value' },
        { key: 'ncb', label: 'No Claim Bonus (%)', type: 'number', placeholder: 'e.g. 20' }
    ],
    HOME: [
        { key: 'propertyAddress', label: 'Property Address', type: 'text', placeholder: 'Address' },
        { key: 'coverType', label: 'Cover Type', type: 'select', options: ['STRUCTURE_ONLY', 'CONTENT_ONLY', 'COMPREHENSIVE'] }
    ],
    TRAVEL: [
        { key: 'tripDestination', label: 'Destination', type: 'text', placeholder: 'e.g. Europe' },
        { key: 'travelDates', label: 'Travel Dates', type: 'text', placeholder: 'e.g. 01/01 - 15/01' }
    ]
};

const getInsuranceIcon = (category) => {
    switch (category) {
        case 'LIFE': return Shield;
        case 'HEALTH': return Heart;
        case 'VEHICLE': return Car;
        case 'HOME': return Home;
        case 'TRAVEL': return Plane;
        case 'CRITICAL_ILLNESS': return BriefcaseMedical;
        default: return Shield;
    }
};

const formatINR = (val) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val || 0);

// ============================================================================
// COMPONENT
// ============================================================================

export default function Insurance() {
    // Data State
    const [policies, setPolicies] = useState([]);
    const [activePolicies, setActivePolicies] = useState([]);
    const [expiringPolicies, setExpiringPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        policyNumber: '',
        provider: '',
        premiumAmount: '',
        coverageAmount: '',
        renewalDate: '',
        category: '',
        attributes: {}
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all lists from backend
            const [allRes, activeRes, expiringRes] = await Promise.all([
                fetchPolicies(),
                fetchActivePolicies(),
                fetchExpiringPolicies()
            ]);

            setPolicies(allRes.data || []);
            setActivePolicies(activeRes.data || []);
            setExpiringPolicies(expiringRes.data || []);
        } catch (error) {
            console.error("Error fetching insurance data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const openModal = (policy = null) => {
        setEditingPolicy(policy);
        if (policy) {
            setFormData({
                name: policy.name,
                policyNumber: policy.policyNumber,
                provider: policy.provider,
                premiumAmount: policy.premiumAmount,
                coverageAmount: policy.coverageAmount,
                renewalDate: policy.renewalDate ? policy.renewalDate.split('T')[0] : '',
                category: policy.category,
                attributes: policy.attributes || {}
            });
        } else {
            setFormData({
                name: '',
                policyNumber: '',
                provider: '',
                premiumAmount: '',
                coverageAmount: '',
                renewalDate: '',
                category: '',
                attributes: {}
            });
        }
        setModalOpen(true);
    };

    const handleMainChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'category') {
                return { ...prev, category: value, attributes: {} };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleAttributeChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        const payload = {
            name: formData.name,
            policyNumber: formData.policyNumber,
            provider: formData.provider,
            premiumAmount: parseFloat(formData.premiumAmount),
            coverageAmount: parseFloat(formData.coverageAmount),
            renewalDate: formData.renewalDate,
            category: formData.category,
            attributes: formData.attributes
        };

        try {
            if (editingPolicy) {
                await updatePolicy(editingPolicy.id, payload);
            } else {
                await createPolicy(payload);
            }
            await loadData();
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving policy:", error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deletePolicy(deletingId);
            await loadData();
        } catch (error) {
            console.error("Error deleting policy:", error);
        } finally {
            setDeleteConfirmOpen(false);
            setDeletingId(null);
        }
    };

    // --- Render ---

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
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2">Insurance</h2>
                    <p className="text-zinc-500 text-lg">Manage protection and policies</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Policy</span>
                </button>
            </div>

            {/* --- Status Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-4xl">

                {/* Card 1: Active Policies Count */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <CheckCircle2 className="w-24 h-24 text-indigo-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-2 text-indigo-500">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Active Protection</span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">
                        {activePolicies.length}
                    </div>
                    <div className="text-sm text-zinc-500">
                        Policies currently in force
                    </div>
                </div>

                {/* Card 2: Renewal Alerts (Expiring) */}
                <div className={`border rounded-2xl p-8 relative overflow-hidden transition-colors ${expiringPolicies.length > 0 ? 'bg-amber-950/20 border-amber-500/50' : 'bg-zinc-900/50 border-white/10'}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <AlertTriangle className={`w-24 h-24 ${expiringPolicies.length > 0 ? 'text-amber-500' : 'text-zinc-500'}`} />
                    </div>
                    <div className={`flex items-center gap-3 mb-2 ${expiringPolicies.length > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Renewals Due</span>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">
                        {expiringPolicies.length}
                    </div>
                    <div className="text-sm text-zinc-500">
                        Policies expiring soon
                    </div>
                </div>
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500">No insurance policies found.</p>
                    </div>
                ) : (
                    policies.map((policy) => {
                        const Icon = getInsuranceIcon(policy.category);
                        // Check if this specific policy is in the expiring list
                        const isExpiring = expiringPolicies.some(p => p.id === policy.id);

                        return (
                            <div key={policy.id} className={`bg-black border rounded-2xl p-6 transition-all duration-300 group ${isExpiring ? 'border-amber-500/50' : 'border-white/10 hover:border-indigo-500/50'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-colors ${isExpiring ? 'text-amber-500' : 'text-zinc-400 group-hover:text-indigo-500'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{policy.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 uppercase">
                                                    {policy.provider}
                                                </span>
                                                {isExpiring && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-500 uppercase border border-amber-500/20">
                                                        Expiring
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <span className="block text-xs text-zinc-500 uppercase mb-1">Coverage</span>
                                        <span className="text-xl font-bold text-white">{formatINR(policy.coverageAmount)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs text-zinc-500 uppercase mb-1">Premium</span>
                                        <span className="text-lg font-medium text-zinc-300">{formatINR(policy.premiumAmount)}</span>
                                    </div>
                                </div>

                                {/* Attribute Preview */}
                                <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-900/20 p-3 rounded-xl border border-white/5">
                                    <div className="col-span-2 text-xs text-zinc-400 font-mono mb-1">
                                        Policy #: {policy.policyNumber}
                                    </div>
                                    {policy.attributes && Object.entries(policy.attributes).slice(0, 2).map(([key, val]) => (
                                        <div key={key}>
                                            <span className="text-zinc-500 block uppercase text-[10px]">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="text-zinc-300 truncate block text-xs">{val}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                                        <Calendar className="w-3 h-3" />
                                        <span>Renew: {policy.renewalDate ? policy.renewalDate.split('T')[0] : 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(policy)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setDeletingId(policy.id); setDeleteConfirmOpen(true); }} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
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

            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-950 pb-4 border-b border-zinc-900 z-10">
                            <h3 className="text-xl font-bold text-white">
                                {editingPolicy ? 'Edit Policy' : 'New Policy'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* --- BASE FIELDS --- */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Policy Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="e.g. HDFC Life Term Plan"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Provider</label>
                                    <input
                                        name="provider"
                                        value={formData.provider}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="e.g. LIC / HDFC"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                                    >
                                        <option value="">Select...</option>
                                        {Object.keys(INSURANCE_CATEGORY_RULES).map(cat => (
                                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Policy Number</label>
                                    <input
                                        name="policyNumber"
                                        value={formData.policyNumber}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="XXX-XXX-XXX"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Premium Amount</label>
                                    <input
                                        name="premiumAmount"
                                        type="number"
                                        value={formData.premiumAmount}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Coverage Amount</label>
                                    <input
                                        name="coverageAmount"
                                        type="number"
                                        value={formData.coverageAmount}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Next Renewal Date</label>
                                    <input
                                        name="renewalDate"
                                        type="date"
                                        value={formData.renewalDate}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                            </div>

                            {/* --- DYNAMIC ATTRIBUTES (Based on Category) --- */}
                            {formData.category && INSURANCE_CATEGORY_RULES[formData.category] && (
                                <div className="pt-4 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <h4 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wider">
                                        {formData.category.replace('_', ' ')} Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {INSURANCE_CATEGORY_RULES[formData.category].map((field) => (
                                            <div key={field.key} className="col-span-1">
                                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">
                                                    {field.label}
                                                </label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        value={formData.attributes[field.key] || ''}
                                                        onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
                                                    >
                                                        <option value="">Select...</option>
                                                        {field.options.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={formData.attributes[field.key] || ''}
                                                        onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full mt-4 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                {formLoading ? 'Saving...' : 'Save Policy'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Policy?</h3>
                        <p className="text-zinc-500 text-sm mb-6">This action cannot be undone.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
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