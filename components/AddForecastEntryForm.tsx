
import React, { useState } from 'react';
import PlusIcon from './icons/PlusIcon';
import MemberSearchInput from './MemberSearchInput';
import type { TrackedMember } from '../types';
import { formatCurrency, parseCurrency } from '../utils';

interface AddForecastEntryFormProps {
  onAddEntry: (memberName: string, classCount: number, unitPrice: number) => void;
  trackedMembers: TrackedMember[];
}

const AddForecastEntryForm: React.FC<AddForecastEntryFormProps> = ({ onAddEntry, trackedMembers }) => {
  const [memberName, setMemberName] = useState('');
  const [classCount, setClassCount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const handleMemberSelected = (member: TrackedMember) => {
    setMemberName(member.name);
    // Use the latest unit price from the member profile
    if (member.unitPrice) {
      setUnitPrice(formatCurrency(member.unitPrice));
    } else {
      setUnitPrice('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName || !classCount || !unitPrice) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    onAddEntry(memberName, parseInt(classCount, 10), parseCurrency(unitPrice));
    setMemberName('');
    setClassCount('');
    setUnitPrice('');
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-700 mb-3">신규 매출 항목 추가</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="forecastMemberName" className="block text-sm font-medium text-slate-600 mb-1">
            회원명
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
            예상 수업 수
          </label>
          <input
            id="forecastClassCount"
            type="number"
            value={classCount}
            onChange={(e) => setClassCount(e.target.value)}
            placeholder="예: 20"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            min="0"
          />
        </div>
        <div className="col-span-1 md:col-span-1">
          <label htmlFor="forecastUnitPrice" className="block text-sm font-medium text-slate-600 mb-1">
            단가 (원)
          </label>
          <input
            id="forecastUnitPrice"
            type="text"
            inputMode="numeric"
            value={unitPrice}
            onChange={(e) => setUnitPrice(formatCurrency(e.target.value))}
            placeholder="예: 50,000"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="col-span-1 md:col-span-1">
          <button
            type="submit"
            className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
