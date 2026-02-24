import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, LayoutGrid, ChevronDown, LogIn, ShieldCheck, UserPlus, ArrowLeft, Sun, Moon } from 'lucide-react'
import { supabase } from '../lib/supabase'

function SignIn({ onSignIn, isDarkMode, toggleDarkMode }) {
    const [isSignUp, setIsSignUp] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [department, setDepartment] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            department: department
                        }
                    }
                })
                if (error) throw error
                alert('Sign up successful! Please check your email for verification.')
                setIsSignUp(false)
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                onSignIn()
            }
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
            {/* Background with Church Interior Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 scale-105"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1548625361-195fe6144df8?q=80&w=2000&auto=format&fit=crop")',
                    filter: `blur(4px) ${isDarkMode ? 'brightness(0.4)' : 'brightness(0.8)'}`
                }}
            >
                <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? 'from-blue-900/40 via-blue-950/60 to-slate-950/90' : 'from-blue-600/20 via-white/40 to-white/90'}`} />
            </div>

            {/* Theme Toggle in Top Right */}
            <button
                onClick={toggleDarkMode}
                className={`absolute top-6 right-6 z-20 p-3 rounded-2xl transition-all shadow-xl backdrop-blur-md border ${isDarkMode ? 'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10' : 'bg-white/80 border-slate-200 text-amber-600 hover:bg-white'}`}
            >
                {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
            </button>

            {/* Main Container */}
            <main className="relative z-10 w-full max-w-[400px] px-6 py-8 flex flex-col items-center min-h-screen md:min-h-0">

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10 mt-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="w-20 h-20 bg-emerald-900/30 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
                            <path d="M9 21v-4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4" />
                            <path d="M10 7h4" />
                            <path d="M10 11h4" />
                            <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-1 text-center">Management Portal</h1>
                    <div className="w-12 h-1 bg-white/20 rounded-full mb-2" />
                </div>

                {/* Glassmorphism Login Card */}
                <div className={`w-full ${isDarkMode ? 'glass-card border-white/10' : 'bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-2xl shadow-slate-900/10'} p-8 rounded-3xl border animate-in fade-in zoom-in-95 duration-700`}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                        {isSignUp && (
                            <button onClick={() => setIsSignUp(false)} className="text-white/40 hover:text-white transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {isSignUp && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none text-sm`}
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none text-sm`}
                                    placeholder="Email Address"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none text-sm`}
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/30 hover:text-white' : 'text-slate-400 hover:text-slate-600'} transition-colors`}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Department Selection */}
                        <div className="space-y-2">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors">
                                    <LayoutGrid size={18} />
                                </div>
                                <select
                                    required
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className={`w-full ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} rounded-2xl py-4 pl-12 pr-10 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none appearance-none text-sm`}
                                >
                                    <option value="" disabled className={isDarkMode ? 'bg-slate-900 text-white/40' : 'bg-white text-slate-400'}>Select Department</option>
                                    <option value="administration" className={isDarkMode ? 'bg-slate-900' : 'bg-white'}>Administration</option>
                                    <option value="security" className={isDarkMode ? 'bg-slate-900' : 'bg-white'}>Security</option>
                                    <option value="maintenance" className={isDarkMode ? 'bg-slate-900' : 'bg-white'}>Maintenance</option>
                                    <option value="outreach" className={isDarkMode ? 'bg-slate-900' : 'bg-white'}>Outreach</option>
                                </select>
                                <div className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/30' : 'text-slate-400'} pointer-events-none`}>
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>

                        {!isSignUp && (
                            <div className="flex justify-end">
                                <a href="#" className="text-xs font-medium text-white/40 hover:text-blue-400 transition-colors tracking-wide">
                                    Forgot Password?
                                </a>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full ${isSignUp ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_8px_30px_rgb(16,185,129,0.3)]' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_8px_30px_rgb(37,99,235,0.3)]'} text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] overflow-hidden flex items-center justify-center gap-2`}
                        >
                            <span className="relative z-10 uppercase tracking-widest text-sm">{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
                            {isSignUp ? <UserPlus size={18} className="relative z-10" /> : <LogIn size={18} className="relative z-10" />}
                        </button>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="mt-12 text-center text-sm">
                    {!isSignUp ? (
                        <p className={`${isDarkMode ? 'text-white/60' : 'text-slate-500'} mb-10`}>
                            New staff member? <button onClick={() => setIsSignUp(true)} className={`${isDarkMode ? 'text-white' : 'text-blue-600'} font-bold hover:underline underline-offset-4`}>Create an account</button>
                        </p>
                    ) : (
                        <p className={`${isDarkMode ? 'text-white/60' : 'text-slate-500'} mb-10`}>
                            Already have an account? <button onClick={() => setIsSignUp(false)} className={`${isDarkMode ? 'text-white' : 'text-blue-600'} font-bold hover:underline underline-offset-4`}>Sign in here</button>
                        </p>
                    )}

                    <div className="space-y-3 opacity-40 hover:opacity-100 transition-opacity duration-500">
                        <div className={`flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-500'}`}>
                            <a href="#" className="hover:text-blue-400 transition-colors ">Privacy Policy</a>
                            <span className={isDarkMode ? 'text-white/20' : 'text-slate-300'}>•</span>
                            <a href="#" className="hover:text-blue-400 transition-colors ">Terms of Service</a>
                        </div>
                        <p className={`text-[10px] uppercase tracking-widest ${isDarkMode ? 'text-white/60' : 'text-slate-400'} font-medium`}>
                            V2.4.0 • THE ROCK CHURCH
                        </p>
                        <div className="flex gap-4 justify-center text-[10px] font-bold uppercase text-blue-500/50">
                            <span>URL: {import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING'}</span>
                            <span>KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'OK' : 'MISSING'}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default SignIn
