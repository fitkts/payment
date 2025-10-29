
export interface MemberSession {
  id: string;
  sessionDate: string; // YYYY-MM-DD
  memberId: string;
  memberName: string;
  classCount: number;
  unitPrice: number;
  completionSourceId?: string; // ID of the CalendarEvent that generated this session
}

export interface ForecastEntry {
  id:string;
  forecastDate: string; // YYYY-MM-DD
  memberName: string;
  classCount: number;
  unitPrice: number;
  amount: number;
}

export interface TrackedMember {
  id: string;
  name: string;
  totalSessions: number;
  usedSessions: number;
  unitPrice: number;
  registrationDate: string;
  birthday?: string;
  forecastStatus?: 'manual_dormant' | 'manual_reregister' | null;
}

export interface TrackedMemberWithStats extends TrackedMember {
  ltv: number;
  lastSessionDate?: string;
  cumulativeTotalSessions: number;
  scheduledSessions: number;
}

export interface SaleEntry {
  id: string;
  saleDate: string; // YYYY-MM-DD
  memberId: string;
  memberName: string;
  classCount: number;
  unitPrice: number;
  amount: number;
  paidAmount: number;
}

export interface SaleWithUsage extends SaleEntry {
  usedCount: number;
}

export type ToastType = 'warning' | 'success';

export interface ToastInfo {
  message: string | null;
  type: ToastType;
}

export interface MemberStat {
  name: string;
  value: number;
  unit: string;
}

export interface SalaryPeriodStats {
  period: string;
  totalSalary: number;
  baseSalary: number;
  sessionIncentive: number;
  salesIncentive: number;
  totalDeduction: number;
  finalSalary: number;
  totalSessionsCount: number;
  totalSalesAmount: number;
}

export interface SalaryStatisticsData {
    monthly: SalaryPeriodStats[];
    quarterly: SalaryPeriodStats[];
    yearly: SalaryPeriodStats[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ScannedSession {
  memberName: string;
  sessionDate: string;
  status: 'matched' | 'unmatched';
  matchedId?: string;
  unitPrice?: number;
  selected: boolean;
}

export type CalendarEventType = 'new_member' | 'sale' | 'refund' | 'consultation' | 'workout';

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  title: string;
  startTime: string; // e.g., '14:00'
  endTime: string; // e.g., '15:00'
  memberId: string;
  recurrenceId?: string;
  status?: 'scheduled' | 'completed' | 'cancelled'; // Only for 'workout' type
}


export type ViewType = 'month' | 'week' | 'day' | 'custom';
export type EditMode = 'single' | 'future' | 'all';

export type ScheduleStatus = 'planned' | 'confirmed';

export interface WeeklyScheduleEntry {
  id: string;
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  memberId: string;
  memberName: string;
  status: ScheduleStatus;
}
