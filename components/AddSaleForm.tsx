
import React, { useState } from 'react';
import PlusIcon from './icons/PlusIcon';
import MemberSearchInput from './MemberSearchInput';
import type { TrackedMember } from '../types';
import { formatCurrency, parseCurrency } from '../utils';

interface AddSaleFormProps {
  onAddSale: (memberId: string, classCount: number, amount: number, saleDate: string) => void;
  trackedMembers: TrackedMember[];
}

const AddSaleForm: React.FC<AddSaleFormProps> = ({ onAddSale, trackedMembers }) => {
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState<TrackedMember | null>(null);
  const [classCount, setClassCount] = useState('');
  const [amount, setAmount] = useState('');

  const unitPrice = (parseInt(classCount, 10) || 0) > 0 ? Math.floor(parseCurrency(amount) / parseInt(classCount, 10)) : 0;
  
  const handleMemberSelected = (member: TrackedMember) => {
    setSelectedMember(member);
    // When a member is selected, we could pre-fill based on their last package,
    // but since the new flow is amount-first, we'll clear it for a fresh entry.
    setClassCount('');
    setAmount('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleDate || !selectedMember || !classCount || !amount) {
      alert('모든 필드를 입력해주세요. 목록에서 회원을 선택해야 합니다.');
      return;
    }
    onAddSale(selectedMember.id, parseInt(classCount, 10), parseCurrency(amount), saleDate);
    setSelectedMember(null);
    setClassCount('');
    setAmount('');
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="col-span-1">
          <label htmlFor="saleDate" className="block text-sm font-medium text-slate-600 mb-1">
            매출 일자
          </label>
          <input
            id="saleDate"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="saleMemberId" className="block text-sm font-medium text-slate-600 mb-1">
            회원 검색
          </label>
          <MemberSearchInput
            id="saleMemberId"
            members={trackedMembers}
            onMemberSelected={handleMemberSelected}
            initialValue={selectedMember?.name || ''}
            placeholder="-- 회원 검색 --"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="saleClassCount" className="block text-sm font-medium text-slate-600 mb-1">
            수업 수
          </label>
          <input
            id="saleClassCount"
            type="number"
            value={classCount}
            onChange={(e) => setClassCount(e.target.value)}
            placeholder="예: 30"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            min="0"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="saleAmount" className="block text-sm font-medium text-slate-600 mb-1">
            총 금액 (원)
          </label>
          <input
            id="saleAmount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatCurrency(e.target.value))}
            placeholder="예: 1,500,000"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="saleUnitPrice" className="block text-sm font-medium text-slate-600 mb-1">
            단가 (자동)
          </label>
          <input
            id="saleUnitPrice"
            type="text"
            value={formatCurrency(unitPrice)}
            readOnly
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none bg-slate-200 text-slate-500 cursor-not-allowed"
          />
        </div>
        <div className="col-span-1">
          <button
            type="submit"
            aria-label="매출 추가"
            title="매출 추가"
            className="h-8 w-8 ml-auto flex items-center justify-center bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSaleForm;
