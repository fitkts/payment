
import React from 'react';
import type { TrackedMemberWithStats } from '../types';
import MoonIcon from './icons/MoonIcon';

interface LowEngagementListProps {
  members: TrackedMemberWithStats[];
}

const LowEngagementList: React.FC<LowEngagementListProps> = ({ members }) => {
  if (members.length === 0) {
    return (
        <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg h-full">
            <div className="flex">
                <div className="py-1">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="ml-3">
                <p className="text-sm font-medium text-green-800">훌륭합니다!</p>
                <p className="text-xs text-green-700 mt-1">모든 회원들이 꾸준히 참여하고 있습니다.</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div>
        <h3 className="text-base font-semibold text-slate-700 mb-2">수업 참여도 낮은 회원 (이탈 위험)</h3>
        <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <div className="flex">
            <div className="flex-shrink-0">
                <MoonIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">관리 필요 회원 ({members.length}명)</h3>
                <div className="mt-2 text-sm text-red-700">
                <p className="mb-2 text-xs">최근 30일간 수업 참여 기록이 없는 회원입니다. 안부 연락으로 동기를 부여해주세요.</p>
                <ul role="list" className="list-disc space-y-1 pl-5">
                    {members.map((member) => (
                    <li key={member.id}>
                        <span className="font-semibold">{member.name}</span>님 (잔여 {member.totalSessions - member.usedSessions}회, 마지막 수업: {member.lastSessionDate || '기록 없음'})
                    </li>
                    ))}
                </ul>
                </div>
            </div>
            </div>
        </div>
    </div>
  );
};

export default LowEngagementList;
