import React from 'react';
import type { TrackedMemberWithStats, ForecastEntry } from '../types';
import PlusIcon from './icons/PlusIcon';
import MoonIcon from './icons/MoonIcon';

interface ReRegistrationForecastListProps {
  members: TrackedMemberWithStats[];
  forecastEntries: ForecastEntry[];
  onAddMemberToForecast: (memberName: string, classCount: number, amount: number) => void;
  onMemberClick: (member: TrackedMemberWithStats) => void;
  onMoveToDormant: (memberId: string) => void;
}

const ReRegistrationForecastList: React.FC<ReRegistrationForecastListProps> = ({
  members,
  forecastEntries,
  onAddMemberToForecast,
  onMemberClick,
  onMoveToDormant,
}) => {
  if (members.length === 0) {
    return null; // 재등록 회원이 없으면 아무것도 렌더링하지 않음
  }

  const handleAddClick = (member: TrackedMemberWithStats) => {
    const unitPrice = member.unitPrice || 50000;
    const totalSessions = member.totalSessions || 0;
    const amount = totalSessions * unitPrice;
    onAddMemberToForecast(member.name, totalSessions, amount);
  };

  const addedMemberNames = new Set(forecastEntries.map(entry => entry.memberName));

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-3">재등록 예상 회원</h2>
      <p className="text-sm text-slate-500 -mt-2 mb-3">
        최근 5개월 내 활동 기록이 있고, 잔여 세션이 3회 이하인 회원 목록입니다.
      </p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {members.map(member => {
            const isAdded = addedMemberNames.has(member.name);
            const remainingSessions = member.cumulativeTotalSessions - member.usedSessions;

            return (
              <div 
                key={member.id} 
                className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-amber-300 cursor-pointer"
                onClick={() => onMemberClick(member)}
              >
                <div className="flex-grow overflow-hidden">
                  <p className="font-semibold text-base text-slate-800 truncate" title={member.name}>{member.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    잔여 <span className="font-bold text-red-600">{remainingSessions}회</span> / 등록 {member.totalSessions}회
                  </p>
                </div>
                <div className="flex-shrink-0 ml-2 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveToDormant(member.id); }}
                    className="p-1.5 bg-slate-500 text-white rounded-full shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                    aria-label={`${member.name}님 장기 미방문으로 이동`}
                    title={`${member.name}님 장기 미방문으로 이동`}
                  >
                    <MoonIcon className="w-4 h-4" />
                  </button>
                  {isAdded ? (
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      ✓ 추가됨
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddClick(member); }}
                      className="p-1.5 bg-amber-500 text-white rounded-full shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                      aria-label={`${member.name}님 매출에 추가`}
                      title={`${member.name}님 매출에 추가`}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReRegistrationForecastList;
