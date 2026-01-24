import React, { useState } from 'react';
import { loginUser } from '../../services/api.jsx';
import { User, Lock, LogIn, Loader2, AlertCircle, ArrowRight, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export default function Login() {
    // --- Standard Login State ---
    const [formData, setFormData] = useState({
        login: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Developer / Test Mode State ---
    const [showDevTools, setShowDevTools] = useState(false);
    const [manualToken, setManualToken] = useState('');

    // --- Standard Handlers ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await loginUser(formData);

            // Destructure possible fields from your API response
            // Adjust this based on what your specific API actually returns
            const { token, user, name, username } = response.data;

            if (token) {
                // 1. Save Token
                localStorage.setItem('token', token);

                // 2. Determine Display Name
                // Priority: user object name > direct name > direct username > what user typed in form
                let displayName = formData.login; // Default fallback

                if (user && user.name) displayName = user.name;
                else if (name) displayName = name;
                else if (user && user.username) displayName = user.username;
                else if (username) displayName = username;

                // 3. Save Name for Sidebar to use
                localStorage.setItem('userName', displayName);

                // 4. Redirect
                window.location.href = '/';
            } else {
                setError('Login failed: No token received.');
            }
        } catch (err) {
            console.error("Login Error:", err);
            if (err.response && err.response.status === 401) {
                setError('Invalid username or password.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Developer Handler ---
    const handleManualLogin = () => {
        if (!manualToken.trim()) {
            setError('Please enter a token first.');
            return;
        }
        // Force save token and dummy name
        localStorage.setItem('token', manualToken.trim());
        localStorage.setItem('userName', 'Dev User'); // Set a default name for Dev mode
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Login Card */}
            <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800 text-emerald-400">
                        <LogIn className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome back</h1>
                    <p className="text-zinc-500">Enter your credentials to access IntelliWealth</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Username or Email
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                            <input
                                type="text"
                                name="login"
                                value={formData.login}
                                onChange={handleChange}
                                placeholder="Enter your ID"
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Password
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center pb-4 border-b border-white/5">
                    <p className="text-zinc-600 text-sm">
                        Don't have an account?{' '}
                        <a href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                            Create one
                        </a>
                    </p>
                </div>

                {/* Developer / Test Mode Section */}
                <div className="mt-6">
                    <button
                        onClick={() => setShowDevTools(!showDevTools)}
                        className="w-full flex items-center justify-between px-4 py-2 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <Terminal className="w-3 h-3" />
                            <span className="uppercase tracking-wider font-bold">Developer Override</span>
                        </div>
                        {showDevTools ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showDevTools && (
                        <div className="mt-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-in slide-in-from-top-2">
                            <p className="text-xs text-zinc-500 mb-2">Paste a valid raw Bearer token to bypass login:</p>
                            <textarea
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                className="w-full h-20 bg-black border border-zinc-800 rounded-lg p-2 text-[10px] font-mono text-emerald-500 focus:outline-none focus:border-emerald-500/50 resize-none mb-3"
                            />
                            <button
                                onClick={handleManualLogin}
                                className="w-full bg-zinc-800 hover:bg-emerald-900/30 hover:text-emerald-400 text-zinc-400 text-xs font-bold py-2 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                            >
                                Force Auth with Token
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}