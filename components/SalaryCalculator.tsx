

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

interface SalaryCalculatorProps {
  sessions: MemberSession[];
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
}

const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({
  sessions,
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
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedMemberForDetails, setSelectedMemberForDetails] = useState<{id: string; name: string} | null>(null);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);

    const handleViewDetails = (memberId: string, memberName: string) => {
        setSelectedMemberForDetails({ id: memberId, name: memberName });
    };
    
    const handleCloseDetailModal = () => {
        setSelectedMemberForDetails(null);
    };

    const workMonthDate = useMemo(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1), [selectedDate]);

    const filteredSessions = useMemo(() => {
        const workYear = workMonthDate.getFullYear();
        const workMonth = workMonthDate.getMonth();

        return sessions.filter(session => {
            const [sYear, sMonth] = session.sessionDate.split('-').map(Number);
            return sYear === workYear && (sMonth - 1) === workMonth;
        });
    }, [sessions, workMonthDate]);

    const workMonthSalesTotal = useMemo(() => {
        const workYear = workMonthDate.getFullYear();
        const workMonth = workMonthDate.getMonth();

        return allSales
            .filter(sale => {
                const saleDate = new Date(sale.saleDate);
                return saleDate.getFullYear() === workYear && saleDate.getMonth() === workMonth;
            })
            .reduce((acc, sale) => acc + sale.amount, 0);
    }, [allSales, workMonthDate]);

    const sessionsForModal = useMemo(() => {
        if (!selectedMemberForDetails) return [];
        return filteredSessions
            .filter(s => s.memberId === selectedMemberForDetails.id)
            .sort((a,b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
    }, [filteredSessions, selectedMemberForDetails]);

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
          <div className="mb-8">
              <label className="block text-lg font-bold text-slate-700 mb-2">
                  정산 연월 선택 (지급 기준)
              </label>
              <MonthYearPicker
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
              />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold text-slate-700">급여 조건 설정</h2>
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
                aria-label="기본값 설정"
                title="기본값 설정"
              >
                <CogIcon className="w-5 h-5" />
                <span>설정</span>
              </button>
            </div>
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
              sessions={filteredSessions} 
              onViewDetails={handleViewDetails}
            />
          </div>

          <SalarySummary 
            sessions={filteredSessions}
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