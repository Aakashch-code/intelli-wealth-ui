import React, { useState } from 'react';
import { registerUser } from '../../services/api';
import { User, Lock, Mail, UserPlus, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
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
            await registerUser(formData);
            // On success, redirect to login
            navigate('/login');
        } catch (err) {
            console.error("Registration Error:", err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Register Card */}
            <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800 text-purple-400">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create Account</h1>
                    <p className="text-zinc-500">Join IntelliWealth today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Username
                        </label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="ak81"
                                required
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:bg-zinc-900 transition-all"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Email Address
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ak@example.com"
                                required
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:bg-zinc-900 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Password
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a strong password"
                                required
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:bg-zinc-900 transition-all"
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
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Get Started</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-zinc-600 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}