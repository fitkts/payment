

import React, { useState } from 'react';
import type { TrackedMemberWithStats, MemberStat, SalaryStatisticsData, DateRange, CalendarEvent } from '../types';
import ReRegistrationList from '../components/ReRegistrationList';
import StatisticsSummary from '../components/StatisticsSummary';
import LowEngagementList from '../components/LowEngagementList';
import MemberRankingLists from '../components/MemberRankingLists';
import SalaryStatistics from '../components/SalaryStatistics';
import StatisticsFilter from '../components/StatisticsFilter';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import ChartPieIcon from '../components/icons/ChartPieIcon';
import PersonalGrowthCharts from '../components/PersonalGrowthCharts';
import Calendar from '../components/Calendar';
import CalendarDaysIcon from '../components/icons/CalendarDaysIcon';

interface StatisticsProps {
    stats: {
        lowEngagementMembers: TrackedMemberWithStats[];
        newMembersCount: number;
        returningMembersCount: number;
        averageLtv: number;
        totalMembersCount: number;
        totalSessionsThisMonth: number;
        sessionRevenueThisMonth: number;
        averageSessionsPerActiveMember: number;
        busiestDayOfWeek: string;
        topAttendantsThisMonth: MemberStat[];
        mostImprovedMember: MemberStat;
        attendanceDropMember: MemberStat;
        topRegistrantAllTime: MemberStat;
        mostFrequentRegistrant: MemberStat;
        salaryStatisticsData: SalaryStatisticsData;
    };
    membersToReRegister: TrackedMemberWithStats[];
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
    salaryDateRange: DateRange;
    onSalaryDateRangeChange: (range: DateRange) => void;
    calendarEvents: CalendarEvent[];
}

type SubTab = 'member' | 'my';

const Statistics: React.FC<StatisticsProps> = ({ stats, membersToReRegister, dateRange, onDateRangeChange, salaryDateRange, onSalaryDateRangeChange, calendarEvents }) => {
    
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('member');
    
    const periodString = `${dateRange.start.toLocaleDateString('ko-KR')} - ${dateRange.end.toLocaleDateString('ko-KR')}`;

    const getSubTabClass = (tabName: SubTab) => {
        return activeSubTab === tabName
          ? 'bg-blue-600 text-white'
          : 'bg-white text-slate-600 hover:bg-slate-100';
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-8">
            <nav className="flex justify-center p-1 bg-slate-200 rounded-xl shadow-inner">
                <button
                    onClick={() => setActiveSubTab('member')}
                    className={`w-1/2 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${getSubTabClass('member')}`}
                >
                    회원 통계 분석
                </button>
                <button
                    onClick={() => setActiveSubTab('my')}
                    className={`w-1/2 py-2.5 px-4 text-center font-semibold rounded-lg transition-all duration-300 ${getSubTabClass('my')}`}
                >
                    나의 통계 분석
                </button>
            </nav>

            {activeSubTab === 'member' && (
                <div className="space-y-12">
                    <section className="space-y-8">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mt-1">
                                <UserGroupIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">기간별 회원 분석</h2>
                                <p className="text-slate-600 mt-1">
                                    아래 필터를 사용하여 특정 기간의 회원 데이터를 분석하고 비즈니스 성장을 위한 인사이트를 확인하세요.
                                </p>
                            </div>
                        </div>

                        <StatisticsFilter dateRange={dateRange} setDateRange={onDateRangeChange} />
                        
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mt-1">
                                <CalendarDaysIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">월간 이벤트 캘린더</h2>
                                <p className="text-slate-600 mt-1">
                                    선택된 기간의 주요 이벤트를 한 눈에 파악하세요.
                                </p>
                            </div>
                        </div>
                        <Calendar dateRange={dateRange} events={calendarEvents} />


                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                            <p className="text-sm font-medium text-blue-700">
                                분석 기간: <span className="font-bold">{periodString}</span>
                            </p>
                        </div>
                        
                        <StatisticsSummary stats={stats} />
                        <MemberRankingLists stats={stats} />
                    </section>
            
                    <hr className="my-4 border-t-2 border-slate-200" />
            
                    <section>
                         <h2 className="text-2xl font-bold text-slate-800 mb-4">회원 상태 알림</h2>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <LowEngagementList members={stats.lowEngagementMembers} />
                            <ReRegistrationList members={membersToReRegister} />
                         </div>
                         <p className="text-xs text-slate-500 mt-4 text-center">
                            * '수업 참여도 낮은 회원'은 위에서 선택한 기간에 따라 필터링되며, '재등록 필요 회원'은 전체 기간 기준입니다.
                         </p>
                    </section>
                </div>
            )}
            
            {activeSubTab === 'my' && (
                <section className="space-y-8">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mt-1">
                            <ChartPieIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">기간별 급여 분석</h2>
                            <p className="text-slate-600 mt-1">
                                기간 필터를 사용하여 특정 시점을 기준으로 과거 급여 추이를 분석합니다. 차트 및 표는 선택된 종료일 이전의 데이터를 보여줍니다.
                            </p>
                        </div>
                    </div>
                    <StatisticsFilter dateRange={salaryDateRange} setDateRange={onSalaryDateRangeChange} />
                    <PersonalGrowthCharts salaryStats={stats.salaryStatisticsData} />
                    <SalaryStatistics salaryStats={stats.salaryStatisticsData} />
                </section>
            )}
        </div>
    );
};

export default Statistics;
