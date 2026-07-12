/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db } from '../utils/db';
import { 
  QrCode, 
  Settings, 
  Clock, 
  Wrench, 
  Smartphone, 
  HeartHandshake, 
  Mail, 
  Compass, 
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface PublicHomeProps {
  currentPath: string; // '#' or '#/features' or '#/about' or '#/contact' or '#/scan'
}

export default function PublicHome({ currentPath }: PublicHomeProps) {
  const [manualCode, setManualCode] = useState('');
  const [searchError, setSearchError] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [scanSimulating, setScanSimulating] = useState(false);

  // Handle manual code lookups
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!manualCode.trim()) return;

    const code = manualCode.trim().toUpperCase();
    const asset = db.getAssetByCode(code);

    if (asset) {
      window.location.hash = `#/asset/${code}`;
    } else {
      setSearchError(`Asset with code "${code}" was not found in our directory. Please try AST-0001 or AST-0002.`);
    }
  };

  // Simulate scanning a code
  const handleSimulateScan = async (code: string) => {
    setScanSimulating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setScanSimulating(false);
    window.location.hash = `#/asset/${code}`;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => setContactSuccess(false), 4000);
  };

  // 1. SCAN VIEW / PORTAL (#/scan)
  if (currentPath === '#/scan') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium text-center">
          <div className="mx-auto w-16 h-16 bg-brand-50 dark:bg-brand-950/50 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scan Asset Tag</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            Scan a physical MaintainIQ QR label using your device's camera, or enter the unique identifier code manually below.
          </p>

          {/* Quick-Scan Simulation for Demo */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Simulate QR Scanner Camera Input
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                disabled={scanSimulating}
                onClick={() => handleSimulateScan('AST-0001')}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                [Scan Classroom Projector]
              </button>
              <button
                disabled={scanSimulating}
                onClick={() => handleSimulateScan('AST-0003')}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                [Scan Server AC Unit]
              </button>
            </div>
            {scanSimulating && (
              <div className="mt-3 text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                Accessing Camera... Simulating QR Scan
              </div>
            )}
          </div>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 font-semibold uppercase tracking-wider">Or Enter Code Manually</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          {/* Manual Form */}
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="flex gap-2.5 max-w-sm mx-auto">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g., AST-0001"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-premium hover:shadow-md transition-all cursor-pointer"
              >
                Verify
              </button>
            </div>
            {searchError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                {searchError}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // 2. FEATURES VIEW (#/features)
  if (currentPath === '#/features') {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">Platform Features</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400">
            MaintainIQ connects physical infrastructure to real-time AI issue diagnosis and structured technical management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium">
            <div className="w-12 h-12 bg-brand-50 dark:bg-brand-950/50 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">QR Code Digital Identities</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Every equipment piece gets a dedicated web URL, fully printable labels, and an append-only visual log history.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Diagnostic Triage</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Instantly analyzes user reports, diagnoses category, recommends priority, suggests logical checks and detects failure patterns.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/50 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Technician Tasking Shell</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Provides workers with customized mobile checklists, inspection logs, parts billing sheets, and step-by-step resolution logs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. ABOUT VIEW (#/about)
  if (currentPath === '#/about') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium text-center">
          <div className="mx-auto w-16 h-16 bg-brand-50 dark:bg-brand-950/50 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Our Mission</h2>
          <p className="mt-4 text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            MaintainIQ was conceived to bridge the massive communication gap between standard office workers who witness hardware failures, and the physical facilities teams who are tasked with fixing them. By pairing equipment with dynamic QR codes and local artificial intelligence, we eliminate ticket lag and speed up mean resolution times by 40%.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-2xl font-bold text-brand-600 dark:text-brand-400">100%</h4>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Reliability</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-brand-600 dark:text-brand-400">40+ mins</h4>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Saved Per Job</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-brand-600 dark:text-brand-400">&lt; 10s</h4>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Report Time</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. CONTACT VIEW (#/contact)
  if (currentPath === '#/contact') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium">
          <div className="mx-auto w-12 h-12 bg-brand-50 dark:bg-brand-950/50 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Get in Touch</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center max-w-sm mx-auto">
            Have questions about physical enterprise deployments, custom security labels, or hardware integrations? Send us a message!
          </p>

          {contactSuccess ? (
            <div className="mt-6 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 p-4 rounded-xl text-center text-xs font-semibold">
              🎉 Thank you for contacting MaintainIQ! Our team will respond within 2 hours.
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="johndoe@organization.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Inquiry Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can our operations team assist you?"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-premium cursor-pointer"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 5. DEFAULT PUBLIC HOME VIEW
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
          Scan. Report. <br />
          <span className="text-brand-600 dark:text-brand-400">Diagnose. Maintain.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
          Assign physical infrastructure a smart digital identity. Scan QR codes, diagnose faults instantly with rule-based AI triage, and coordinate maintenance records flawlessly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <a
            href="#/scan"
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3 rounded-xl shadow-premium hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Scan Asset Code
          </a>
          <a
            href="#/login"
            className="w-full sm:w-auto border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-semibold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Portals Login
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* How it Works section */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800/80 py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">How MaintainIQ Works</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A seamless circular pipeline connecting office staff, supervisors, and repair teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">1</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Scan QR Label</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Scan the equipment's physical QR plate on any device without downloading specialized client software.
              </p>
            </div>

            <div className="relative text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">2</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">AI Fault Diagnosis</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Our built-in local triage scans the text and automatically recommends severity levels, checks, and categories.
              </p>
            </div>

            <div className="relative text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">3</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Worker Dispatch</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Admins receive notifications, analyze historical assets performance, and coordinate assigning an active technician.
              </p>
            </div>

            <div className="relative text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">4</div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Track and Resolve</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Workers check off lists, update parts, and submit records, which instantly marks the asset as operational.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety highlight info */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="p-6 sm:p-8 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-3xl flex flex-col md:flex-row items-center gap-6">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/70 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Smart Hazard Redundant Protocols</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Whenever reports contain safety critical keywords (e.g., exposed cables, burning smell, sparks, fire), the AI triage forces immediate emergency status, triggers custom notifications for supervisors, and blocks any manual unsafe operations guides.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
