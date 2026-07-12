/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { db } from '../utils/db';
import { Asset, Issue, User, AssetCondition, AssetStatus, IssuePriority, IssueStatus, MaintenanceSchedule } from '../types';
import QRGenerator from '../components/QRGenerator';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Edit3, 
  Trash2, 
  QrCode, 
  ExternalLink,
  UserPlus,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Wrench,
  CheckCircle,
  TrendingUp,
  Sliders,
  Filter,
  Eye,
  X
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab: string; // 'overview' | 'assets' | 'issues' | 'schedule'
  currentUser: any;
  onTabChange?: (tab: 'overview' | 'assets' | 'issues' | 'schedule' | 'workers' | 'analytics' | 'settings') => void;
}

export default function AdminDashboard({ currentTab, currentUser, onTabChange }: AdminDashboardProps) {
  const [assets, setAssets] = useState(() => db.getAssets());
  const [issues, setIssues] = useState(() => db.getIssues());
  const [workers, setWorkers] = useState(() => db.getUsers().filter(u => u.role === 'worker'));
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>(() => db.getSchedules());

  const refreshData = () => {
    setAssets(db.getAssets());
    setIssues(db.getIssues());
    setWorkers(db.getUsers().filter(u => u.role === 'worker'));
    setSchedules(db.getSchedules());
  };

  React.useEffect(() => {
    refreshData();
  }, [currentTab]);

  // --- COMPONENT LOCAL STATES ---
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals States
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showQrModal, setShowQrModal] = useState<Asset | null>(null);
  const [assigningIssue, setAssigningIssue] = useState<Issue | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const [noIssueAlert, setNoIssueAlert] = useState<{ assetName: string; assetCode: string } | null>(null);

  // Handle click on asset code to open its reported issue(s)
  const handleAssetCodeClick = (ast: Asset) => {
    const assetIssues = issues.filter(isu => isu.assetId === ast.id);
    const activeIssue = assetIssues.find(isu => isu.status !== 'Resolved' && isu.status !== 'Closed');
    
    if (activeIssue) {
      setViewingIssue(activeIssue);
    } else if (assetIssues.length > 0) {
      // Open the most recent resolved/closed issue
      const sorted = [...assetIssues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setViewingIssue(sorted[0]);
    } else {
      setNoIssueAlert({ assetName: ast.name, assetCode: ast.assetCode });
    }
  };

  // Asset Form fields
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('Electronics');
  const [assetLocation, setAssetLocation] = useState('');
  const [assetCondition, setAssetCondition] = useState<AssetCondition>('New');
  const [assetStatus, setAssetStatus] = useState<AssetStatus>('Operational');
  const [lastService, setLastService] = useState('');
  const [nextService, setNextService] = useState('');

  // Maintenance Schedule Form States
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [scheduleAssetId, setScheduleAssetId] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [scheduleDueDate, setScheduleDueDate] = useState('');
  const [schedulePriority, setSchedulePriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [scheduleAssignedTo, setScheduleAssignedTo] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState<'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'>('Scheduled');

  // Populate schedule form fields for editing or create
  const handleOpenScheduleModal = (sched?: MaintenanceSchedule) => {
    if (sched) {
      setEditingSchedule(sched);
      setScheduleAssetId(sched.assetId);
      setScheduleTitle(sched.title);
      setScheduleDescription(sched.description);
      setScheduleDueDate(sched.dueDate);
      setSchedulePriority(sched.priority);
      setScheduleAssignedTo(sched.assignedTo || '');
      setScheduleStatus(sched.status);
    } else {
      setEditingSchedule(null);
      setScheduleAssetId(assets[0]?.id || '');
      setScheduleTitle('');
      setScheduleDescription('');
      setScheduleDueDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 5 days from now
      setSchedulePriority('Medium');
      setScheduleAssignedTo('');
      setScheduleStatus('Scheduled');
    }
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleAssetId || !scheduleTitle || !scheduleDueDate) {
      alert('Please fill in required fields (Asset, Title, and Due Date).');
      return;
    }

    const payload = {
      assetId: scheduleAssetId,
      title: scheduleTitle,
      description: scheduleDescription,
      dueDate: scheduleDueDate,
      priority: schedulePriority,
      assignedTo: scheduleAssignedTo || undefined,
      status: scheduleStatus,
    };

    if (editingSchedule) {
      db.updateSchedule(editingSchedule.id, payload);
    } else {
      db.createSchedule(payload);
    }

    setShowScheduleModal(false);
    refreshData();
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this maintenance schedule?')) {
      db.deleteSchedule(id);
      refreshData();
    }
  };
  const [formError, setFormError] = useState('');

  // Handle open Asset Modal for Create
  const handleOpenCreate = () => {
    setEditingAsset(null);
    setAssetCode(`AST-00${assets.length + 1}`);
    setAssetName('');
    setAssetCategory('Electronics');
    setAssetLocation('');
    setAssetCondition('New');
    setAssetStatus('Operational');
    setLastService(new Date().toISOString().split('T')[0]);
    
    const next = new Date();
    next.setMonth(next.getMonth() + 6);
    setNextService(next.toISOString().split('T')[0]);
    
    setFormError('');
    setShowAssetModal(true);
  };

  // Handle open Asset Modal for Edit
  const handleOpenEdit = (ast: Asset) => {
    setEditingAsset(ast);
    setAssetCode(ast.assetCode);
    setAssetName(ast.name);
    setAssetCategory(ast.category);
    setAssetLocation(ast.location);
    setAssetCondition(ast.condition);
    setAssetStatus(ast.status);
    setLastService(ast.lastServiceDate);
    setNextService(ast.nextServiceDate);
    setFormError('');
    setShowAssetModal(true);
  };

  // Handle Asset Form Submit (Create & Update)
  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Business validations
    if (!assetCode.trim() || !assetName.trim() || !assetLocation.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    // Check date correlation business rule: nextServiceDate cannot be before lastServiceDate
    if (new Date(nextService) < new Date(lastService)) {
      setFormError('Next Scheduled Maintenance date cannot be prior to the Last Certified Service date.');
      return;
    }

    try {
      if (editingAsset) {
        // Update
        db.updateAsset(editingAsset.id, {
          assetCode: assetCode.trim().toUpperCase(),
          name: assetName.trim(),
          category: assetCategory,
          location: assetLocation.trim(),
          condition: assetCondition,
          status: assetStatus,
          lastServiceDate: lastService,
          nextServiceDate: nextService,
        }, currentUser.id, currentUser.name);
      } else {
        // Create
        db.createAsset({
          assetCode: assetCode.trim().toUpperCase(),
          name: assetName.trim(),
          category: assetCategory,
          location: assetLocation.trim(),
          condition: assetCondition,
          status: 'Operational',
          lastServiceDate: lastService,
          nextServiceDate: nextService,
          qrUrl: '',
        });
      }

      refreshData();
      setShowAssetModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Validation error while saving asset.');
    }
  };

  // Handle Asset Delete
  const handleDeleteAsset = (asset: Asset) => {
    setAssetToDelete(asset);
  };

  // Handle Technician Assignment Submit
  const handleAssignTech = (techId: string) => {
    if (!assigningIssue) return;

    const targetStatus: IssueStatus = techId === 'unassigned' ? 'Reported' : 'Assigned';
    db.updateIssue(assigningIssue.id, {
      assignedTechnicianId: techId === 'unassigned' ? undefined : techId,
      status: targetStatus
    }, currentUser.id, currentUser.name);

    refreshData();
    setAssigningIssue(null);
  };

  // Filter Assets List
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || a.status === statusFilter;
      const matchCategory = !categoryFilter || a.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [assets, searchQuery, statusFilter, categoryFilter]);

  // Filter Issues List
  const filteredIssues = useMemo(() => {
    return issues.filter(i => {
      const asset = assets.find(a => a.id === i.assetId);
      const matchSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.issueNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (asset?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = !statusFilter || i.status === statusFilter;
      const matchPriority = !priorityFilter || i.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [issues, assets, searchQuery, statusFilter, priorityFilter]);

  // Upcoming & Overdue maintenance list splits
  const maintenanceSchedules = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const overdue: Asset[] = [];
    const upcoming: Asset[] = [];

    assets.forEach(a => {
      if (a.status === 'Retired') return;
      if (a.nextServiceDate < today) {
        overdue.push(a);
      } else {
        upcoming.push(a);
      }
    });

    // Sort dates
    overdue.sort((a, b) => a.nextServiceDate.localeCompare(b.nextServiceDate));
    upcoming.sort((a, b) => a.nextServiceDate.localeCompare(b.nextServiceDate));

    return { overdue, upcoming };
  }, [assets]);

  // General counts overview metrics
  const statsOverview = useMemo(() => {
    const total = assets.length;
    const operational = assets.filter(a => a.status === 'Operational').length;
    const maintenance = assets.filter(a => ['Under Inspection', 'Under Maintenance'].includes(a.status)).length;
    const openIssues = issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length;

    return { total, operational, maintenance, openIssues };
  }, [assets, issues]);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400';
      default: return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400';
    }
  };

  const renderTabContent = () => {
    // 1. --- OVERVIEW TAB PANEL ---
    if (currentTab === 'overview') {
      return (
      <div className="space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Monitored Assets</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{statsOverview.total}</h3>
              <Layers className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Healthy / Operational</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">{statsOverview.operational}</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Under Maintenance</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-3xl font-bold text-brand-600 dark:text-brand-400">{statsOverview.maintenance}</h3>
              <Wrench className="w-5 h-5 text-brand-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Open Backlog Issues</p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{statsOverview.openIssues}</h3>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Recent reports row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Unresolved Repairs Queue</span>
              <button 
                onClick={() => onTabChange?.('issues')} 
                className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                View Queue
              </button>
            </h3>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).slice(0, 5).map(isu => {
                const affectedAsset = assets.find(a => a.id === isu.assetId);
                const tech = workers.find(w => w.id === isu.assignedTechnicianId);
                return (
                  <div 
                    key={isu.id} 
                    onClick={() => setViewingIssue(isu)}
                    className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all cursor-pointer group"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{isu.issueNumber}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(isu.priority)}`}>
                          {isu.priority}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-white truncate max-w-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{isu.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate">Asset: {affectedAsset?.name || 'Asset'}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {tech ? (
                          <p className="font-medium text-slate-700 dark:text-slate-300">{tech.name}</p>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssigningIssue(isu);
                            }}
                            className="text-red-500 font-bold hover:underline bg-red-50 dark:bg-red-950/25 px-2 py-0.5 rounded cursor-pointer border border-red-200/40"
                            title="Click to assign technician"
                          >
                            Unassigned
                          </button>
                        )}
                        <p className="text-[9px] text-slate-405 mt-0.5">{new Date(isu.createdAt).toLocaleDateString()}</p>
                      </div>

                      {/* Eye Icon button to open details */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingIssue(isu);
                        }}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 rounded-lg transition-all cursor-pointer"
                        title="View issue details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-6">All reported issues have been fully resolved! Zero backlog.</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Overdue Maintenance Alerts
            </h3>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {maintenanceSchedules.overdue.slice(0, 4).map(ast => (
                <div key={ast.id} className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-950 rounded-xl text-xs flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{ast.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {ast.assetCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-red-600 dark:text-red-400">{ast.nextServiceDate}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Overdue</p>
                  </div>
                </div>
              ))}
              {maintenanceSchedules.overdue.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-8">Zero overdue equipment schedules. Everything up to date.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // 2. --- ASSETS MANAGEMENT TAB PANEL ---
  if (currentTab === 'assets') {
    return (
      <div className="space-y-6">
        
        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets, codes, or locations..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Operational">Operational</option>
                <option value="Issue Reported">Issue Reported</option>
                <option value="Under Inspection">Under Inspection</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Out of Service">Out of Service</option>
                <option value="Retired">Retired</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Heavy Equipment">Heavy Equipment</option>
                <option value="HVAC">HVAC</option>
                <option value="Appliances">Appliances</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>

        {/* Assets table/grid list */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Code / Asset</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last / Next Service</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                {filteredAssets.map(ast => {
                  const assetIssues = issues.filter(isu => isu.assetId === ast.id);
                  const activeIssue = assetIssues.find(isu => isu.status !== 'Resolved' && isu.status !== 'Closed');

                  // Determine condition displayed dynamically
                  let displayedCondition = ast.condition;
                  if (activeIssue) {
                    if (activeIssue.priority === 'Critical') displayedCondition = 'Critical';
                    else if (activeIssue.priority === 'High') displayedCondition = 'Poor';
                    else if (activeIssue.priority === 'Medium') displayedCondition = 'Fair';
                    else if (activeIssue.priority === 'Low') displayedCondition = 'Fair';
                  }

                  return (
                    <tr key={ast.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleAssetCodeClick(ast)}
                          className="font-mono font-bold text-brand-600 dark:text-brand-400 hover:underline hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left transition-all"
                          title="Click to view related service tickets"
                        >
                          <span>{ast.assetCode}</span>
                          <Eye className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                        </button>
                        <div className="font-bold text-slate-800 dark:text-white mt-0.5 truncate max-w-[150px]">{ast.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{ast.category}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {ast.location}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className={`font-bold ${
                            displayedCondition === 'New' || displayedCondition === 'Good' 
                              ? 'text-green-600 dark:text-green-400' 
                              : displayedCondition === 'Fair' 
                              ? 'text-yellow-600 dark:text-yellow-400' 
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {displayedCondition}
                          </span>
                          {activeIssue && (
                            <span className="text-[9px] text-red-500 font-bold animate-pulse mt-0.5 flex items-center gap-1 bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded border border-red-100 dark:border-red-900/30 w-fit">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-red-500" />
                              {activeIssue.priority} Issue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          ast.status === 'Operational' ? 'bg-green-50 text-green-700 border-green-200' : ast.status === 'Retired' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {ast.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[10px] space-y-0.5">
                        <div><b>Last:</b> {ast.lastServiceDate}</div>
                        <div><b>Next:</b> {ast.nextServiceDate}</div>
                      </td>
                    <td className="py-3.5 px-4 text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setShowQrModal(ast)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-brand-50 border border-slate-100 dark:border-slate-800 cursor-pointer"
                          title="Generate QR label"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ast)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-brand-50 border border-slate-100 dark:border-slate-800 cursor-pointer"
                          title="Edit asset details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(ast)}
                          className="p-1.5 text-slate-500 hover:text-red-600 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-red-50 border border-slate-100 dark:border-slate-800 cursor-pointer"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
                {filteredAssets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">No assets match your current lookup criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // 3. --- ISSUE MANAGEMENT TAB PANEL ---
  if (currentTab === 'issues') {
    return (
      <div className="space-y-6">
        
        {/* Filter toolbar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues, numbers, or affected assets..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Assigned">Assigned</option>
                <option value="Inspection Started">Inspection Started</option>
                <option value="Maintenance In Progress">Maintenance In Progress</option>
                <option value="Waiting for Parts">Waiting for Parts</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="">All Urgency Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Issues list */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Affected Equipment</th>
                  <th className="py-3 px-4">Issue Details</th>
                  <th className="py-3 px-4">Severity / status</th>
                  <th className="py-3 px-4">Assigned Worker</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                {filteredIssues.map(isu => {
                  const affectedAsset = assets.find(a => a.id === isu.assetId);
                  const assignedTech = workers.find(w => w.id === isu.assignedTechnicianId);
                  return (
                    <tr key={isu.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/10 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {isu.issueNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{affectedAsset?.name || 'Asset'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{affectedAsset?.assetCode} • {affectedAsset?.location}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-800 dark:text-white truncate">{isu.title}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{isu.description}</div>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getPriorityColor(isu.priority)}`}>
                            {isu.priority}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{isu.status}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {assignedTech ? (
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{assignedTech.name}</div>
                        ) : (
                          <span className="text-red-500 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingIssue(isu)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 rounded-lg cursor-pointer border border-transparent hover:border-slate-200/40 dark:hover:border-slate-700/40 transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAssigningIssue(isu)}
                            disabled={isu.status === 'Closed'}
                            className="bg-slate-50 dark:bg-slate-900 hover:bg-brand-50 hover:text-brand-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0"
                          >
                            Dispatch Work
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredIssues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">No service tickets matched current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // 4. --- SCHEDULED MAINTENANCE TAB PANEL ---
  if (currentTab === 'schedule') {
    return (
      <div className="space-y-8">
        
        {/* Custom Interactive Maintenance Schedules */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-premium space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Interactive Maintenance Schedules</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add, edit, assign, and reassign maintenance tasks to technicians.</p>
            </div>
            
            <button
              onClick={() => handleOpenScheduleModal()}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Maintenance</span>
            </button>
          </div>

          {schedules.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {schedules.map(sched => {
                const affectedAsset = assets.find(a => a.id === sched.assetId);
                const assignedWorker = workers.find(w => w.id === sched.assignedTo);
                
                return (
                  <div 
                    key={sched.id} 
                    className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-brand-100 dark:hover:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Badge Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getPriorityColor(sched.priority)}`}>
                            {sched.priority} Priority
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                            sched.status === 'Completed' 
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40' 
                              : sched.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40'
                              : sched.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                              : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40'
                          }`}>
                            {sched.status}
                          </span>
                        </div>
                        
                        <span className="text-[10px] text-slate-400 font-mono">ID: {sched.id}</span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
                          {sched.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {sched.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Asset quick specification */}
                      {affectedAsset ? (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-brand-600 dark:text-brand-400 font-mono">{affectedAsset.assetCode}</span>
                            <span className="text-slate-400">{affectedAsset.location}</span>
                          </div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{affectedAsset.name}</p>
                        </div>
                      ) : (
                        <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 rounded-xl text-xs text-red-500 italic">
                          Asset information missing.
                        </div>
                      )}
                    </div>

                    {/* Footer Row: Worker assignment and edit/delete actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      {/* Technician assignment status */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Tech</p>
                        {assignedWorker ? (
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                            <div className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase border border-brand-100/40">
                              {assignedWorker.name.charAt(0)}
                            </div>
                            <span className="truncate max-w-[120px]">{assignedWorker.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-500 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Unassigned</span>
                          </div>
                        )}
                      </div>

                      {/* Due date details */}
                      <div className="space-y-1 sm:text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Due Date</p>
                        <div className="flex items-center sm:justify-end gap-1 font-bold text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sched.dueDate}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 pt-1.5 sm:pt-0 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleOpenScheduleModal(sched)}
                          className="p-2 text-slate-500 hover:text-brand-600 bg-white hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-brand-950/20 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-100/50 transition-all cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                          title="Edit task details or Reassign tech"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit / Reassign</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(sched.id)}
                          className="p-2 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/25 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-red-100/50 transition-all cursor-pointer"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-400 italic">No custom maintenance schedules defined yet.</p>
              <button
                onClick={() => handleOpenScheduleModal()}
                className="mt-3 text-xs font-bold text-brand-600 hover:underline cursor-pointer bg-transparent border-none"
              >
                Create your first schedule now
              </button>
            </div>
          )}
        </div>

        {/* Compliant Inspection Intervals (Based on automatic Next Service Dates on assets) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Overdue queue */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-3">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Asset-interval Overdue Service ({maintenanceSchedules.overdue.length})</h3>
            </div>

            {maintenanceSchedules.overdue.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {maintenanceSchedules.overdue.map(ast => (
                  <div key={ast.id} className="p-3 bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-950/60 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold px-2 py-0.5 rounded font-mono uppercase">{ast.assetCode}</span>
                      <h4 className="font-bold text-slate-800 dark:text-white mt-1 text-xs">{ast.name}</h4>
                      <p className="text-[10px] text-slate-400">Location: {ast.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-red-600 dark:text-red-400">{ast.nextServiceDate}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Overdue</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">All physical assets are compliant with scheduled maintenance intervals.</p>
            )}
          </div>

          {/* Upcoming queue */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Asset-interval Upcoming Service ({maintenanceSchedules.upcoming.length})</h3>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {maintenanceSchedules.upcoming.map(ast => (
                <div key={ast.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded font-mono uppercase">{ast.assetCode}</span>
                    <h4 className="font-bold text-slate-800 dark:text-white mt-1 text-xs">{ast.name}</h4>
                    <p className="text-[10px] text-slate-400">Location: {ast.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">{ast.nextServiceDate}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Upcoming</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  }

    return null;
  };

  return (
    <div className="relative">
      {renderTabContent()}
      
      {/* 🚀 --- ASSETS MUTATION MODAL --- */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-lg w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingAsset ? 'Edit Registered Asset' : 'Register New Enterprise Asset'}
              </h3>
              <button
                onClick={() => setShowAssetModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Close
              </button>
            </div>

            {formError && (
              <p className="text-xs text-red-500 font-bold p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">{formError}</p>
            )}

            <form onSubmit={handleAssetSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Asset Tag Code *</label>
                  <input
                    type="text"
                    required
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    placeholder="AST-0001"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white font-mono uppercase tracking-widest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="Classroom Projector 01"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Subsystem Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Heavy Equipment">Heavy Equipment</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Appliances">Appliances</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Deployment Location *</label>
                  <input
                    type="text"
                    required
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    placeholder="Room 302, 3rd Floor"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Physical Condition</label>
                  <select
                    value={assetCondition}
                    onChange={(e) => setAssetCondition(e.target.value as AssetCondition)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {editingAsset && (
                  <div>
                    <label className="block font-bold text-slate-600 uppercase mb-1">Operating Status</label>
                    <select
                      value={assetStatus}
                      onChange={(e) => setAssetStatus(e.target.value as AssetStatus)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none"
                    >
                      <option value="Operational">Operational</option>
                      <option value="Issue Reported">Issue Reported</option>
                      <option value="Under Inspection">Under Inspection</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Out of Service">Out of Service</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Last Certified Service</label>
                  <input
                    type="date"
                    required
                    value={lastService}
                    onChange={(e) => setLastService(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Next Scheduled Service</label>
                  <input
                    type="date"
                    required
                    value={nextService}
                    onChange={(e) => setNextService(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-premium cursor-pointer"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 --- QR CODE VIEW MODAL --- */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center">Interactive Asset Label Tag</h3>
            <QRGenerator
              assetCode={showQrModal.assetCode}
              assetName={showQrModal.name}
              location={showQrModal.location}
            />
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 text-center">
              <button
                onClick={() => setShowQrModal(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 --- ASSET DELETE CONFIRMATION MODAL --- */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Asset?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you absolutely sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">{assetToDelete.name}</span> ({assetToDelete.assetCode})? This action is irreversible and clears all associated maintenance logs.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 text-xs">
              <button
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  db.deleteAsset(assetToDelete.id, currentUser.id, currentUser.name);
                  refreshData();
                  setAssetToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 --- SERVICE TICKET / ISSUE DETAILS MODAL --- */}
      {viewingIssue && (() => {
        const affectedAsset = assets.find(a => a.id === viewingIssue.assetId);
        const assignedTech = workers.find(w => w.id === viewingIssue.assignedTechnicianId);
        const records = db.getRecords().filter(r => r.issueId === viewingIssue.id);
        const historyLogs = db.getHistory().filter(h => h.issueId === viewingIssue.id);

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50 text-xs">
                    {viewingIssue.issueNumber}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Service Ticket Details</h3>
                </div>
                <button
                  onClick={() => setViewingIssue(null)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1 text-slate-700 dark:text-slate-300">
                
                {/* Title & Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {viewingIssue.title}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {viewingIssue.description || "No description provided."}
                  </p>
                </div>

                {/* Status, Urgency, Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Severity / Priority</p>
                    <div className="pt-0.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getPriorityColor(viewingIssue.priority)}`}>
                        {viewingIssue.priority}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ticket Status</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 capitalize pt-0.5 text-xs">
                      {viewingIssue.status}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Category</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 pt-0.5 text-xs">
                      {viewingIssue.category}
                    </p>
                  </div>
                </div>

                {/* Equipment & Dispatch Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Affected Equipment */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Affected Equipment</h4>
                    {affectedAsset ? (
                      <div className="space-y-1.5">
                        <p className="font-bold text-slate-800 dark:text-white text-xs">{affectedAsset.name}</p>
                        <div className="space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <p><span className="font-medium text-slate-400">Asset Code:</span> {affectedAsset.assetCode}</p>
                          <p><span className="font-medium text-slate-400">Location:</span> {affectedAsset.location}</p>
                          <p><span className="font-medium text-slate-400">Current Status:</span> {affectedAsset.status}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Equipment info not found.</p>
                    )}
                  </div>

                  {/* Dispatch / Assigned Technician */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Worker</h4>
                      {assignedTech ? (
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 dark:text-white text-xs">{assignedTech.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{assignedTech.email}</p>
                        </div>
                      ) : (
                        <p className="text-red-500 font-bold flex items-center gap-1 text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Unassigned (Backlog)
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setAssigningIssue(viewingIssue);
                          setViewingIssue(null);
                        }}
                        disabled={viewingIssue.status === 'Closed'}
                        className="w-full text-center bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-xl font-bold shadow-xs transition-all disabled:opacity-40 cursor-pointer text-xs"
                      >
                        {assignedTech ? "Re-assign Dispatch" : "Dispatch Now"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Evidence Attachments */}
                {viewingIssue.evidence && viewingIssue.evidence.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attached Evidence / Photo Logs</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingIssue.evidence.map((imgUrl, idx) => (
                        <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="block cursor-zoom-in">
                          <img 
                            src={imgUrl} 
                            alt={`Evidence ${idx + 1}`} 
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 hover:opacity-90 transition-all" 
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Maintenance Records performed */}
                {records.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-1.5">
                      Maintenance Work Performed ({records.length})
                    </h4>
                    <div className="space-y-3">
                      {records.map(rec => {
                        const recWorker = workers.find(w => w.id === rec.technicianId);
                        return (
                          <div key={rec.id} className="p-3.5 bg-green-50/30 dark:bg-green-950/10 border border-green-100 dark:border-green-950/50 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-[10px]">
                              <p className="font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Work Completed by {recWorker?.name || "Technician"}
                              </p>
                              <span className="text-slate-400 font-medium">{new Date(rec.resolvedAt).toLocaleString()}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                              <div>
                                <p className="text-[9px] text-slate-400 font-semibold uppercase">Inspection Notes</p>
                                <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">{rec.inspectionNotes}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-semibold uppercase">Work Performed</p>
                                <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{rec.workPerformed}</p>
                              </div>
                            </div>

                            {rec.partsUsed && rec.partsUsed.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[9px] text-slate-400 font-semibold uppercase">Parts & Costs Details</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {rec.partsUsed.map((p, pIdx) => (
                                    <span key={pIdx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg text-[10px]">
                                      {p.name} (${p.cost})
                                    </span>
                                  ))}
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded-lg font-bold text-[10px]">
                                    Total: ${rec.totalCost}
                                  </span>
                                  <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 rounded-lg font-bold text-[10px]">
                                    Duration: {rec.timeSpent} mins
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Audit & Activity Timeline */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-1.5">
                    Ticket Activity Timeline
                  </h4>
                  <div className="relative pl-3 border-l-2 border-slate-100 dark:border-slate-700 space-y-4">
                    {historyLogs.length > 0 ? (
                      historyLogs.map(evt => (
                        <div key={evt.id} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-slate-800" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-700 dark:text-slate-300">{evt.action}</p>
                            <p className="text-[10px] text-slate-400">
                              By {evt.actorName} • <span className="font-mono">{new Date(evt.date).toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="relative">
                        <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-slate-800" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-700 dark:text-slate-300">Ticket Registered</p>
                          <p className="text-[10px] text-slate-400">
                            By {viewingIssue.reporterName} • <span className="font-mono">{new Date(viewingIssue.createdAt).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end shrink-0 bg-slate-50 dark:bg-slate-900/40 rounded-b-3xl">
                <button
                  onClick={() => setViewingIssue(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold cursor-pointer text-xs transition-all shadow-md"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 🚀 --- WORKER ASSIGNMENT DISPATCH MODAL --- */}
      {assigningIssue && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-700/50 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white">Dispatch Ticket {assigningIssue.issueNumber}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{assigningIssue.title}</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <label className="block font-bold text-slate-500 uppercase tracking-wider">Select Available Technician</label>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleAssignTech('unassigned')}
                  className={`w-full text-left p-3 rounded-xl border font-bold transition-all flex items-center justify-between ${
                    !assigningIssue.assignedTechnicianId 
                      ? 'bg-red-50/50 border-red-300 text-red-700' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>Leave Unassigned / Queue</span>
                  <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded uppercase">Default</span>
                </button>

                {workers.map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleAssignTech(w.id)}
                    className={`w-full text-left p-3 rounded-xl border font-bold transition-all flex items-center justify-between cursor-pointer ${
                      assigningIssue.assignedTechnicianId === w.id 
                        ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/20 dark:border-brand-900 dark:text-brand-400' 
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{w.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({w.email})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAssigningIssue(null)}
                className="px-4 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🟢 --- NO ISSUES ALERT MODAL --- */}
      {noIssueAlert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-5 text-center">
            
            {/* Green Animated/Pulse Check Circle */}
            <div className="mx-auto w-16 h-16 bg-green-50 dark:bg-green-950/30 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center border border-green-200 dark:border-green-900/40 shadow-sm">
              <CheckCircle className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Equipment Status Healthy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No active or historical service tickets found for this asset.
              </p>
            </div>

            {/* Asset quick specs card */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Asset Code</span>
                <span className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-2 py-0.5 rounded text-[10px]">
                  {noIssueAlert.assetCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{noIssueAlert.assetName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="px-2 py-0.5 text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 rounded-full">
                  Fully Operational
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              All inspections, safety checks, and telemetry readings are clean.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setNoIssueAlert(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md"
              >
                Close Status Overview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🛠️ --- INTERACTIVE MAINTENANCE SCHEDULE MODAL --- */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 max-w-lg w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>{editingSchedule ? 'Edit Maintenance Task' : 'Schedule New Maintenance'}</span>
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              
              {/* Asset Select */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase">Target Equipment / Asset *</label>
                <select
                  value={scheduleAssetId}
                  onChange={(e) => setScheduleAssetId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 font-medium"
                  required
                >
                  <option value="" disabled>Select an Asset</option>
                  {assets.map(ast => (
                    <option key={ast.id} value={ast.id}>
                      {ast.assetCode} — {ast.name} ({ast.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase">Maintenance Title *</label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="e.g., Compressor replacement, safety diagnostics"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 font-medium"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase">Task Details / Instructions</label>
                <textarea
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  placeholder="Provide precise details, steps to reproduce, or tools required..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Due Date */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase">Due Date *</label>
                  <input
                    type="date"
                    value={scheduleDueDate}
                    onChange={(e) => setScheduleDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 font-medium font-mono"
                    required
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase">Priority Rating</label>
                  <select
                    value={schedulePriority}
                    onChange={(e) => setSchedulePriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assign Technician */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase">Assign Technician (Worker)</label>
                  <select
                    value={scheduleAssignedTo}
                    onChange={(e) => setScheduleAssignedTo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 font-medium"
                  >
                    <option value="">Unassigned (Queue)</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 leading-normal">Assigning or switching will automatically dispatch a real-time notification to the worker.</p>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase">Current Progress State</label>
                  <select
                    value={scheduleStatus}
                    onChange={(e) => setScheduleStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 font-medium"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
                >
                  {editingSchedule ? 'Save Changes & Dispatches' : 'Register Schedule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
