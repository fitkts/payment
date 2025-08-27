import React, { useState } from 'react';
import PlusIcon from './icons/PlusIcon';
import { formatCurrency, parseCurrency } from '../utils';

interface AddTrackedMemberFormProps {
  onAddMember: (name: string, totalSessions: number, unitPrice: number) => void;
}

const AddTrackedMemberForm: React.FC<AddTrackedMemberFormProps> = ({ onAddMember }) => {
  const [name, setName] = useState('');
  const [totalSessions, setTotalSessions] = useState('');
  const [amount, setAmount] = useState('');

  const unitPrice = (parseInt(totalSessions, 10) || 0) > 0 ? Math.floor(parseCurrency(amount) / parseInt(totalSessions, 10)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalSessions || !amount) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    onAddMember(name, parseInt(totalSessions, 10), unitPrice);
    setName('');
    setTotalSessions('');
    setAmount('');
  };

  return (
    <div className="mb-6 mt-8">
      <h2 className="text-xl font-semibold text-slate-700 mb-3">신규 회원 등록</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="col-span-1">
          <label htmlFor="trackedMemberName" className="block text-sm font-medium text-slate-600 mb-1">
            회원명
          </label>
          <input
            id="trackedMemberName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 오건강"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="totalSessions" className="block text-sm font-medium text-slate-600 mb-1">
            등록 횟수
          </label>
          <input
            id="totalSessions"
            type="number"
            value={totalSessions}
            onChange={(e) => setTotalSessions(e.target.value)}
            placeholder="예: 30"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            min="0"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="amountMember" className="block text-sm font-medium text-slate-600 mb-1">
            총 금액 (원)
          </label>
          <input
            id="amountMember"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatCurrency(e.target.value))}
            placeholder="예: 1,500,000"
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="unitPriceMember" className="block text-sm font-medium text-slate-600 mb-1">
            단가 (자동)
          </label>
          <input
            id="unitPriceMember"
            type="text"
            value={formatCurrency(unitPrice)}
            readOnly
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none bg-slate-200 text-slate-500 cursor-not-allowed"
          />
        </div>
        <div className="col-span-1">
          <button
            type="submit"
            className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-1 px-4 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            등록하기
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTrackedMemberForm;