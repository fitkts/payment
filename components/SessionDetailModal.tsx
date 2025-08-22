
import React, { useMemo } from 'react';
import type { MemberSession, ToastInfo } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency, parseCurrency } from '../utils';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberId: string;
  sessions: MemberSession[];
  onUpdateSession: (id: string, field: keyof MemberSession, value: string | number) => void;
  onDeleteSession: (id: string) => void;
  onAddSession: (memberId: string, classCount: number, sessionDate: string, unitPrice: number) => void;
  onShowToast: React.Dispatch<React.SetStateAction<ToastInfo>>;
}

type ExpandedSession = MemberSession & {
    originalId: string;
};

const getDayOfWeek = (dateString: string): string => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return '';
        }
        return days[date.getDay()];
    } catch (e) {
        return '';
    }
};

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ isOpen, onClose, memberName, memberId, sessions, onUpdateSession, onDeleteSession, onAddSession, onShowToast }) => {
  if (!isOpen) return null;

  const expandedSessions: ExpandedSession[] = useMemo(() => {
    const result: ExpandedSession[] = [];
    sessions.forEach(session => {
        for (let i = 0; i < (Number(session.classCount) || 0); i++) {
            result.push({
                ...session,
                id: `${session.id}-${i}`,
                originalId: session.id,
                classCount: 1,
            });
        }
    });
    return result.sort((a,b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
  }, [sessions]);


  const handleDateChange = (expandedSession: ExpandedSession, newDate: string) => {
    const originalSession = sessions.find(s => s.id === expandedSession.originalId);
    if (!originalSession || !newDate) return;

    onAddSession(memberId, 1, newDate, expandedSession.unitPrice);

    if (originalSession.classCount > 1) {
        onUpdateSession(originalSession.id, 'classCount', originalSession.classCount - 1);
    } else {
        onDeleteSession(originalSession.id);
    }
  };

  const handlePriceChange = (expandedSession: ExpandedSession, newPriceStr: string) => {
    onUpdateSession(expandedSession.originalId, 'unitPrice', parseCurrency(newPriceStr));
  };

  const handleDelete = (expandedSession: ExpandedSession) => {
    const originalSession = sessions.find(s => s.id === expandedSession.originalId);
    if (!originalSession) return;
    
    if (originalSession.classCount > 1) {
        onUpdateSession(originalSession.id, 'classCount', originalSession.classCount - 1);
    } else {
        onDeleteSession(originalSession.id);
    }
    onShowToast({ message: '수업 세션이 삭제되었습니다.', type: 'success' });
  };


  const totalClassCount = expandedSessions.length;
  const totalRevenue = expandedSessions.reduce((acc, session) => acc + (Number(session.unitPrice) || 0), 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{memberName}님 수업 상세 내역</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto bg-white rounded-lg shadow-inner border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="w-16 px-3 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">번호</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">수업일자</th>
                  <th scope="col" className="w-16 px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">요일</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">단가 (원)</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">합계 (원)</th>
                  <th scope="col" className="relative px-3 py-3">
                    <span className="sr-only">삭제</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {expandedSessions.map((session, index) => (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500 text-center font-medium">{index + 1}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="date"
                        value={session.sessionDate}
                        onChange={(e) => handleDateChange(session, e.target.value)}
                        className="w-36 px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-slate-800 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                      {getDayOfWeek(session.sessionDate)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCurrency(session.unitPrice)}
                        onChange={(e) => handlePriceChange(session, e.target.value)}
                        className="w-28 px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-slate-800 text-sm"
                        step="1000"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 font-semibold">
                      {(session.unitPrice).toLocaleString()} 원
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(session)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100"
                        aria-label={`${memberName} 세션 삭제`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                  <tr className="text-sm font-semibold text-slate-700">
                      <td colSpan={3} className="px-3 py-3 text-center">합계</td>
                      <td className="px-3 py-3 whitespace-nowrap">{totalClassCount} 회</td>
                      <td className="px-3 py-3 whitespace-nowrap font-bold text-slate-800">
                          {totalRevenue.toLocaleString()} 원
                      </td>
                      <td className="px-3 py-3"></td>
                  </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <footer className="sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 border-t border-slate-200 flex justify-end">
            <button 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
                닫기
            </button>
        </footer>
      </div>
    </div>
  );
};

export default SessionDetailModal;