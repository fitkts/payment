
import React from 'react';
import type { TrackedMemberWithStats } from '../types';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

interface ReRegistrationListProps {
  members: TrackedMemberWithStats[];
}

const ReRegistrationList: React.FC<ReRegistrationListProps> = ({ members }) => {
  if (members.length === 0) {
    return (
       <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <div className="flex">
            <div className="py-1">
               <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">모든 회원의 잔여 횟수가 충분합니다.</p>
              <p className="text-xs text-green-700">재등록이 필요한 회원이 없습니다.</p>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-bold text-orange-800">재등록 필요 회원</h3>
            <div className="mt-2 text-sm text-orange-700">
              <ul role="list" className="list-disc space-y-1 pl-5">
                {members.map((member) => (
                  <li key={member.id}>
                    <span className="font-semibold">{member.name}</span>님 (잔여 {member.cumulativeTotalSessions - member.usedSessions}회)
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

export default ReRegistrationList;
