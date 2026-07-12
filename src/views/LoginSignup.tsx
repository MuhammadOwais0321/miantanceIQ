/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db } from '../utils/db';
import { UserRole } from '../types';
import { Shield, Key, Eye, EyeOff, CheckCircle2, UserPlus, LogIn, Chrome } from 'lucide-react';

interface LoginSignupProps {
  currentPath: string; // e.g. '#/login', '#/signup', '#/admin/login', '#/worker/login'
  onLoginSuccess: (user: any) => void;
}

export default function LoginSignup({ currentPath, onLoginSuccess }: LoginSignupProps) {
  const isSignup = currentPath === '#/signup';
  const isAdminPortal = currentPath === '#/admin/login';
  const isWorkerPortal = currentPath === '#/worker/login';
  const isPublicPortal = currentPath === '#/login' || isSignup;

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Determine standard role based on page
  let targetRole: UserRole = 'public';
  if (isAdminPortal) targetRole = 'admin';
  if (isWorkerPortal) targetRole = 'worker';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Minor delay to give rich feel
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      if (isSignup) {
        // Handle signup validation
        if (!name || !email || !password) {
          throw new Error('Please fill in all fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const newUser = db.createUser({
          name,
          email,
          passwordHash: password,
          role: 'public',
          status: 'active',
        });

        setSuccess('Account created successfully! Logging you in...');
        setTimeout(() => {
          onLoginSuccess(newUser);
          window.location.hash = '#/';
        }, 1000);
      } else {
        // Handle login validation
        if (!email || !password) {
          throw new Error('Please provide both email and password.');
        }

        const users = db.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user || user.passwordHash !== password) {
          throw new Error('Invalid email or password.');
        }

        if (user.status === 'suspended') {
          throw new Error('Your account has been suspended. Please contact an administrator.');
        }

        // Validate portal access roles
        if (isAdminPortal && user.role !== 'admin') {
          throw new Error('Access denied. This portal is for Administrators only.');
        }
        if (isWorkerPortal && user.role !== 'worker') {
          throw new Error('Access denied. This portal is for Technicians only.');
        }
        if (isPublicPortal && user.role !== 'public') {
          throw new Error('Standard users only. Admins and Workers should log in via their respective portals.');
        }

        setSuccess('Authentication successful! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(user);
          // Redirect appropriately
          if (user.role === 'admin') window.location.hash = '#/admin/dashboard';
          else if (user.role === 'worker') window.location.hash = '#/worker/dashboard';
          else window.location.hash = '#/';
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate OAuth login
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const gUser = {
        name: 'John Google Demo',
        email: 'john.google@gmail.com',
        role: 'public' as UserRole,
        status: 'active' as const,
      };

      // Check if user exists, otherwise create
      const users = db.getUsers();
      let user = users.find(u => u.email === gUser.email);
      if (!user) {
        user = db.createUser({
          name: gUser.name,
          email: gUser.email,
          passwordHash: 'google-oauth-mock-pass',
          role: 'public',
          status: 'active',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        });
      }

      setSuccess('Connected via Google OAuth successfully!');
      setTimeout(() => {
        onLoginSuccess(user);
        window.location.hash = '#/';
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Google Auth simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill test credentials helper
  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-premium">
            M
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isSignup ? 'Create your public account' : isWorkerPortal ? 'Technician Portal' : isAdminPortal ? 'Administrator Portal' : 'Log in to MaintainIQ'}
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {isWorkerPortal ? 'Access assigned repair tickets & records' : isAdminPortal ? 'Full supervisor database dashboard' : 'Scan codes and track reported repairs'}
          </p>
        </div>

        {/* System Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
            {success}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleFormSubmit}>
          {isSignup && (
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div>
            <label htmlFor="email-address" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-premium hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignup ? (
              <>
                <UserPlus className="w-4 h-4" />
                Sign Up
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Log In
              </>
            )}
          </button>
        </form>

        {/* Public Google Simulation */}
        {isPublicPortal && !isSignup && (
          <div className="mt-4">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-4 text-xs text-slate-400 dark:text-slate-500 font-medium">Or continue with</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mt-2 border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-2xs cursor-pointer"
            >
              <Chrome className="w-4.5 h-4.5 text-red-500" />
              Continue with Google
            </button>
          </div>
        )}

        {/* Switching portals */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-center text-xs space-y-2">
          {isPublicPortal ? (
            <div>
              {isSignup ? (
                <p className="text-slate-500">
                  Already have an account?{' '}
                  <a href="#/login" className="text-brand-600 hover:underline font-bold">Log In</a>
                </p>
              ) : (
                <p className="text-slate-500">
                  Don't have an account?{' '}
                  <a href="#/signup" className="text-brand-600 hover:underline font-bold">Sign Up</a>
                </p>
              )}
            </div>
          ) : null}

          {/* Alternative portals mappings */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
            {isAdminPortal || isWorkerPortal ? (
              <a href="#/login" className="hover:text-brand-600 transition-colors">Public Portal</a>
            ) : null}
            {!isAdminPortal && (
              <a href="#/admin/login" className="hover:text-brand-600 transition-colors flex items-center gap-0.5">
                <Shield className="w-3 h-3" /> Admin Portal
              </a>
            )}
            {!isWorkerPortal && (
              <a href="#/worker/login" className="hover:text-brand-600 transition-colors flex items-center gap-0.5">
                <Key className="w-3 h-3" /> Tech Portal
              </a>
            )}
          </div>
        </div>

        {/* Demo Credentials quick fill */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Demo Credentials (Quick-Fill)
          </h4>
          <div className="flex flex-col gap-1.5">
            {isAdminPortal && (
              <button
                type="button"
                onClick={() => handleDemoFill('admin@maintainiq.com', 'Admin@123')}
                className="text-left text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700 flex items-center justify-between cursor-pointer"
              >
                <span>Admin: admin@maintainiq.com</span>
                <span className="text-[10px] bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded font-mono">Pass: Admin@123</span>
              </button>
            )}
            {isWorkerPortal && (
              <>
                <button
                  type="button"
                  onClick={() => handleDemoFill('tech1@maintainiq.com', 'Tech@123')}
                  className="text-left text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700 flex items-center justify-between mb-1 cursor-pointer"
                >
                  <span>Tech 1: tech1@maintainiq.com</span>
                  <span className="text-[10px] bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded font-mono">Pass: Tech@123</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('tech2@maintainiq.com', 'Tech@123')}
                  className="text-left text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span>Tech 2: tech2@maintainiq.com</span>
                  <span className="text-[10px] bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded font-mono">Pass: Tech@123</span>
                </button>
              </>
            )}
            {isPublicPortal && (
              <button
                type="button"
                onClick={() => handleDemoFill('john@gmail.com', 'User@123')}
                className="text-left text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700 flex items-center justify-between cursor-pointer"
              >
                <span>User: john@gmail.com</span>
                <span className="text-[10px] bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded font-mono">Pass: User@123</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
