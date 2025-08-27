
import React from 'react';
import { formatCurrency, parseCurrency } from '../utils';

interface SalaryConfigFormProps {
  baseSalary: number;
  setBaseSalary: (value: number) => void;
  incentiveRate: number;
  setIncentiveRate: (value: number) => void;
  performanceBonus: number;
  setPerformanceBonus: (value: number) => void;
  monthlySales: number;
  salesIncentiveRate: number;
  setSalesIncentiveRate: (value: number) => void;
}

const SalaryConfigForm: React.FC<SalaryConfigFormProps> = ({
  baseSalary,
  setBaseSalary,
  incentiveRate,
  setIncentiveRate,
  performanceBonus,
  setPerformanceBonus,
  monthlySales,
  salesIncentiveRate,
  setSalesIncentiveRate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div>
        <label htmlFor="baseSalary" className="block text-sm font-medium text-slate-600 mb-1">
          기본급 (원)
        </label>
        <input
          id="baseSalary"
          type="text"
          inputMode="numeric"
          value={formatCurrency(baseSalary)}
          onChange={(e) => setBaseSalary(parseCurrency(e.target.value))}
          placeholder="예: 2,100,000"
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
      </div>
      <div>
        <label htmlFor="incentiveRate" className="block text-sm font-medium text-slate-600 mb-1">
          수업 인센티브 (%)
        </label>
        <input
          id="incentiveRate"
          type="number"
          value={incentiveRate}
          onChange={(e) => setIncentiveRate(parseInt(e.target.value, 10) || 0)}
          placeholder="예: 50"
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          min="0"
          max="100"
        />
      </div>
      <div>
        <label htmlFor="performanceBonus" className="block text-sm font-medium text-slate-600 mb-1">
          성과급 (원)
        </label>
        <input
          id="performanceBonus"
          type="text"
          inputMode="numeric"
          value={formatCurrency(performanceBonus)}
          onChange={(e) => setPerformanceBonus(parseCurrency(e.target.value))}
          placeholder="예: 300,000"
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
      </div>
      <div>
        <label htmlFor="monthlySales" className="block text-sm font-medium text-slate-600 mb-1">
          월 매출액 (자동 계산)
        </label>
        <input
          id="monthlySales"
          type="text"
          value={monthlySales.toLocaleString()}
          readOnly
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none bg-slate-200 text-slate-500 cursor-not-allowed"
        />
      </div>
      <div>
        <label htmlFor="salesIncentiveRate" className="block text-sm font-medium text-slate-600 mb-1">
          매출 인센티브 (%)
        </label>
        <input
          id="salesIncentiveRate"
          type="number"
          value={salesIncentiveRate}
          onChange={(e) => setSalesIncentiveRate(parseInt(e.target.value, 10) || 0)}
          placeholder="예: 10"
          className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          min="0"
          max="100"
        />
      </div>
    </div>
  );
};

export default SalaryConfigForm;