
import React from 'react';
import type { TrackedMemberWithStats, ForecastEntry } from '../types';
import PlusIcon from './icons/PlusIcon';

interface ReRegistrationForecastListProps {
  members: TrackedMemberWithStats[];
  forecastEntries: ForecastEntry[];
  onAddMemberToForecast: (memberName: string, classCount: number, amount: number) => void;
}

const ReRegistrationForecastList: React.FC<ReRegistrationForecastListProps> = ({
  members,
  forecastEntries,
  onAddMemberToForecast,
}) => {
  if (members.length === 0) {
    return null; // 재등록 회원이 없으면 아무것도 렌더링하지 않음
  }

  const handleAddClick = (member: TrackedMemberWithStats) => {
    const unitPrice = member.unitPrice || 50000;
    const amount = member.totalSessions * unitPrice;
    onAddMemberToForecast(member.name, member.totalSessions, amount);
  };

  const addedMemberNames = new Set(forecastEntries.map(entry => entry.memberName));

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-3">재등록 예상 회원</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <ul className="divide-y divide-amber-200">
          {members.map(member => {
            const isAdded = addedMemberNames.has(member.name);
            const remainingSessions = member.cumulativeTotalSessions - member.usedSessions;

            return (
              <li key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                  <p className="text-xs text-slate-500">
                    잔여 {remainingSessions}회 / 최근 등록 {member.totalSessions}회
                  </p>
                </div>
                {isAdded ? (
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    ✓ 추가됨
                  </span>
                ) : (
                  <button
                    onClick={() => handleAddClick(member)}
                    className="flex items-center justify-center bg-amber-500 text-white font-semibold text-sm py-1.5 px-3 rounded-md shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-1.5" />
                    매출에 추가
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ReRegistrationForecastList;