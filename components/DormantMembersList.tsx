import React from 'react';
import type { TrackedMemberWithStats } from '../types';
import MoonIcon from './icons/MoonIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

interface DormantMember extends TrackedMemberWithStats {
    remainingSessions: number;
}

interface DormantMembersListProps {
  members: DormantMember[];
  onMemberClick: (member: TrackedMemberWithStats) => void;
  onMoveToReRegister: (memberId: string) => void;
}

const DormantMembersList: React.FC<DormantMembersListProps> = ({ members, onMemberClick, onMoveToReRegister }) => {
  if (members.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-3">장기 미방문 회원 (6개월 이상)</h2>
      <p className="text-sm text-slate-500 -mt-2 mb-3">
        잔여 세션이 있지만 오랫동안 방문하지 않은 회원입니다. 재방문을 유도하는 캠페인을 고려해보세요.
      </p>
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {members.map(member => (
            <div 
              key={member.id} 
              className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-slate-300 cursor-pointer"
              onClick={() => onMemberClick(member)}
            >
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-base text-slate-800 truncate" title={member.name}>{member.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate" title={`마지막 방문: ${member.lastSessionDate} (잔여 ${member.remainingSessions}회)`}>
                  잔여 <span className="font-bold text-slate-600">{member.remainingSessions}회</span> / {member.lastSessionDate}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2 flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveToReRegister(member.id); }}
                  className="p-1.5 bg-amber-500 text-white rounded-full shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                  aria-label={`${member.name}님 재등록 예상으로 이동`}
                  title={`${member.name}님 재등록 예상으로 이동`}
                >
                  <ExclamationTriangleIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`${member.name}님에게 재방문 유도 메시지를 보내는 기능은 준비 중입니다.`);
                  }}
                  className="p-1.5 bg-slate-600 text-white rounded-full shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                  aria-label={`${member.name}님에게 연락하기`}
                  title={`${member.name}님에게 연락하기`}
                >
                  <MoonIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DormantMembersList;
