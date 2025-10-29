import React, { useState, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import MemberSearchInput from './MemberSearchInput';
import type { TrackedMember } from '../types';
import { formatCurrency, parseCurrency } from '../utils';

interface AddSaleFormProps {
  onAddSale: (memberId: string, classCount: number, amount: number, saleDate: string, paidAmount: number) => void;
  trackedMembers: TrackedMember[];
  selectedDate: Date;
}

const AddSaleForm: React.FC<AddSaleFormProps> = ({ onAddSale, trackedMembers, selectedDate }) => {
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState<TrackedMember | null>(null);
  const [classCount, setClassCount] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  useEffect(() => {
    setSaleDate(selectedDate.toISOString().split('T')[0]);
  }, [selectedDate]);

  const sessionCount = parseInt(classCount, 10) || 0;
  const totalAmount = parseCurrency(amount);
  const paidAmountValue = parseCurrency(paidAmount);
  const unitPrice = sessionCount > 0 ? Math.floor(totalAmount / sessionCount) : 0;
  const unpaidAmount = totalAmount - paidAmountValue;
  
  const handleMemberSelected = (member: TrackedMember) => {
    setSelectedMember(member);
    setClassCount('');
    setAmount('');
    setPaidAmount('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(formatCurrency(value));
    setPaidAmount(formatCurrency(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleDate || !selectedMember || !classCount || !amount) {
      alert('매출 일자, 회원, 수업 수, 총 금액을 모두 입력해주세요.');
      return;
    }
    onAddSale(selectedMember.id, sessionCount, totalAmount, saleDate, paidAmountValue);
    setSelectedMember(null);
    setClassCount('');
    setAmount('');
    setPaidAmount('');
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-8 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="md:col-span-1">
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
        <div className="md:col-span-2">
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
        <div className="md:col-span-1">
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
        <div className="md:col-span-1">
          <label htmlFor="saleAmount" className="block text-sm font-medium text-slate-600 mb-1">
            총 금액 (원)
          </label>
          <input
            id="saleAmount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={handleAmountChange}
            placeholder="예: 1,500,000"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="paidAmount" className="block text-sm font-medium text-slate-600 mb-1">
            결제 금액 (원)
          </label>
          <input
            id="paidAmount"
            type="text"
            inputMode="numeric"
            value={paidAmount}
            onChange={(e) => setPaidAmount(formatCurrency(e.target.value))}
            placeholder="예: 1,500,000"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
           {amount && <div className="text-xs text-slate-500 mt-1">미수금: {formatCurrency(unpaidAmount)}</div>}
        </div>
        <div className="md:col-span-1">
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
        <div className="md:col-span-1">
          <button
            type="submit"
            aria-label="매출 추가"
            title="매출 추가"
            className="h-8 w-full flex items-center justify-center bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSaleForm;