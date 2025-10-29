import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import type { TrackedMember, MemberSession, ForecastEntry, SaleEntry, TrackedMemberWithStats, ToastInfo, MemberStat, SalaryStatisticsData, DateRange, SalaryPeriodStats, CalendarEvent, EditMode, WeeklyScheduleEntry, ScheduleStatus } from '../types';
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

const CACHE_KEY = 'gym-biseo-data';

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
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [forecastEntries, setForecastEntries] = useState<ForecastEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklyScheduleEntry[]>([]);
  
  const [toastInfo, setToastInfo] = useState<ToastInfo>({ message: null, type: 'warning' });
  const notificationShownRef = useRef(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [scheduleModalContext, setScheduleModalContext] = useState<ScheduleModalContext>({ memberId: null, date: null });

  const [salaryDefaults, setSalaryDefaults] = useState<SalaryDefaults>({
    baseSalary: 2100000, incentiveRate: 50, salesIncentiveRate: 0, taxEnabled: false, insurancesEnabled: false,
  });

  const [baseSalary, setBaseSalary] = useState(salaryDefaults.baseSalary);
  const [incentiveRate, setIncentiveRate] = useState(salaryDefaults.incentiveRate);
  const [performanceBonus, setPerformanceBonus] = useState(0);
  const [salesIncentiveRate, setSalesIncentiveRate] = useState(salaryDefaults.salesIncentiveRate);
  const [taxEnabled, setTaxEnabled] = useState(salaryDefaults.taxEnabled);
  const [insurancesEnabled, setInsurancesEnabled] = useState(salaryDefaults.insurancesEnabled);
  
  const [statisticsDateRange, setStatisticsDateRange] = useState<DateRange>(getThisMonthRange());
  const [salaryStatsDateRange, setSalaryStatsDateRange] = useState<DateRange>(getThisMonthRange());
  const [scheduleDateRange, setScheduleDateRange] = useState<DateRange>(getThisMonthRange());
  const [salaryDate, setSalaryDate] = useState(new Date());
  
  const setSalaryCalculationMonth = (date: Date) => setSalaryDate(date);
  
  const applySalaryDefaults = (defaults: SalaryDefaults) => {
    setSalaryDefaults(defaults); setBaseSalary(defaults.baseSalary); setIncentiveRate(defaults.incentiveRate); setSalesIncentiveRate(defaults.salesIncentiveRate); setTaxEnabled(defaults.taxEnabled); setInsurancesEnabled(defaults.insurancesEnabled);
  };

  const processApiData = (data: any) => {
    if (!data) return {};
    const sanitizeDate = (dateValue: any): string => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string') {
            if (dateValue.includes('T')) return dateValue.split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
        }
        try {
            const d = new Date(dateValue);
            if (!isNaN(d.getTime())) return formatDateISO(d);
        } catch (e) { console.warn(`Error constructing Date from value:`, dateValue, e); }
        return '';
    };

    const processCollection = (collection: any[], dateField: string) => {
        return collection ? collection.map(item => ({...item, [dateField]: sanitizeDate(item[dateField])})) : [];
    };

    if (data.calendarEvents) data.calendarEvents = processCollection(data.calendarEvents, 'date');
    if (data.sessions) data.sessions = processCollection(data.sessions, 'sessionDate');
    if (data.sales) data.sales = processCollection(data.sales, 'saleDate');
    if (data.members) {
        data.members = data.members.map((member: any) => ({
            ...member, registrationDate: sanitizeDate(member.registrationDate), birthday: member.birthday ? sanitizeDate(member.birthday) : '', lastSessionDate: member.lastSessionDate ? sanitizeDate(member.lastSessionDate) : '',
        }));
    }
    return data;
  };
  
  const reloadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await api.fetchAllData();
        const processedData = processApiData(data);
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: new Date().getTime(), data }));

        if (processedData.members) setMembersWithStats(processedData.members);
        if (processedData.sales) setSales(processedData.sales);
        if (processedData.sessions) setSessions(processedData.sessions);
        if (processedData.forecastEntries) setForecastEntries(processedData.forecastEntries);
        if (processedData.calendarEvents) setCalendarEvents(processedData.calendarEvents);
        if (processedData.weeklySchedules) setWeeklySchedules(processedData.weeklySchedules);
        if (processedData.salaryDefaults) applySalaryDefaults(processedData.salaryDefaults);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to fetch all data:", message);
        setToastInfo({ message: `데이터 로딩 실패: ${message}`, type: 'warning' });
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
        let loadedFromCache = false;
        try {
            const cachedDataString = localStorage.getItem(CACHE_KEY);
            if (cachedDataString) {
                const { data } = JSON.parse(cachedDataString);
                const processedData = processApiData(data);

                if (processedData.members) setMembersWithStats(processedData.members);
                if (processedData.sales) setSales(processedData.sales);
                if (processedData.sessions) setSessions(processedData.sessions);
                if (processedData.forecastEntries) setForecastEntries(processedData.forecastEntries);
                if (processedData.calendarEvents) setCalendarEvents(processedData.calendarEvents);
                if (processedData.weeklySchedules) setWeeklySchedules(processedData.weeklySchedules);
                if (processedData.salaryDefaults) applySalaryDefaults(processedData.salaryDefaults);
                
                setIsLoading(false); // Show UI with cached data right away
                loadedFromCache = true;
            }
        } catch (error) {
            console.warn("Failed to load data from cache:", error);
            localStorage.removeItem(CACHE_KEY);
        }

        // If no cache, `reloadAllData` will show a loader and fetch.
        if (!loadedFromCache) {
            await reloadAllData();
        } else {
            // If loaded from cache, silently refresh in the background.
            try {
                const data = await api.fetchAllData();
                const processedData = processApiData(data);
                
                localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: new Date().getTime(), data }));

                // Update state with fresh data
                if (processedData.members) setMembersWithStats(processedData.members);
                if (processedData.sales) setSales(processedData.sales);
                if (processedData.sessions) setSessions(processedData.sessions);
                if (processedData.forecastEntries) setForecastEntries(processedData.forecastEntries);
                if (processedData.calendarEvents) setCalendarEvents(processedData.calendarEvents);
                if (processedData.weeklySchedules) setWeeklySchedules(processedData.weeklySchedules);
                if (processedData.salaryDefaults) applySalaryDefaults(processedData.salaryDefaults);
            } catch (refreshError) {
                console.error("Background data refresh failed:", refreshError);
            }
        }
    };

    loadInitialData();
  }, []);

  const { monthlySessions, monthlySales } = useMemo(() => {
    if (isLoading || !sessions || !sales) return { monthlySessions: [], monthlySales: [] };

    const workMonth = new Date(salaryDate.getFullYear(), salaryDate.getMonth() - 1, 1);
    const workYear = workMonth.getFullYear();
    const workMonthIndex = workMonth.getMonth();

    const newMonthlySessions = sessions.filter(s => {
        const d = new Date(s.sessionDate);
        return d.getFullYear() === workYear && d.getMonth() === workMonthIndex;
    }).sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    
    const newMonthlySales = sales.filter(s => {
        const d = new Date(s.saleDate);
        return d.getFullYear() === workYear && d.getMonth() === workMonthIndex;
    }).sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

    return { monthlySessions: newMonthlySessions, monthlySales: newMonthlySales };
  }, [sessions, sales, salaryDate, isLoading]);
  
  const statisticsData = useMemo(() => {
      const { start: rangeStart, end: rangeEnd } = statisticsDateRange;
      
      const thirtyDaysBeforeRangeEnd = new Date(rangeEnd);
      thirtyDaysBeforeRangeEnd.setDate(rangeEnd.getDate() - 30);
      
      const lowEngagementMembers = membersWithStats.filter(m => {
          const remaining = (m.cumulativeTotalSessions || 0) - (m.usedSessions || 0);
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

      const totalLtv = membersWithStats.reduce((sum, m) => sum + (m.ltv || 0), 0);
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
      
      const sessionsByMemberCurrent = sessionsInPeriodFiltered.reduce<Record<string, number>>((acc, s) => {
        acc[s.memberId] = (acc[s.memberId] || 0) + (s.classCount || 0);
        return acc;
      }, {});

      const sessionsByMemberPrevious = sessionsInPreviousPeriodFiltered.reduce<Record<string, number>>((acc, s) => {
        acc[s.memberId] = (acc[s.memberId] || 0) + (s.classCount || 0);
        return acc;
      }, {});

      let mostImprovedMember: MemberStat = { name: '없음', value: 0, unit: '회 증가' };
      let attendanceDropMember: MemberStat = { name: '없음', value: 0, unit: '회 감소' };
      let maxIncrease = 0;
      let maxDecrease = 0;

      membersWithStats.forEach(member => {
        const currentSessions = sessionsByMemberCurrent[member.id] || 0;
        const previousSessions = sessionsByMemberPrevious[member.id] || 0;
        const diff = currentSessions - previousSessions;

        if (diff > 0 && diff > maxIncrease) {
          maxIncrease = diff;
          mostImprovedMember = { name: member.name, value: diff, unit: '회 증가' };
        }
        if (diff < 0 && diff < maxDecrease) {
          maxDecrease = diff;
          attendanceDropMember = { name: member.name, value: Math.abs(diff), unit: '회 감소' };
        }
      });
      
      const topAttendantsThisMonth: MemberStat[] = Object.entries(sessionsByMemberCurrent)
        .map(([memberId, count]: [string, number]) => {
            const member = membersWithStats.find(m => m.id === memberId);
            return { name: member?.name || '알수없음', value: count, unit: '회' };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
        
      while(topAttendantsThisMonth.length < 3) {
          topAttendantsThisMonth.push({name: '없음', value: 0, unit: '회'});
      }
      
      // FIX: Cast the initial value of reduce to the correct type to ensure proper type inference for the accumulator and the result.
      const salesByMember = sales.reduce((acc, s) => {
          if (!acc[s.memberId]) {
              acc[s.memberId] = { totalAmount: 0, count: 0 };
          }
          acc[s.memberId].totalAmount += s.amount;
          acc[s.memberId].count += 1;
          return acc;
      }, {} as Record<string, { totalAmount: number; count: number }>);
      
      let topRegistrantAllTime: MemberStat = { name: '없음', value: 0, unit: '원' };
      let maxTotalAmount = 0;
      
      let mostFrequentRegistrant: MemberStat = { name: '없음', value: 0, unit: '회' };
      let maxRegCount = 0;
      
      Object.entries(salesByMember).forEach(([memberId, data]) => {
          const member = membersWithStats.find(m => m.id === memberId);
          if (member) {
              if (data.totalAmount > maxTotalAmount) {
                  maxTotalAmount = data.totalAmount;
                  topRegistrantAllTime = { name: member.name, value: data.totalAmount, unit: '원' };
              }
              if (data.count > maxRegCount) {
                  maxRegCount = data.count;
                  mostFrequentRegistrant = { name: member.name, value: data.count, unit: '회' };
              }
          }
      });

      return {
          lowEngagementMembers, newMembersCount, returningMembersCount, averageLtv,
          totalMembersCount: membersWithStats.length, totalSessionsThisMonth, sessionRevenueThisMonth,
          averageSessionsPerActiveMember, busiestDayOfWeek, topAttendantsThisMonth, mostImprovedMember,
          attendanceDropMember, topRegistrantAllTime, mostFrequentRegistrant,
      };
  }, [membersWithStats, sessions, sales, statisticsDateRange]);

  const salaryStatisticsData: SalaryStatisticsData = useMemo(() => {
    const calculateStatsForPeriod = (startDate: Date, endDate: Date, periodName: string): SalaryPeriodStats => {
        const periodSessions = sessions.filter(s => { const d = new Date(s.sessionDate); return d >= startDate && d <= endDate; });
        const periodSales = sales.filter(s => { const d = new Date(s.saleDate); return d >= startDate && d <= endDate; });
        const totalSessionsCount = periodSessions.reduce((sum, s) => sum + (s.classCount || 0), 0);
        const sessionRevenue = periodSessions.reduce((sum, s) => sum + (s.classCount || 0) * (s.unitPrice || 0), 0);
        const totalSalesAmount = periodSales.reduce((sum, s) => sum + s.amount, 0);
        const sessionIncentive = Math.floor(sessionRevenue * (incentiveRate / 100));
        const salesIncentive = Math.floor(totalSalesAmount * (salesIncentiveRate / 100));
        const totalSalary = baseSalary + sessionIncentive + salesIncentive;
        const nationalPension = insurancesEnabled ? Math.floor(totalSalary * NATIONAL_PENSION_RATE) : 0;
        const healthInsurance = insurancesEnabled ? Math.floor(totalSalary * HEALTH_INSURANCE_RATE) : 0;
        const longTermCareInsurance = insurancesEnabled ? Math.floor(healthInsurance * LONG_TERM_CARE_INSURANCE_RATE_OF_HEALTH_INSURANCE) : 0;
        const employmentInsurance = insurancesEnabled ? Math.floor(totalSalary * EMPLOYMENT_INSURANCE_RATE) : 0;
        const totalInsuranceDeduction = nationalPension + healthInsurance + longTermCareInsurance + employmentInsurance;
        const taxAmount = taxEnabled ? Math.floor(totalSalary * TAX_RATE) : 0;
        const totalDeduction = totalInsuranceDeduction + taxAmount;
        const finalSalary = totalSalary - totalDeduction;
        return { period: periodName, totalSalary, baseSalary, sessionIncentive, salesIncentive, totalDeduction, finalSalary, totalSessionsCount, totalSalesAmount };
    };
    const today = salaryStatsDateRange.end;
    const monthly: SalaryPeriodStats[] = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); end.setHours(23, 59, 59, 999);
        return calculateStatsForPeriod(start, end, `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    const quarterly: SalaryPeriodStats[] = [];
    for (let i = 7; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - (i * 3), 1);
        const currentQuarter = Math.floor(d.getMonth() / 3);
        const start = new Date(d.getFullYear(), currentQuarter * 3, 1);
        const end = new Date(d.getFullYear(), start.getMonth() + 3, 0); end.setHours(23, 59, 59, 999);
        const periodName = `${d.getFullYear()} Q${currentQuarter + 1}`;
        if (!quarterly.some(q => q.period === periodName)) quarterly.push(calculateStatsForPeriod(start, end, periodName));
    }
    const yearly: SalaryPeriodStats[] = Array.from({ length: 3 }, (_, i) => {
        const year = today.getFullYear() - (2 - i);
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31); end.setHours(23, 59, 59, 999);
        return calculateStatsForPeriod(start, end, `${year}`);
    });
    return { monthly, quarterly, yearly };
  }, [sessions, sales, baseSalary, incentiveRate, salesIncentiveRate, taxEnabled, insurancesEnabled, salaryStatsDateRange]);

  const currentMonthSales = useMemo(() => {
    const today = new Date(); const currentYear = today.getFullYear(); const currentMonth = today.getMonth();
    return sales.filter(s => { const d = new Date(s.saleDate); return d.getFullYear() === currentYear && d.getMonth() === currentMonth; }).reduce((acc, s) => acc + s.amount, 0);
  }, [sales]);

  const { membersToReRegister, dormantMembers } = useMemo(() => {
    const fiveMonthsAgo = new Date(); fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const reRegisterIds = new Set<string>();
    const dormantIds = new Set<string>();

    // Initial automatic classification
    membersWithStats.forEach(m => {
        const remainingSessions = (m.cumulativeTotalSessions || 0) - (m.usedSessions || 0);
        const lastSession = m.lastSessionDate ? new Date(m.lastSessionDate) : null;

        if (remainingSessions <= RE_REGISTRATION_THRESHOLD && remainingSessions >= 0 && (!lastSession || lastSession > fiveMonthsAgo)) {
            reRegisterIds.add(m.id);
        }
        
        if (remainingSessions > 0 && lastSession && lastSession < sixMonthsAgo) {
            dormantIds.add(m.id);
        }
    });

    // Apply manual overrides
    membersWithStats.forEach(m => {
        if (m.forecastStatus === 'manual_dormant') {
            reRegisterIds.delete(m.id);
            dormantIds.add(m.id);
        } else if (m.forecastStatus === 'manual_reregister') {
            dormantIds.delete(m.id);
            reRegisterIds.add(m.id);
        }
    });

    const reRegisterList = membersWithStats.filter(m => reRegisterIds.has(m.id));
    const dormantList = membersWithStats
        .filter(m => dormantIds.has(m.id))
        .map(m => ({
            ...m,
            remainingSessions: (m.cumulativeTotalSessions || 0) - (m.usedSessions || 0)
        }));

    return { membersToReRegister: reRegisterList, dormantMembers: dormantList };
  }, [membersWithStats]);
  
  useEffect(() => {
    if (isLoading) return;
    const membersWithFewSessions = membersToReRegister.length;
    if (membersWithFewSessions > 0 && !notificationShownRef.current) {
        setToastInfo({ message: `${membersWithFewSessions}명의 회원이 재등록이 필요합니다. '매출 예상' 탭에서 확인하세요.`, type: 'warning' });
        notificationShownRef.current = true;
    }
  }, [membersToReRegister, isLoading]);
  
  const plannedMonthlySessions = useMemo(() => {
    const today = new Date(); const year = today.getFullYear(); const month = today.getMonth();
    const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0);
    let totalSessions = 0;
    const confirmedSchedules = weeklySchedules.filter(s => s.status === 'confirmed');
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        confirmedSchedules.forEach(schedule => { if (schedule.dayOfWeek === dayOfWeek) totalSessions++; });
    }
    return totalSessions;
  }, [weeklySchedules]);
  
  // Handlers
  const handleToggleTax = () => setTaxEnabled(p => !p);
  const handleToggleInsurances = () => setInsurancesEnabled(p => !p);
  const handleSaveSettings = async (newDefaults: SalaryDefaults) => {
    const previousDefaults = { ...salaryDefaults }; applySalaryDefaults(newDefaults);
    try {
        const result = await api.saveSalaryDefaults(newDefaults);
        if (result.success) {
            setToastInfo({ message: '기본 설정이 저장되었습니다.', type: 'success' });
        } else {
            applySalaryDefaults(previousDefaults);
            // FIX: Handle potential 'unknown' type for result.error
            const error = result.error;
            let errorMessage = 'An unknown error occurred.';
            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else if (error) {
                errorMessage = String(error);
            }
            setToastInfo({ message: `설정 저장 실패: ${errorMessage}`, type: 'warning' });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        applySalaryDefaults(previousDefaults);
        setToastInfo({ message: `설정 저장 실패: ${message}`, type: 'warning' });
    }
  };

  const handleAddMember = async (name: string, totalSessions: number, amount: number, registrationDate: string, birthday: string) => {
    try {
        const datePrefix = registrationDate.replace(/-/g, ''); const memberId = `member-${datePrefix}-${Date.now()}`;
        const unitPrice = totalSessions > 0 ? Math.floor(amount / totalSessions) : 0;
        await api.addMember(memberId, name, totalSessions, unitPrice, registrationDate, birthday, amount);
        setToastInfo({ message: '신규 회원이 등록되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `회원 추가 실패: ${message}`, type: 'warning' });
    }
  };
  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('정말로 이 회원을 삭제하시겠습니까? 모든 관련 데이터(매출, 수업)가 삭제됩니다.')) return;
    try {
        await api.deleteMember(memberId);
        setToastInfo({ message: '회원이 삭제되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `회원 삭제 실패: ${message}`, type: 'warning' });
    }
  };
  const handleUpdateMember = async (memberId: string, updatedData: { name: string; totalSessions: number; unitPrice: number; }) => {
     try {
        await api.updateMember(memberId, updatedData);
        setToastInfo({ message: '회원 정보가 수정되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `회원 정보 수정 실패: ${message}`, type: 'warning' });
    }
  };
  const handleUpdateMemberForecastStatus = async (memberId: string, status: 'manual_dormant' | 'manual_reregister' | null) => {
    try {
        await api.updateMemberForecastStatus(memberId, status);
        setToastInfo({ message: '회원 상태가 변경되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `회원 상태 변경 실패: ${message}`, type: 'warning' });
    }
  };
  const handleAddSale = async (memberId: string, classCount: number, amount: number, saleDate: string, paidAmount: number) => {
      try {
          const datePrefix = saleDate.replace(/-/g, ''); const salesOnDate = sales.filter(s => s.saleDate === saleDate).length;
          const saleId = `sale-${datePrefix}-${salesOnDate + 1}`;
          await api.addSale(saleId, memberId, classCount, amount, saleDate, paidAmount);
          setToastInfo({ message: '신규 매출이 등록되었습니다.', type: 'success' });
          await reloadAllData();
      } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          setToastInfo({ message: `매출 추가 실패: ${message}`, type: 'warning' });
      }
  };
  const handleDeleteSale = async (saleId: string) => {
      if (!confirm('정말로 이 매출 항목을 삭제하시겠습니까?')) return;
      try {
          await api.deleteSale(saleId);
          setToastInfo({ message: '매출 항목이 삭제되었습니다.', type: 'success' });
          await reloadAllData();
      } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          setToastInfo({ message: `매출 삭제 실패: ${message}`, type: 'warning' });
      }
  };
  const handleUpdateSale = async (saleId: string, field: 'saleDate' | 'classCount' | 'amount' | 'paidAmount', value: string | number) => {
      try {
          await api.updateSale(saleId, field, value);
          setToastInfo({ message: '매출 정보가 수정되었습니다.', type: 'success' });
          await reloadAllData();
      } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          setToastInfo({ message: `매출 수정 실패: ${message}`, type: 'warning' });
      }
  };
    const handleAddSession = async (memberId: string, classCount: number, sessionDate: string, unitPrice?: number) => {
        try {
            const datePrefix = sessionDate.replace(/-/g, '');
            const sessionsOnDate = sessions.filter(s => s.sessionDate === sessionDate).length;
            const sessionId = `session-${datePrefix}-${sessionsOnDate + 1}`;

            const result = await api.addSession({ sessionId, memberId, classCount, sessionDate, unitPrice });

            if (result.success) {
                // Also create a corresponding completed calendar event
                const member = membersWithStats.find(m => m.id === memberId);
                if (member) {
                    const scheduleEventId = `schedule-${sessionId}`; // Link event to session ID
                    const newEvent: CalendarEvent = {
                        id: scheduleEventId,
                        date: sessionDate,
                        type: 'workout',
                        title: member.name,
                        startTime: '09:00', // Default time, as session doesn't have time info
                        endTime: '09:50',   // Default duration
                        memberId: memberId,
                        status: 'completed',
                    };
                    await api.addScheduleEvents([newEvent]);
                }

                setToastInfo({ message: '세션이 추가되었습니다.', type: 'success' });
                if (result.toast) setTimeout(() => setToastInfo(result.toast!), 1000);
                await reloadAllData();
            } else {
                setToastInfo({ message: `세션 추가 실패: ${result.error || '알 수 없는 오류'}`, type: 'warning' });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setToastInfo({ message: `세션 추가 실패: ${message}`, type: 'warning' });
        }
    };
  const handleDeleteSession = async (sessionId: string) => {
    try {
        // Find and delete the corresponding calendar event if it exists
        const sessionToDelete = sessions.find(s => s.id === sessionId);
        if (sessionToDelete) {
            // Case 1: Session was created from a schedule event
            const eventIdFromSource = sessionToDelete.completionSourceId;
            // Case 2: Schedule event was created from a manual session (convention-based ID)
            const eventIdFromConvention = `schedule-${sessionId}`;
            
            const linkedEvent = calendarEvents.find(e => e.id === eventIdFromSource || e.id === eventIdFromConvention);

            if (linkedEvent) {
                await api.deleteScheduleEvent(linkedEvent.id, 'single');
            }
        }

        await api.deleteSession(sessionId);
        setToastInfo({ message: '세션이 삭제되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `세션 삭제 실패: ${message}`, type: 'warning' });
    }
  };
  const handleUpdateSession = async (sessionId: string, field: keyof MemberSession, value: string | number) => {
    try {
        await api.updateSession(sessionId, field, value);
        setToastInfo({ message: '세션 정보가 수정되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `세션 수정 실패: ${message}`, type: 'warning' });
    }
  };
  const handleAddForecastEntry = async (memberName: string, classCount: number, amount: number, forecastDate: string) => {
    try {
        const forecastId = `forecast-${forecastDate.replace(/-/g, '')}-${Date.now()}`;
        await api.addForecastEntry(forecastId, memberName, classCount, amount, forecastDate);
        setToastInfo({ message: '매출 예상 항목이 추가되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `매출 예상 추가 실패: ${message}`, type: 'warning' });
    }
  };
  const handleDeleteForecastEntry = async (id: string) => {
    try {
        await api.deleteForecastEntry(id);
        setToastInfo({ message: '매출 예상 항목이 삭제되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `매출 예상 삭제 실패: ${message}`, type: 'warning' });
    }
  };
  const handleUpdateForecastEntry = async (id: string, field: keyof ForecastEntry, value: string | number) => {
    try {
        await api.updateForecastEntry(id, field, value);
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `매출 예상 수정 실패: ${message}`, type: 'warning' });
    }
  };
  const handleAddSchedule = async (formData: AddScheduleFormData) => {
    try {
        const { memberId, type, startDate, startTime, duration, recurrence, daysOfWeek, endCondition } = formData;
        const member = membersWithStats.find(m => m.id === memberId);
        if (!member) {
            setToastInfo({ message: '유효하지 않은 회원입니다.', type: 'warning' });
            return;
        }
        const [startHour, startMin] = startTime.split(':').map(Number);
        const endTimeDate = new Date();
        endTimeDate.setHours(startHour, startMin + duration);
        const endTime = `${String(endTimeDate.getHours()).padStart(2, '0')}:${String(endTimeDate.getMinutes()).padStart(2, '0')}`;
        let eventsToAdd: CalendarEvent[] = [];
        const dailyCounts: { [key: string]: number } = {};
        const getNextIdForDate = (dateStr: string) => {
            const datePrefix = dateStr.replace(/-/g, '');
            const sequence = (calendarEvents.filter(e => e.date === dateStr).length) + (dailyCounts[dateStr] || 0) + 1;
            dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
            return `schedule-${datePrefix}-${sequence}`;
        };
        if (type === 'single') {
            eventsToAdd.push({
                id: getNextIdForDate(startDate), date: startDate, type: 'workout', title: member.name, startTime, endTime, memberId, status: 'scheduled'
            });
        } else {
            const recurrenceId = `recurrence-${Date.now()}`;
            let currentDate = new Date(`${startDate}T00:00:00`);
            let occurrencesCount = 0;
            const endDateLimit = endCondition.type === 'date' ? new Date(`${endCondition.value}T00:00:00`) : null;
            const maxOccurrences = endCondition.type === 'occurrences' || endCondition.type === 'sessions' ? Number(endCondition.value) : 200;
            const anchorDate = new Date(currentDate);
            while (occurrencesCount < maxOccurrences && occurrencesCount < 200) {
                if (endDateLimit && currentDate > endDateLimit) break;
                if (daysOfWeek.includes(currentDate.getDay())) {
                    const weekDiff = Math.floor((currentDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    if (recurrence === 'weekly' || (recurrence === 'bi-weekly' && weekDiff % 2 === 0)) {
                        const dateStr = formatDateISO(currentDate);
                        eventsToAdd.push({
                            id: getNextIdForDate(dateStr), date: dateStr, type: 'workout', title: member.name, startTime, endTime, memberId, status: 'scheduled', recurrenceId
                        });
                        occurrencesCount++;
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        await api.addScheduleEvents(eventsToAdd);
        setToastInfo({ message: `${eventsToAdd.length}개의 스케줄이 추가되었습니다.`, type: 'success' });
        setIsAddScheduleModalOpen(false);
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `스케줄 추가 실패: ${message}`, type: 'warning' });
    }
  };
  const handleUpdateSchedule = async (eventId: string, formData: Partial<CalendarEvent>, mode: EditMode) => {
      try {
          await api.updateScheduleEvent(eventId, formData, mode);
          setToastInfo({ message: '스케줄이 수정되었습니다.', type: 'success' });
          await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `스케줄 수정 실패: ${message}`, type: 'warning' });
    }
  };
  const handleDeleteSchedule = async (eventId: string, mode: EditMode) => {
    try {
        const eventToDelete = calendarEvents.find(e => e.id === eventId);
        if (eventToDelete?.status === 'completed' && eventToDelete.type === 'workout') {
            const linkedSession = sessions.find(s => s.completionSourceId === eventId);
            if (linkedSession) {
                await api.deleteSession(linkedSession.id);
            }
        }
        await api.deleteScheduleEvent(eventId, mode);
        setToastInfo({ message: '스케줄이 삭제되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `스케줄 삭제 실패: ${message}`, type: 'warning' });
    }
  };
  const handleUncompleteSession = async (eventId: string) => {
    const linkedSession = sessions.find(s => s.completionSourceId === eventId);
    if (linkedSession) {
        try {
            await api.deleteSession(linkedSession.id);
            setToastInfo({ message: '수업을 예정 상태로 되돌렸습니다.', type: 'success' });
            await reloadAllData();
        } catch(error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setToastInfo({ message: `되돌리기 실패: ${message}`, type: 'warning' });
        }
    } else {
        setToastInfo({ message: '연결된 수업 기록을 찾을 수 없습니다.', type: 'warning' });
    }
  };
  const handleCompleteMultipleSessions = async (eventIds: string[]) => {
      const eventsToComplete = eventIds.map(id => calendarEvents.find(e => e.id === id)).filter((e): e is CalendarEvent => !!(e && e.type === 'workout' && e.status === 'scheduled'));
      if (eventsToComplete.length === 0) {
          setToastInfo({ message: '완료할 수 있는 수업이 없습니다.', type: 'warning' });
          return;
      }
      
      let successCount = 0, errorCount = 0;
      for (const event of eventsToComplete) {
          const sessionsOnDate = sessions.filter(s => s.sessionDate === event.date).length + successCount;
          const sessionId = `session-${event.date.replace(/-/g, '')}-${sessionsOnDate + 1}`;
          const unitPrice = membersWithStats.find(m => m.id === event.memberId)?.unitPrice || 0;
          try {
              const result = await api.addSession({ sessionId, memberId: event.memberId, classCount: 1, sessionDate: event.date, unitPrice, completionSourceId: event.id });
              if (result.success) { successCount++; } else { errorCount++; }
          } catch (e: unknown) {
              errorCount++;
              const message = e instanceof Error ? e.message : String(e);
              console.error(`수업 완료 처리 실패 (이벤트 ID: ${event.id}):`, message);
          }
      }
      if (successCount > 0) setToastInfo({ message: `${successCount}개의 수업이 완료 처리되었습니다.`, type: 'success' });
      if (errorCount > 0) setToastInfo({ message: `${errorCount}개 수업 완료 처리에 실패했습니다.`, type: 'warning' });
      if (successCount > 0) await reloadAllData();
  };
  const handleCompleteDay = (date: string) => handleCompleteMultipleSessions(calendarEvents.filter(e => e.date === date && e.type === 'workout' && e.status === 'scheduled').map(e => e.id));
  const handleCompleteSession = (eventId: string) => handleCompleteMultipleSessions([eventId]);
  const handleAddWeeklySchedule = async (dayOfWeek: number, startTime: string, endTime: string, memberId: string, status: ScheduleStatus) => {
    const member = membersWithStats.find(m => m.id === memberId);
    if (!member) return;
    try {
        await api.addWeeklySchedule({ id: `ws-${Date.now()}`, dayOfWeek, startTime, endTime, memberId, memberName: member.name, status });
        setToastInfo({ message: '주간 시간표에 추가되었습니다.', type: 'success' });
        await reloadAllData();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `시간표 추가 실패: ${message}`, type: 'warning' });
    }
  };
  const handleUpdateWeeklySchedule = async (id: string, updatedData: Partial<Omit<WeeklyScheduleEntry, 'id'>>) => {
      try {
          await api.updateWeeklySchedule(id, updatedData);
          setToastInfo({ message: '시간표가 수정되었습니다.', type: 'success' });
          await reloadAllData();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setToastInfo({ message: `시간표 수정 실패: ${message}`, type: 'warning' });
      }
  };
  const handleDeleteWeeklySchedule = async (id: string) => {
      try {
          await api.deleteWeeklySchedule(id);
          setToastInfo({ message: '시간표 항목이 삭제되었습니다.', type: 'success' });
          await reloadAllData();
      } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          setToastInfo({ message: `시간표 삭제 실패: ${message}`, type: 'warning' });
      }
  };
  const handleDeleteMultipleSchedules = async (eventIds: string[]) => {
      if (eventIds.length === 0) return;
      try {
          const eventsToDelete = eventIds.map(id => calendarEvents.find(e => e.id === id)).filter(Boolean) as CalendarEvent[];
          const completedWorkoutEvents = eventsToDelete.filter(e => e.type === 'workout' && e.status === 'completed');
          const linkedSessionIdsToDelete = completedWorkoutEvents
              .map(event => sessions.find(s => s.completionSourceId === event.id)?.id)
              .filter(Boolean) as string[];

          const deletePromises: Promise<any>[] = [];
          eventIds.forEach(id => deletePromises.push(api.deleteScheduleEvent(id, 'single')));
          linkedSessionIdsToDelete.forEach(id => deletePromises.push(api.deleteSession(id)));

          await Promise.all(deletePromises);

          setToastInfo({ message: `${eventIds.length}개의 스케줄이 삭제되었습니다.`, type: 'success' });
          await reloadAllData();
      } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          setToastInfo({ message: `스케줄 삭제 실패: ${message}`, type: 'warning' });
          throw error;
      }
  };

  return {
    isLoading, sessions, sales, monthlySessions, monthlySales, forecastEntries,
    membersWithStats, weeklySchedules, plannedMonthlySessions, toastInfo, isSettingsModalOpen, isAddScheduleModalOpen,
    isEditScheduleModalOpen, editingEvent, scheduleModalContext, salaryDefaults, baseSalary, incentiveRate,
    performanceBonus, salesIncentiveRate, taxEnabled, insurancesEnabled, statisticsDateRange, salaryStatsDateRange,
    scheduleDateRange, salaryDate, statisticsData, salaryStatisticsData, currentMonthSales, membersToReRegister,
    dormantMembers, calendarEvents, setToastInfo, setIsSettingsModalOpen, setIsAddScheduleModalOpen,
    setIsEditScheduleModalOpen, setEditingEvent, setScheduleModalContext, setBaseSalary, setIncentiveRate,
    setPerformanceBonus, setSalesIncentiveRate, setStatisticsDateRange, setSalaryStatsDateRange, setScheduleDateRange,
    setSalaryCalculationMonth, handleToggleTax, handleToggleInsurances, handleSaveSettings, handleAddMember,
    handleDeleteMember, handleUpdateMember, handleAddSale, handleDeleteSale, handleUpdateSale, handleAddSession,
    handleDeleteSession, handleUpdateSession, handleAddForecastEntry, handleDeleteForecastEntry, handleUpdateForecastEntry,
    handleUpdateMemberForecastStatus,
    handleAddSchedule, handleUpdateSchedule, handleDeleteSchedule, handleUncompleteSession, handleCompleteDay,
    handleCompleteSession, handleAddWeeklySchedule, handleUpdateWeeklySchedule, handleDeleteWeeklySchedule,
    handleDeleteMultipleSchedules, handleCompleteMultipleSessions,
  };
};