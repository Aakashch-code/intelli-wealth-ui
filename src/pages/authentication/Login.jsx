import React, { useState } from 'react';
import { loginUser } from '../../services/api'; // Ensure path is correct
import { User, Lock, LogIn, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom'; // Assuming you use react-router-dom

export default function Login() {
    const [formData, setFormData] = useState({
        login: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            const { token, user, name, username } = response.data;

            if (token) {
                // 1. Save Token
                localStorage.setItem('token', token);

                // 2. Determine Display Name
                let displayName = formData.login;
                if (user && user.name) displayName = user.name;
                else if (name) displayName = name;
                else if (user && user.username) displayName = user.username;
                else if (username) displayName = username;

                localStorage.setItem('userName', displayName);

                // 3. Redirect
                window.location.href = '/';
            } else {
                setError('Login failed: No token received.');
            }
        } catch (err) {
            console.error("Login Error:", err);
            // Handle specific backend error messages if available
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.response && err.response.status === 401) {
                setError('Invalid username or password.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
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
                                required
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
                                required
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

                <div className="mt-8 text-center">
                    <p className="text-zinc-600 text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}