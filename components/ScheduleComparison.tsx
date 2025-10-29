import React from 'react';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

interface ScheduleComparisonProps {
  planned: number;
  actual: number;
}

const ScheduleComparison: React.FC<ScheduleComparisonProps> = ({ planned, actual }) => {
  const achievementRate = planned > 0 ? (actual / planned) * 100 : 0;
  const progressBarWidth = Math.min(achievementRate, 100);

  let progressColorClass = 'bg-blue-600';
  if (achievementRate < 50) {
    progressColorClass = 'bg-red-500';
  } else if (achievementRate < 90) {
    progressColorClass = 'bg-yellow-500';
  } else {
    progressColorClass = 'bg-green-500';
  }

  return (
    <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <ClipboardDocumentListIcon className="w-6 h-6" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-indigo-800">이달 수업 성과 비교</h2>
            <p className="text-sm text-indigo-700 mt-1">
                '주간 시간표'의 확정된 수업과 실제 진행된 수업을 비교한 통계입니다.
            </p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">월간 계획 수업</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{planned}<span className="text-base font-normal">회</span></p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">월간 실제 수업</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{actual}<span className="text-base font-normal">회</span></p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500">수업 달성률</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{achievementRate.toFixed(1)}<span className="text-base font-normal">%</span></p>
        </div>
      </div>

      <div className="mt-4">
        <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div 
                className={`${progressColorClass} h-2.5 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${progressBarWidth}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleComparison;