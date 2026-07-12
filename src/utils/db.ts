/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  User, 
  Asset, 
  Issue, 
  MaintenanceRecord, 
  AssetHistoryEvent, 
  Notification,
  AssetStatus,
  AssetCondition,
  MaintenanceSchedule
} from '../types';

// Storage keys
const KEYS = {
  USERS: 'mq_users',
  ASSETS: 'mq_assets',
  ISSUES: 'mq_issues',
  RECORDS: 'mq_records',
  HISTORY: 'mq_history',
  NOTIFICATIONS: 'mq_notifications',
  SCHEDULES: 'mq_schedules',
};

// Seed helper to initialize database if empty
export function initDB() {
  if (!localStorage.getItem(KEYS.USERS)) {
    // 1. Seed Users (1 admin, 2 technicians, 1 public demo user)
    const seedUsers: User[] = [
      {
        id: 'usr-admin',
        name: 'Jane Doe (Admin)',
        email: 'admin@maintainiq.com',
        passwordHash: 'Admin@123', // Clean demo credential
        role: 'admin',
        status: 'active',
        createdAt: new Date('2026-01-10T08:00:00Z').toISOString(),
      },
      {
        id: 'usr-tech1',
        name: 'Alex Rivera (Technician)',
        email: 'tech1@maintainiq.com',
        passwordHash: 'Tech@123',
        role: 'worker',
        status: 'active',
        createdAt: new Date('2026-01-11T09:00:00Z').toISOString(),
      },
      {
        id: 'usr-tech2',
        name: 'Sarah Chen (Technician)',
        email: 'tech2@maintainiq.com',
        passwordHash: 'Tech@123',
        role: 'worker',
        status: 'active',
        createdAt: new Date('2026-01-12T10:00:00Z').toISOString(),
      },
      {
        id: 'usr-public',
        name: 'John Public',
        email: 'john@gmail.com',
        passwordHash: 'User@123',
        role: 'public',
        status: 'active',
        createdAt: new Date('2026-01-15T12:00:00Z').toISOString(),
      },
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(seedUsers));

    // 2. Seed Assets
    const seedAssets: Asset[] = [
      {
        id: 'ast-0001',
        assetCode: 'AST-0001',
        name: 'Classroom Projector 01',
        category: 'Electronics',
        location: 'Room 302',
        condition: 'Good',
        status: 'Operational',
        lastServiceDate: '2026-05-15',
        nextServiceDate: '2026-11-15',
        qrUrl: '', // Will be filled dynamically by Router/UI
        createdAt: new Date('2026-01-15T14:00:00Z').toISOString(),
      },
      {
        id: 'ast-0002',
        assetCode: 'AST-0002',
        name: 'Backup Diesel Generator B',
        category: 'Heavy Equipment',
        location: 'Basement - Generator Bay',
        condition: 'Good',
        status: 'Operational',
        lastServiceDate: '2026-06-01',
        nextServiceDate: '2026-09-01',
        qrUrl: '',
        createdAt: new Date('2026-01-16T15:00:00Z').toISOString(),
      },
      {
        id: 'ast-0003',
        assetCode: 'AST-0003',
        name: 'Server Room AC Unit',
        category: 'HVAC',
        location: 'Server Room (2nd Floor)',
        condition: 'Fair',
        status: 'Under Maintenance',
        lastServiceDate: '2026-04-10',
        nextServiceDate: '2026-07-10', // Past date -> shows as overdue if not serviced
        qrUrl: '',
        createdAt: new Date('2026-01-17T16:00:00Z').toISOString(),
      },
      {
        id: 'ast-0004',
        assetCode: 'AST-0004',
        name: 'Breakroom Refrigerator',
        category: 'Appliances',
        location: 'Main Breakroom',
        condition: 'New',
        status: 'Operational',
        lastServiceDate: '2026-07-01',
        nextServiceDate: '2027-01-01',
        qrUrl: '',
        createdAt: new Date('2026-02-01T10:00:00Z').toISOString(),
      }
    ];
    localStorage.setItem(KEYS.ASSETS, JSON.stringify(seedAssets));

    // 3. Seed Issues
    const seedIssues: Issue[] = [
      {
        id: 'isu-1001',
        issueNumber: 'ISU-1001',
        assetId: 'ast-0003',
        reporterName: 'Sysadmin Steve',
        title: 'AC leaking water & weak cooling',
        description: 'Water is dripping from the vent onto the rack floor. Room temperature is slowly rising to 78 degrees.',
        category: 'Leakage / Cooling',
        priority: 'High',
        status: 'Maintenance In Progress',
        assignedTechnicianId: 'usr-tech1',
        aiSuggested: {
          title: 'AC leaking water & cooling efficiency reduction',
          category: 'Leakage / Cooling',
          priority: 'High',
          possibleCauses: ['Blocked condensation drain pipe', 'Frozen evaporator coils', 'Dirty air filter'],
          initialChecks: ['Check water level in drain pan', 'Inspect air intake filter', 'Verify thermostat setpoint'],
          recurringPatternWarning: null,
        },
        createdAt: new Date('2026-07-10T10:00:00Z').toISOString(),
        updatedAt: new Date('2026-07-11T09:00:00Z').toISOString(),
      },
      {
        id: 'isu-1002',
        issueNumber: 'ISU-1002',
        assetId: 'ast-0001',
        reporterName: 'Professor Higgins',
        title: 'Flickering display, HDMI not connecting',
        description: 'When plugging in laptops, the display flickers violently and sometimes cuts out to a static blue screen.',
        category: 'Display / Connectivity',
        priority: 'Medium',
        status: 'Reported',
        aiSuggested: {
          title: 'Projector display instability & connectivity failure',
          category: 'Display / Connectivity',
          priority: 'Medium',
          possibleCauses: ['Loose or faulty HDMI connector', 'Incorrect screen resolution output', 'Projector lamp reaching end of life'],
          initialChecks: ['Inspect physical HDMI cable pins', 'Try alternative HDMI input port', 'Verify input source on projector menu'],
          recurringPatternWarning: null,
        },
        createdAt: new Date('2026-07-11T14:30:00Z').toISOString(),
        updatedAt: new Date('2026-07-11T14:30:00Z').toISOString(),
      },
    ];
    localStorage.setItem(KEYS.ISSUES, JSON.stringify(seedIssues));

    // 4. Seed Maintenance Records
    const seedRecords: MaintenanceRecord[] = [];
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(seedRecords));

    // 5. Seed History Events
    const seedHistory: AssetHistoryEvent[] = [
      {
        id: 'evt-1',
        assetId: 'ast-0001',
        actorId: 'usr-admin',
        actorName: 'Jane Doe (Admin)',
        action: 'Asset Registered',
        date: new Date('2026-01-15T14:00:00Z').toISOString(),
      },
      {
        id: 'evt-2',
        assetId: 'ast-0002',
        actorId: 'usr-admin',
        actorName: 'Jane Doe (Admin)',
        action: 'Asset Registered',
        date: new Date('2026-01-16T15:00:00Z').toISOString(),
      },
      {
        id: 'evt-3',
        assetId: 'ast-0003',
        actorId: 'usr-admin',
        actorName: 'Jane Doe (Admin)',
        action: 'Asset Registered',
        date: new Date('2026-01-17T16:00:00Z').toISOString(),
      },
      {
        id: 'evt-4',
        assetId: 'ast-0003',
        issueId: 'isu-1001',
        actorId: 'usr-public',
        actorName: 'Sysadmin Steve',
        action: 'Issue Reported: AC leaking water & weak cooling',
        date: new Date('2026-07-10T10:00:00Z').toISOString(),
      },
      {
        id: 'evt-5',
        assetId: 'ast-0003',
        issueId: 'isu-1001',
        actorId: 'usr-admin',
        actorName: 'Jane Doe (Admin)',
        action: 'Assigned to Alex Rivera (Technician)',
        date: new Date('2026-07-10T11:00:00Z').toISOString(),
      },
      {
        id: 'evt-6',
        assetId: 'ast-0003',
        issueId: 'isu-1001',
        actorId: 'usr-tech1',
        actorName: 'Alex Rivera (Technician)',
        action: 'Inspection Started',
        date: new Date('2026-07-11T09:00:00Z').toISOString(),
      },
      {
        id: 'evt-7',
        assetId: 'ast-0001',
        issueId: 'isu-1002',
        actorId: 'usr-public',
        actorName: 'Professor Higgins',
        action: 'Issue Reported: Flickering display, HDMI not connecting',
        date: new Date('2026-07-11T14:30:00Z').toISOString(),
      }
    ];
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(seedHistory));

    // 6. Seed Notifications
    const seedNotifications: Notification[] = [
      {
        id: 'notif-1',
        userId: 'usr-admin',
        message: 'New issue reported: Flickering display on Classroom Projector 01',
        type: 'warning',
        read: false,
        createdAt: new Date('2026-07-11T14:30:00Z').toISOString(),
      },
      {
        id: 'notif-2',
        userId: 'usr-tech1',
        message: 'You have been assigned to issue ISU-1001: AC leaking water & weak cooling',
        type: 'info',
        read: false,
        createdAt: new Date('2026-07-10T11:00:00Z').toISOString(),
      }
    ];
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(seedNotifications));

    // 7. Seed Maintenance Schedules
    const seedSchedules: MaintenanceSchedule[] = [
      {
        id: 'sch-0001',
        assetId: 'ast-0003',
        title: 'HVAC Compressor & Filter Check',
        description: 'Check coolant pressure, inspect filters, clean condenser coil, and run diagnostics check.',
        dueDate: '2026-07-15',
        priority: 'High',
        assignedTo: 'usr-tech1',
        status: 'In Progress',
        createdAt: new Date('2026-07-01T10:00:00Z').toISOString(),
      },
      {
        id: 'sch-0002',
        assetId: 'ast-0002',
        title: 'Generator Monthly Load Test',
        description: 'Execute regular monthly test run at 75% load capacity, verify battery water level and fuel status.',
        dueDate: '2026-08-01',
        priority: 'Medium',
        assignedTo: 'usr-tech2',
        status: 'Scheduled',
        createdAt: new Date('2026-07-02T11:00:00Z').toISOString(),
      },
      {
        id: 'sch-0003',
        assetId: 'ast-0001',
        title: 'Projector Filter Replacement',
        description: 'Clean optical lens glass, replace filter grid, inspect system fans for noise or vibrations.',
        dueDate: '2026-10-15',
        priority: 'Low',
        assignedTo: '',
        status: 'Scheduled',
        createdAt: new Date('2026-07-03T12:00:00Z').toISOString(),
      }
    ];
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(seedSchedules));
  }
}

// Low-level helpers
function getTable<T>(key: string): T[] {
  initDB();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveTable<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generate unique ID
function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

// ---------------- USER OPERATIONS ----------------

export const db = {
  getUsers(): User[] {
    return getTable<User>(KEYS.USERS);
  },

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    // Validate duplicate email
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error(`Email ${user.email} is already registered.`);
    }

    const newUser: User = {
      ...user,
      id: genId('usr'),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveTable(KEYS.USERS, users);
    return newUser;
  },

  updateUser(id: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    // Enforce email uniqueness on update
    if (updates.email) {
      const exists = users.some(u => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase());
      if (exists) throw new Error(`Email ${updates.email} is already in use.`);
    }

    users[idx] = { ...users[idx], ...updates };
    saveTable(KEYS.USERS, users);
    return users[idx];
  },

  deleteUser(id: string) {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    saveTable(KEYS.USERS, filtered);
  },

  // ---------------- ASSET OPERATIONS ----------------

  getAssets(): Asset[] {
    return getTable<Asset>(KEYS.ASSETS);
  },

  getAssetById(id: string): Asset | undefined {
    return this.getAssets().find(a => a.id === id);
  },

  getAssetByCode(code: string): Asset | undefined {
    return this.getAssets().find(a => a.assetCode.toUpperCase() === code.toUpperCase());
  },

  createAsset(asset: Omit<Asset, 'id' | 'createdAt'>): Asset {
    const assets = this.getAssets();

    // Enforce Unique assetCode business rule
    if (assets.some(a => a.assetCode.toUpperCase() === asset.assetCode.toUpperCase())) {
      throw new Error(`Duplicate Asset Code: ${asset.assetCode} already exists.`);
    }

    const newAsset: Asset = {
      ...asset,
      id: genId('ast'),
      createdAt: new Date().toISOString(),
    };
    assets.push(newAsset);
    saveTable(KEYS.ASSETS, assets);

    // Push history event
    this.createHistoryEvent({
      assetId: newAsset.id,
      actorId: 'system',
      actorName: 'System',
      action: `Asset Registered: ${newAsset.name} [${newAsset.assetCode}]`,
    });

    return newAsset;
  },

  updateAsset(id: string, updates: Partial<Asset>, actorId = 'system', actorName = 'System'): Asset {
    const assets = this.getAssets();
    const idx = assets.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Asset not found');

    if (updates.assetCode && updates.assetCode.toUpperCase() !== assets[idx].assetCode.toUpperCase()) {
      const exists = assets.some(a => a.id !== id && a.assetCode.toUpperCase() === updates.assetCode!.toUpperCase());
      if (exists) throw new Error(`Duplicate Asset Code: ${updates.assetCode} is already registered.`);
    }

    const original = assets[idx];
    assets[idx] = { ...assets[idx], ...updates };
    saveTable(KEYS.ASSETS, assets);

    // Track state modifications
    const changes: string[] = [];
    if (updates.name && updates.name !== original.name) changes.push(`renamed to "${updates.name}"`);
    if (updates.status && updates.status !== original.status) changes.push(`status updated to ${updates.status}`);
    if (updates.condition && updates.condition !== original.condition) changes.push(`condition updated to ${updates.condition}`);
    if (updates.location && updates.location !== original.location) changes.push(`location updated to ${updates.location}`);

    if (changes.length > 0) {
      this.createHistoryEvent({
        assetId: id,
        actorId,
        actorName,
        action: `Asset updated (${changes.join(', ')})`,
      });
    }

    return assets[idx];
  },

  deleteAsset(id: string, actorId = 'system', actorName = 'System') {
    const asset = this.getAssetById(id);
    if (!asset) return;

    const assets = this.getAssets();
    const filtered = assets.filter(a => a.id !== id);
    saveTable(KEYS.ASSETS, filtered);

    // Filter dependent issues, records, events
    const issues = this.getIssues().filter(i => i.assetId !== id);
    saveTable(KEYS.ISSUES, issues);

    // Clean historical logs
    const logs = this.getHistory().filter(h => h.assetId !== id);
    saveTable(KEYS.HISTORY, logs);
  },

  // ---------------- ISSUE OPERATIONS ----------------

  getIssues(): Issue[] {
    return getTable<Issue>(KEYS.ISSUES);
  },

  getIssueById(id: string): Issue | undefined {
    return this.getIssues().find(i => i.id === id);
  },

  getIssueByNumber(num: string): Issue | undefined {
    return this.getIssues().find(i => i.issueNumber.toUpperCase() === num.toUpperCase());
  },

  createIssue(issue: Omit<Issue, 'id' | 'issueNumber' | 'status' | 'createdAt' | 'updatedAt'>, actorId = 'public-user', actorName = 'Public User'): Issue {
    const issues = this.getIssues();
    
    // Generate consecutive-like unique issue code: ISU-[number]
    const nextNum = 1000 + issues.length + 1;
    const issueNumber = `ISU-${nextNum}`;

    const newIssue: Issue = {
      ...issue,
      id: genId('isu'),
      issueNumber,
      status: 'Reported',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    issues.push(newIssue);
    saveTable(KEYS.ISSUES, issues);

    // Update asset status to "Issue Reported"
    const asset = this.getAssetById(newIssue.assetId);
    if (asset) {
      this.updateAsset(newIssue.assetId, { status: 'Issue Reported' }, actorId, actorName);
    }

    // Push history event
    this.createHistoryEvent({
      assetId: newIssue.assetId,
      issueId: newIssue.id,
      actorId,
      actorName,
      action: `Issue Reported (${issueNumber}): ${newIssue.title} [Priority: ${newIssue.priority}]`,
    });

    // Create Admin notification
    this.createNotification({
      userId: 'usr-admin',
      message: `New Issue Reported: ${issueNumber} on ${asset?.name || 'Asset'}. Priority: ${newIssue.priority}.`,
      type: newIssue.priority === 'Critical' ? 'alert' : 'warning',
      targetTab: 'admin-dashboard',
      targetSubTab: 'issues',
      targetId: newIssue.id,
    });

    return newIssue;
  },

  updateIssue(id: string, updates: Partial<Issue>, actorId = 'system', actorName = 'System'): Issue {
    const issues = this.getIssues();
    const idx = issues.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Issue not found');

    const original = issues[idx];

    // Enforce "Closed issue cannot be edited unless reopened" business rule
    if (original.status === 'Closed' && updates.status !== 'Reopened' && Object.keys(updates).some(k => k !== 'status')) {
      throw new Error('A Closed issue cannot be edited unless it is Reopened first.');
    }

    issues[idx] = { 
      ...issues[idx], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveTable(KEYS.ISSUES, issues);

    const updatedIssue = issues[idx];

    // Automatic asset status updates based on lifecycle
    const asset = this.getAssetById(updatedIssue.assetId);
    if (asset) {
      let nextAssetStatus: AssetStatus = asset.status;
      if (updatedIssue.status === 'Inspection Started') {
        nextAssetStatus = 'Under Inspection';
      } else if (updatedIssue.status === 'Maintenance In Progress' || updatedIssue.status === 'Waiting for Parts') {
        nextAssetStatus = 'Under Maintenance';
      } else if (updatedIssue.status === 'Resolved' || updatedIssue.status === 'Closed') {
        // Check if there are other unresolved issues for this asset
        const activeIssues = issues.filter(i => i.assetId === updatedIssue.assetId && !['Resolved', 'Closed'].includes(i.status));
        if (activeIssues.length === 0) {
          nextAssetStatus = 'Operational';
        } else {
          // Fallback to highest urgency status of active issues
          const criticalExists = activeIssues.some(i => i.priority === 'Critical');
          nextAssetStatus = criticalExists ? 'Out of Service' : 'Issue Reported';
        }
      } else if (updatedIssue.status === 'Reopened') {
        nextAssetStatus = 'Issue Reported';
      }

      // If issue is Critical and not resolved, asset can be forced to "Out of Service" for safety
      if (updatedIssue.priority === 'Critical' && !['Resolved', 'Closed'].includes(updatedIssue.status)) {
        nextAssetStatus = 'Out of Service';
      }

      if (nextAssetStatus !== asset.status) {
        this.updateAsset(updatedIssue.assetId, { status: nextAssetStatus }, actorId, actorName);
      }
    }

    // History log
    const changedFields: string[] = [];
    if (updates.status && updates.status !== original.status) changedFields.push(`status to "${updates.status}"`);
    if (updates.assignedTechnicianId && updates.assignedTechnicianId !== original.assignedTechnicianId) {
      const techs = this.getUsers();
      const techName = techs.find(t => t.id === updates.assignedTechnicianId)?.name || 'Unassigned';
      changedFields.push(`assigned technician to "${techName}"`);

      // Notify the technician
      if (updates.assignedTechnicianId && updates.assignedTechnicianId !== 'unassigned') {
        this.createNotification({
          userId: updates.assignedTechnicianId,
          message: `Assigned task: ${updatedIssue.issueNumber} - ${updatedIssue.title}`,
          type: 'info',
          targetTab: 'worker-dashboard',
          targetId: updatedIssue.id,
        });
      }
    }

    if (changedFields.length > 0) {
      this.createHistoryEvent({
        assetId: updatedIssue.assetId,
        issueId: id,
        actorId,
        actorName,
        action: `Issue ${updatedIssue.issueNumber} updated: ${changedFields.join(', ')}`,
      });
    }

    return updatedIssue;
  },

  // ---------------- MAINTENANCE RECORD OPERATIONS ----------------

  getRecords(): MaintenanceRecord[] {
    return getTable<MaintenanceRecord>(KEYS.RECORDS);
  },

  createMaintenanceRecord(record: Omit<MaintenanceRecord, 'id' | 'resolvedAt'>, actorId: string, actorName: string): MaintenanceRecord {
    const records = this.getRecords();
    const issues = this.getIssues();
    const issue = issues.find(i => i.id === record.issueId);

    if (!issue) throw new Error('Associated issue not found');

    // Enforce business rules:
    // 1. Maintenance notes check (this record itself contains inspectionNotes and workPerformed)
    if (!record.inspectionNotes || !record.workPerformed) {
      throw new Error('An issue cannot be marked Resolved without clear maintenance notes.');
    }

    // 2. Cost cannot be negative
    if (record.totalCost < 0) {
      throw new Error('Total maintenance cost cannot be negative.');
    }
    const partsNegative = record.partsUsed.some(p => p.cost < 0);
    if (partsNegative) {
      throw new Error('Part costs cannot be negative.');
    }

    // 3. nextServiceDate cannot be before the completion date
    const asset = this.getAssetById(issue.assetId);
    if (asset) {
      const today = new Date().toISOString().split('T')[0];
      // Note: nextServiceDate validation should be checked when updating asset, we'll enforce it here as well
    }

    const newRecord: MaintenanceRecord = {
      ...record,
      id: genId('rec'),
      resolvedAt: new Date().toISOString(),
    };

    records.push(newRecord);
    saveTable(KEYS.RECORDS, records);

    // Force Issue status update to Resolved
    this.updateIssue(record.issueId, { status: 'Resolved' }, actorId, actorName);

    // Update asset lastServiceDate and final condition
    if (asset) {
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Calculate a standard next service date (e.g., 6 months from now)
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 6);
      const nextServiceString = nextDate.toISOString().split('T')[0];

      this.updateAsset(asset.id, { 
        lastServiceDate: todayDate,
        nextServiceDate: nextServiceString,
        condition: record.finalCondition
      }, actorId, actorName);
    }

    // Notify Admins
    this.createNotification({
      userId: 'usr-admin',
      message: `Technician ${actorName} resolved ${issue.issueNumber}. Cost: $${newRecord.totalCost}.`,
      type: 'success',
      targetTab: 'admin-dashboard',
      targetSubTab: 'issues',
      targetId: issue.id,
    });

    // History event
    this.createHistoryEvent({
      assetId: issue.assetId,
      issueId: issue.id,
      actorId,
      actorName,
      action: `Maintenance Completed: ${record.workPerformed}. Asset condition: ${record.finalCondition}.`,
    });

    return newRecord;
  },

  // ---------------- HISTORY OPERATIONS ----------------

  getHistory(): AssetHistoryEvent[] {
    const history = getTable<AssetHistoryEvent>(KEYS.HISTORY);
    // Sort chronological descending
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  createHistoryEvent(event: Omit<AssetHistoryEvent, 'id' | 'date'>): AssetHistoryEvent {
    const history = getTable<AssetHistoryEvent>(KEYS.HISTORY);
    const newEvent: AssetHistoryEvent = {
      ...event,
      id: genId('evt'),
      date: new Date().toISOString(),
    };
    history.push(newEvent);
    saveTable(KEYS.HISTORY, history);
    return newEvent;
  },

  // ---------------- NOTIFICATION OPERATIONS ----------------

  getNotifications(userId: string): Notification[] {
    const notifs = getTable<Notification>(KEYS.NOTIFICATIONS);
    return notifs
      .filter(n => n.userId === userId || n.userId === 'all')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createNotification(notif: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
    const notifs = getTable<Notification>(KEYS.NOTIFICATIONS);
    const newNotif: Notification = {
      ...notif,
      id: genId('notif'),
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifs.push(newNotif);
    saveTable(KEYS.NOTIFICATIONS, notifs);
    return newNotif;
  },

  markNotificationRead(id: string) {
    const notifs = getTable<Notification>(KEYS.NOTIFICATIONS);
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      saveTable(KEYS.NOTIFICATIONS, notifs);
    }
  },

  markAllNotificationsRead(userId: string) {
    const notifs = getTable<Notification>(KEYS.NOTIFICATIONS);
    notifs.forEach(n => {
      if (n.userId === userId || n.userId === 'all') {
        n.read = true;
      }
    });
    saveTable(KEYS.NOTIFICATIONS, notifs);
  },

  deleteNotification(id: string) {
    let notifs = getTable<Notification>(KEYS.NOTIFICATIONS);
    notifs = notifs.filter(n => n.id !== id);
    saveTable(KEYS.NOTIFICATIONS, notifs);
  },

  deleteAllNotifications(userId: string) {
    let notifs = getTable<Notification>(KEYS.NOTIFICATIONS);
    notifs = notifs.filter(n => n.userId !== userId && n.userId !== 'all');
    saveTable(KEYS.NOTIFICATIONS, notifs);
  },

  // ---------------- SCHEDULE OPERATIONS ----------------

  getSchedules(): MaintenanceSchedule[] {
    return getTable<MaintenanceSchedule>(KEYS.SCHEDULES);
  },

  createSchedule(schedule: Omit<MaintenanceSchedule, 'id' | 'createdAt'>): MaintenanceSchedule {
    const schedules = this.getSchedules();
    const newSchedule: MaintenanceSchedule = {
      ...schedule,
      id: genId('sch'),
      createdAt: new Date().toISOString(),
    };
    schedules.push(newSchedule);
    saveTable(KEYS.SCHEDULES, schedules);

    // Create a history event for the asset
    this.createHistoryEvent({
      assetId: schedule.assetId,
      actorId: 'system',
      actorName: 'System / Admin',
      action: `Maintenance Scheduled: "${schedule.title}"`
    });

    // Notify assigned technician if any
    if (newSchedule.assignedTo) {
      this.createNotification({
        userId: newSchedule.assignedTo,
        message: `New Maintenance Scheduled: ${newSchedule.title} is assigned to you.`,
        type: 'info',
        targetTab: 'worker-dashboard',
        targetId: newSchedule.id,
      });
    }

    return newSchedule;
  },

  updateSchedule(id: string, updates: Partial<MaintenanceSchedule>): MaintenanceSchedule {
    const schedules = this.getSchedules();
    const idx = schedules.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Schedule not found');

    const oldAssignedTo = schedules[idx].assignedTo;
    schedules[idx] = { ...schedules[idx], ...updates };
    saveTable(KEYS.SCHEDULES, schedules);

    // If assigned worker changed or newly assigned
    if (updates.assignedTo && updates.assignedTo !== oldAssignedTo) {
      this.createNotification({
        userId: updates.assignedTo,
        message: `Maintenance Assigned: ${schedules[idx].title} has been assigned to you.`,
        type: 'info',
        targetTab: 'worker-dashboard',
        targetId: schedules[idx].id,
      });
    }

    return schedules[idx];
  },

  deleteSchedule(id: string): void {
    const schedules = this.getSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    saveTable(KEYS.SCHEDULES, filtered);
  }
};
