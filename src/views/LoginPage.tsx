import React, { useState } from 'react';
import {
  Sun,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Clock,
  UserPlus,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  Zap,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, registerEmployee } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Employee Sign Up Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Electrical Maintenance');
  const [phone, setPhone] = useState('+63 9');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [emailConflict, setEmailConflict] = useState(false);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Employee Registration
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailConflict(false);

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both passwords.');
      return;
    }

    if (signupPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);

    try {
      await registerEmployee({
        full_name: fullName.trim(),
        email: email.trim(),
        password: signupPassword.trim(),
        employee_id: employeeId.trim() || undefined,
        department,
        phone: phone.trim(),
      });
      // Context will auto-login newly created employee into field terminal
    } catch (err: any) {
      const msg = err.message || 'Failed to register employee';
      setError(msg);
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('used email')) {
        setEmailConflict(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* Background Solar Farm Photo with Multi-Stage Cinematic Overlays */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20 transition-transform duration-1000 scale-100"
        style={{
          backgroundImage: "url('/assets/aistudio/solar_panel_24057600.jpg')",
        }}
      />
      
      {/* Darkening & Color Tint Overlays for optimal contrast and warmth */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/90 -z-10 backdrop-blur-[2px]" />
      <div className="fixed inset-0 bg-radial from-amber-500/10 via-transparent to-slate-950/60 -z-10 pointer-events-none" />

      {/* Top Bar Status Info */}
      <header className="w-full px-4 sm:px-8 pt-4 pb-2 z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full text-xs">
          <div className="flex items-center gap-2 text-slate-300/90 font-mono bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Kirahon, Misamis Oriental (PHT, UTC+8)</span>
          </div>

          <div className="flex items-center gap-2 font-mono bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800/80 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-emerald-400 font-bold tracking-tight">Solar Plant Active</span>
            <span className="hidden sm:inline text-slate-500 font-normal">·</span>
            <span className="hidden sm:inline text-slate-400 text-[11px]">Grid Synchronized</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-6 sm:py-10 z-10">
        <div className={`w-full transition-all duration-300 ${authMode === 'signup' ? 'max-w-lg' : 'max-w-md'}`}>
          <div className="bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] relative overflow-hidden ring-1 ring-white/10">
            {/* Top Amber Highlight Accent Bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 opacity-80" />

            {/* Subtle Ambient Glows */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Plant Brand Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 mb-1 ring-2 ring-amber-300/30">
                <Sun className="w-8 h-8 animate-[spin_25s_linear_infinite]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Solar Panel <span className="text-amber-400">Power Plant</span>
              </h1>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300/90 font-mono">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Kirahon, Misamis Oriental · Maintenance Management System</span>
              </div>
            </div>

            {/* Auth Mode Tabs Toggle */}
            <div className="flex p-1 bg-slate-950/90 rounded-2xl border border-slate-800/90 mb-6 text-xs font-semibold shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                  setEmailConflict(false);
                }}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                  setEmailConflict(false);
                }}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Employee Sign Up</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 shadow-sm animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* 1. SIGN IN FORM MODE */}
            {/* ======================================================== */}
            {authMode === 'signin' ? (
              <div>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
                      Username or Employee ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username or ID"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Plant MMS</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    New technician or maintenance staff?{' '}
                    <span className="text-cyan-400 hover:underline font-semibold ml-1">
                      Create Employee Account
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* 2. EMPLOYEE SIGN UP FORM MODE */
              /* ======================================================== */
              <div>
                <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
                  {/* Full Name */}
                  <div>
                    <label className="block text-slate-300 font-mono text-[11px] mb-1 font-medium">
                      Employee Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Elena Santos"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email (Strict Uniqueness) */}
                  <div>
                    <label className="block text-slate-300 font-mono text-[11px] mb-1 font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="e.g. elena.santos@sunpeak.ph"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailConflict(false);
                        }}
                        className={`w-full pl-10 pr-3 py-2 bg-slate-950/80 border rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-hidden transition-all ${
                          emailConflict
                            ? 'border-rose-500 ring-2 ring-rose-500/30'
                            : 'border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20'
                        }`}
                      />
                    </div>
                    {emailConflict && (
                      <span className="text-[10px] font-mono text-rose-400 mt-1 block font-medium">
                        ⚠ This email is already in use. Please enter a different email address.
                      </span>
                    )}
                  </div>

                  {/* Department & Employee ID Row (Aligned) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-mono text-[11px] mb-1 font-medium">
                        Department / Specialty
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all h-[38px] cursor-pointer"
                        >
                          <option value="Electrical Maintenance">Electrical Maintenance</option>
                          <option value="Inverter & Instrumentation">Inverter & Instrumentation</option>
                          <option value="Solar PV Array & DC Systems">PV Array & DC Systems</option>
                          <option value="High Voltage & Substation">High Voltage & Substation</option>
                          <option value="SCADA & Weather Station">SCADA & Weather Station</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-mono text-[11px] mb-1 font-medium">
                        Employee ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <BadgeCheck className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. EMP-TEC-105"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all h-[38px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-slate-300 font-mono text-[11px] mb-1 font-medium">
                      Contact Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        placeholder="+63 918 555 2002"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-mono text-[11px] mb-1 font-medium">
                        Password (min 4 chars)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full pl-10 pr-8 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          tabIndex={-1}
                          aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-mono text-[11px] mb-1 font-medium">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-hidden focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Sign Up Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Validating & Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Employee Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setError(null);
                    }}
                    className="text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Already have an account?{' '}
                    <span className="text-amber-400 hover:underline font-semibold ml-1">
                      Sign In to Account
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-3 z-10 text-center">
        <div className="text-[11px] font-mono text-slate-400/90 max-w-lg mx-auto bg-slate-950/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/80 shadow-sm">
          <span>Solar Panel Power Plant · Kirahon, Misamis Oriental</span>
          <span className="mx-1.5 opacity-40">|</span>
          <span className="text-amber-400/90">Authorized Plant Personnel Only</span>
        </div>
      </footer>
    </div>
  );
};
