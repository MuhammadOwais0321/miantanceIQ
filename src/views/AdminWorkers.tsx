/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { db } from '../utils/db';
import { User, UserStatus } from '../types';
import { 
  UserPlus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  UserX, 
  RefreshCw, 
  Lock, 
  Activity, 
  ShieldAlert, 
  CheckCircle2,
  Mail,
  MoreVertical,
  XCircle
} from 'lucide-react';

export default function AdminWorkers() {
  const [users, setUsers] = useState(() => db.getUsers());
  const [issues, setIssues] = useState(() => db.getIssues());
  const [records, setRecords] = useState(() => db.getRecords());

  const refreshData = () => {
    setUsers(db.getUsers());
    setIssues(db.getIssues());
    setRecords(db.getRecords());
  };

  // Roster of only Technicians
  const technicians = useMemo(() => {
    return users.filter(u => u.role === 'worker');
  }, [users]);

  // Form inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Password reset state helper
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Confirmation states
  const [suspendConfirm, setSuspendConfirm] = useState<{ id: string; name: string; currentStatus: UserStatus } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Calculate detailed worker analytics
  const workerStats = useMemo(() => {
    const stats: { [key: string]: { assigned: number; resolved: number; avgTime: number } } = {};

    technicians.forEach(t => {
      const techIssues = issues.filter(i => i.assignedTechnicianId === t.id);
      const totalAssigned = techIssues.length;
      const totalResolved = techIssues.filter(i => ['Resolved', 'Closed'].includes(i.status)).length;
      
      const techRecords = records.filter(r => r.technicianId === t.id);
      const avgTime = techRecords.length > 0
        ? Math.round(techRecords.reduce((acc, r) => acc + r.timeSpent, 0) / techRecords.length)
        : 0;

      stats[t.id] = {
        assigned: totalAssigned,
        resolved: totalResolved,
        avgTime,
      };
    });

    return stats;
  }, [technicians, issues, records]);

  // Submit new worker registration
  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('All fields are required.');
      return;
    }

    try {
      db.createUser({
        name: name.trim(),
        email: email.trim(),
        passwordHash: password,
        role: 'worker',
        status: 'active',
      });

      refreshData();
      setFormSuccess('Technician account created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setTimeout(() => setShowAddModal(false), 800);
    } catch (err: any) {
      setFormError(err.message || 'Duplicate email or validation error.');
    }
  };

  // Toggle user suspension state
  const handleToggleSuspend = (id: string, name: string, currentStatus: UserStatus) => {
    setSuspendConfirm({ id, name, currentStatus });
  };

  // Hard Delete worker
  const handleDeleteWorker = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  // Submit Password Reset Override
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword.trim()) return;

    db.updateUser(resettingUser.id, { passwordHash: newPassword.trim() });
    refreshData();
    setResetSuccessMsg(`Password for ${resettingUser.name} has been securely reset.`);
    setResettingUser(null);
    setNewPassword('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Technical Roster</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage technician accounts, credentials, workloads, and repair performance indexes.</p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setShowAddModal(true);
          }}
          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow-premium transition-all cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          Add Technician
        </button>
      </div>

      {/* Roster Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {technicians.map(tech => {
          const stats = workerStats[tech.id] || { assigned: 0, resolved: 0, avgTime: 0 };
          const isSuspended = tech.status === 'suspended';

          return (
            <div 
              key={tech.id} 
              className={`bg-white dark:bg-slate-800 p-5 rounded-3xl border shadow-premium space-y-4 transition-all ${
                isSuspended ? 'border-red-100 dark:border-red-950/40 opacity-75' : 'border-slate-100 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg ${
                    isSuspended ? 'bg-red-50 text-red-600' : 'bg-brand-50 dark:bg-brand-950 text-brand-600'
                  }`}>
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      {tech.name}
                      {isSuspended && (
                        <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Suspended
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {tech.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setNewPassword('Tech@123'); // Default suggested reset pass
                      setResettingUser(tech);
                    }}
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg border border-transparent cursor-pointer"
                    title="Reset Password"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleSuspend(tech.id, tech.name, tech.status)}
                    className={`p-1.5 rounded-lg border border-transparent cursor-pointer ${
                      isSuspended ? 'text-green-500 hover:bg-green-50' : 'text-orange-400 hover:text-orange-600 hover:bg-slate-50'
                    }`}
                    title={isSuspended ? 'Activate account' : 'Suspend account'}
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWorker(tech.id, tech.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg border border-transparent cursor-pointer"
                    title="Remove user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Roster Individual Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs text-center border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned</p>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.assigned}</h4>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
                  <h4 className="text-base font-bold text-green-600 dark:text-green-400 mt-1">{stats.resolved}</h4>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Avg. Duration</p>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.avgTime}m</h4>
                </div>
              </div>
            </div>
          );
        })}
        {technicians.length === 0 && (
          <p className="text-sm text-slate-400 italic text-center py-10 col-span-2">No technicians enrolled in database roster yet.</p>
        )}
      </div>

      {/* 🚀 --- ADD TECHNICIAN MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-sm w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-premium-lg p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white">Provision Worker Credentials</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            {formError && (
              <p className="text-xs text-red-500 font-bold p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">{formError}</p>
            )}
            {formSuccess && (
              <p className="text-xs text-green-600 font-bold p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">{formSuccess}</p>
            )}

            <form onSubmit={handleAddWorker} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Technician Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Liam Foster"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Temporary Login Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. Tech@123"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold cursor-pointer shadow-premium"
                >
                  Provision User
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🚀 --- SUSPEND CONFIRMATION OVERLAY --- */}
      {suspendConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-150 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <UserX className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {suspendConfirm.currentStatus === 'active' ? 'Suspend Account?' : 'Activate Account?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {suspendConfirm.currentStatus === 'active' ? (
                  <>Are you sure you want to suspend technician <span className="font-bold text-slate-700 dark:text-slate-300">{suspendConfirm.name}</span>? They will be locked out of updating assigned repair tickets.</>
                ) : (
                  <>Resume account access for technician <span className="font-bold text-slate-700 dark:text-slate-300">{suspendConfirm.name}</span>?</>
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 text-xs">
              <button
                onClick={() => setSuspendConfirm(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetStatus: UserStatus = suspendConfirm.currentStatus === 'active' ? 'suspended' : 'active';
                  db.updateUser(suspendConfirm.id, { status: targetStatus });
                  refreshData();
                  setSuspendConfirm(null);
                }}
                className={`px-4 py-2 text-white rounded-xl font-bold shadow-md cursor-pointer ${
                  suspendConfirm.currentStatus === 'active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 --- WORKER DELETE CONFIRMATION OVERLAY --- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Technician Account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Permanently delete technician account for <span className="font-bold text-slate-700 dark:text-slate-300">{deleteConfirm.name}</span>? Outstanding tickets assigned to them will be queued as Unassigned.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 text-xs">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  issues.forEach(i => {
                    if (i.assignedTechnicianId === deleteConfirm.id) {
                      db.updateIssue(i.id, { assignedTechnicianId: undefined, status: 'Reported' });
                    }
                  });
                  db.deleteUser(deleteConfirm.id);
                  refreshData();
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 --- PASSWORD RESET SUCCESS DIALOG --- */}
      {resetSuccessMsg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Credentials Reset</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {resetSuccessMsg}
              </p>
            </div>
            <div className="flex items-center justify-center pt-2 text-xs">
              <button
                onClick={() => setResetSuccessMsg(null)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 --- RE-ASSIGN CREDENTIAL PASSWORD MODAL --- */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-xs w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-premium-lg p-6 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Reset Pass Override</h4>
            <p className="text-xs text-slate-400">Force new credentials password for <b>{resettingUser.name}</b>.</p>
            
            <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-center"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold cursor-pointer shadow-premium"
                >
                  Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
