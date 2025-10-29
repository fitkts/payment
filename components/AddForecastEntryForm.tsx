import React, { useState, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import MemberSearchInput from './MemberSearchInput';
import type { TrackedMember } from '../types';
import { formatCurrency, parseCurrency } from '../utils';

interface AddForecastEntryFormProps {
  onAddEntry: (memberName: string, classCount: number, amount: number, forecastDate: string) => void;
  trackedMembers: TrackedMember[];
  selectedDate: Date;
}

const getFirstDayOfSelectedMonth = (date: Date) => {
    const selectedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    return selectedMonth.toISOString().split('T')[0];
};

const AddForecastEntryForm: React.FC<AddForecastEntryFormProps> = ({ onAddEntry, trackedMembers, selectedDate }) => {
  const [memberName, setMemberName] = useState('');
  const [forecastDate, setForecastDate] = useState(getFirstDayOfSelectedMonth(selectedDate));
  const [classCount, setClassCount] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setForecastDate(getFirstDayOfSelectedMonth(selectedDate));
  }, [selectedDate]);

  const sessionCount = parseInt(classCount, 10) || 0;
  const totalAmount = parseCurrency(amount);
  const unitPrice = sessionCount > 0 ? Math.floor(totalAmount / sessionCount) : 0;

  const handleMemberSelected = (member: TrackedMember) => {
    setMemberName(member.name);
    setClassCount('');
    setAmount('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forecastDate || !memberName || !classCount || !amount) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    onAddEntry(memberName, sessionCount, totalAmount, forecastDate);
    setMemberName('');
    setClassCount('');
    setAmount('');
    setForecastDate(getFirstDayOfSelectedMonth(selectedDate));
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-3">신규 매출 항목 추가</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="md:col-span-1">
          <label htmlFor="forecastDate" className="block text-sm font-medium text-slate-600 mb-1">
            예상 일자
          </label>
          <input
            id="forecastDate"
            type="date"
            value={forecastDate}
            onChange={(e) => setForecastDate(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="forecastMemberName" className="block text-sm font-medium text-slate-600 mb-1">
            회원명/항목
          </label>
          <MemberSearchInput
            id="forecastMemberName"
            members={trackedMembers}
            onMemberSelected={handleMemberSelected}
            onCustomInput={setMemberName}
            initialValue={memberName}
            placeholder="회원 검색 또는 항목 입력"
          />
        </div>
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="forecastClassCount" className="block text-sm font-medium text-slate-600 mb-1">
            수업 수
          </label>
          <input
            id="forecastClassCount"
            type="number"
            value={classCount}
            onChange={(e) => setClassCount(e.target.value)}
            placeholder="예: 20"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            min="0"
          />
        </div>
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="forecastAmount" className="block text-sm font-medium text-slate-600 mb-1">
            총 금액 (원)
          </label>
          <input
            id="forecastAmount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatCurrency(e.target.value))}
            placeholder="예: 1,000,000"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="forecastUnitPrice" className="block text-sm font-medium text-slate-600 mb-1">
            단가 (자동)
          </label>
          <input
            id="forecastUnitPrice"
            type="text"
            value={formatCurrency(unitPrice)}
            readOnly
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none bg-slate-200 text-slate-500 cursor-not-allowed"
          />
        </div>
        <div className="col-span-1 md:col-span-1">
          <button
            type="submit"
            className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-1 px-4 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            추가하기
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddForecastEntryForm;