
import React, { useState, useMemo, useEffect, useRef } from 'react';
import SalaryCalculator from './components/SalaryCalculator';
import SalesForecast from './pages/SalesForecast';
import Statistics from './pages/Statistics';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Toast from './components/Toast';
import type { TrackedMember, MemberSession, ForecastEntry, SaleEntry, TrackedMemberWithStats, ToastInfo, MemberStat, SalaryStatisticsData, DateRange, SalaryPeriodStats, CalendarEvent } from './types';
import { 
    RE_REGISTRATION_THRESHOLD,
    NATIONAL_PENSION_RATE,
    HEALTH_INSURANCE_RATE,
    LONG_TERM_CARE_INSURANCE_RATE_OF_HEALTH_INSURANCE,
    EMPLOYMENT_INSURANCE_RATE,
    TAX_RATE
} from './constants';
import SettingsModal from './components/SettingsModal';
import type { SalaryDefaults } from './components/SettingsModal';

type ActiveTab = 'dashboard' | 'calculator' | 'forecast' | 'statistics' | 'members';

// Helper function to get a random date in the past N days
const getRandomDate = (daysAgo: number): Date => {
  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - Math.floor(Math.random() * daysAgo));
  return pastDate;
};

// Helper to format date to YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const generateInitialData = () => {
    const membersData: Omit<TrackedMember, 'usedSessions'>[] = [
      { id: 'm1', name: '김민준', totalSessions: 30, unitPrice: 55000 },
      { id: 'm2', name: '이서아', totalSessions: 30, unitPrice: 60000 },
      { id: 'm3', name: '박도윤', totalSessions: 50, unitPrice: 50000 },
      { id: 'm4', name: '최하은', totalSessions: 20, unitPrice: 45000 },
      { id: 'm5', name: '정시우', totalSessions: 30, unitPrice: 55000 },
      { id: 'm6', name: '강지안', totalSessions: 30, unitPrice: 50000 },
      { id: 'm7', name: '조은우', totalSessions: 30, unitPrice: 55000 },
      { id: 'm8', name: '윤하윤', totalSessions: 20, unitPrice: 50000 },
      { id: 'm9', name: '장서준', totalSessions: 10, unitPrice: 55000 },
      { id: 'm10', name: '임아린', totalSessions: 20, unitPrice: 50000 },
      { id: 'm11', name: '한이준', totalSessions: 30, unitPrice: 60000 },
      { id: 'm12', name: '오지유', totalSessions: 20, unitPrice: 45000 },
      { id: 'm13', name: '송선우', totalSessions: 30, unitPrice: 50000 },
      { id: 'm14', name: '권나은', totalSessions: 30, unitPrice: 55000 },
      { id: 'm15', name: '황유준', totalSessions: 30, unitPrice: 50000 },
      { id: 'm16', name: '안소율', totalSessions: 20, unitPrice: 60000 },
      { id: 'm17', name: '홍주원', totalSessions: 50, unitPrice: 45000 },
      { id: 'm18', name: '문예은', totalSessions: 50, unitPrice: 55000 },
      { id: 'm19', name: '고건우', totalSessions: 30, unitPrice: 50000 },
      { id: 'm20', name: '양채아', totalSessions: 20, unitPrice: 45000 }
    ];

    const members: TrackedMember[] = membersData.map(m => ({ ...m, usedSessions: 0 }));

    const sales: SaleEntry[] = [];
    const sessions: MemberSession[] = [];
    const today = new Date();
    const classCountsOptions = [20, 30, 50];

    // Generate sales for the last year
    members.forEach(member => {
        const numSales = Math.floor(Math.random() * 2) + 2; // 2 to 3 sales per member over the year
        let lastSaleDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

        for (let i = 0; i < numSales; i++) {
            // Distribute sales over the year
            const saleDate = new Date(lastSaleDate.getTime() + (Math.random() * (365 / numSales) * 24 * 60 * 60 * 1000));
            lastSaleDate = saleDate;

            if (saleDate > today) continue;

            const classCount = classCountsOptions[Math.floor(Math.random() * classCountsOptions.length)];
            const unitPrice = member.unitPrice + (Math.floor(Math.random() * 6) - 3) * 1000; // slight variation

            sales.push({
                id: crypto.randomUUID(),
                saleDate: formatDate(saleDate),
                memberId: member.id,
                memberName: member.name,
                classCount,
                unitPrice,
                amount: classCount * unitPrice,
            });
        }
    });
    
    // Update member's totalSessions and unitPrice based on the most recent sale
    members.forEach(member => {
        const memberSales = sales
            .filter(s => s.memberId === member.id)
            .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
        
        if (memberSales.length > 0) {
            member.totalSessions = memberSales[0].classCount;
            member.unitPrice = memberSales[0].unitPrice;
        }
    });

    // Generate sessions for the last YEAR
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    members.forEach(member => {
        const memberSales = sales.filter(s => s.memberId === member.id);
        if (memberSales.length === 0) return;

        let totalBoughtSessions = memberSales.reduce((sum, s) => sum + s.classCount, 0);
        let generatedSessionsCount = 0;

        // Roughly 6-10 sessions per month
        const sessionsPerMonth = Math.floor(Math.random() * 5) + 6;
        const totalSessionsToGenerate = Math.min(totalBoughtSessions, sessionsPerMonth * 12);

        for (let i = 0; i < totalSessionsToGenerate; i++) {
            if (generatedSessionsCount >= totalBoughtSessions) break;
            
            // Random date in the last year
            const sessionDate = getRandomDate(365); 
            if (sessionDate < oneYearAgo) continue;

            // Ensure session date is after the first sale date for this member
            const firstSaleDate = new Date(memberSales.sort((a,b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime())[0].saleDate);
            if(sessionDate < firstSaleDate) continue;

            const classCount = 1; // Keep it simple, one session per entry

            const relevantSale = sales
                .filter(s => s.memberId === member.id && new Date(s.saleDate) <= sessionDate)
                .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())[0];
            
            if (!relevantSale) continue; 

            const unitPrice = relevantSale.unitPrice;

            sessions.push({
                id: crypto.randomUUID(),
                sessionDate: formatDate(sessionDate),
                memberId: member.id,
                memberName: member.name,
                classCount,
                unitPrice,
            });
            generatedSessionsCount += classCount;
        }
    });

    return { members, sales, sessions };
};

const { members: initialTrackedMembers, sales: initialSales, sessions: initialSessions } = generateInitialData();


const initialForecastEntries: ForecastEntry[] = [
    { id: 'f1', memberName: '신규PT등록', classCount: 20, unitPrice: 50000 },
    { id: 'f2', memberName: '재등록 예상', classCount: 15, unitPrice: 52000 },
];

const getThisMonthRange = (): DateRange => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999); // Include whole day
  return { start, end };
};


function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  const [trackedMembers, setTrackedMembers] = useState<TrackedMember[]>(initialTrackedMembers);
  const [sessions, setSessions] = useState<MemberSession[]>(initialSessions);
  const [forecastEntries, setForecastEntries] = useState<ForecastEntry[]>(initialForecastEntries);
  const [sales, setSales] = useState<SaleEntry[]>(initialSales);

  const [toastInfo, setToastInfo] = useState<ToastInfo>({ message: null, type: 'warning' });
  const notificationShownRef = useRef(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [salaryDefaults, setSalaryDefaults] = useState<SalaryDefaults>({
    baseSalary: 2100000,
    incentiveRate: 50,
    salesIncentiveRate: 0,
    taxEnabled: false,
    insurancesEnabled: false,
  });

  // Salary Configuration State (lifted from SalaryCalculator)
  const [baseSalary, setBaseSalary] = useState(salaryDefaults.baseSalary);
  const [incentiveRate, setIncentiveRate] = useState(salaryDefaults.incentiveRate);
  const [performanceBonus, setPerformanceBonus] = useState(0);
  const [salesIncentiveRate, setSalesIncentiveRate] = useState(salaryDefaults.salesIncentiveRate);
  const [taxEnabled, setTaxEnabled] = useState(salaryDefaults.taxEnabled);
  const [insurancesEnabled, setInsurancesEnabled] = useState(salaryDefaults.insurancesEnabled);
  const [statisticsDateRange, setStatisticsDateRange] = useState<DateRange>(getThisMonthRange());
  const [salaryStatsDateRange, setSalaryStatsDateRange] = useState<DateRange>(getThisMonthRange());

  const handleToggleTax = () => setTaxEnabled(p => !p);
  const handleToggleInsurances = () => setInsurancesEnabled(p => !p);

  const handleSaveSettings = (newDefaults: SalaryDefaults) => {
    setSalaryDefaults(newDefaults);
    // Also update the current calculator values
    setBaseSalary(newDefaults.baseSalary);
    setIncentiveRate(newDefaults.incentiveRate);
    setSalesIncentiveRate(newDefaults.salesIncentiveRate);
    setTaxEnabled(newDefaults.taxEnabled);
    setInsurancesEnabled(newDefaults.insurancesEnabled);
    setToastInfo({ message: '기본 설정이 저장되었습니다.', type: 'success' });
  };
  
  const membersWithUsage = useMemo(() => {
    const usageMap = new Map<string, number>();
    sessions.forEach(session => {
        usageMap.set(session.memberId, (usageMap.get(session.memberId) || 0) + (Number(session.classCount) || 0));
    });

    return trackedMembers.map(member => ({
        ...member,
        usedSessions: usageMap.get(member.id) || 0,
    }));
  }, [trackedMembers, sessions]);
  
  const membersWithStats: TrackedMemberWithStats[] = useMemo(() => {
    const ltvMap = new Map<string, number>();
    const salesByMember = new Map<string, SaleEntry[]>();
    sales.forEach(sale => {
        ltvMap.set(sale.memberId, (ltvMap.get(sale.memberId) || 0) + sale.amount);
        
        if (!salesByMember.has(sale.memberId)) {
            salesByMember.set(sale.memberId, []);
        }
        salesByMember.get(sale.memberId)!.push(sale);
    });

    const lastSessionDateMap = new Map<string, string>();
    sessions.forEach(session => {
        const existingDate = lastSessionDateMap.get(session.memberId);
        if (!existingDate || new Date(session.sessionDate) > new Date(existingDate)) {
            lastSessionDateMap.set(session.memberId, session.sessionDate);
        }
    });

    return membersWithUsage.map(member => ({
        ...member,
        ltv: ltvMap.get(member.id) || 0,
        lastSessionDate: lastSessionDateMap.get(member.id),
        cumulativeTotalSessions: (salesByMember.get(member.id) || []).reduce((sum, s) => sum + s.classCount, 0),
    }));
  }, [membersWithUsage, sales, sessions]);

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
      const averageLtv = trackedMembers.length > 0 ? Math.floor(totalLtv / trackedMembers.length) : 0;
      
      // ===== Summary Stats Calculation =====
      const sessionsInPeriodFiltered = sessions.filter(session => {
        try {
            const sessionDate = new Date(session.sessionDate);
            return sessionDate >= rangeStart && sessionDate <= rangeEnd;
        } catch (e) { return false; }
      });

      const totalSessionsThisMonth = sessionsInPeriodFiltered.reduce((sum, s) => sum + (Number(s.classCount) || 0), 0);
      const sessionRevenueThisMonth = sessionsInPeriodFiltered.reduce((sum, s) => sum + (Number(s.classCount) || 0) * (Number(s.unitPrice) || 0), 0);
      
      const activeMemberIds = new Set(sessionsInPeriodFiltered.map(s => s.memberId));
      const averageSessionsPerActiveMember = activeMemberIds.size > 0 ? totalSessionsThisMonth / activeMemberIds.size : 0;
      
      const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun - Sat
      sessionsInPeriodFiltered.forEach(session => {
        try {
            const date = new Date(session.sessionDate);
            if (!isNaN(date.getTime())) {
                const dayIndex = date.getDay();
                dayCounts[dayIndex] += Number(session.classCount) || 0;
            }
        } catch(e) { /* ignore invalid dates */ }
      });
      
      let busiestDayOfWeek = '데이터 없음';
      if(sessionsInPeriodFiltered.length > 0) {
        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
        busiestDayOfWeek = dayNames[busiestDayIndex];
      }

      // ===== Member Ranking Calculation =====
      const periodDuration = rangeEnd.getTime() - rangeStart.getTime();
      const previousPeriodStart = new Date(rangeStart.getTime() - periodDuration);
      const previousPeriodEnd = new Date(rangeStart.getTime() - 1);

      const sessionsInPreviousPeriodFiltered = sessions.filter(session => {
        try {
          const sessionDate = new Date(session.sessionDate);
          return sessionDate >= previousPeriodStart && sessionDate <= previousPeriodEnd;
        } catch (e) {
            return false;
        }
      });

      const getAttendanceMap = (sessionList: MemberSession[]) => {
        const map = new Map<string, {name: string, count: number}>();
        sessionList.forEach(s => {
            const current = map.get(s.memberId) || { name: s.memberName, count: 0 };
            current.count += (Number(s.classCount) || 0);
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
          const memberName = (attendanceThisPeriod.get(memberId)?.name || attendancePreviousPeriod.get(memberId)?.name || trackedMembers.find(m => m.id === memberId)?.name) || '알 수 없음';
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
          lowEngagementMembers,
          newMembersCount,
          returningMembersCount,
          averageLtv,
          totalMembersCount: trackedMembers.length,
          totalSessionsThisMonth,
          sessionRevenueThisMonth,
          averageSessionsPerActiveMember,
          busiestDayOfWeek,
          topAttendantsThisMonth,
          mostImprovedMember,
          attendanceDropMember,
          topRegistrantAllTime,
          mostFrequentRegistrant,
      };
  }, [membersWithStats, sales, sessions, trackedMembers, statisticsDateRange]);

  const salaryStatisticsData: SalaryStatisticsData = useMemo(() => {
    const monthlyData: ({ year: number, month: number } & Omit<SalaryPeriodStats, 'period'>)[] = [];
    const endDate = salaryStatsDateRange.end;

    // 1. Calculate salary data for the last 36 months
    for (let i = 0; i < 36; i++) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11

        const monthlySessions = sessions.filter(s => {
            const sDate = new Date(s.sessionDate);
            return sDate.getFullYear() === year && sDate.getMonth() === month;
        });
        const monthlySalesData = sales.filter(s => {
            const sDate = new Date(s.saleDate);
            return sDate.getFullYear() === year && sDate.getMonth() === month;
        });

        const sessionRevenue = monthlySessions.reduce((acc, s) => acc + s.classCount * s.unitPrice, 0);
        const salesRevenue = monthlySalesData.reduce((acc, s) => acc + s.amount, 0);
        
        const totalSessionsCount = monthlySessions.reduce((acc, s) => acc + s.classCount, 0);
        const totalSalesAmount = salesRevenue;

        const currentBaseSalary = baseSalary;
        const sessionIncentive = Math.floor(sessionRevenue * (incentiveRate / 100));
        const salesIncentive = Math.floor(salesRevenue * (salesIncentiveRate / 100));

        const totalSalary = currentBaseSalary + sessionIncentive + salesIncentive;
        
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

        const finalSalary = totalSalary - totalDeduction;

        monthlyData.push({
            year,
            month,
            totalSalary,
            baseSalary: currentBaseSalary,
            sessionIncentive,
            salesIncentive,
            totalDeduction,
            finalSalary,
            totalSessionsCount,
            totalSalesAmount,
        });
    }

    // 2. Prepare monthly view (last 12 months)
    const monthly = monthlyData.slice(0, 12).map(d => ({
        ...d,
        period: `${d.year}.${String(d.month + 1).padStart(2, '0')}`
    })).reverse();

    // 3. Prepare quarterly view (last 8 quarters)
    const getQuarter = (month: number) => Math.floor(month / 3) + 1;
    const quarters: { [key: string]: SalaryPeriodStats } = {};

    monthlyData.slice(0, 24).forEach(monthData => {
        const quarterKey = `${monthData.year}-Q${getQuarter(monthData.month)}`;
        if (!quarters[quarterKey]) {
            quarters[quarterKey] = {
                period: `${monthData.year} ${getQuarter(monthData.month)}Q`,
                totalSalary: 0, baseSalary: 0, sessionIncentive: 0, salesIncentive: 0, totalDeduction: 0, finalSalary: 0,
                totalSessionsCount: 0, totalSalesAmount: 0,
            };
        }
        quarters[quarterKey].totalSalary += monthData.totalSalary;
        quarters[quarterKey].baseSalary += monthData.baseSalary;
        quarters[quarterKey].sessionIncentive += monthData.sessionIncentive;
        quarters[quarterKey].salesIncentive += monthData.salesIncentive;
        quarters[quarterKey].totalDeduction += monthData.totalDeduction;
        quarters[quarterKey].finalSalary += monthData.finalSalary;
        quarters[quarterKey].totalSessionsCount += monthData.totalSessionsCount;
        quarters[quarterKey].totalSalesAmount += monthData.totalSalesAmount;
    });

    const quarterly = Object.values(quarters).sort((a, b) => a.period.localeCompare(b.period)).slice(-8);

    // 4. Prepare yearly view (last 3 years)
    const years: { [key: string]: SalaryPeriodStats } = {};

     monthlyData.forEach(monthData => {
        const yearKey = `${monthData.year}`;
        if (!years[yearKey]) {
            years[yearKey] = {
                period: `${monthData.year}년`,
                totalSalary: 0, baseSalary: 0, sessionIncentive: 0, salesIncentive: 0, totalDeduction: 0, finalSalary: 0,
                totalSessionsCount: 0, totalSalesAmount: 0,
            };
        }
        years[yearKey].totalSalary += monthData.totalSalary;
        years[yearKey].baseSalary += monthData.baseSalary;
        years[yearKey].sessionIncentive += monthData.sessionIncentive;
        years[yearKey].salesIncentive += monthData.salesIncentive;
        years[yearKey].totalDeduction += monthData.totalDeduction;
        years[yearKey].finalSalary += monthData.finalSalary;
        years[yearKey].totalSessionsCount += monthData.totalSessionsCount;
        years[yearKey].totalSalesAmount += monthData.totalSalesAmount;
    });

    const yearly = Object.values(years).sort((a, b) => a.period.localeCompare(b.period)).slice(-3);


    return { monthly, quarterly, yearly };
}, [sessions, sales, baseSalary, incentiveRate, salesIncentiveRate, taxEnabled, insurancesEnabled, salaryStatsDateRange]);


  const currentMonthSales = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    return sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.getFullYear() === year && saleDate.getMonth() === month;
    });
  }, [sales]);


  const membersToReRegister = useMemo(() => {
    return membersWithStats.filter(member => {
        const remaining = member.cumulativeTotalSessions - member.usedSessions;
        return remaining <= RE_REGISTRATION_THRESHOLD;
    });
  }, [membersWithStats]);

  useEffect(() => {
    if (membersToReRegister.length > 0 && !notificationShownRef.current) {
      const memberCount = membersToReRegister.length;
      let message;
      if (memberCount === 1) {
        message = `${membersToReRegister[0].name}님의 재등록이 필요합니다.`;
      } else {
        message = `${membersToReRegister[0].name}님 외 ${memberCount - 1}명의 재등록이 필요합니다.`;
      }
      setToastInfo({ message, type: 'warning' });
      notificationShownRef.current = true;
    }
  }, [membersToReRegister]);


  const handleAddSale = (memberId: string, classCount: number, unitPrice: number, saleDate: string, memberNameParam?: string) => {
    const memberName = memberNameParam || trackedMembers.find(m => m.id === memberId)?.name;

    const newSale: SaleEntry = {
        id: crypto.randomUUID(),
        saleDate,
        memberId,
        memberName: memberName || '알 수 없는 회원',
        classCount,
        unitPrice,
        amount: classCount * unitPrice,
    };
    setSales(prev => [...prev, newSale].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()));
  };
  
  const handleAddMember = (name: string, totalSessions: number, unitPrice: number) => {
    const newMember: TrackedMember = {
      id: crypto.randomUUID(),
      name,
      totalSessions,
      usedSessions: 0,
      unitPrice,
    };
    setTrackedMembers(prev => [...prev, newMember]);
    setToastInfo({ message: `${name} 회원님이 성공적으로 등록되었습니다.`, type: 'success' });
    const saleDate = new Date().toISOString().split('T')[0];
    handleAddSale(newMember.id, totalSessions, unitPrice, saleDate, newMember.name);
  };

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm('정말로 이 회원을 삭제하시겠습니까? 관련된 모든 수업 및 매출 기록도 삭제됩니다.')) {
      const memberName = trackedMembers.find(m => m.id === memberId)?.name;
      setTrackedMembers(prev => prev.filter(member => member.id !== memberId));
      setSessions(prev => prev.filter(session => session.memberId !== memberId));
      setSales(prev => prev.filter(sale => sale.memberId !== memberId));
      setToastInfo({ message: `${memberName || '회원'} 정보가 삭제되었습니다.`, type: 'success' });
    }
  };

  const handleUpdateMember = (memberId: string, updatedData: { name: string; totalSessions: number; unitPrice: number; }) => {
    let memberNameChanged = false;
    
    setTrackedMembers(prev => prev.map(member => {
        if (member.id === memberId) {
            if (member.name !== updatedData.name) {
                memberNameChanged = true;
            }
            // usedSessions는 유지하면서 다른 데이터 업데이트
            return { ...member, ...updatedData };
        }
        return member;
    }));

    if (memberNameChanged) {
        setSessions(prev => prev.map(session => 
            session.memberId === memberId ? { ...session, memberName: updatedData.name } : session
        ));
        setSales(prev => prev.map(sale => 
            sale.memberId === memberId ? { ...sale, memberName: updatedData.name } : sale
        ));
    }
    setToastInfo({ message: `${updatedData.name}님의 정보가 성공적으로 수정되었습니다.`, type: 'success' });
  };


  const handleAddSession = (memberId: string, classCount: number, sessionDate: string, unitPrice?: number) => {
    const member = trackedMembers.find(m => m.id === memberId);
    if (!member) {
      alert('존재하지 않는 회원입니다.');
      return;
    }

    if (unitPrice !== undefined) {
      // Direct add with a specified unit price (e.g., moving a session from the detail modal)
      const newSession: MemberSession = {
        id: crypto.randomUUID(),
        sessionDate,
        memberId,
        memberName: member.name,
        classCount,
        unitPrice,
      };
      setSessions(prev => [...prev, newSession].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()));
      return;
    }

    // FIFO logic for adding new sessions from the main form
    const memberSales = sales
      .filter(s => s.memberId === memberId)
      .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());

    if (memberSales.length === 0) {
      alert('해당 회원의 매출 기록이 없어 세션을 추가할 수 없습니다.');
      return;
    }

    const previouslyUsedSessions = sessions
      .filter(s => s.memberId === memberId)
      .reduce((sum, s) => sum + s.classCount, 0);

    let sessionsToAllocate = classCount;
    let cumulativeSessionsFromSales = 0;
    const newSessions: MemberSession[] = [];

    for (const sale of memberSales) {
      if (sessionsToAllocate <= 0) break;

      const saleEndSessionCount = cumulativeSessionsFromSales + sale.classCount;
      const startPointForAllocation = Math.max(cumulativeSessionsFromSales, previouslyUsedSessions);
      
      if (startPointForAllocation < saleEndSessionCount) {
        const availableSlots = saleEndSessionCount - startPointForAllocation;
        const sessionsToTake = Math.min(sessionsToAllocate, availableSlots);
        
        if (sessionsToTake > 0) {
          newSessions.push({
            id: crypto.randomUUID(),
            sessionDate,
            memberId,
            memberName: member.name,
            classCount: sessionsToTake,
            unitPrice: sale.unitPrice,
          });
          sessionsToAllocate -= sessionsToTake;
        }
      }
      
      cumulativeSessionsFromSales += sale.classCount;
    }

    if (sessionsToAllocate > 0) {
      const lastSale = memberSales[memberSales.length - 1];
      newSessions.push({
        id: crypto.randomUUID(),
        sessionDate,
        memberId,
        memberName: member.name,
        classCount: sessionsToAllocate,
        unitPrice: lastSale.unitPrice,
      });
      setToastInfo({ message: `잔여 세션을 초과하여 ${sessionsToAllocate}개의 세션이 추가되었습니다. 단가는 마지막 매출 기준으로 적용됩니다.`, type: 'warning' });
    }

    if (newSessions.length > 0) {
      setSessions(prev => [...prev, ...newSessions].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()));
    }
  };

  const handleDeleteSession = (sessionId: string) => {
     setSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  const handleUpdateSession = (sessionId: string, field: keyof MemberSession, value: string | number) => {
    setSessions(prev =>
      prev.map(session => {
        if (session.id === sessionId) {
          const newSession = { ...session };
          
          if (field === 'classCount' && typeof value === 'number') {
            newSession.classCount = value;
          } else if (field === 'unitPrice' && typeof value === 'number') {
            newSession.unitPrice = value;
          } else if (field === 'sessionDate' && typeof value === 'string') {
            newSession.sessionDate = value;
          } else if (field === 'memberName' && typeof value === 'string') {
            newSession.memberName = value;
          } else if (field === 'id' && typeof value === 'string') {
            newSession.id = value;
          } else if (field === 'memberId' && typeof value === 'string') {
            newSession.memberId = value;
          }
          
          return newSession;
        }
        return session;
      }),
    );
  };
  
  const handleAddForecastEntry = (memberName: string, classCount: number, unitPrice: number) => {
    const newEntry: ForecastEntry = { id: crypto.randomUUID(), memberName, classCount, unitPrice };
    setForecastEntries(prev => [...prev, newEntry]);
  };

  const handleDeleteForecastEntry = (id: string) => {
    setForecastEntries(prev => prev.filter(entry => entry.id !== id));
    setToastInfo({ message: '예상 매출 항목이 삭제되었습니다.', type: 'success' });
  };
  
  const handleUpdateForecastEntry = (id: string, field: keyof ForecastEntry, value: string | number) => {
    setForecastEntries(prev => prev.map(entry => {
        if (entry.id === id) {
            const newEntry = { ...entry };
            if (field === 'classCount' && typeof value === 'number') {
              newEntry.classCount = value;
            } else if (field === 'unitPrice' && typeof value === 'number') {
              newEntry.unitPrice = value;
            } else if (field === 'memberName' && typeof value === 'string') {
              newEntry.memberName = value;
            } else if (field === 'id' && typeof value === 'string') {
              newEntry.id = value;
            }
            return newEntry;
        }
        return entry;
    }));
  };

  const handleDeleteSale = (saleId: string) => {
    setSales(prev => prev.filter(sale => sale.id !== saleId));
    setToastInfo({ message: '매출 기록이 삭제되었습니다.', type: 'success' });
  };

  const handleUpdateSale = (saleId: string, field: keyof Omit<SaleEntry, 'id' | 'memberId' | 'memberName' | 'amount'>, value: string | number) => {
      setSales(prev => prev.map(sale => {
        if (sale.id === saleId) {
            const newSale = { ...sale };

            if (field === 'saleDate' && typeof value === 'string') {
                newSale.saleDate = value;
            } else if (field === 'classCount' && typeof value === 'number') {
                newSale.classCount = value;
            } else if (field === 'unitPrice' && typeof value === 'number') {
                newSale.unitPrice = value;
            }
            
            newSale.amount = newSale.classCount * newSale.unitPrice;
            
            return newSale;
        }
        return sale;
      }));
  };

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];
    if (!sales) return [];
    
    const { start, end } = statisticsDateRange;

    const salesInPeriod = sales.filter(s => {
        const saleDate = new Date(s.saleDate);
        return saleDate >= start && saleDate <= end;
    });

    // 1. Process 'new_member' events
    const firstSaleDateMap = new Map<string, string>();
    // Use all sales to determine the absolute first sale date for a member
    [...sales].sort((a,b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime())
        .forEach(sale => {
            if (!firstSaleDateMap.has(sale.memberId)) {
                firstSaleDateMap.set(sale.memberId, sale.saleDate);
            }
        });

    salesInPeriod.forEach(sale => {
        const firstSaleDate = firstSaleDateMap.get(sale.memberId);
        if (firstSaleDate === sale.saleDate) {
            events.push({
                date: sale.saleDate,
                type: 'new_member',
                description: `신규: ${sale.memberName}`,
            });
        }
    });

    // 2. Process 'sale' events by aggregating daily totals
    const salesByDay = new Map<string, number>();
    salesInPeriod.forEach(sale => {
        const dateKey = sale.saleDate;
        const currentTotal = salesByDay.get(dateKey) || 0;
        salesByDay.set(dateKey, currentTotal + sale.amount);
    });

    salesByDay.forEach((totalAmount, date) => {
        if (totalAmount >= 1) { // Only show if total sales are 1 won or more
            events.push({
                date: date,
                type: 'sale',
                description: `총 매출: ${totalAmount.toLocaleString()}원`,
                amount: totalAmount,
            });
        }
    });


    // 3. Sort events for consistent display
    return events.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        if (a.type === 'new_member' && b.type !== 'new_member') return -1;
        if (a.type !== 'new_member' && b.type === 'new_member') return 1;
        return 0;
    });
}, [statisticsDateRange, sales]);


  const getTabClass = (tabName: ActiveTab) => {
    return activeTab === tabName
      ? 'bg-blue-600 text-white'
      : 'bg-white text-slate-600 hover:bg-slate-100';
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            membersWithUsage={membersWithStats}
            forecastEntries={forecastEntries}
          />
        );
      case 'calculator':
        return (
          <SalaryCalculator
            sessions={sessions}
            allSales={sales}
            membersWithStats={membersWithStats}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onUpdateSession={handleUpdateSession}
            onShowToast={setToastInfo}
            // Salary Config Props
            taxEnabled={taxEnabled}
            onToggleTax={handleToggleTax}
            insurancesEnabled={insurancesEnabled}
            onToggleInsurances={handleToggleInsurances}
            baseSalary={baseSalary}
            setBaseSalary={setBaseSalary}
            incentiveRate={incentiveRate}
            setIncentiveRate={setIncentiveRate}
            performanceBonus={performanceBonus}
            setPerformanceBonus={setPerformanceBonus}
            salesIncentiveRate={salesIncentiveRate}
            setSalesIncentiveRate={setSalesIncentiveRate}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        );
      case 'forecast':
        return (
          <SalesForecast
            currentMonthSales={currentMonthSales}
            onAddSale={handleAddSale}
            onDeleteSale={handleDeleteSale}
            onUpdateSale={handleUpdateSale}
            entries={forecastEntries}
            membersToReRegister={membersToReRegister}
            trackedMembers={membersWithUsage}
            onAddEntry={handleAddForecastEntry}
            onDeleteEntry={handleDeleteForecastEntry}
            onUpdateEntry={handleUpdateForecastEntry}
          />
        );
      case 'statistics':
        return (
          <Statistics 
             stats={{...statisticsData, salaryStatisticsData}}
             membersToReRegister={membersToReRegister}
             dateRange={statisticsDateRange}
             onDateRangeChange={setStatisticsDateRange}
             salaryDateRange={salaryStatsDateRange}
             onSalaryDateRangeChange={setSalaryStatsDateRange}
             calendarEvents={calendarEvents}
          />
        );
      case 'members':
        return (
          <Members
             members={membersWithStats}
             onAddMember={handleAddMember}
             onDeleteMember={handleDeleteMember}
             onUpdateMember={handleUpdateMember}
             sales={sales}
             sessions={sessions}
             onAddSale={handleAddSale}
             onDeleteSale={handleDeleteSale}
             onUpdateSale={handleUpdateSale}
          />
        );
      default:
        return null;
    }
  };


  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <Toast 
        message={toastInfo.message} 
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: null, type: 'warning' })} 
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        defaults={salaryDefaults}
      />
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900">피트니스 AI 애널리틱스 대시보드</h1>
          <p className="mt-2 text-lg text-slate-600">급여 정산, 매출 예상, 회원 통계 및 AI 분석을 한번에 관리하세요.</p>
        </header>

        <nav className="mb-8 flex justify-center p-1 bg-slate-200 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-1/5 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${getTabClass('dashboard')}`}
          >
            AI 대시보드
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`w-1/5 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${getTabClass('calculator')}`}
          >
            급여 정산
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`w-1/5 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${getTabClass('forecast')}`}
          >
            매출 예상
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`w-1/5 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${getTabClass('statistics')}`}
          >
            통계
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`w-1/5 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${getTabClass('members')}`}
          >
            회원 관리
          </button>
        </nav>

        <main>
          {renderContent()}
        </main>

        <footer className="text-center mt-8 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Fitness Management System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
