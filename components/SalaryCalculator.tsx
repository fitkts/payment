import React, { useState, useMemo } from 'react';
import { TAX_RATE } from '../constants';
import type { MemberSession, TrackedMemberWithStats, ToastInfo, SaleEntry } from '../types';
import AddSessionForm from './AddSessionForm';
import SessionTable from './SessionTable';
import SalarySummary from './SalarySummary';
import SalaryConfigForm from './SalaryConfigForm';
import MonthYearPicker from './MonthYearPicker';
import SessionDetailModal from './SessionDetailModal';
import CameraScanModal from './CameraScanModal';
import FileUploadModal from './FileUploadModal';
import CogIcon from './icons/CogIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { formatCurrency } from '../utils';
import ScheduleComparison from './ScheduleComparison';

interface SalaryCalculatorProps {
  sessions: MemberSession[];
  monthlySales: SaleEntry[];
  allSales: SaleEntry[];
  membersWithStats: TrackedMemberWithStats[];
  onAddSession: (memberId: string, classCount: number, sessionDate: string, unitPrice?: number) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, field: keyof MemberSession, value: string | number) => void;
  onShowToast: React.Dispatch<React.SetStateAction<ToastInfo>>;
  taxEnabled: boolean;
  onToggleTax: () => void;
  insurancesEnabled: boolean;
  onToggleInsurances: () => void;
  baseSalary: number;
  setBaseSalary: (value: number) => void;
  incentiveRate: number;
  setIncentiveRate: (value: number) => void;
  performanceBonus: number;
  setPerformanceBonus: (value: number) => void;
  salesIncentiveRate: number;
  setSalesIncentiveRate: (value: number) => void;
  onOpenSettings: () => void;
  plannedMonthlySessions: number;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isLoading: boolean;
}

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({
  sessions,
  monthlySales,
  allSales,
  membersWithStats,
  onAddSession,
  onDeleteSession,
  onUpdateSession,
  onShowToast,
  taxEnabled,
  onToggleTax,
  insurancesEnabled,
  onToggleInsurances,
  baseSalary,
  setBaseSalary,
  incentiveRate,
  setIncentiveRate,
  performanceBonus,
  setPerformanceBonus,
  salesIncentiveRate,
  setSalesIncentiveRate,
  onOpenSettings,
  plannedMonthlySessions,
  selectedDate,
  onDateChange,
  isLoading,
}) => {
    const [selectedMemberForDetails, setSelectedMemberForDetails] = useState<{id: string; name: string} | null>(null);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
    const [isConfigExpanded, setIsConfigExpanded] = useState(false);


    const handleViewDetails = (memberId: string, memberName: string) => {
        setSelectedMemberForDetails({ id: memberId, name: memberName });
    };
    
    const handleCloseDetailModal = () => {
        setSelectedMemberForDetails(null);
    };

    const workMonthDate = useMemo(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1), [selectedDate]);

    const actualMonthlySessions = useMemo(() => {
        return sessions.reduce((acc, session) => acc + (session.classCount || 0), 0);
    }, [sessions]);

    const workMonthSalesTotal = useMemo(() => {
        return monthlySales.reduce((acc, sale) => acc + sale.amount, 0);
    }, [monthlySales]);

    const sessionsForModal = useMemo(() => {
        if (!selectedMemberForDetails) return [];
        return sessions
            .filter(s => s.memberId === selectedMemberForDetails.id)
            .sort((a,b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
    }, [sessions, selectedMemberForDetails]);

    const handleAddScannedSessions = (scannedSessions: { memberId: string, sessionDate: string }[]) => {
      let addedCount = 0;
      scannedSessions.forEach(session => {
        onAddSession(session.memberId, 1, session.sessionDate);
        addedCount++;
      });
      setIsCameraModalOpen(false);
      setIsFileUploadModalOpen(false);
      if (addedCount > 0) {
        onShowToast({ message: `${addedCount}개의 세션이 성공적으로 추가되었습니다.`, type: 'success' });
      } else {
        onShowToast({ message: '추가된 세션이 없습니다.', type: 'warning' });
      }
    };
    
    return (
      <>
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
           <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="text-lg font-bold text-slate-700">
                  정산 연월 선택 (지급 기준)
              </label>
              <MonthYearPicker
                  selectedDate={selectedDate}
                  onDateChange={onDateChange}
              />
          </div>
          
          <ScheduleComparison 
            planned={plannedMonthlySessions} 
            actual={actualMonthlySessions} 
          />
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-4 text-slate-600">월별 데이터를 불러오는 중입니다...</span>
            </div>
           ) : (
           <>
              <div className="mb-6">
                <div className="border border-slate-200 rounded-lg">
                    <div
                        className="flex justify-between items-center bg-slate-50 p-4 rounded-t-lg cursor-pointer hover:bg-slate-100 transition-colors"
                        onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsConfigExpanded(!isConfigExpanded); }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={isConfigExpanded}
                        aria-controls="salary-config-form"
                    >
                        <div>
                            <h2 className="text-xl font-semibold text-slate-700">급여 조건 설정</h2>
                            {!isConfigExpanded && (
                            <p className="text-sm text-slate-500 mt-1 hidden sm:block">
                                기본급: {formatCurrency(baseSalary)}, 수업 인센티브: {incentiveRate}%, 매출 인센티브: {salesIncentiveRate}%
                            </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                            onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
                            className="p-2 rounded-full text-slate-600 hover:bg-slate-200 focus-visible:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="기본값 설정"
                            title="기본값 설정"
                            >
                            <CogIcon className="w-5 h-5" />
                            </button>
                            <span className="p-1">
                            {isConfigExpanded ? <ChevronUpIcon className="w-5 h-5 text-slate-600" /> : <ChevronDownIcon className="w-5 h-5 text-slate-600" />}
                            </span>
                        </div>
                    </div>

                    <div
                        id="salary-config-form"
                        className={`transition-[max-height,padding] duration-500 ease-in-out overflow-hidden ${isConfigExpanded ? 'max-h-96' : 'max-h-0'}`}
                    >
                        <div className={`bg-slate-50 p-4 border-t border-slate-200 ${!isConfigExpanded ? 'hidden' : ''}`}>
                            <SalaryConfigForm
                                baseSalary={baseSalary}
                                setBaseSalary={setBaseSalary}
                                incentiveRate={incentiveRate}
                                setIncentiveRate={setIncentiveRate}
                                performanceBonus={performanceBonus}
                                setPerformanceBonus={setPerformanceBonus}
                                monthlySales={workMonthSalesTotal}
                                salesIncentiveRate={salesIncentiveRate}
                                setSalesIncentiveRate={setSalesIncentiveRate}
                            />
                        </div>
                    </div>
                </div>
              </div>
              
              <AddSessionForm 
                  onAddSession={onAddSession} 
                  disabled={false} 
                  trackedMembers={membersWithStats}
                  allSales={allSales}
                  selectedDate={selectedDate}
                  onOpenCamera={() => setIsCameraModalOpen(true)}
                  onOpenUploadModal={() => setIsFileUploadModalOpen(true)}
              />

              <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-700 mb-3">수업 세션 목록 (업무 기준)</h2>
                <SessionTable 
                  sessions={sessions} 
                  onViewDetails={handleViewDetails}
                />
              </div>

              <SalarySummary 
                sessions={sessions}
                taxRate={TAX_RATE}
                taxEnabled={taxEnabled}
                onToggleTax={onToggleTax}
                insurancesEnabled={insurancesEnabled}
                onToggleInsurances={onToggleInsurances}
                baseSalary={baseSalary}
                incentiveRate={incentiveRate}
                performanceBonus={performanceBonus}
                monthlySales={workMonthSalesTotal}
                salesIncentiveRate={salesIncentiveRate}
              />
            </>
          )}
        </div>
        {selectedMemberForDetails && (
            <SessionDetailModal 
                isOpen={!!selectedMemberForDetails}
                onClose={handleCloseDetailModal}
                memberName={selectedMemberForDetails.name}
                memberId={selectedMemberForDetails.id}
                sessions={sessionsForModal}
                onUpdateSession={onUpdateSession}
                onDeleteSession={onDeleteSession}
                onAddSession={onAddSession}
                onShowToast={onShowToast}
            />
        )}
        {isCameraModalOpen && (
            <CameraScanModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onAddSessions={handleAddScannedSessions}
                trackedMembers={membersWithStats}
                workMonthDate={workMonthDate}
            />
        )}
        {isFileUploadModalOpen && (
            <FileUploadModal
                isOpen={isFileUploadModalOpen}
                onClose={() => setIsFileUploadModalOpen(false)}
                onAddSessions={handleAddScannedSessions}
                trackedMembers={membersWithStats}
                workMonthDate={workMonthDate}
            />
        )}
      </>
    );
}

export default SalaryCalculator;