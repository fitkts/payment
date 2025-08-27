import { useState, useMemo, useEffect, useRef } from 'react';
import { api } from '../services/api';
// FIX: Import EditMode type
import type { TrackedMember, MemberSession, ForecastEntry, SaleEntry, TrackedMemberWithStats, ToastInfo, MemberStat, SalaryStatisticsData, DateRange, SalaryPeriodStats, CalendarEvent, EditMode } from '../types';
import {
    RE_REGISTRATION_THRESHOLD,
    NATIONAL_PENSION_RATE,
    HEALTH_INSURANCE_RATE,
    LONG_TERM_CARE_INSURANCE_RATE_OF_HEALTH_INSURANCE,
    EMPLOYMENT_INSURANCE_RATE,
    TAX_RATE
} from '../constants';
import type { SalaryDefaults } from '../components/SettingsModal';
import { formatDateISO } from '../utils';

type AddSessionSuccess = { success: true; toast: ToastInfo | null };
type AddSessionError = { success: false; error: string };
type AddSessionResult = AddSessionSuccess | AddSessionError;

type ScheduleModalContext = {
    memberId: string | null;
    date: string | null;
};

export interface AddScheduleFormData {
    memberId: string;
    type: 'single' | 'recurring';
    startDate: string;
    startTime: string;
    duration: number; // in minutes
    // Recurring fields
    recurrence: 'weekly' | 'bi-weekly';
    daysOfWeek: number[]; // 0 for Sunday, 1 for Monday, etc.
    endCondition: {
        type: 'occurrences' | 'date' | 'sessions';
        value: number | string; // number for occurrences/sessions, string for date
    };
}


const getThisMonthRange = (): DateRange => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999); // Include whole day
  return { start, end };
};

export const useFitnessData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [membersWithStats, setMembersWithStats] = useState<TrackedMemberWithStats[]>([]);
  const [sessions, setSessions] = useState<MemberSession[]>([]);
  const [forecastEntries, setForecastEntries] = useState<ForecastEntry[]>([]);
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  const [toastInfo, setToastInfo] = useState<ToastInfo>({ message: null, type: 'warning' });
  const notificationShownRef = useRef(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  // FIX: Add state for edit schedule modal
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [scheduleModalContext, setScheduleModalContext] = useState<ScheduleModalContext>({ memberId: null, date: null });

  const [salaryDefaults, setSalaryDefaults] = useState<SalaryDefaults>({
    baseSalary: 2100000,
    incentiveRate: 50,
    salesIncentiveRate: 0,
    taxEnabled: false,
    insurancesEnabled: false,
  });

  // Salary Configuration State
  const [baseSalary, setBaseSalary] = useState(salaryDefaults.baseSalary);
  const [incentiveRate, setIncentiveRate] = useState(salaryDefaults.incentiveRate);
  const [performanceBonus, setPerformanceBonus] = useState(0);
  const [salesIncentiveRate, setSalesIncentiveRate] = useState(salaryDefaults.salesIncentiveRate);
  const [taxEnabled, setTaxEnabled] = useState(salaryDefaults.taxEnabled);
  const [insurancesEnabled, setInsurancesEnabled] = useState(salaryDefaults.insurancesEnabled);
  
  // Date Range State
  const [statisticsDateRange, setStatisticsDateRange] = useState<DateRange>(getThisMonthRange());
  const [salaryStatsDateRange, setSalaryStatsDateRange] = useState<DateRange>(getThisMonthRange());
  const [scheduleDateRange, setScheduleDateRange] = useState<DateRange>(getThisMonthRange());

  const fetchDataWithLoading = async () => {
    setIsLoading(prev => prev || true);
    try {
        const data = await api.fetchAllData();
        setMembersWithStats(data.members);
        setSessions(data.sessions.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()));
        setSales(data.sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()));
        setForecastEntries(data.forecastEntries);
        setCalendarEvents(data.calendarEvents);
    } catch (error) {
        console.error("Failed to fetch data:", error);
        setToastInfo({ message: '데이터를 불러오는 데 실패했습니다.', type: 'warning' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const silentFetchData = async () => {
    try {
        const data = await api.fetchAllData();
        setMembersWithStats(data.members);
        setSessions(data.sessions.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()));
        setSales(data.sales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()));
        setForecastEntries(data.forecastEntries);
        setCalendarEvents(data.calendarEvents);
    } catch (error) {
        console.error("Failed to silently fetch data:", error);
        setToastInfo({ message: '백그라운드 데이터 동기화에 실패했습니다.', type: 'warning' });
    }
  };

  useEffect(() => {
    fetchDataWithLoading();
  }, []);

  const handleToggleTax = () => setTaxEnabled(p => !p);
  const handleToggleInsurances = () => setInsurancesEnabled(p => !p);

  const handleSaveSettings = (newDefaults: SalaryDefaults) => {
    setSalaryDefaults(newDefaults);
    setBaseSalary(newDefaults.baseSalary);
    setIncentiveRate(newDefaults.incentiveRate);
    setSalesIncentiveRate(newDefaults.salesIncentiveRate);
    setTaxEnabled(newDefaults.taxEnabled);
    setInsurancesEnabled(newDefaults.insurancesEnabled);
    setToastInfo({ message: '기본 설정이 저장되었습니다.', type: 'success' });
  };
  
  const statisticsData = useMemo(() => {
      const { start: rangeStart, end: rangeEnd } = statisticsDateRange;
      
      const thirtyDaysBeforeRangeEnd = new Date(rangeEnd);
      thirtyDaysBeforeRangeEnd.setDate(rangeEnd.getDate() - 30);
      
      const lowEngagementMembers = membersWithStats.filter(m => {
          const remaining = m.cumulativeTotalSessions - m.usedSessions;
          if (remaining <= 0) return false;
          if (!m.lastSessionDate) return true;
          return new Date(m.lastSessionDate) < thirtyDaysBeforeRangeEnd;
      });

      const firstSaleDateMap = new Map<string, Date>();
      sales.forEach(sale => {
          const saleDate = new Date(sale.saleDate);
          const existingDate = firstSaleDateMap.get(sale.memberId);
          if (!existingDate || saleDate < existingDate) {
              firstSaleDateMap.set(sale.memberId, saleDate);
          }
      });

      const salesInPeriod = sales.filter(s => {
          const saleDate = new Date(s.saleDate);
          return saleDate >= rangeStart && saleDate <= rangeEnd;
      });

      const salesInPeriodMemberIds = new Set(salesInPeriod.map(s => s.memberId));
      
      let newMembersCount = 0;
      let returningMembersCount = 0;

      salesInPeriodMemberIds.forEach(memberId => {
          const firstSaleDate = firstSaleDateMap.get(memberId);
          if (firstSaleDate && firstSaleDate >= rangeStart && firstSaleDate <= rangeEnd) {
              newMembersCount++;
          } else {
              returningMembersCount++;
          }
      });

      const totalLtv = membersWithStats.reduce((sum, m) => sum + m.ltv, 0);
      const averageLtv = membersWithStats.length > 0 ? Math.floor(totalLtv / membersWithStats.length) : 0;
      
      const sessionsInPeriodFiltered = sessions.filter(session => {
        try {
            const sessionDate = new Date(session.sessionDate);
            return sessionDate >= rangeStart && sessionDate <= rangeEnd;
        } catch (e) { return false; }
      });

      const totalSessionsThisMonth = sessionsInPeriodFiltered.reduce((sum, s) => sum + (s.classCount || 0), 0);
      const sessionRevenueThisMonth = sessionsInPeriodFiltered.reduce((sum, s) => sum + (s.classCount || 0) * (s.unitPrice || 0), 0);
      
      const activeMemberIds = new Set(sessionsInPeriodFiltered.map(s => s.memberId));
      const averageSessionsPerActiveMember = activeMemberIds.size > 0 ? totalSessionsThisMonth / activeMemberIds.size : 0;
      
      const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun - Sat
      sessionsInPeriodFiltered.forEach(session => {
        try {
            const date = new Date(session.sessionDate);
            if (!isNaN(date.getTime())) {
                const dayIndex = date.getDay();
                dayCounts[dayIndex] += session.classCount || 0;
            }
        } catch(e) { /* ignore invalid dates */ }
      });
      
      let busiestDayOfWeek = '데이터 없음';
      if(sessionsInPeriodFiltered.length > 0) {
        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
        busiestDayOfWeek = dayNames[busiestDayIndex];
      }

      const periodDuration = rangeEnd.getTime() - rangeStart.getTime();
      const previousPeriodStart = new Date(rangeStart.getTime() - periodDuration);
      const previousPeriodEnd = new Date(rangeStart.getTime() - 1);

      const sessionsInPreviousPeriodFiltered = sessions.filter(session => {
        try {
          const sessionDate = new Date(session.sessionDate);
          return sessionDate >= previousPeriodStart && sessionDate <= previousPeriodEnd;
        } catch (e) { return false; }
      });

      const getAttendanceMap = (sessionList: MemberSession[]) => {
        const map = new Map<string, {name: string, count: number}>();
        sessionList.forEach(s => {
            const current = map.get(s.memberId) || { name: s.memberName, count: 0 };
            current.count += s.classCount || 0;
            map.set(s.memberId, current);
        });
        return map;
      };

      const attendanceThisPeriod = getAttendanceMap(sessionsInPeriodFiltered);
      const attendancePreviousPeriod = getAttendanceMap(sessionsInPreviousPeriodFiltered);
      
      const topAttendantsThisMonth: MemberStat[] = [];
      if (attendanceThisPeriod.size > 0) {
          const sorted = [...attendanceThisPeriod.entries()].sort((a, b) => b[1].count - a[1].count);
          for (let i = 0; i < Math.min(3, sorted.length); i++) {
              if (sorted[i][1].count > 0) {
                  topAttendantsThisMonth.push({
                      name: sorted[i][1].name,
                      value: sorted[i][1].count,
                      unit: '회',
                  });
              }
          }
      }

      const attendanceChanges = new Map<string, {name: string, change: number}>();
      const allMemberIdsInPeriod = new Set([...attendanceThisPeriod.keys(), ...attendancePreviousPeriod.keys()]);
      
      allMemberIdsInPeriod.forEach(memberId => {
          const thisPeriodCount = attendanceThisPeriod.get(memberId)?.count || 0;
          const lastPeriodCount = attendancePreviousPeriod.get(memberId)?.count || 0;
          const memberName = membersWithStats.find(m => m.id === memberId)?.name || '알 수 없음';
          if (memberName !== '알 수 없음') {
            attendanceChanges.set(memberId, { name: memberName, change: thisPeriodCount - lastPeriodCount });
          }
      });

      let mostImprovedMember = { name: '없음', value: 0, unit: '회 증가' };
      if (attendanceChanges.size > 0) {
          const sortedChanges = [...attendanceChanges.entries()].sort((a,b) => b[1].change - a[1].change);
          if(sortedChanges.length > 0 && sortedChanges[0][1].change > 0) {
              mostImprovedMember = { name: sortedChanges[0][1].name, value: sortedChanges[0][1].change, unit: '회 증가' };
          }
      }

      let attendanceDropMember = { name: '없음', value: 0, unit: '회 감소' };
      if (attendanceChanges.size > 0) {
          const sortedChanges = [...attendanceChanges.entries()].sort((a,b) => b[1].change - a[1].change).reverse();
          if(sortedChanges.length > 0 && sortedChanges[0][1].change < 0) {
              attendanceDropMember = { name: sortedChanges[0][1].name, value: Math.abs(sortedChanges[0][1].change), unit: '회 감소' };
          }
      }

      let topRegistrantAllTime = { name: '없음', value: 0, unit: '회 등록' };
      if(membersWithStats.length > 0) {
        const topBySessions = [...membersWithStats].sort((a, b) => b.cumulativeTotalSessions - a.cumulativeTotalSessions)[0];
        if (topBySessions) {
            topRegistrantAllTime = { name: topBySessions.name, value: topBySessions.cumulativeTotalSessions, unit: '회 등록' };
        }
      }

      const salesCountByMember = new Map<string, {name: string, count: number}>();
      sales.forEach(sale => {
          const current = salesCountByMember.get(sale.memberId) || { name: sale.memberName, count: 0 };
          current.count += 1;
          salesCountByMember.set(sale.memberId, current);
      });
      let mostFrequentRegistrant = { name: '없음', value: 0, unit: '번 등록' };
      if (salesCountByMember.size > 0) {
          const sorted = [...salesCountByMember.entries()].sort((a,b) => b[1].count - a[1].count);
          mostFrequentRegistrant = { name: sorted[0][1].name, value: sorted[0][1].count, unit: '번 등록' };
      }
      
      return {
          lowEngagementMembers, newMembersCount, returningMembersCount, averageLtv,
          totalMembersCount: membersWithStats.length, totalSessionsThisMonth, sessionRevenueThisMonth,
          averageSessionsPerActiveMember, busiestDayOfWeek, topAttendantsThisMonth, mostImprovedMember,
          attendanceDropMember, topRegistrantAllTime, mostFrequentRegistrant,
      };
  }, [membersWithStats, sales, sessions, statisticsDateRange]);

  const salaryStatisticsData: SalaryStatisticsData = useMemo(() => {
    const monthlyData: ({ year: number, month: number } & Omit<SalaryPeriodStats, 'period'>)[] = [];
    const endDate = salaryStatsDateRange.end;

    for (let i = 0; i < 36; i++) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        const monthlySessions = sessions.filter(s => { const d = new Date(s.sessionDate); return d.getFullYear() === year && d.getMonth() === month; });
        const monthlySalesData = sales.filter(s => { const d = new Date(s.saleDate); return d.getFullYear() === year && d.getMonth() === month; });

        const sessionRevenue = monthlySessions.reduce((acc, s) => acc + s.classCount * s.unitPrice, 0);
        const salesRevenue = monthlySalesData.reduce((acc, s) => acc + s.amount, 0);
        
        const totalSessionsCount = monthlySessions.reduce((acc, s) => acc + s.classCount, 0);
        const totalSalesAmount = salesRevenue;

        const sessionIncentive = Math.floor(sessionRevenue * (incentiveRate / 100));
        const salesIncentive = Math.floor(salesRevenue * (salesIncentiveRate / 100));
        const totalSalary = baseSalary + sessionIncentive;
        
        let totalDeduction = 0;
        if (insurancesEnabled) {
            const nationalPension = Math.floor(totalSalary * NATIONAL_PENSION_RATE);
            const healthInsurance = Math.floor(totalSalary * HEALTH_INSURANCE_RATE);
            const longTermCareInsurance = Math.floor(healthInsurance * LONG_TERM_CARE_INSURANCE_RATE_OF_HEALTH_INSURANCE);
            const employmentInsurance = Math.floor(totalSalary * EMPLOYMENT_INSURANCE_RATE);
            totalDeduction += nationalPension + healthInsurance + longTermCareInsurance + employmentInsurance;
        }
        if (taxEnabled) {
            totalDeduction += Math.floor(totalSalary * TAX_RATE);
        }

        monthlyData.push({
            year, month, totalSalary, baseSalary, sessionIncentive, salesIncentive, totalDeduction,
            finalSalary: totalSalary - totalDeduction, totalSessionsCount, totalSalesAmount,
        });
    }

    const monthly = monthlyData.slice(0, 12).map(d => ({ ...d, period: `${d.year}.${String(d.month + 1).padStart(2, '0')}` })).reverse();
    
    const getQuarter = (month: number) => Math.floor(month / 3) + 1;
    const quarters: { [key: string]: SalaryPeriodStats } = {};
    monthlyData.slice(0, 24).forEach(d => {
        const key = `${d.year}-Q${getQuarter(d.month)}`;
        if (!quarters[key]) quarters[key] = { period: `${d.year} ${getQuarter(d.month)}Q`, totalSalary: 0, baseSalary: 0, sessionIncentive: 0, salesIncentive: 0, totalDeduction: 0, finalSalary: 0, totalSessionsCount: 0, totalSalesAmount: 0, };
        Object.keys(quarters[key]).forEach(k => { if (k !== 'period') quarters[key][k as keyof Omit<SalaryPeriodStats, 'period'>] += d[k as keyof Omit<SalaryPeriodStats, 'period' | 'year' | 'month'>]; });
    });
    const quarterly = Object.values(quarters).sort((a, b) => a.period.localeCompare(b.period)).slice(-8);

    const years: { [key: string]: SalaryPeriodStats } = {};
    monthlyData.forEach(d => {
        const key = `${d.year}`;
        if (!years[key]) years[key] = { period: `${d.year}년`, totalSalary: 0, baseSalary: 0, sessionIncentive: 0, salesIncentive: 0, totalDeduction: 0, finalSalary: 0, totalSessionsCount: 0, totalSalesAmount: 0, };
        Object.keys(years[key]).forEach(k => { if (k !== 'period') years[key][k as keyof Omit<SalaryPeriodStats, 'period'>] += d[k as keyof Omit<SalaryPeriodStats, 'period' | 'year' | 'month'>]; });
    });
    const yearly = Object.values(years).sort((a, b) => a.period.localeCompare(b.period)).slice(-3);

    return { monthly, quarterly, yearly };
}, [sessions, sales, baseSalary, incentiveRate, salesIncentiveRate, taxEnabled, insurancesEnabled, salaryStatsDateRange]);

  const currentMonthSales = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return sales.filter(sale => { const d = new Date(sale.saleDate); return d.getFullYear() === year && d.getMonth() === month; });
  }, [sales]);

  const membersToReRegister = useMemo(() => {
    return membersWithStats.filter(m => (m.cumulativeTotalSessions - m.usedSessions) <= RE_REGISTRATION_THRESHOLD);
  }, [membersWithStats]);

  useEffect(() => {
    if (membersToReRegister.length > 0 && !notificationShownRef.current) {
      const memberCount = membersToReRegister.length;
      const message = memberCount === 1 ? `${membersToReRegister[0].name}님의 재등록이 필요합니다.` : `${membersToReRegister[0].name}님 외 ${memberCount - 1}명의 재등록이 필요합니다.`;
      setToastInfo({ message, type: 'warning' });
      notificationShownRef.current = true;
    }
  }, [membersToReRegister]);

  const handleAddMember = async (name: string, totalSessions: number, unitPrice: number) => {
    const tempMemberId = `temp-member-${crypto.randomUUID()}`;
    const tempSaleId = `temp-sale-${crypto.randomUUID()}`;
    const optimisticMember: TrackedMemberWithStats = { id: tempMemberId, name, totalSessions, usedSessions: 0, unitPrice, ltv: totalSessions * unitPrice, cumulativeTotalSessions: totalSessions, lastSessionDate: undefined, scheduledSessions: 0 };
    const optimisticSale: SaleEntry = { id: tempSaleId, saleDate: new Date().toISOString().split('T')[0], memberId: tempMemberId, memberName: name, classCount: totalSessions, unitPrice, amount: totalSessions * unitPrice };
    
    const prevMembers = membersWithStats;
    const prevSales = sales;
    setMembersWithStats(prev => [...prev, optimisticMember]);
    setSales(prev => [optimisticSale, ...prev]);

    try {
        await api.addMember(name, totalSessions, unitPrice);
        setToastInfo({ message: `${name} 회원님이 성공적으로 등록되었습니다.`, type: 'success' });
    } catch (error) {
        console.error("Failed to add member:", error);
        setMembersWithStats(prevMembers);
        setSales(prevSales);
        setToastInfo({ message: `오류: ${name} 회원님을 추가하지 못했습니다.`, type: 'warning' });
    } finally {
        await silentFetchData();
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (window.confirm('정말로 이 회원을 삭제하시겠습니까? 관련된 모든 수업 및 매출 기록도 삭제됩니다.')) {
        const memberName = membersWithStats.find(m => m.id === memberId)?.name;
        
        const prevMembers = membersWithStats;
        const prevSales = sales;
        const prevSessions = sessions;

        setMembersWithStats(prev => prev.filter(m => m.id !== memberId));
        setSales(prev => prev.filter(s => s.memberId !== memberId));
        setSessions(prev => prev.filter(s => s.memberId !== memberId));

        try {
            await api.deleteMember(memberId);
            setToastInfo({ message: `${memberName || '회원'} 정보가 삭제되었습니다.`, type: 'success' });
        } catch (error) {
            console.error("Failed to delete member:", error);
            setMembersWithStats(prevMembers);
            setSales(prevSales);
            setSessions(prevSessions);
            setToastInfo({ message: `오류: ${memberName || '회원'} 정보를 삭제하지 못했습니다.`, type: 'warning' });
        }
    }
  };

  const handleUpdateMember = async (memberId: string, updatedData: { name: string; totalSessions: number; unitPrice: number; }) => {
    const prevMembers = membersWithStats;
    const prevSales = sales;

    setMembersWithStats(prev => prev.map(m => m.id === memberId ? { ...m, name: updatedData.name, totalSessions: updatedData.totalSessions, unitPrice: updatedData.unitPrice } : m));
    // This is a simplification; a full optimistic update would also update LTV, etc.
    // And update the latest sale. For now, a silent refresh is a good compromise.

    try {
        await api.updateMember(memberId, updatedData);
        setToastInfo({ message: `${updatedData.name}님의 정보가 성공적으로 수정되었습니다.`, type: 'success' });
    } catch (error) {
        console.error("Failed to update member:", error);
        setMembersWithStats(prevMembers);
        setSales(prevSales);
        setToastInfo({ message: `오류: ${updatedData.name}님의 정보를 수정하지 못했습니다.`, type: 'warning' });
    } finally {
        await silentFetchData();
    }
  };
  
  const handleAddSale = async (memberId: string, classCount: number, amount: number, saleDate: string) => {
    const memberName = membersWithStats.find(m => m.id === memberId)?.name || '';
    const unitPrice = classCount > 0 ? Math.floor(amount / classCount) : 0;
    const optimisticSale: SaleEntry = { id: `temp-sale-${crypto.randomUUID()}`, saleDate, memberId, memberName, classCount, unitPrice, amount };

    const prevSales = sales;
    setSales(prev => [optimisticSale, ...prev]);

    try {
        await api.addSale(memberId, classCount, amount, saleDate);
        setToastInfo({ message: '신규 매출이 등록되었습니다.', type: 'success' });
    } catch (error) {
        console.error("Failed to add sale:", error);
        setSales(prevSales);
        setToastInfo({ message: '오류: 신규 매출을 등록하지 못했습니다.', type: 'warning' });
    } finally {
        await silentFetchData();
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    const prevSales = sales;
    setSales(prev => prev.filter(s => s.id !== saleId));
    
    try {
        await api.deleteSale(saleId);
        setToastInfo({ message: '매출 기록이 삭제되었습니다.', type: 'success' });
    } catch (error) {
        console.error("Failed to delete sale:", error);
        setSales(prevSales);
        setToastInfo({ message: '오류: 매출 기록을 삭제하지 못했습니다.', type: 'warning' });
    } finally {
        await silentFetchData();
    }
  };

  const handleUpdateSale = async (saleId: string, field: 'saleDate' | 'classCount' | 'amount', value: string | number) => {
    const prevSales = sales;
    setSales(prev => prev.map(s => {
        if (s.id === saleId) {
            const newSale = { ...s, [field]: value };
            if (field === 'classCount' || field === 'amount') {
                newSale.unitPrice = newSale.classCount > 0 ? Math.floor(newSale.amount / newSale.classCount) : 0;
            }
            return newSale;
        }
        return s;
    }));

    try {
        await api.updateSale(saleId, field, value);
    } catch (error) {
        console.error("Failed to update sale:", error);
        setSales(prevSales);
        setToastInfo({ message: '오류: 매출을 수정하지 못했습니다.', type: 'warning' });
    }
  };

  const handleAddSession = async (memberId: string, classCount: number, sessionDate: string, unitPrice?: number) => {
    // This operation is complex due to automatic price calculation, so we use the loading state for data integrity.
    const result = await api.addSession({ memberId, classCount, sessionDate, unitPrice }) as AddSessionResult;
    
    if (result.success === false) {
      alert(result.error);
      return;
    }

    await fetchDataWithLoading();
    if (result.toast) {
      setToastInfo(result.toast);
    } else {
      setToastInfo({ message: `세션 ${classCount}개가 추가되었습니다.`, type: 'success' });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const prevSessions = sessions;
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    try {
        await api.deleteSession(sessionId);
    } catch (error) {
        console.error("Failed to delete session:", error);
        setSessions(prevSessions);
        setToastInfo({ message: '오류: 세션을 삭제하지 못했습니다.', type: 'warning' });
    } finally {
        await silentFetchData();
    }
  };
  
  const handleUpdateSession = async (sessionId: string, field: keyof MemberSession, value: string | number) => {
    const prevSessions = sessions;
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, [field]: value } : s));
    
    try {
        await api.updateSession(sessionId, field, value);
    } catch (error) {
        console.error("Failed to update session:", error);
        setSessions(prevSessions);
        setToastInfo({ message: '오류: 세션을 수정하지 못했습니다.', type: 'warning' });
    }
  };

  const handleAddForecastEntry = async (memberName: string, classCount: number, amount: number) => {
    const unitPrice = classCount > 0 ? Math.floor(amount / classCount) : 0;
    const optimisticEntry: ForecastEntry = { id: `temp-forecast-${crypto.randomUUID()}`, memberName, classCount, unitPrice, amount };
    const prevEntries = forecastEntries;
    setForecastEntries(prev => [...prev, optimisticEntry]);

    try {
        await api.addForecastEntry(memberName, classCount, amount);
    } catch (error) {
        console.error("Failed to add forecast entry:", error);
        setForecastEntries(prevEntries);
        setToastInfo({ message: '오류: 예상 매출 항목을 추가하지 못했습니다.', type: 'warning' });
    } finally {
        await silentFetchData();
    }
  };
  
  const handleDeleteForecastEntry = async (id: string) => {
    const prevEntries = forecastEntries;
    setForecastEntries(prev => prev.filter(e => e.id !== id));
    
    try {
        await api.deleteForecastEntry(id);
        setToastInfo({ message: '예상 매출 항목이 삭제되었습니다.', type: 'success' });
    } catch (error) {
        console.error("Failed to delete forecast entry:", error);
        setForecastEntries(prevEntries);
        setToastInfo({ message: '오류: 예상 매출 항목을 삭제하지 못했습니다.', type: 'warning' });
    }
  };
  
  const handleUpdateForecastEntry = async (id: string, field: keyof ForecastEntry, value: string | number) => {
     const prevEntries = forecastEntries;
     setForecastEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));

     try {
         await api.updateForecastEntry(id, field, value);
     } catch (error) {
        console.error("Failed to update forecast entry:", error);
        setForecastEntries(prevEntries);
        setToastInfo({ message: '오류: 예상 매출 항목을 수정하지 못했습니다.', type: 'warning' });
     }
  };

  const handleAddSchedule = async (formData: AddScheduleFormData) => {
    const { memberId, type, startDate, startTime, duration, recurrence, daysOfWeek, endCondition } = formData;
    
    const member = membersWithStats.find(m => m.id === memberId);
    if (!member) {
      setToastInfo({ message: '회원을 찾을 수 없습니다.', type: 'warning' });
      return;
    }
    
    const newEvents: Omit<CalendarEvent, 'id'>[] = [];
    const recurrenceId = crypto.randomUUID();

    const getEndTime = (start: string, minutes: number): string => {
        const [h, m] = start.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + minutes);
        return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    };
    
    if (type === 'single') {
        newEvents.push({
            date: startDate,
            type: 'workout',
            title: member.name,
            memberId,
            startTime,
            endTime: getEndTime(startTime, duration),
        });
    } else { // Recurring
        let currentDate = new Date(`${startDate}T00:00:00`);
        const anchorDate = new Date(currentDate);
        const endDate = endCondition.type === 'date' ? new Date(`${endCondition.value}T00:00:00`) : null;
        let occurrences = 0;
        let sessionsLeft = (member.cumulativeTotalSessions || 0) - (member.usedSessions || 0) - (member.scheduledSessions || 0);
        
        const maxOccurrences = endCondition.type === 'occurrences' 
            ? Number(endCondition.value) 
            : (endCondition.type === 'sessions' ? sessionsLeft : 200); // safety cap

        while (occurrences < maxOccurrences) {
            if (endDate && currentDate > endDate) break;

            const dayOfWeek = currentDate.getDay();
            if (daysOfWeek.includes(dayOfWeek)) {
                if (recurrence === 'weekly') {
                     newEvents.push({
                        date: formatDateISO(currentDate), type: 'workout', title: member.name, memberId, startTime,
                        endTime: getEndTime(startTime, duration), recurrenceId
                    });
                    occurrences++;
                } else { // bi-weekly
                    const weekDiff = Math.floor((currentDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    if (weekDiff % 2 === 0) {
                        newEvents.push({
                           date: formatDateISO(currentDate), type: 'workout', title: member.name, memberId, startTime,
                           endTime: getEndTime(startTime, duration), recurrenceId
                        });
                        occurrences++;
                    }
                }
            }
             if (newEvents.length >= 200) { // Safety break
                setToastInfo({ message: '최대 200개의 반복 스케줄만 생성할 수 있습니다.', type: 'warning' });
                break;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    
    if (newEvents.length === 0) {
        setToastInfo({ message: '추가할 스케줄이 없습니다. 조건을 확인해주세요.', type: 'warning'});
        return;
    }

    try {
        await api.addScheduleEvents(newEvents);
        setToastInfo({ message: `${newEvents.length}개의 스케줄이 성공적으로 추가되었습니다.`, type: 'success' });
    } catch(e) {
        setToastInfo({ message: '스케줄 추가 중 오류가 발생했습니다.', type: 'warning' });
    } finally {
        setIsAddScheduleModalOpen(false);
        await silentFetchData();
    }
  };

  // FIX: Implement handleUpdateSchedule
  const handleUpdateSchedule = async (eventId: string, formData: Partial<CalendarEvent>, mode: EditMode) => {
    try {
        await api.updateScheduleEvent(eventId, formData, mode);
        setToastInfo({ message: '스케줄이 성공적으로 수정되었습니다.', type: 'success' });
    } catch(e) {
        setToastInfo({ message: '스케줄 수정 중 오류가 발생했습니다.', type: 'warning' });
    } finally {
        setIsEditScheduleModalOpen(false);
        await silentFetchData();
    }
  };

  // FIX: Implement handleDeleteSchedule
  const handleDeleteSchedule = async (eventId: string, mode: EditMode) => {
    try {
        await api.deleteScheduleEvent(eventId, mode);
        setToastInfo({ message: '스케줄이 삭제되었습니다.', type: 'success' });
    } catch(e) {
        setToastInfo({ message: '스케줄 삭제 중 오류가 발생했습니다.', type: 'warning' });
    } finally {
        setIsEditScheduleModalOpen(false);
        await silentFetchData();
    }
  };

  const handleCompleteDay = async (date: string) => {
    const eventsToComplete = calendarEvents.filter(e => 
        e.date === date && e.type === 'workout' && e.status === 'scheduled'
    );
    if (eventsToComplete.length === 0) {
        setToastInfo({ message: '완료할 수업이 없습니다.', type: 'warning' });
        return;
    }

    const eventIds = eventsToComplete.map(e => e.id);
    
    try {
        const result = await api.completeScheduledEvents(eventIds);
        setToastInfo({ message: `${result.addedCount}개의 수업이 완료 처리되어 급여 정산에 반영되었습니다.`, type: 'success' });
    } catch(e) {
        setToastInfo({ message: '수업 완료 처리 중 오류가 발생했습니다.', type: 'warning' });
    } finally {
        await silentFetchData();
    }
  };

  const handleCompleteSession = async (eventId: string) => {
     try {
        const result = await api.completeScheduledEvents([eventId]);
        setToastInfo({ message: `1개의 수업이 완료 처리되었습니다.`, type: 'success' });
    } catch(e) {
        setToastInfo({ message: '수업 완료 처리 중 오류가 발생했습니다.', type: 'warning' });
    } finally {
        await silentFetchData();
    }
  };


  return {
    isLoading,
    sessions, forecastEntries, sales, membersWithStats, calendarEvents,
    toastInfo, isSettingsModalOpen, salaryDefaults,
    isAddScheduleModalOpen, scheduleModalContext,
    // FIX: Export edit schedule modal states
    isEditScheduleModalOpen, editingEvent,
    baseSalary, incentiveRate, performanceBonus, salesIncentiveRate,
    taxEnabled, insurancesEnabled,
    statisticsDateRange, salaryStatsDateRange, scheduleDateRange,
    statisticsData, salaryStatisticsData, currentMonthSales, membersToReRegister,
    setToastInfo, setIsSettingsModalOpen, setIsAddScheduleModalOpen, 
    // FIX: Export edit schedule modal setters
    setIsEditScheduleModalOpen, setEditingEvent,
    setScheduleModalContext,
    setBaseSalary, setIncentiveRate, setPerformanceBonus, setSalesIncentiveRate,
    setStatisticsDateRange, setSalaryStatsDateRange, setScheduleDateRange,
    handleToggleTax, handleToggleInsurances, handleSaveSettings,
    handleAddMember, handleDeleteMember, handleUpdateMember,
    handleAddSale, handleDeleteSale, handleUpdateSale,
    handleAddSession, handleDeleteSession, handleUpdateSession,
    handleAddForecastEntry, handleDeleteForecastEntry, handleUpdateForecastEntry,
    handleAddSchedule,
    // FIX: Export schedule handlers
    handleUpdateSchedule,
    handleDeleteSchedule,
    handleCompleteDay,
    handleCompleteSession
  };
};