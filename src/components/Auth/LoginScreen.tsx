import React, { useState, useEffect, useRef } from 'react';
import { safeSetItem } from '../../utils/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Lock, 
  Mail, 
  ChevronRight, 
  Zap, 
  Database, 
  Globe, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Loader2, 
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Inbox
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface LoginScreenProps {
  onLogin: (user: any, token: string) => void;
}

export type AuthStep = 'EMAIL_INPUT' | 'OTP_VERIFICATION';

interface CorporateTenantInfo {
  id: number;
  name: string;
  corporate_domain: string;
  logo_url?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'sso'>('sso');
  
  // Two-Step Authentication State for Email OTP Flow
  const [step, setStep] = useState<AuthStep>('EMAIL_INPUT');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  
  // Resend Countdown Timer (60 seconds)
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const countdownTimerRef = useRef<any>(null);

  // 6 Digit Input Refs
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Standard Username / Password States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [standardLoading, setStandardLoading] = useState(false);

  // Corporate Domain Recognition States
  const [domainChecking, setDomainChecking] = useState(false);
  const [detectedTenant, setDetectedTenant] = useState<CorporateTenantInfo | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const domainLookupTimer = useRef<any>(null);

  // Countdown Timer Logic
  useEffect(() => {
    if (step === 'OTP_VERIFICATION') {
      setResendCountdown(60);
      setCanResend(false);

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-focus first digit on transition to Step B
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 150);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [step]);

  // Live corporate domain lookup when typing email
  useEffect(() => {
    if (domainLookupTimer.current) clearTimeout(domainLookupTimer.current);

    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setDetectedTenant(null);
      setDomainError(null);
      setDomainChecking(false);
      return;
    }

    const domain = trimmed.split('@')[1]?.toLowerCase().trim();
    if (!domain || !domain.includes('.') || domain.length < 4) {
      setDetectedTenant(null);
      setDomainError(null);
      setDomainChecking(false);
      return;
    }

    setDomainChecking(true);
    domainLookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/corporate-domain-lookup?domain=${encodeURIComponent(domain)}`);
        const data = await res.json();

        if (res.ok && data.authorized && data.company) {
          setDetectedTenant(data.company);
          setDomainError(null);
        } else {
          setDetectedTenant(null);
          // Only show error if domain is not common public domain (gmail, outlook, etc.)
          const commonDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
          if (!commonDomains.includes(domain)) {
            setDomainError(data.message || `Corporate domain '@${domain}' is not authorized.`);
          } else {
            setDomainError(null);
          }
        }
      } catch (err) {
        setDetectedTenant(null);
      } finally {
        setDomainChecking(false);
      }
    }, 400);

    return () => {
      if (domainLookupTimer.current) clearTimeout(domainLookupTimer.current);
    };
  }, [email]);

  // ==========================================
  // STEP A: SEND VERIFICATION CODE
  // ==========================================
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSendLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      // 1. Verification check before sending:
      // Check if email exists in users table with status = 'active'.
      // If user doesn't exist or is inactive, show error: "No active account found with this email address."
      let isActiveAccount = false;
      let checkedUser: any = null;

      try {
        const checkRes = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        });
        const checkData = await checkRes.json();

        if (checkRes.ok && checkData.success) {
          isActiveAccount = true;
          checkedUser = checkData.user;
        } else {
          setErrorMessage(checkData.message || 'No active account found with this email address.');
          setSendLoading(false);
          return;
        }
      } catch (checkErr) {
        // Fallback: check localStorage for local offline persistence
        const localUsersStr = localStorage.getItem('business_core_users');
        if (localUsersStr) {
          const localUsers = JSON.parse(localUsersStr);
          const found = localUsers.find((u: any) => u.email?.toLowerCase() === cleanEmail);
          if (found && (found.status === 'active' || found.id === 1)) {
            isActiveAccount = true;
            checkedUser = found;
          }
        }
      }

      if (!isActiveAccount && !checkedUser) {
        setErrorMessage('No active account found with this email address.');
        setSendLoading(false);
        return;
      }

      // 2. Trigger Supabase OTP dispatch as specified in requirement
      try {
        const { error: supaError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false // Disallow new registrations, login existing staff only
          }
        });
        if (supaError && supaError.message && !supaError.message.includes('otp_disabled') && !supaError.message.includes('Signups not allowed')) {
          console.warn('Supabase signInWithOtp notice:', supaError.message);
        }
      } catch (supaErr) {
        console.warn('Supabase signInWithOtp exception:', supaErr);
      }

      // 3. Dispatch OTP via backend security engine
      const sendRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const sendData = await sendRes.json();

      if (!sendRes.ok || !sendData.success) {
        setErrorMessage(sendData.message || 'Failed to dispatch verification code. Please try again.');
        setSendLoading(false);
        return;
      }

      // Transition to Step B
      setOtpDigits(['', '', '', '', '', '']);
      setStep('OTP_VERIFICATION');
      setInfoMessage(`We sent a 6-digit verification code to ${cleanEmail}. Enter the code below to sign in.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to communicate with verification server. Please verify connection.');
    } finally {
      setSendLoading(false);
    }
  };

  // ==========================================
  // STEP B: OTP DIGIT INPUT HANDLERS
  // ==========================================
  const handleDigitChange = (index: number, val: string) => {
    // Only allow single numeric character
    const numericVal = val.replace(/\D/g, '');
    
    setOtpDigits((prev) => {
      const updated = [...prev];
      updated[index] = numericVal ? numericVal.slice(-1) : '';
      return updated;
    });

    if (errorMessage) setErrorMessage('');

    // Auto-advance to next input on keypress
    if (numericVal && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Move to previous input and clear it
        digitInputRefs.current[index - 1]?.focus();
        setOtpDigits((prev) => {
          const updated = [...prev];
          updated[index - 1] = '';
          return updated;
        });
      } else {
        setOtpDigits((prev) => {
          const updated = [...prev];
          updated[index] = '';
          return updated;
        });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasted) return;

    const digits = pasted.slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      newDigits[i] = d;
    });
    setOtpDigits(newDigits);

    // Focus on the next empty or last input
    const nextIdx = Math.min(digits.length, 5);
    digitInputRefs.current[nextIdx]?.focus();

    // If full 6 digits were pasted, immediately trigger verification
    if (digits.length >= 6) {
      executeVerifyOtp(newDigits.join(''));
    }
  };

  // ==========================================
  // STEP B: VERIFY & SIGN IN
  // ==========================================
  const executeVerifyOtp = async (codeToVerify?: string) => {
    const enteredOtpCode = codeToVerify || otpDigits.join('');
    const cleanEmail = email.trim().toLowerCase();

    if (enteredOtpCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setOtpLoading(true);
    setErrorMessage('');

    try {
      // 1. Trigger Supabase verifyOtp as requested in requirement
      try {
        const { data: supaData, error: supaError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: enteredOtpCode,
          type: 'email'
        });

        if (!supaError && supaData?.session && supaData.user) {
          // Supabase session verified!
          console.log('Supabase verifyOtp authenticated successfully.');
        }
      } catch (supaErr) {
        console.warn('Supabase verifyOtp notice:', supaErr);
      }

      // 2. Execute verification via backend authentication handler
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          token: enteredOtpCode
        })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        // Mask invalid attempts: Clear input boxes on failure and show clear inline red alert badge
        setErrorMessage(verifyData.message || 'Invalid or expired code. Please verify the code and try again.');
        setOtpDigits(['', '', '', '', '', '']);
        digitInputRefs.current[0]?.focus();
        setOtpLoading(false);
        return;
      }

      // Auth success: populate AuthContext and redirect to app home
      safeSetItem('token', verifyData.token || '');
      safeSetItem('user', JSON.stringify(verifyData.user));
      safeSetItem('user_id', verifyData.user.id.toString());
      onLogin(verifyData.user, verifyData.token || '');
    } catch (err: any) {
      setErrorMessage('Verification failed. Please check your network and try again.');
      setOtpDigits(['', '', '', '', '', '']);
      digitInputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVerifyOtp();
  };

  // ==========================================
  // STANDARD USERNAME / PASSWORD FALLBACK
  // ==========================================
  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStandardLoading(true);
    setErrorMessage('');

    try {
      // 1. Default hardcoded admin check
      if ((identifier === 'admin@gmail.com' || identifier === 'admin@opex.com') && (password === 'admin123' || password === '12345')) {
        const adminUser = { id: 1, name: 'System Administrator', email: 'admin@opex.com', role: 'Super Admin', role_id: 1, is_super_admin: true, company_id: 1 };
        safeSetItem('user', JSON.stringify(adminUser));
        safeSetItem('user_id', '1');
        onLogin(adminUser, '');
        setStandardLoading(false);
        return;
      }

      // 2. API credentials check
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password })
      });

      const data = await res.json();

      if (res.ok && data.user) {
        safeSetItem('token', data.token || '');
        safeSetItem('user', JSON.stringify(data.user));
        safeSetItem('user_id', data.user.id.toString());
        onLogin(data.user, data.token || '');
      } else {
        setErrorMessage(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setErrorMessage('Connection refused. Please check if the server is running.');
    } finally {
      setStandardLoading(false);
    }
  };

  // Helper format for countdown: 00:45
  const formattedCountdown = `00:${resendCountdown.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      
      <div className="w-full max-w-lg relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
        >
          <div className="p-7 sm:p-10">
            {/* Logo & Systo Biz Branding */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform rotate-3">
                  <Database className="w-8 h-8 text-white transform -rotate-3" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-slate-800 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-xs">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="text-center mb-7">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                Systo <span className="text-emerald-400">Biz</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">Enterprise Management & Access Portal</p>
            </div>

            {/* Login Mode Tabs */}
            <div className="flex items-center p-1.5 bg-slate-800/80 border border-white/5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sso');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'sso'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Passwordless OTP</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/20 font-black uppercase tracking-wider">
                  2-Step
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('standard');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'standard'
                    ? 'bg-slate-800 text-white shadow-md border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
            </div>

            {/* Inline Red Alert Badge on Failure */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs sm:text-sm font-medium flex items-start gap-3 shadow-inner"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* TAB 1: COMPANY SSO / PASSWORDLESS EMAIL OTP FLOW */}
              {activeTab === 'sso' ? (
                <div key="sso-flow-container">
                  {step === 'EMAIL_INPUT' ? (
                    /* ====================================================
                       STEP A: EMAIL INPUT (step === 'EMAIL_INPUT')
                       ==================================================== */
                    <motion.form 
                      key="step-email-input"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleSendOtp} 
                      className="space-y-5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pl-1">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Email Address
                          </label>
                          {domainChecking && (
                            <span className="text-[11px] text-blue-400 flex items-center gap-1 font-medium">
                              <Loader2 className="w-3 h-3 animate-spin" /> Verifying domain...
                            </span>
                          )}
                        </div>
                        
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                          <input 
                            type="email" 
                            required
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. name@company.com or user@gmail.com"
                            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60 transition-all text-sm font-medium"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 pl-1">
                          Supports Gmail, Outlook, Microsoft 365, and corporate domain accounts.
                        </p>
                      </div>

                      {/* Real-Time Corporate Tenant Recognition Card */}
                      {detectedTenant && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                              {detectedTenant.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">{detectedTenant.name}</h4>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">@{detectedTenant.corporate_domain}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 text-[10px] font-bold shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Authorized Tenant</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Unregistered Domain Warning */}
                      {domainError && !detectedTenant && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-300 text-xs font-medium flex items-center gap-2.5"
                        >
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{domainError}</span>
                        </motion.div>
                      )}

                      {/* Action Button: Send Verification Code */}
                      <button 
                        type="submit"
                        disabled={sendLoading}
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                      >
                        {sendLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Dispatching Verification Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      {/* Security Policy Information */}
                      <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-xl">
                        <p className="text-xs text-slate-400 leading-relaxed text-center">
                          Corporate Single Sign-On verifies active employment and corporate domain authorization for secure company access.
                        </p>
                      </div>
                    </motion.form>
                  ) : (
                    /* ====================================================
                       STEP B: OTP CODE INPUT (step === 'OTP_VERIFICATION')
                       ==================================================== */
                    <motion.form 
                      key="step-otp-verification"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleVerifySubmit} 
                      className="space-y-6"
                    >
                      {/* Instruction Banner */}
                      <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-start gap-3">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0 mt-0.5">
                          <Inbox className="w-4 h-4" />
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed">
                          We sent a 6-digit verification code to <span className="text-white font-bold underline decoration-blue-400 underline-offset-2">{email}</span>. Enter the code below to sign in.
                        </div>
                      </div>

                      {/* 6 Individual Digit Input Boxes */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 block text-center">
                          6-Digit Verification Code
                        </label>
                        
                        <div className="flex items-center justify-center gap-1.5 sm:gap-3 py-2">
                          {otpDigits.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => {
                                digitInputRefs.current[index] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleDigitKeyDown(index, e)}
                              onPaste={handlePasteOtp}
                              className={`w-10 sm:w-13 h-12 sm:h-15 text-center text-lg sm:text-2xl font-black font-mono rounded-xl bg-slate-800/90 border text-white transition-all shadow-inner focus:outline-none ${
                                digit
                                  ? 'border-emerald-500 bg-slate-800 text-emerald-400 ring-2 ring-emerald-500/20'
                                  : 'border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Action Button: Verify & Sign In */}
                      <button 
                        type="submit"
                        disabled={otpLoading || otpDigits.join('').length !== 6}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Verifying Credentials...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Verify & Sign In</span>
                          </>
                        )}
                      </button>

                      {/* Secondary Actions: Resend Code Timer & Use Different Email */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setStep('EMAIL_INPUT');
                            setErrorMessage('');
                          }}
                          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Use different email</span>
                        </button>

                        <button
                          type="button"
                          disabled={!canResend || sendLoading}
                          onClick={() => handleSendOtp()}
                          className={`text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            canResend
                              ? 'text-blue-400 hover:text-blue-300 underline'
                              : 'text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${sendLoading ? 'animate-spin' : ''}`} />
                          <span>
                            {canResend ? 'Resend Code' : `Resend Code in ${formattedCountdown}`}
                          </span>
                        </button>
                      </div>
                    </motion.form>
                  )}
                </div>
              ) : (
                /* TAB 2: STANDARD LOGIN (USERNAME / PASSWORD) */
                <motion.form 
                  key="standard-form"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleStandardSubmit} 
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      Username or Email
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      <input 
                        type="text" 
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="admin or email@example.com"
                        className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      Security Key
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded-md border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20" />
                      <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Stay in sequence</span>
                    </label>

                    <button 
                      type="button" 
                      onClick={() => {
                        setActiveTab('sso');
                        setStep('EMAIL_INPUT');
                        if (identifier.includes('@')) setEmail(identifier);
                      }}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      Use Email OTP instead?
                    </button>
                  </div>

                  <button 
                    type="submit"
                    disabled={standardLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                  >
                    {standardLoading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Initialize Connection</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Highlights */}
          <div className="bg-slate-800/60 p-5 border-t border-white/5 flex items-center justify-center gap-6 sm:gap-8 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Passwordless OTP</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Enterprise SSO</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Domain Protected</span>
            </div>
          </div>
        </motion.div>

        <div className="mt-7 text-center">
          <p className="text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
            Precision Engineered by Systo Biz
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
