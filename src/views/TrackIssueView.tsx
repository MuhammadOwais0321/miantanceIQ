/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { db } from '../utils/db';
import { Issue, IssueStatus } from '../types';
import { 
  Search, 
  Clock, 
  CheckCircle, 
  Wrench, 
  User, 
  AlertCircle, 
  ArrowRight,
  FileText,
  MessageSquare,
  Activity
} from 'lucide-react';

interface TrackIssueViewProps {
  currentUser: any;
}

export default function TrackIssueView({ currentUser }: TrackIssueViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [lookupError, setLookupError] = useState('');

  // 1. Fetch user-reported issues if they are authenticated
  const personalIssues = useMemo(() => {
    if (!currentUser) return [];
    const issues = db.getIssues();
    // Filter by reporterId or reporterName (fallback matching)
    return issues.filter(
      i => i.reporterId === currentUser.id || i.reporterName.toLowerCase() === currentUser.name.toLowerCase()
    );
  }, [currentUser]);

  // 2. Perform manual lookup
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setSelectedIssue(null);

    const cleanQuery = searchQuery.trim().toUpperCase();
    if (!cleanQuery) return;

    const issue = db.getIssueByNumber(cleanQuery);
    if (issue) {
      setSelectedIssue(issue);
    } else {
      setLookupError(`No record found matching ticket reference "${cleanQuery}".`);
    }
  };

  // Get milestone states checklist
  const getMilestones = (currentStatus: IssueStatus) => {
    const states: { label: string; description: string; active: boolean; done: boolean }[] = [
      {
        label: 'Reported',
        description: 'Issue registered in maintenance queue.',
        active: currentStatus === 'Reported',
        done: true, // Always done since it exists
      },
      {
        label: 'Assigned',
        description: 'Technician dispatched to supervise repairs.',
        active: currentStatus === 'Assigned',
        done: !['Reported'].includes(currentStatus),
      },
      {
        label: 'Inspection Started',
        description: 'Technician has initiated on-site diagnostics.',
        active: currentStatus === 'Inspection Started',
        done: !['Reported', 'Assigned'].includes(currentStatus),
      },
      {
        label: 'Repair Underway',
        description: 'Active hardware fixes and parts replacement.',
        active: ['Maintenance In Progress', 'Waiting for Parts'].includes(currentStatus),
        done: !['Reported', 'Assigned', 'Inspection Started'].includes(currentStatus),
      },
      {
        label: 'Resolved',
        description: 'Service completed. Operational check green.',
        active: currentStatus === 'Resolved',
        done: ['Resolved', 'Closed'].includes(currentStatus),
      },
      {
        label: 'Closed',
        description: 'Supervisors signed off. Ticket archived.',
        active: currentStatus === 'Closed',
        done: currentStatus === 'Closed',
      }
    ];

    return states;
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200';
      default: return 'text-green-600 bg-green-50 dark:bg-green-950/40 border-green-200';
    }
  };

  // Helper to fetch details for selected issue
  const assetForSelected = selectedIssue ? db.getAssetById(selectedIssue.assetId) : null;
  const recordForSelected = selectedIssue && ['Resolved', 'Closed'].includes(selectedIssue.status)
    ? db.getRecords().find(r => r.issueId === selectedIssue.id)
    : null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      
      {/* Header Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Track Repairs</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Search for dynamic progress milestones, dispatch allocations, and resolution logs.</p>
      </div>

      {/* Lookup Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium max-w-xl mx-auto">
        <form onSubmit={handleManualSearch} className="space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
            Enter Ticket Reference Code
          </label>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. ISU-1001"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm font-mono uppercase tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-premium shrink-0 flex items-center justify-center cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          {lookupError && (
            <p className="text-center text-xs text-red-500 font-semibold">{lookupError}</p>
          )}
        </form>
      </div>

      {/* Search results detail container */}
      {selectedIssue && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium-lg overflow-hidden p-6 sm:p-8 space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded font-mono">
                  {selectedIssue.issueNumber}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(selectedIssue.priority)}`}>
                  {selectedIssue.priority} Severity
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
                {selectedIssue.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <b>Equipment Affected:</b> {assetForSelected?.name || 'Asset'} ({assetForSelected?.assetCode})
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-400 shrink-0">
              <p><b>Reporter:</b> {selectedIssue.reporterName}</p>
              <p className="mt-0.5"><b>Filed:</b> {new Date(selectedIssue.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* User description and uploaded evidence */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Your Problem Description</p>
              <p className="text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                {selectedIssue.description}
              </p>
            </div>
            {selectedIssue.evidence && selectedIssue.evidence.length > 0 && (
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-2">Your Attached Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {selectedIssue.evidence.map((imgUrl, idx) => (
                    <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                      <img 
                        src={imgUrl} 
                        alt={`Evidence ${idx + 1}`} 
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-all" 
                        referrerPolicy="no-referrer"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Core milestone timeline */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-400" />
              Live Progress Milestones
            </h3>

            <div className="relative pl-6 space-y-8">
              {getMilestones(selectedIssue.status).map((m, idx) => (
                <div key={idx} className="relative flex gap-4">
                  
                  {/* Connector Line */}
                  {idx !== 5 && (
                    <span className={`absolute left-[-16px] top-6 bottom-[-32px] w-0.5 ${m.done ? 'bg-brand-500' : 'bg-slate-100 dark:bg-slate-700'}`} />
                  )}

                  {/* Circle dot icon indicator */}
                  <div className={`absolute left-[-23px] w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                    m.active 
                      ? 'bg-brand-600 border-brand-600 shadow-sm animate-pulse'
                      : m.done 
                        ? 'bg-brand-500 border-brand-500' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    {m.active && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>

                  <div className="text-xs space-y-0.5">
                    <h4 className={`font-bold ${m.active ? 'text-brand-600 dark:text-brand-400' : m.done ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                      {m.label}
                    </h4>
                    <p className="text-slate-400 dark:text-slate-500">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance signed logs if resolved */}
          {recordForSelected && (
            <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Technician Certified Resolution Report
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/40">
                <div>
                  <p className="font-bold text-slate-500">Inspection/Fault Findings</p>
                  <p className="mt-1 leading-relaxed bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">{recordForSelected.inspectionNotes}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500">Resolution Operations Carried Out</p>
                  <p className="mt-1 leading-relaxed bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">{recordForSelected.workPerformed}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Logged in User personal dashboard list */}
      {currentUser && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium p-6 sm:p-8 space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4.5 h-4.5 text-slate-400" />
            Your Reported Infrastructure Tickets
          </h3>

          {personalIssues.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {personalIssues.map((isu) => {
                const asset = db.getAssetById(isu.assetId);
                return (
                  <div 
                    key={isu.id} 
                    onClick={() => setSelectedIssue(isu)}
                    className="py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all rounded-xl px-2 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          {isu.issueNumber}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          isu.status === 'Resolved' || isu.status === 'Closed' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {isu.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 transition-colors">
                        {isu.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Asset affected: {asset?.name || 'Asset'} • Reported {new Date(isu.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-400 italic">You have not submitted any infrastructure tickets.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
