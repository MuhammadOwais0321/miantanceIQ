/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { db } from '../utils/db';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function AnalyticsCharts() {
  const issues = db.getIssues();
  const assets = db.getAssets();
  const records = db.getRecords();

  // Aggregate Category Data
  const categoryData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    issues.forEach(i => {
      const cat = i.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [issues]);

  // Aggregate Priority Data
  const priorityData = useMemo(() => {
    const counts: { [key in 'Low' | 'Medium' | 'High' | 'Critical']: number } = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    issues.forEach(i => {
      const prio = i.priority;
      if (counts[prio] !== undefined) {
        counts[prio]++;
      }
    });
    return [
      { name: 'Critical', value: counts.Critical, color: '#ef4444' }, // Red-500
      { name: 'High', value: counts.High, color: '#f97316' },       // Orange-500
      { name: 'Medium', value: counts.Medium, color: '#eab308' },   // Yellow-500
      { name: 'Low', value: counts.Low, color: '#22c55e' },         // Green-500
    ].filter(item => item.value > 0);
  }, [issues]);

  // Aggregate Top Recurring Assets
  const recurringAssetsData = useMemo(() => {
    const counts: { [key: string]: { name: string; count: number } } = {};
    issues.forEach(i => {
      const asset = assets.find(a => a.id === i.assetId);
      if (asset) {
        if (!counts[asset.id]) {
          counts[asset.id] = { name: `${asset.name} (${asset.assetCode})`, count: 0 };
        }
        counts[asset.id].count++;
      }
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [issues, assets]);

  // Aggregate Time Resolution Trend
  const trendData = useMemo(() => {
    // Generate dates for last 6 days or 6 months. Let's do months/days based on creation dates
    const monthlyCounts: { [key: string]: { reported: number; resolved: number } } = {};
    
    // We'll create last 5 months
    const monthNames = ['Mar', 'Apr', 'May', 'Jun', 'Jul'];
    monthNames.forEach(m => {
      monthlyCounts[m] = { reported: 0, resolved: 0 };
    });

    issues.forEach(i => {
      const date = new Date(i.createdAt);
      const month = date.toLocaleString('en-US', { month: 'short' });
      if (monthlyCounts[month]) {
        monthlyCounts[month].reported++;
      }
    });

    records.forEach(r => {
      const date = new Date(r.resolvedAt);
      const month = date.toLocaleString('en-US', { month: 'short' });
      if (monthlyCounts[month]) {
        monthlyCounts[month].resolved++;
      }
    });

    return Object.entries(monthlyCounts).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [issues, records]);

  // Key KPI stats
  const kpis = useMemo(() => {
    const total = issues.length;
    const resolved = issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const open = total - resolved;
    const mttr = records.length > 0 
      ? Math.round(records.reduce((acc, r) => acc + r.timeSpent, 0) / records.length) 
      : 0;

    return { total, resolved, open, mttr };
  }, [issues, records]);

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No Analytics Data Yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Once users report issues and technicians log maintenance records, this screen will populate with live, fully-interactive charts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Reported Issues</p>
          <div className="flex items-baseline justify-between mt-2">
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{kpis.total}</h4>
            <span className="text-[10px] bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded-full">All time</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Open Backlog</p>
          <div className="flex items-baseline justify-between mt-2">
            <h4 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{kpis.open}</h4>
            <span className="text-[10px] bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-bold px-2 py-0.5 rounded-full">Pending Fix</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved Jobs</p>
          <div className="flex items-baseline justify-between mt-2">
            <h4 className="text-3xl font-bold text-green-600 dark:text-green-400">{kpis.resolved}</h4>
            <span className="text-[10px] bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 font-bold px-2 py-0.5 rounded-full">Success</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg. Repair Time</p>
          <div className="flex items-baseline justify-between mt-2">
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{kpis.mttr} <span className="text-sm font-normal text-slate-500">mins</span></h4>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">MTTR</span>
          </div>
        </div>
      </div>

      {/* Main Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category breakdown (Bar) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Issues by Subsystem Category</h4>
          <div className="h-72">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No category counts</div>
            )}
          </div>
        </div>

        {/* Priority breakdown (Pie) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Issues by Severity Level</h4>
          <div className="h-72 flex flex-col md:flex-row items-center justify-center">
            {priorityData.length > 0 ? (
              <>
                <div className="h-full w-full md:w-3/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: 12, border: 'none', backgroundColor: '#1e293b', color: '#ffffff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legends list */}
                <div className="w-full md:w-2/5 flex flex-col gap-2.5 pl-4">
                  {priorityData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-xs text-slate-400 ml-auto font-mono">({item.value} issues)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No priority counts</div>
            )}
          </div>
        </div>

        {/* Load & Resolution Trends (Line) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Activity Load Trend (Reported vs Resolved)</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="reported" stroke="#f97316" strokeWidth={2.5} name="Reported" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2.5} name="Resolved" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top recurring failure assets (Bar) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Top Faulty Assets (Issue Count)</h4>
          <div className="h-72">
            {recurringAssetsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recurringAssetsData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={130} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b' }}
                  />
                  <Bar dataKey="count" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No recurring asset data</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
