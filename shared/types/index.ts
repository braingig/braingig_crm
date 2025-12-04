// Shared TypeScript types for the entire application

export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  TEAM_LEAD = 'TEAM_LEAD',
  DEVELOPER = 'DEVELOPER',
  SALES = 'SALES',
  FINANCE = 'FINANCE',
}

export enum SalaryType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SalesStatus {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  skills?: string[];
  salaryType: SalaryType;
  salaryAmount: number;
  joiningDate: Date;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  budget: number;
  hourlyRate?: number;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  clientName?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId?: string;
  startDate?: Date;
  dueDate?: Date;
  timeSpent: number; // in minutes
  estimatedTime?: number; // in minutes
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  totalHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
  isManual: boolean;
  createdAt: Date;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: Date;
  baseSalary: number;
  bonus: number;
  deductions: number;
  totalPaid: number;
  hoursWorked?: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  leadName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  source?: string;
  status: SalesStatus;
  estimatedValue: number;
  actualValue?: number;
  assignedToId: string;
  notes?: string;
  expectedCloseDate?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

// API Response Types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  totalHoursWorked: number;
  tasksCompleted: number;
  averageTaskTime: number;
  productivity: number; // percentage
}

// GraphQL Input Types
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  skills?: string[];
  salaryType: SalaryType;
  salaryAmount: number;
  joiningDate: Date;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  department?: string;
  skills?: string[];
  salaryType?: SalaryType;
  salaryAmount?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  budget: number;
  hourlyRate?: number;
  startDate: Date;
  endDate?: Date;
  clientName?: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assignedToId?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedTime?: number;
}

export interface TimeTrackingInput {
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  description?: string;
}

export interface CreateSaleInput {
  leadName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  source?: string;
  estimatedValue: number;
  assignedToId: string;
  notes?: string;
  expectedCloseDate?: Date;
}
