import React from 'react';
import UserGroupIcon from './icons/UserGroupIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import CurrencyWonIcon from './icons/CurrencyWonIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import SparklesIcon from './icons/SparklesIcon';

interface StatisticsSummaryProps {
  stats: {
    totalMembersCount: number;
    newMembersCount: number;
    returningMembersCount: number;
    averageLtv: number;
    totalSessionsThisMonth: number;
    sessionRevenueThisMonth: number;
    averageSessionsPerActiveMember: number;
    busiestDayOfWeek: string;
  };
}

const StatCard = ({ title, value, icon, unit }: { title: string; value: string; icon: React.ReactNode, unit?: string }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex items-center">
    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
      {icon}
    </div>
    <div className="ml-3 overflow-hidden">
      <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
      <p className="text-lg font-bold text-slate-800 truncate">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-slate-600">{unit}</span>}
      </p>
    </div>
  </div>
);


const StatisticsSummary: React.FC<StatisticsSummaryProps> = ({ stats }) => {
  return (
    <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">핵심 지표 요약</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard 
                title="총 회원" 
                value={stats.totalMembersCount.toLocaleString()} 
                unit="명"
                icon={<UserGroupIcon className="w-5 h-5" />} 
            />
            <StatCard 
                title="이달 신규 회원" 
                value={stats.newMembersCount.toLocaleString()} 
                unit="명"
                icon={<UserPlusIcon className="w-5 h-5" />} 
            />
            <StatCard 
                title="이달 재등록" 
                value={stats.returningMembersCount.toLocaleString()} 
                unit="명"
                icon={<ArrowPathIcon className="w-5 h-5" />} 
            />
            <StatCard 
                title="인당 평균 매출 (LTV)" 
                value={stats.averageLtv.toLocaleString()} 
                unit="원"
                icon={<CurrencyWonIcon className="w-5 h-5" />} 
            />
            <StatCard
                title="이달 총 수업"
                value={stats.totalSessionsThisMonth.toLocaleString()}
                unit="회"
                icon={<CalendarDaysIcon className="w-5 h-5" />}
            />
            <StatCard
                title="이달 수업 매출"
                value={stats.sessionRevenueThisMonth.toLocaleString()}
                unit="원"
                icon={<BanknotesIcon className="w-5 h-5" />}
            />
            <StatCard
                title="활성 회원당 평균 수업"
                value={stats.averageSessionsPerActiveMember.toFixed(1)}
                unit="회"
                icon={<ChartBarIcon className="w-5 h-5" />}
            />
            <StatCard
                title="주요 활동 요일"
                value={stats.busiestDayOfWeek}
                icon={<SparklesIcon className="w-5 h-5" />}
            />
        </div>
    </div>
  );
};

export default StatisticsSummary;