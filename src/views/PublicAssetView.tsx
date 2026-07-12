/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { getAITriage } from '../utils/ai';
import { Asset, IssuePriority, AISuggested } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  FileText, 
  Sparkles, 
  History, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Wrench,
  Camera,
  Search
} from 'lucide-react';

interface PublicAssetViewProps {
  assetCode: string;
  currentUser: any;
}

export default function PublicAssetView({ assetCode, currentUser }: PublicAssetViewProps) {
  const asset = db.getAssetByCode(assetCode);

  // Modal / Form States
  const [showReportModal, setShowReportModal] = useState(false);
  const [complaint, setComplaint] = useState('');
  
  // AI Suggestions states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISuggested | null>(null);
  
  // Form fields (pre-filled by AI, but fully editable)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [possibleCauses, setPossibleCauses] = useState<string[]>([]);
  const [initialChecks, setInitialChecks] = useState<string[]>([]);
  const [userEdited, setUserEdited] = useState({ title: false, category: false, priority: false });

  // Real Evidence Attachments
  const [evidence, setEvidence] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setEvidence((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  // Tracking code after successful submission
  const [submittedIssueCode, setSubmittedIssueCode] = useState<string | null>(null);

  // Reset states when modal is toggled
  useEffect(() => {
    if (!showReportModal) {
      setComplaint('');
      setAiResult(null);
      setTitle('');
      setCategory('');
      setPriority('Medium');
      setPossibleCauses([]);
      setInitialChecks([]);
      setUserEdited({ title: false, category: false, priority: false });
      setEvidence([]);
      setSubmittedIssueCode(null);
    }
  }, [showReportModal]);

  if (!asset) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Asset Label Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          The barcode or QR code you scanned does not match any registered asset. Please verify the code and scan again.
        </p>
        <a
          href="#/scan"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-premium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to lookup
        </a>
      </div>
    );
  }

  // Filter Safe activity logs for public view
  const publicLogs = db.getHistory()
    .filter(h => h.assetId === asset.id)
    .slice(0, 5); // top 5 only

  // Trigger AI analysis based on the complaint text
  const handleAITriage = async () => {
    if (!complaint.trim()) return;
    setIsAiLoading(true);
    setAiResult(null);

    try {
      const triage = await getAITriage(complaint, asset.id);
      setAiResult(triage);
      
      // Pre-fill editable forms
      setTitle(triage.title);
      setCategory(triage.category);
      setPriority(triage.priority);
      setPossibleCauses(triage.possibleCauses);
      setInitialChecks(triage.initialChecks);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Issue to local storage
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !complaint.trim()) return;

    const reporterName = currentUser ? currentUser.name : 'Anonymous Reporter';
    const reporterId = currentUser ? currentUser.id : undefined;

    const newIssue = db.createIssue({
      assetId: asset.id,
      reporterId,
      reporterName,
      title,
      description: complaint,
      category,
      priority,
      evidence, // Save uploaded evidence Base64 paths
      aiSuggested: aiResult || undefined,
      aiSuggestedUsed: {
        title: !userEdited.title,
        category: !userEdited.category,
        priority: !userEdited.priority,
      }
    }, reporterId || 'public', reporterName);

    setSubmittedIssueCode(newIssue.issueNumber);
  };

  // Get severity badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Operational':
        return 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900';
      case 'Issue Reported':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'Under Inspection':
        return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900';
      case 'Under Maintenance':
        return 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-900';
      case 'Out of Service':
        return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900';
      case 'Retired':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'New':
        return 'text-emerald-500 font-bold';
      case 'Good':
        return 'text-green-500 font-semibold';
      case 'Fair':
        return 'text-amber-500 font-semibold';
      case 'Poor':
        return 'text-orange-500 font-bold';
      case 'Critical':
        return 'text-red-600 font-black animate-pulse';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      
      {/* Back button */}
      <a href="#/" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors font-semibold">
        <ArrowLeft className="w-4.5 h-4.5" />
        Back to marketing
      </a>

      {/* Main Asset details board */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium overflow-hidden">
        
        {/* Color stripe code status */}
        <div className={`h-2.5 w-full ${asset.status === 'Operational' ? 'bg-green-500' : asset.status === 'Retired' ? 'bg-slate-400' : 'bg-orange-500'}`} />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                {asset.category}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {asset.name}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Asset Ref: {asset.assetCode}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(asset.status)}`}>
                {asset.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-sm">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Operational Location</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{asset.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Physical Condition</p>
                <p className={`font-semibold mt-0.5 ${getConditionBadge(asset.condition)}`}>
                  {asset.condition}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Last Certified Service</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{asset.lastServiceDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Next Scheduled Maintenance</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{asset.nextServiceDate}</p>
              </div>
            </div>
          </div>

          {/* Report Button */}
          {asset.status !== 'Retired' && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-premium hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Report Fault or Malfunction
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Safe Public Log Timeline */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          Safe Activity Log
        </h3>
        
        {publicLogs.length > 0 ? (
          <div className="space-y-4">
            {publicLogs.map((log, idx) => (
              <div key={log.id} className="relative flex gap-4 pl-1">
                {/* Visual Connector dot */}
                {idx !== publicLogs.length - 1 && (
                  <span className="absolute left-3 top-6 bottom-[-20px] w-0.5 bg-slate-100 dark:bg-slate-700" />
                )}
                <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 z-10">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">{log.action}</div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <span>{log.actorName}</span>
                    <span>•</span>
                    <span>{new Date(log.date).toLocaleDateString()} at {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No recent activity logs recorded.</p>
        )}
      </div>

      {/* 🚀 --- REPORT ISSUE MODAL --- */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-premium-lg overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-pulse" />
                <h3 className="font-bold text-slate-900 dark:text-white">AI-Powered Issue Triage</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {submittedIssueCode ? (
                /* Success tracker panel */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-premium">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Issue Filed Successfully</h4>
                    <p className="text-xs text-slate-400">Your report is dispatched and queue-logged in our facilities backlog.</p>
                  </div>

                  <div className="max-w-xs mx-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 font-mono shadow-premium">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Tracking Reference</span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{submittedIssueCode}</h3>
                  </div>

                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Save this reference code. You can search or trace real-time resolution logs in the <b>Track Repairs</b> section on our home portal.
                  </p>

                  <div className="pt-4">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Return to Asset Screen
                    </button>
                  </div>
                </div>
              ) : (
                /* Form entries */
                <form onSubmit={handleIssueSubmit} className="space-y-5">
                  
                  {/* Step 1: Raw Complaint */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Describe the exact malfunction
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      placeholder="e.g. AC leaking water from vent, or Projector display is constantly cutting off with static flickering."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={handleAITriage}
                        disabled={isAiLoading || !complaint.trim()}
                        className="bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all border border-brand-100/30 dark:border-brand-900 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isAiLoading ? 'Analyzing Complaint...' : '✨ Run AI Diagnose'}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: AI Diagnosis Preview */}
                  {isAiLoading && (
                    <div className="p-4 bg-brand-50/40 dark:bg-brand-950/10 border border-dashed border-brand-200 dark:border-brand-900 rounded-2xl flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Synthesizing keywords, categories, and safety hazards...</span>
                    </div>
                  )}

                  {aiResult && (
                    <div className="p-5 bg-brand-50/30 dark:bg-brand-950/10 border border-brand-100 dark:border-brand-950 rounded-2xl space-y-4 shadow-premium">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                        <h4 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">AI Suggested Diagnostics (Editable)</h4>
                      </div>

                      {/* Repetitive history pattern warning if exists */}
                      {aiResult.recurringPatternWarning && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 text-[11px] text-amber-700 dark:text-amber-400 rounded-xl leading-relaxed font-medium">
                          {aiResult.recurringPatternWarning}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Suggested Title */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Suggested Ticket Title</label>
                          <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => {
                              setTitle(e.target.value);
                              setUserEdited(prev => ({ ...prev, title: true }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-xs mt-1 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                          />
                        </div>

                        {/* Suggested Category */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Diagnosed Category</label>
                          <input
                            type="text"
                            required
                            value={category}
                            onChange={(e) => {
                              setCategory(e.target.value);
                              setUserEdited(prev => ({ ...prev, category: true }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent dark:text-white text-xs mt-1 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                          />
                        </div>

                        {/* Suggested Severity Priority */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recommended Severity Level</label>
                          <div className="flex gap-1.5">
                            {(['Low', 'Medium', 'High', 'Critical'] as IssuePriority[]).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  setPriority(p);
                                  setUserEdited(prev => ({ ...prev, priority: true }));
                                }}
                                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                  priority === p 
                                    ? p === 'Critical' ? 'bg-red-600 border-red-600 text-white animate-pulse' : p === 'High' ? 'bg-orange-500 border-orange-500 text-white' : p === 'Medium' ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-green-500 border-green-500 text-white'
                                    : 'bg-transparent border-slate-200 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Possible Causes checklist */}
                      {possibleCauses.length > 0 && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Probable Internal Causes</label>
                          <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {possibleCauses.map((cause, idx) => (
                              <li key={idx}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Initial pre-check safety guides */}
                      {initialChecks.length > 0 && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Initial Field Safety Checks</label>
                          <ul className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                            {initialChecks.map((check, idx) => (
                              <li key={idx} className={check.includes('❌') ? 'text-red-500 font-bold' : ''}>
                                {check}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Optional Evidence Attachments */}
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Attach Evidence (Photos / Screenshots)
                    </label>
                    <label
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative flex items-center justify-between p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        isDragging
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200/50 shadow-2xs shrink-0">
                          <Camera className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {isDragging ? 'Drop images here!' : 'Attach Evidence / Photo Logs'}
                          </h5>
                          <p className="text-[10px] text-slate-400 truncate">
                            Drag-and-drop or click to upload photos of the malfunction
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50 shadow-2xs shrink-0">
                        {evidence.length} file{evidence.length !== 1 ? 's' : ''}
                      </span>
                    </label>

                    {/* Previews */}
                    {evidence.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800 rounded-2xl">
                        {evidence.map((imgBase64, idx) => (
                          <div key={idx} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                            <img
                              src={imgBase64}
                              alt={`preview-${idx}`}
                              className="w-full h-full object-cover animate-fade-in"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeEvidence(idx);
                              }}
                              className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom validation button */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3.5">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!title.trim()}
                      className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-premium"
                    >
                      Submit Ticket
                    </button>
                  </div>

                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
