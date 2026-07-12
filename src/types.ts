/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'worker' | 'public';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain-text mock in localStorage
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
}

export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Critical';
export type AssetStatus = 'Operational' | 'Issue Reported' | 'Under Inspection' | 'Under Maintenance' | 'Out of Service' | 'Retired';

export interface Asset {
  id: string;
  assetCode: string; // Unique, e.g., AST-0001
  name: string;
  category: string;
  location: string;
  condition: AssetCondition;
  status: AssetStatus;
  lastServiceDate: string;
  nextServiceDate: string;
  assignedTechnicianId?: string; // Optional default assignee
  qrUrl: string;
  createdAt: string;
}

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueStatus = 
  | 'Reported' 
  | 'Assigned' 
  | 'Inspection Started' 
  | 'Maintenance In Progress' 
  | 'Waiting for Parts' 
  | 'Resolved' 
  | 'Closed' 
  | 'Reopened';

export interface AISuggested {
  title: string;
  category: string;
  priority: IssuePriority;
  possibleCauses: string[];
  initialChecks: string[];
  recurringPatternWarning?: string | null;
}

export interface Issue {
  id: string;
  issueNumber: string; // Unique, e.g., ISU-1001
  assetId: string;
  reporterId?: string; // Empty if reported by anonymous public
  reporterName: string;
  title: string;
  description: string;
  category: string;
  priority: IssuePriority;
  status: IssueStatus;
  assignedTechnicianId?: string;
  aiSuggested?: AISuggested;
  aiSuggestedUsed?: {
    title: boolean;
    category: boolean;
    priority: boolean;
  };
  evidence?: string[]; // Base64 or object URLs
  createdAt: string;
  updatedAt: string;
}

export interface PartUsed {
  name: string;
  cost: number;
}

export interface MaintenanceRecord {
  id: string;
  issueId: string;
  technicianId: string;
  inspectionNotes: string;
  workPerformed: string;
  partsUsed: PartUsed[];
  totalCost: number;
  timeSpent: number; // in minutes
  evidence?: string[];
  finalCondition: AssetCondition;
  resolvedAt: string;
}

export interface AssetHistoryEvent {
  id: string;
  assetId: string;
  issueId?: string;
  actorId: string;
  actorName: string;
  action: string; // e.g., "Asset Created", "Issue Reported", "Technician Assigned"
  date: string;
}

export type NotificationType = 'info' | 'warning' | 'alert' | 'success';

export interface Notification {
  id: string;
  userId: string; // target user ID (or "all-admins" or "all")
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: string; // User ID of the technician (worker)
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

