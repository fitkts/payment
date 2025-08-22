import React, { useState, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import CameraIcon from './icons/CameraIcon';
import MemberSearchInput from './MemberSearchInput';
import type { TrackedMember, TrackedMemberWithStats, SaleEntry } from '../types';
import { formatCurrency, parseCurrency } from '../utils';
import DocumentArrowUpIcon from './icons/DocumentArrowUpIcon';

interface AddSessionFormProps {
  onAddSession: (memberId: string, classCount: number, sessionDate: string) => void;
  disabled: boolean;
  trackedMembers: TrackedMemberWithStats[];
  allSales: SaleEntry[];
  selectedDate: Date;
  onOpenCamera: () => void;
  onOpenUploadModal: () => void;
}

const AddSessionForm: React.FC<AddSessionFormProps> = ({ onAddSession, disabled, trackedMembers, allSales, selectedDate, onOpenCamera, onOpenUploadModal }) => {
  const [sessionDate, setSessionDate] = useState('');
  const [selectedMember, setSelectedMember] = useState<TrackedMember | null>(null);
  const [classCount, setClassCount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [unitPriceInfo, setUnitPriceInfo] = useState<string | null>(null);

  useEffect(() => {
    const workMonthStartDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    const workMonthEndDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0); 
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    let newDefaultDate;
    if (today < workMonthStartDate) {
        newDefaultDate = workMonthStartDate;
    } else if (today > workMonthEndDate) {
        newDefaultDate = workMonthEndDate;
    } else {
        newDefaultDate = today;
    }
    
    setSessionDate(newDefaultDate.toISOString().split('T')[0]);
  }, [selectedDate]);
  
  const handleMemberSelected = (member: TrackedMember) => {
    setSelectedMember(member);

    const fullMemberStats = trackedMembers.find(m => m.id === member.id);
    if (!fullMemberStats) {
      setUnitPrice(formatCurrency(member.unitPrice));
      setUnitPriceInfo('회원 정보를 불러올 수 없습니다.');
      return;
    }

    const usedSessions = fullMemberStats.usedSessions;
    let sessionsToAccountFor = usedSessions;
    
    const memberSalesSorted = allSales
        .filter(s => s.memberId === member.id)
        .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());

    let activeSale: SaleEntry | null = null;
    for (const sale of memberSalesSorted) {
        if (sessionsToAccountFor < sale.classCount) {
            activeSale = sale;
            break;
        }
        sessionsToAccountFor -= sale.classCount;
    }

    if (activeSale) {
        setUnitPrice(formatCurrency(activeSale.unitPrice));
        setUnitPriceInfo(`※ ${activeSale.saleDate}에 등록된 세션에서 차감됩니다.`);
    } else {
        const latestSale = memberSalesSorted.length > 0 ? memberSalesSorted[memberSalesSorted.length - 1] : null;
        setUnitPrice(latestSale ? formatCurrency(latestSale.unitPrice) : '');
        setUnitPriceInfo('※ 잔여 세션이 없습니다. 신규 매출을 먼저 등록해주세요.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !sessionDate || !selectedMember || !classCount || !unitPrice) {
      alert('모든 필드를 입력해주세요. 목록에서 회원을 선택해야 합니다.');
      return;
    }
     if (unitPriceInfo && unitPriceInfo.includes('잔여 세션이 없습니다')) {
        alert('잔여 세션이 없는 회원은 세션을 추가할 수 없습니다. 매출 예상 탭에서 신규 매출을 먼저 등록해주세요.');
        return;
    }
    onAddSession(selectedMember.id, parseInt(classCount, 10), sessionDate);
    setSelectedMember(null);
    setClassCount('');
    setUnitPrice('');
    setUnitPriceInfo(null);
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-3">신규 세션 추가</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="md:col-span-1">
          <label htmlFor="sessionDate" className="block text-sm font-medium text-slate-600 mb-1">
            수업 일자
          </label>
           <input
            id="sessionDate"
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-200"
            disabled={disabled}
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="memberId" className="block text-sm font-medium text-slate-600 mb-1">
            회원 검색
          </label>
          <MemberSearchInput
            id="memberId"
            members={trackedMembers}
            onMemberSelected={handleMemberSelected}
            initialValue={selectedMember?.name || ''}
            placeholder="-- 회원 검색 --"
            disabled={disabled}
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="classCount" className="block text-sm font-medium text-slate-600 mb-1">
            수업 수
          </label>
          <input
            id="classCount"
            type="number"
            value={classCount}
            onChange={(e) => setClassCount(e.target.value)}
            placeholder="예: 1"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-200"
            disabled={disabled}
            min="0"
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="unitPrice" className="block text-sm font-medium text-slate-600 mb-1">
            단가 (원)
          </label>
          <input
            id="unitPrice"
            type="text"
            inputMode="numeric"
            value={unitPrice}
            readOnly
            placeholder="회원 선택 시 자동 입력"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none bg-slate-200 text-slate-500 cursor-not-allowed"
            disabled={disabled}
          />
          {unitPriceInfo && (
            <p className={`text-xs mt-1 ${unitPriceInfo.includes('잔여 세션이 없습니다') ? 'text-red-600' : 'text-slate-500'}`}>
                {unitPriceInfo}
            </p>
          )}
        </div>
        <div className="md:col-span-1">
           <label className="block text-sm font-medium text-slate-600 mb-1 invisible" aria-hidden="true">
             작업
           </label>
           <div className="flex items-center gap-2">
             <button
                type="submit"
                disabled={disabled}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                aria-label="세션 추가"
                title="세션 추가"
             >
                <PlusIcon className="w-5 h-5" />
             </button>
             <button
                type="button"
                onClick={onOpenCamera}
                disabled={disabled}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-slate-700 text-white font-semibold rounded-md shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                aria-label="카메라로 스캔"
                title="카메라로 스캔"
             >
                <CameraIcon className="w-5 h-5" />
             </button>
             <button
                type="button"
                onClick={onOpenUploadModal}
                disabled={disabled}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-teal-600 text-white font-semibold rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                aria-label="파일 업로드로 스캔"
                title="파일 업로드로 스캔"
             >
                <DocumentArrowUpIcon className="w-5 h-5" />
             </button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default AddSessionForm;