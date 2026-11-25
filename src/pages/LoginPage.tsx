import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { DEMO_CREDENTIALS } from '../services/storageService';
import { BrandLogo } from '../components/ui/BrandLogo';

const LOGIN_HERO_IMAGE = '/src/assets/images/medicare_login_atrium_1795194287313.jpg';

export function LoginPage() {
  const { login, settings } = useHospital();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [heroError, setHeroError] = useState(false);

  const validate = (): boolean => {
    const nextErrors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    const result = login(email, password);
    if (!result.success) {
      setError(result.error || 'Authentication failed.');
    }
  };

  const fillDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setFieldErrors({});
    setError('');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#F4F6F9]">
      {/* Left Architectural Editorial Panel */}
      <div className="relative hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between overflow-hidden bg-[#0F2544] p-10 text-white">
        {!heroError ? (
          <img
            src={LOGIN_HERO_IMAGE}
            alt="MediCare Hospital sunlit architectural atrium"
            referrerPolicy="no-referrer"
            onError={() => setHeroError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#09172B] via-[#0F2544] to-[#1E4478]" />
        )}
        {/* Measured contrast scrim ensuring > 4.5:1 legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#09172B]/95 via-[#0F2544]/78 to-[#09172B]/55"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <BrandLogo variant="light" />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1
            className="font-display text-3xl xl:text-4xl font-bold tracking-tight leading-[1.15] text-white"
            style={{ textWrap: 'balance' }}
          >
            Clinical Operations &amp; Patient Care Registry
          </h1>
          <p className="text-sm leading-relaxed text-slate-200">
            Coordinate outpatient doctors, patient profiles, conflict-checked appointment
            schedules, medical records, and consultation fee billing inside a unified hospital
            administration console.
          </p>

          <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-xs">
            <div>
              <p className="font-display font-semibold text-white">Doctor Roster</p>
              <p className="mt-1 text-slate-300">5 specialty categories</p>
            </div>
            <div>
              <p className="font-display font-semibold text-white">Smart Booking</p>
              <p className="mt-1 text-slate-300">Slot conflict checks</p>
            </div>
            <div>
              <p className="font-display font-semibold text-white">Fee Billing</p>
              <p className="mt-1 text-slate-300">Printable receipts</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-300/80">
          {settings.hospitalName} · Frontend Demo Administration Portal
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex flex-col items-center justify-center lg:col-span-7 xl:col-span-7 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo variant="dark" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9 shadow-sm">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F2544]">
                Administrator Sign In
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Sign in to manage hospital schedules, patient records, and consultation billing.
              </p>
            </div>

            {error && (
              <div
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-[#0F2544]"
                >
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                    }}
                    placeholder="admin@medicare.org"
                    className={`h-11 w-full rounded-lg border pl-10 pr-4 text-sm text-[#0F1E36] placeholder:text-slate-400 focus:outline-none transition-colors ${
                      fieldErrors.email
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                        : 'border-slate-300 bg-white focus:border-[#2563EB]'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-[#0F2544]"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password)
                        setFieldErrors((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="Enter your password"
                    className={`h-11 w-full rounded-lg border pl-10 pr-11 text-sm text-[#0F1E36] placeholder:text-slate-400 focus:outline-none transition-colors ${
                      fieldErrors.password
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                        : 'border-slate-300 bg-white focus:border-[#2563EB]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0F2544] px-4 text-sm font-semibold text-white hover:bg-[#16335B] transition-colors whitespace-nowrap"
              >
                Sign In to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Demo Login Credentials Card */}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2544]">
                  <KeyRound className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
                  Demo Login Credentials
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline whitespace-nowrap"
                >
                  Fill Credentials
                </button>
              </div>
              <div className="mt-2.5 rounded-lg bg-[#F8FAFC] border border-slate-200/80 px-3.5 py-2.5 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Email</span>
                  <span className="font-mono font-medium text-[#0F2544] select-all">
                    {DEMO_CREDENTIALS.email}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Password</span>
                  <span className="font-mono font-medium text-[#0F2544] select-all">
                    {DEMO_CREDENTIALS.password}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
                Demo-only local authentication stored in browser localStorage. No external server
                connection required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
