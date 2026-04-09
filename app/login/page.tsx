'use client';

import { useState } from 'react';
import { authService } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { user, error } = await authService.login(email, password);
            if (error) throw new Error(error);
            if (user) {
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long to keep your account secure.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match. Please try again.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await authService.resetPassword(email, newPassword);
            if (error) throw new Error(error);
            setResetSent(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 space-y-8 glass-morphism relative overflow-hidden">
                    {isForgotPassword ? (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
                            <button 
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setResetSent(false);
                                    setError(null);
                                }}
                                className="absolute top-8 left-8 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            
                            <div className="text-center space-y-2 mt-4">
                                <div className="inline-flex p-3 bg-indigo-100 rounded-2xl shadow-inner mb-2">
                                    {resetSent ? (
                                        <CheckCircle2 className="w-8 h-8 text-indigo-600" />
                                    ) : (
                                        <Lock className="w-8 h-8 text-indigo-600" />
                                    )}
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reset Password</h1>
                                <p className="text-slate-500">
                                    {resetSent 
                                        ? "Your password has been successfully reset. You can now log in." 
                                        : "Enter your email and your new password."}
                                </p>
                            </div>

                            {!resetSent ? (
                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            <input
                                                type="email"
                                                placeholder="name@company.com"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Confirm New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium animate-shake">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                Reset Password
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsForgotPassword(false);
                                        setResetSent(false);
                                        setEmail('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                                >
                                    Back to Login
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-left-8 fade-in duration-300">
                            <div className="text-center space-y-2">
                                <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-2">
                                    <ShieldCheck className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
                                <p className="text-slate-500">Login to your PrivaGuard account</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="name@company.com"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end pt-1">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsForgotPassword(true)}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-all"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium animate-shake">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            Sign In
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-sm text-slate-500">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-indigo-600 font-bold hover:underline underline-offset-4">
                                    Create account
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
