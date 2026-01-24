import React, { useEffect, useState } from 'react';
import {
    Briefcase,
    Building2,
    Bitcoin,
    Banknote,
    Plus,
    Edit2,
    Trash2,
    X,
    Loader2,
    TrendingUp,
    RefreshCw,
    Car,
    Landmark
} from 'lucide-react';
import {
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    allAssetsAmount
} from "../../services/api.jsx";

// ============================================================================
// CONFIGURATION (Matches Java AssetAttributeRules)
// ============================================================================

// 1. Map Categories to specific field requirements
const CATEGORY_RULES = {
    REAL_ESTATE: [
        { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Pune, Maharashtra' },
        { key: 'areaSqFt', label: 'Area (Sq Ft)', type: 'number', placeholder: 'e.g. 1200' },
        { key: 'propertyType', label: 'Property Type', type: 'select', options: ['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL'] },
        { key: 'status', label: 'Status', type: 'select', options: ['SELF_OCCUPIED', 'RENTED', 'UNDER_CONSTRUCTION', 'VACANT'] }
    ],
    EQUITY: [
        { key: 'tickerSymbol', label: 'Ticker Symbol', type: 'text', placeholder: 'e.g. RELIANCE' },
        { key: 'exchange', label: 'Exchange', type: 'text', placeholder: 'NSE/BSE' },
        { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
        { key: 'avgBuyPrice', label: 'Avg Buy Price', type: 'number', placeholder: '0.00' }
    ],
    MUTUAL_FUND: [
        { key: 'fundHouse', label: 'Fund House', type: 'text', placeholder: 'e.g. HDFC' },
        { key: 'schemeName', label: 'Scheme Name', type: 'text', placeholder: 'e.g. Top 100 Fund' },
        { key: 'folioNumber', label: 'Folio Number', type: 'text', placeholder: 'Optional' },
        { key: 'units', label: 'Units', type: 'number', placeholder: '0' },
        { key: 'nav', label: 'Current NAV', type: 'number', placeholder: '0.00' }
    ],
    FIXED_INCOME: [
        { key: 'issuer', label: 'Issuer/Bank', type: 'text', placeholder: 'e.g. SBI' },
        { key: 'interestRate', label: 'Interest Rate (%)', type: 'number', placeholder: '7.5' },
        { key: 'maturityDate', label: 'Maturity Date', type: 'date', placeholder: '' },
        { key: 'accountNumber', label: 'Account No.', type: 'text', placeholder: 'XXXX' }
    ],
    CRYPTO: [
        { key: 'coinSymbol', label: 'Coin Symbol', type: 'text', placeholder: 'BTC' },
        { key: 'walletAddress', label: 'Wallet Address', type: 'text', placeholder: '0x...' },
        { key: 'network', label: 'Network', type: 'text', placeholder: 'e.g. Ethereum' },
        { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0.00' }
    ],
    VEHICLE: [
        { key: 'registrationNo', label: 'Registration No', type: 'text', placeholder: 'MH-12-...' },
        { key: 'modelYear', label: 'Model Year', type: 'number', placeholder: '2024' },
        { key: 'insuranceExpiry', label: 'Insurance Expiry', type: 'date', placeholder: '' }
    ],
    CASH: [
        { key: 'bankName', label: 'Bank Name', type: 'text', placeholder: 'e.g. ICICI' },
        { key: 'accountType', label: 'Account Type', type: 'select', options: ['SAVINGS', 'CURRENT'] }
    ]
};

// 2. Helper to determine Main Category (Financial vs Physical)
const getMainCategory = (category) => {
    const physical = ['REAL_ESTATE', 'VEHICLE', 'GOLD'];
    return physical.includes(category) ? 'PHYSICAL' : 'FINANCIAL';
};

// 3. UI Helper for Icons
const getAssetIcon = (category) => {
    switch (category) {
        case 'REAL_ESTATE': return Building2;
        case 'CRYPTO': return Bitcoin;
        case 'CASH': return Banknote;
        case 'EQUITY':
        case 'MUTUAL_FUND': return TrendingUp;
        case 'VEHICLE': return Car;
        case 'FIXED_INCOME': return Landmark;
        default: return Briefcase;
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

export default function Assets() {
    const [assets, setAssets] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [loading, setLoading] = useState(true);

    // UI State
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State (Aligned with JSON Structure)
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        currentValue: '',
        dateAcquired: new Date().toISOString().split('T')[0], // Default today
        attributes: {} // Dynamic bucket
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [listResponse, totalResponse] = await Promise.all([
                fetchAssets(),
                allAssetsAmount()
            ]);
            setAssets(listResponse.data || []);
            setTotalValue(totalResponse.data || 0);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---

    const openModal = (asset = null) => {
        setEditingAsset(asset);
        if (asset) {
            // Flatten logic if editing (assuming backend returns nested attributes)
            setFormData({
                name: asset.name,
                category: asset.category,
                currentValue: asset.currentValue || asset.value, // Handle potential naming diffs
                dateAcquired: asset.dateAcquired,
                attributes: asset.attributes || {}
            });
        } else {
            setFormData({
                name: '',
                category: '',
                currentValue: '',
                dateAcquired: new Date().toISOString().split('T')[0],
                attributes: {}
            });
        }
        setModalOpen(true);
    };

    // Handle Top Level Fields (Name, Value, Category)
    const handleMainChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            // If category changes, reset attributes
            if (name === 'category') {
                return { ...prev, category: value, attributes: {} };
            }
            return { ...prev, [name]: value };
        });
    };

    // Handle Dynamic Attribute Fields
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

        // Construct Payload matching your JSON example
        const payload = {
            name: formData.name,
            mainCategory: getMainCategory(formData.category), // Auto-calculate
            category: formData.category,
            currentValue: parseFloat(formData.currentValue),
            dateAcquired: formData.dateAcquired,
            attributes: formData.attributes
        };

        try {
            if (editingAsset) {
                await updateAsset(editingAsset.id, payload);
            } else {
                await createAsset(payload);
            }
            await loadData();
            setModalOpen(false);
        } catch (error) {
            console.error("Error saving asset:", error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteAsset(deletingId);
            await loadData();
        } catch (error) {
            console.error("Error deleting:", error);
        } finally {
            setDeleteConfirmOpen(false);
            setDeletingId(null);
        }
    };

    // --- Render ---

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight mb-2">Assets</h2>
                    <p className="text-zinc-500 text-lg">Your portfolio overview</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Asset</span>
                </button>
            </div>

            {/* Total Value Card */}
            <div className="mb-10">
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 max-w-sm">
                    <div className="flex items-center gap-3 mb-2 text-emerald-400">
                        <TrendingUp className="w-5 h-5" />
                        {/* CHANGED TEXT HERE */}
                        <span className="text-sm font-bold uppercase tracking-wider">Total Asset Value</span>
                    </div>
                    <div className="text-4xl font-bold text-white">
                        {formatINR(totalValue)}
                    </div>
                    <div className="mt-2 text-sm text-zinc-500">
                        Calculated from {assets.length} assets
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.length === 0 ? (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500">No assets found in database.</p>
                    </div>
                ) : (
                    assets.map((asset) => {
                        const Icon = getAssetIcon(asset.category);
                        return (
                            <div key={asset.id} className="bg-black border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition-colors">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{asset.name}</h3>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 uppercase">
                                                {asset.category?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span className="text-2xl font-bold text-white">
                                        {formatINR(asset.currentValue || asset.value)}
                                    </span>
                                </div>

                                {/* Mini details preview (first 2 attributes) */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {asset.attributes && Object.entries(asset.attributes).slice(0, 2).map(([key, val]) => (
                                        <div key={key} className="bg-zinc-900/30 p-2 rounded text-xs">
                                            <span className="text-zinc-500 block uppercase text-[10px]">{key}</span>
                                            <span className="text-zinc-300 truncate block">{val}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Acquired: {asset.dateAcquired}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(asset)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { setDeletingId(asset.id); setDeleteConfirmOpen(true); }} className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-500 hover:text-red-400 transition-colors">
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
                                {editingAsset ? 'Edit Asset' : 'New Asset'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* --- BASE FIELDS --- */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Asset Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                                        placeholder="e.g. My Apartment"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                                    >
                                        <option value="">Select...</option>
                                        {Object.keys(CATEGORY_RULES).map(cat => (
                                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Current Value (INR)</label>
                                    <input
                                        name="currentValue"
                                        type="number"
                                        value={formData.currentValue}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">Date Acquired</label>
                                    <input
                                        name="dateAcquired"
                                        type="date"
                                        value={formData.dateAcquired}
                                        onChange={handleMainChange}
                                        required
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                                    />
                                </div>
                            </div>

                            {/* --- DYNAMIC ATTRIBUTES (Based on Category) --- */}
                            {formData.category && CATEGORY_RULES[formData.category] && (
                                <div className="pt-4 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <h4 className="text-sm font-bold text-emerald-500 mb-3 uppercase tracking-wider">
                                        {formData.category.replace('_', ' ')} Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {CATEGORY_RULES[formData.category].map((field) => (
                                            <div key={field.key} className={field.type === 'text' && !field.options ? "col-span-1" : "col-span-1"}>
                                                <label className="text-xs text-zinc-500 uppercase font-bold ml-1 mb-1 block">
                                                    {field.label}
                                                </label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        value={formData.attributes[field.key] || ''}
                                                        onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
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
                                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
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
                                {formLoading ? 'Saving...' : 'Save Asset'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal (Same as before) */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Asset?</h3>
                        <p className="text-zinc-500 text-sm mb-6">This action cannot be undone.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setDeleteConfirmOpen(false)} className="py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">Cancel</button>
                            <button onClick={handleDelete} className="py-2 bg-red-600 text-white rounded-lg hover:bg-red-500">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}