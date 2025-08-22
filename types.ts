

export interface MemberSession {
  id: string;
  sessionDate: string; // YYYY-MM-DD
  memberId: string;
  memberName: string;
  classCount: number;
  unitPrice: number;
}

export interface ForecastEntry {
  id:string;
  memberName: string;
  classCount: number;
  unitPrice: number;
}

export interface TrackedMember {
  id: string;
  name: string;
  totalSessions: number;
  usedSessions: number;
  unitPrice: number;
}

export interface TrackedMemberWithStats extends TrackedMember {
  ltv: number;
  lastSessionDate?: string;
  cumulativeTotalSessions: number;
}

export interface SaleEntry {
  id: string;
  saleDate: string; // YYYY-MM-DD
  memberId: string;
  memberName: string;
  classCount: number;
  unitPrice: number;
  amount: number;
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

export type CalendarEventType = 'new_member' | 'sale' | 'refund' | 'consultation';

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  description: string;
  amount?: number;
}