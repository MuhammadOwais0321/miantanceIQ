/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { db } from '../utils/db';
import { Issue, Asset, PartUsed, AssetCondition, IssueStatus, MaintenanceSchedule } from '../types';
import { 
  Clipboard, 
  Wrench, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Plus, 
  Trash2, 
  FolderKanban, 
  History, 
  User, 
  Key,
  ShieldAlert,
  FileText,
  Calendar,
  X
} from 'lucide-react';

interface WorkerDashboardProps {
  currentUser: any;
  onUserUpdate?: (user: any) => void;
}

export default function WorkerDashboard({ currentUser, onUserUpdate }: WorkerDashboardProps) {
  const [issues, setIssues] = useState(() => db.getIssues());
  const [assets, setAssets] = useState(() => db.getAssets());
  const [records, setRecords] = useState(() => db.getRecords());
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>(() => db.getSchedules());

  const refreshData = () => {
    setIssues(db.getIssues());
    setAssets(db.getAssets());
    setRecords(db.getRecords());
    setSchedules(db.getSchedules());
  };

  React.useEffect(() => {
    const handleDbUpdate = () => {
      refreshData();
    };
    window.addEventListener('mq_db_update', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate);
    return () => {
      window.removeEventListener('mq_db_update', handleDbUpdate);
      window.removeEventListener('storage', handleDbUpdate);
    };
  }, []);

  // Navigation state inside technician panel
  const [activeTab, setActiveTab] = useState<'tasks' | 'history' | 'profile'>('tasks');
  const [tasksSubTab, setTasksSubTab] = useState<'repairs' | 'maintenance'>('repairs');
  const [historySubTab, setHistorySubTab] = useState<'repairs' | 'maintenance'>('repairs');

  // Selected ticket / schedule detail expansion state
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<MaintenanceSchedule | null>(null);

  // Maintenance Record Filing Form States
  const [showFilingForm, setShowFilingForm] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [parts, setParts] = useState<PartUsed[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCost, setNewPartCost] = useState('');
  const [timeSpent, setTimeSpent] = useState('60'); // in minutes
  const [finalCondition, setFinalCondition] = useState<AssetCondition>('Good');
  const [formError, setFormError] = useState('');

  // Profile Form States
  const [profileName, setProfileName] = useState(() => currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(() => currentUser?.email || '');
  const [profilePass, setProfilePass] = useState(() => currentUser?.passwordHash || 'Tech@123');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Sync profile form states when currentUser updates (from parent context)
  React.useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfilePass(currentUser.passwordHash || 'Tech@123');
    }
  }, [currentUser]);

  // Handle auto-focus from notification clicks
  React.useEffect(() => {
    const checkFocus = () => {
      const focusedIssueId = localStorage.getItem('mq_focused_issue_id');
      if (focusedIssueId) {
        const found = db.getIssues().find(i => i.id === focusedIssueId);
        if (found) {
          setActiveTab('tasks');
          setTasksSubTab('repairs');
          setActiveIssue(found);
          localStorage.removeItem('mq_focused_issue_id');
          setTimeout(() => {
            const el = document.getElementById('issue-details-panel');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-brand-500', 'animate-pulse');
              setTimeout(() => {
                el.classList.remove('ring-2', 'ring-brand-500', 'animate-pulse');
              }, 3000);
            }
          }, 250);
        }
      }

      const focusedScheduleId = localStorage.getItem('mq_focused_schedule_id');
      if (focusedScheduleId) {
        const found = db.getSchedules().find(s => s.id === focusedScheduleId);
        if (found) {
          setActiveTab('tasks');
          setTasksSubTab('maintenance');
          setActiveSchedule(found);
          localStorage.removeItem('mq_focused_schedule_id');
          setTimeout(() => {
            const el = document.getElementById('schedule-details-panel');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-brand-500', 'animate-pulse');
              setTimeout(() => {
                el.classList.remove('ring-2', 'ring-brand-500', 'animate-pulse');
              }, 3000);
            }
          }, 250);
        }
      }
    };

    checkFocus();

    const handleFocusEvent = (e: any) => {
      checkFocus();
    };

    window.addEventListener('mq_focus_item', handleFocusEvent);
    return () => window.removeEventListener('mq_focus_item', handleFocusEvent);
  }, [issues, schedules]);

  // 1. Filter tickets assigned to this worker
  const activeTasks = useMemo(() => {
    if (!currentUser) return [];
    return issues.filter(
      i => i.assignedTechnicianId === currentUser.id && !['Resolved', 'Closed'].includes(i.status)
    );
  }, [issues, currentUser]);

  // Filter custom maintenance schedules assigned to this worker (active schedules)
  const mySchedules = useMemo(() => {
    if (!currentUser) return [];
    return schedules.filter(
      s => s.assignedTo === currentUser.id && s.status !== 'Completed' && s.status !== 'Cancelled'
    );
  }, [schedules, currentUser]);

  // Filter completed or cancelled maintenance schedules assigned to this worker for history
  const completedSchedules = useMemo(() => {
    if (!currentUser) return [];
    return schedules.filter(
      s => s.assignedTo === currentUser.id && (s.status === 'Completed' || s.status === 'Cancelled')
    );
  }, [schedules, currentUser]);

  // 2. Filter resolved jobs history
  const resolvedTasks = useMemo(() => {
    if (!currentUser) return [];
    return issues.filter(
      i => i.assignedTechnicianId === currentUser.id && ['Resolved', 'Closed'].includes(i.status)
    );
  }, [issues, currentUser]);

  // Sum up parts total cost
  const calculatedTotalCost = useMemo(() => {
    return parts.reduce((acc, p) => acc + p.cost, 0);
  }, [parts]);

  // Handle status step updates
  const handleUpdateStatus = (issueId: string, nextStatus: IssueStatus) => {
    db.updateIssue(issueId, { status: nextStatus }, currentUser.id, currentUser.name);
    refreshData();
    // Refresh active issue details panel
    const fresh = db.getIssueById(issueId);
    if (fresh) setActiveIssue(fresh);
  };

  // Update status of assigned maintenance schedule
  const handleUpdateScheduleStatus = (scheduleId: string, nextStatus: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled') => {
    db.updateSchedule(scheduleId, { status: nextStatus });
    refreshData();
    // Refresh active schedule state
    const allScheds = db.getSchedules();
    const fresh = allScheds.find(s => s.id === scheduleId);
    if (fresh && fresh.status !== 'Completed' && fresh.status !== 'Cancelled') {
      setActiveSchedule(fresh);
    } else {
      setActiveSchedule(null);
    }
  };

  // Add Part to log list
  const handleAddPart = () => {
    setFormError('');
    if (!newPartName.trim() || !newPartCost.trim()) return;
    const cost = parseFloat(newPartCost);
    if (isNaN(cost) || cost < 0) {
      setFormError('Part cost must be a non-negative number.');
      return;
    }

    setParts([...parts, { name: newPartName.trim(), cost }]);
    setNewPartName('');
    setNewPartCost('');
  };

  // Remove Part from log list
  const handleRemovePart = (idx: number) => {
    setParts(parts.filter((_, i) => i !== idx));
  };

  // Submit completed maintenance record
  const handleFilingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activeIssue) return;

    // Validate business rules
    if (!inspectionNotes.trim() || !workPerformed.trim()) {
      setFormError('Inspection Notes and Work Performed descriptions are strictly mandatory.');
      return;
    }

    const duration = parseInt(timeSpent);
    if (isNaN(duration) || duration <= 0) {
      setFormError('Time spent must be a positive integer in minutes.');
      return;
    }

    try {
      db.createMaintenanceRecord({
        issueId: activeIssue.id,
        technicianId: currentUser.id,
        inspectionNotes: inspectionNotes.trim(),
        workPerformed: workPerformed.trim(),
        partsUsed: parts,
        totalCost: calculatedTotalCost,
        timeSpent: duration,
        finalCondition,
      }, currentUser.id, currentUser.name);

      refreshData();

      // Clean form states
      setShowFilingForm(false);
      setInspectionNotes('');
      setWorkPerformed('');
      setParts([]);
      setFormError('');
      
      // Close detail view on success
      setActiveIssue(null);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving maintenance record.');
    }
  };

  // Submit Profile Changes
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      const updated = db.updateUser(currentUser.id, {
        name: profileName.trim(),
        email: profileEmail.trim(),
        passwordHash: profilePass.trim(),
      });
      refreshData();
      if (onUserUpdate) {
        onUserUpdate(updated);
      }
      setProfileSuccess('Profile credentials modified successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to modify profile');
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 text-sm font-semibold tracking-wide shrink-0">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3.5 px-6 border-b-2 transition-all cursor-pointer ${
            activeTab === 'tasks' 
              ? 'border-brand-600 text-brand-600 dark:text-brand-400' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FolderKanban className="w-4.5 h-4.5" />
            Active Repair casetasks ({activeTasks.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3.5 px-6 border-b-2 transition-all cursor-pointer ${
            activeTab === 'history' 
              ? 'border-brand-600 text-brand-600 dark:text-brand-400' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <History className="w-4.5 h-4.5" />
            Resolved History ({resolvedTasks.length + completedSchedules.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3.5 px-6 border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile' 
              ? 'border-brand-600 text-brand-600 dark:text-brand-400' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <User className="w-4.5 h-4.5" />
            My Profile
          </span>
        </button>
      </div>

      {/* ================= 1. MY ACTIVE TASKS MODULE ================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Sub-tab selection toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl max-w-sm border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setTasksSubTab('repairs');
                if (activeTasks.length > 0 && !activeIssue) {
                  setActiveIssue(activeTasks[0]);
                }
              }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tasksSubTab === 'repairs'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Repair Tickets ({activeTasks.length})
            </button>
            <button
              onClick={() => {
                setTasksSubTab('maintenance');
                if (mySchedules.length > 0 && !activeSchedule) {
                  setActiveSchedule(mySchedules[0]);
                }
              }}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tasksSubTab === 'maintenance'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Assigned Maintenance ({mySchedules.length})
            </button>
          </div>

          {tasksSubTab === 'repairs' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Active List */}
          <div className="lg:col-span-2 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Caseload Queue</h3>
            
            <div className="space-y-3">
              {activeTasks.map(isu => {
                const affectedAsset = assets.find(a => a.id === isu.assetId);
                const isSelected = activeIssue?.id === isu.id;

                return (
                  <div
                    key={isu.id}
                    onClick={() => {
                      setActiveIssue(isu);
                      setShowFilingForm(false);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-300 dark:border-brand-900 shadow-premium' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2.5 mb-1.5">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono font-bold px-1.5 py-0.5 rounded">
                        {isu.issueNumber}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getPriorityColor(isu.priority)}`}>
                        {isu.priority}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                      {isu.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      <b>Asset:</b> {affectedAsset?.name || 'Asset'} • {affectedAsset?.location}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-[10px]">
                      <span className="text-brand-600 dark:text-brand-400 font-bold uppercase">{isu.status}</span>
                      <span className="text-slate-400">{new Date(isu.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
              {activeTasks.length === 0 && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400 italic shadow-premium">
                  Relax! Zero active jobs in your queue.
                </div>
              )}
            </div>
          </div>

          {/* Ticket Detail Panel */}
          <div id="issue-details-panel" className="lg:col-span-3">
            {activeIssue ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium p-6 sm:p-8 space-y-6">
                
                {/* Details Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-mono font-bold px-2 py-0.5 rounded">
                        {activeIssue.issueNumber}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(activeIssue.priority)}`}>
                        {activeIssue.priority} Priority
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-2">{activeIssue.title}</h2>
                    <p className="text-[11px] text-slate-400 mt-1">
                      <b>Affected Asset:</b> {assets.find(a => a.id === activeIssue.assetId)?.name || 'Asset'} • {assets.find(a => a.id === activeIssue.assetId)?.location}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">{activeIssue.status}</span>
                </div>

                {/* Complaint descriptions and AI suggestion details */}
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider">User Reported Complaint</h4>
                    <p className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                      {activeIssue.description}
                    </p>
                  </div>

                  {activeIssue.evidence && activeIssue.evidence.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">Attached Evidence</h4>
                      <div className="flex flex-wrap gap-2">
                        {activeIssue.evidence.map((imgUrl: string, idx: number) => (
                          <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                            <img 
                              src={imgUrl} 
                              alt={`Evidence ${idx + 1}`} 
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 hover:opacity-90 transition-all" 
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeIssue.aiSuggested && (
                    <div className="p-4 bg-brand-50/20 dark:bg-brand-950/10 border border-brand-100/30 dark:border-brand-950 rounded-xl space-y-3.5 shadow-premium">
                      <h4 className="font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-1.5 text-[10px]">
                        AI Diagnostics Summary
                      </h4>
                      <div>
                        <p className="font-semibold text-slate-500">Probable Internal Causes:</p>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-600 dark:text-slate-400">
                          {activeIssue.aiSuggested.possibleCauses.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500">Recommended Checks Checklist:</p>
                        <ul className="list-decimal pl-4 mt-0.5 space-y-0.5 text-slate-600 dark:text-slate-400">
                          {activeIssue.aiSuggested.initialChecks.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Workflow state switches */}
                {!showFilingForm && (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-2.5">
                    {activeIssue.status === 'Assigned' && (
                      <button
                        onClick={() => handleUpdateStatus(activeIssue.id, 'Inspection Started')}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-premium hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start Inspection
                      </button>
                    )}

                    {['Inspection Started', 'Waiting for Parts'].includes(activeIssue.status) && (
                      <button
                        onClick={() => handleUpdateStatus(activeIssue.id, 'Maintenance In Progress')}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-premium hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Begin Repair Work
                      </button>
                    )}

                    {activeIssue.status === 'Maintenance In Progress' && (
                      <button
                        onClick={() => handleUpdateStatus(activeIssue.id, 'Waiting for Parts')}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-premium hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Awaiting Spare Parts
                      </button>
                    )}

                    {/* Submit resolution logs button */}
                    {['Inspection Started', 'Maintenance In Progress', 'Waiting for Parts'].includes(activeIssue.status) && (
                      <button
                        onClick={() => {
                          setFormError('');
                          setShowFilingForm(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-premium hover:shadow-md transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Certify and Resolve
                      </button>
                    )}
                  </div>
                )}

                {/* 🚀 --- EMBEDDED RECORD FILING FORM --- */}
                {showFilingForm && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 mt-6 shadow-premium">
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-2.5">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Certify Maintenance Log</h4>
                      <button 
                        onClick={() => setShowFilingForm(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {formError && (
                      <p className="text-xs text-red-500 font-bold p-2 bg-red-50 dark:bg-red-950/20 border border-red-150 rounded-lg">{formError}</p>
                    )}

                    <form onSubmit={handleFilingSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-slate-600 uppercase mb-1">Inspection Findings *</label>
                        <textarea
                          rows={2}
                          required
                          value={inspectionNotes}
                          onChange={(e) => setInspectionNotes(e.target.value)}
                          placeholder="What did you inspect or discover? (e.g. Blown fuse, loose adapter...)"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 uppercase mb-1">Work Operations Performed *</label>
                        <textarea
                          rows={2}
                          required
                          value={workPerformed}
                          onChange={(e) => setWorkPerformed(e.target.value)}
                          placeholder="What actions solved the issue? (e.g. Spliced wire, swapped HDMI cord...)"
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      {/* Spare parts items logging builder */}
                      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl space-y-3 shadow-2xs">
                        <label className="block font-bold text-slate-500 uppercase text-[10px]">Spare Parts Billing Log</label>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPartName}
                            onChange={(e) => setNewPartName(e.target.value)}
                            placeholder="Part item"
                            className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                          <input
                            type="number"
                            value={newPartCost}
                            onChange={(e) => setNewPartCost(e.target.value)}
                            placeholder="Cost ($)"
                            className="w-20 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddPart}
                            className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Parts table list */}
                        {parts.length > 0 && (
                          <div className="space-y-1.5 max-h-24 overflow-y-auto">
                            {parts.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <span>{p.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold">${p.cost.toFixed(2)}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemovePart(idx)}
                                    className="text-red-500 p-0.5 hover:bg-red-50 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-100">
                          <span>Total Parts Cost:</span>
                          <span className="font-mono text-brand-600 dark:text-brand-400">${calculatedTotalCost.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-600 uppercase mb-1">Time Spent (Minutes) *</label>
                          <input
                            type="number"
                            required
                            value={timeSpent}
                            onChange={(e) => setTimeSpent(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Final Asset Condition</label>
                          <select
                            value={finalCondition}
                            onChange={(e) => setFinalCondition(e.target.value as AssetCondition)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" value="New">New</option>
                            <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" value="Good">Good</option>
                            <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" value="Fair">Fair</option>
                            <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" value="Poor">Poor</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/50 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFilingForm(false)}
                          className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-premium cursor-pointer"
                        >
                          Certify Resolution
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center h-full min-h-[400px] shadow-premium">
                <Clipboard className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No ticket selected</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Click on any assigned ticket from your left queue to check findings, view rule-based diagnostics, and update maintenance states.
                </p>
              </div>
            )}
          </div>

        </div>
          ) : (
            /* ================= MY ASSIGNED MAINTENANCE SCHEDULES ================= */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left Column - Maintenance List */}
              <div className="lg:col-span-2 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Assigned Schedules</h3>
                
                <div className="space-y-3">
                  {mySchedules.map(sched => {
                    const affectedAsset = assets.find(a => a.id === sched.assetId);
                    const isSelected = activeSchedule?.id === sched.id;

                    return (
                      <div
                        key={sched.id}
                        onClick={() => setActiveSchedule(sched)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                          isSelected 
                            ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-300 dark:border-brand-900 shadow-premium' 
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(sched.priority)}`}>
                            {sched.priority} Priority
                          </span>
                          
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                            sched.status === 'Completed' 
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40' 
                              : sched.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40'
                              : sched.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40'
                          }`}>
                            {sched.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                          {sched.title}
                        </h4>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-[10px] text-slate-400">
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                            {affectedAsset?.assetCode || 'Asset Code'}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3 h-3" />
                            {sched.dueDate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {mySchedules.length === 0 && (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400 italic shadow-premium">
                      Relax! No assigned maintenance schedules found.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Schedule Details Panel */}
              <div id="schedule-details-panel" className="lg:col-span-3">
                {activeSchedule ? (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium p-6 sm:p-8 space-y-6">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(activeSchedule.priority)}`}>
                            {activeSchedule.priority} Priority
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                            {activeSchedule.id}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-2">{activeSchedule.title}</h2>
                        <p className="text-[11px] text-slate-400 mt-1">
                          <b>Due Date:</b> <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{activeSchedule.dueDate}</span>
                        </p>
                      </div>
                      
                      <span className={`px-2 py-1 text-[10px] font-black rounded-full border ${
                        activeSchedule.status === 'Completed' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : activeSchedule.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : activeSchedule.status === 'Cancelled'
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {activeSchedule.status}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-500 uppercase tracking-wider">Asset Specifications</h4>
                        {(() => {
                          const assetObj = assets.find(a => a.id === activeSchedule.assetId);
                          return assetObj ? (
                            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 mt-1 space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-brand-600 dark:text-brand-400 font-mono">{assetObj.assetCode}</span>
                                <span className="text-slate-400">{assetObj.location}</span>
                              </div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{assetObj.name}</p>
                              <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/85">
                                <span>Condition: {assetObj.condition}</span>
                                <span>Status: {assetObj.status}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-red-500 italic">Associated asset not found.</p>
                          );
                        })()}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-500 uppercase tracking-wider">Instructions & Description</h4>
                        <p className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 mt-1 text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          {activeSchedule.description || 'No maintenance details provided by Admin.'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Status Actions for Workers */}
                    <div className="pt-5 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Maintenance Status</h4>
                      
                      <div className="flex flex-wrap gap-2.5">
                        {activeSchedule.status === 'Scheduled' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateScheduleStatus(activeSchedule.id, 'In Progress')}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer text-xs"
                          >
                            <Play className="w-4 h-4" />
                            <span>Start Work (In Progress)</span>
                          </button>
                        )}

                        {activeSchedule.status === 'In Progress' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateScheduleStatus(activeSchedule.id, 'Completed')}
                              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer text-xs"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Complete Maintenance</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleUpdateScheduleStatus(activeSchedule.id, 'Scheduled')}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs border border-slate-200 dark:border-slate-650"
                            >
                              <Pause className="w-4 h-4" />
                              <span>Put On Hold</span>
                            </button>
                          </>
                        )}

                        {activeSchedule.status === 'Completed' && (
                          <div className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-xl border border-green-100 dark:border-green-900/40 text-xs">
                            <CheckCircle className="w-4 h-4" />
                            <span>This maintenance checklist has been fully certified & completed.</span>
                          </div>
                        )}

                        {activeSchedule.status === 'Cancelled' && (
                          <p className="text-slate-400 italic">This maintenance task has been cancelled.</p>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center h-full min-h-[400px] shadow-premium">
                    <Wrench className="w-12 h-12 text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No maintenance task selected</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Select any assigned maintenance schedule from the left list to check task details and update status.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ================= 2. WORK HISTORY MODULE ================= */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Your Resolved Tasks Archive</h3>
              <p className="text-xs text-slate-400 mt-0.5">Summary breakdown of completed repairs and certified maintenance filings.</p>
            </div>

            {/* Sub-tab selection toggle inside history */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl max-w-sm border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setHistorySubTab('repairs')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  historySubTab === 'repairs'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/50'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Repairs ({resolvedTasks.length})
              </button>
              <button
                onClick={() => setHistorySubTab('maintenance')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  historySubTab === 'maintenance'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/50'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Maintenance ({completedSchedules.length})
              </button>
            </div>
          </div>

          {historySubTab === 'repairs' ? (
            resolvedTasks.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-750">
                {resolvedTasks.map(isu => {
                  const affectedAsset = assets.find(a => a.id === isu.assetId);
                  const rec = records.find(r => r.issueId === isu.id);

                  return (
                    <div key={isu.id} className="py-4 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {isu.issueNumber}
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{isu.title}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          Resolved: {rec ? new Date(rec.resolvedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-2xs">
                        <div>
                          <p className="font-bold text-slate-400 uppercase text-[9px]">Affected Equipment</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">{affectedAsset?.name || 'Asset'} ({affectedAsset?.assetCode})</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400 uppercase text-[9px]">Resolution work</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1 line-clamp-2" title={rec?.workPerformed}>{rec?.workPerformed || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400 uppercase text-[9px]">Calculated Cost / Time</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1 font-mono">
                            ${rec?.totalCost.toFixed(2)} • {rec?.timeSpent} minutes
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-10">No completed jobs archive available yet.</p>
            )
          ) : (
            completedSchedules.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-750">
                {completedSchedules.map(sched => {
                  const affectedAsset = assets.find(a => a.id === sched.assetId);

                  return (
                    <div key={sched.id} className="py-4 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            sched.status === 'Completed' 
                              ? 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/25 dark:text-green-400 dark:border-green-900/40' 
                              : 'text-slate-500 bg-slate-50 border-slate-200'
                          }`}>
                            {sched.status}
                          </span>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{sched.title}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          Due Date: {sched.dueDate}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-2xs">
                        <div>
                          <p className="font-bold text-slate-400 uppercase text-[9px]">Equipment Details</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                            {affectedAsset?.name || 'Asset'} ({affectedAsset?.assetCode || 'N/A'})
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400 uppercase text-[9px]">Priority & Location</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1">
                            {sched.priority} Priority • {affectedAsset?.location || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-10">No completed maintenance archive available yet.</p>
            )
          )}
        </div>
      )}

      {/* ================= 3. MY PROFILE MODULE ================= */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium p-6 sm:p-8 max-w-md mx-auto space-y-6">
          <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="mx-auto w-16 h-16 bg-brand-50 dark:bg-brand-950/50 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-2xl shadow-premium">
              {currentUser.name.charAt(0)}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mt-3 text-lg">{currentUser.name}</h3>
            <p className="text-xs text-slate-400">Security Clearance: Field Technician</p>
          </div>

          {profileSuccess && (
            <p className="text-xs text-green-600 font-bold p-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg text-center">{profileSuccess}</p>
          )}
          {profileError && (
            <p className="text-xs text-red-600 font-bold p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg text-center">{profileError}</p>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1.5">Profile Name *</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1.5">Login Password *</label>
              <input
                type="text"
                required
                value={profilePass}
                onChange={(e) => setProfilePass(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl mt-4 cursor-pointer shadow-premium"
            >
              Modify profile
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
