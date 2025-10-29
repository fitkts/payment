import React, { useState } from 'react';
import type { MemberSession } from '../types';
import {
  NATIONAL_PENSION_RATE,
  HEALTH_INSURANCE_RATE,
  LONG_TERM_CARE_INSURANCE_RATE_OF_HEALTH_INSURANCE,
  EMPLOYMENT_INSURANCE_RATE,
  TAX_RATE
} from '../constants';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface SalarySummaryProps {
  sessions: MemberSession[];
  taxRate: number;
  taxEnabled: boolean;
  onToggleTax: () => void;
  insurancesEnabled: boolean;
  onToggleInsurances: () => void;
  baseSalary: number;
  incentiveRate: number;
  performanceBonus: number;
  monthlySales: number;
  salesIncentiveRate: number;
}

const SalarySummary: React.FC<SalarySummaryProps> = ({ 
  sessions, 
  taxRate, 
  taxEnabled, 
  onToggleTax,
  insurancesEnabled,
  onToggleInsurances,
  baseSalary,
  incentiveRate,
  performanceBonus,
  monthlySales,
  salesIncentiveRate
}) => {
  const [isBreakdownVisible, setIsBreakdownVisible] = useState(false);
  const sessionRevenue = sessions.reduce((acc, session) => acc + (session.classCount || 0) * (session.unitPrice || 0), 0);
  const sessionIncentive = Math.floor(sessionRevenue * (incentiveRate / 100));
  const salesIncentive = Math.floor(monthlySales * (salesIncentiveRate / 100));
  const totalSalary = baseSalary + sessionIncentive + performanceBonus + salesIncentive;

  // 4대 보험료 계산 (새로운 총 급여 기준)
  const nationalPension = insurancesEnabled ? Math.floor(totalSalary * NATIONAL_PENSION_RATE) : 0;
  const healthInsurance = insurancesEnabled ? Math.floor(totalSalary * HEALTH_INSURANCE_RATE) : 0;
  const longTermCareInsurance = insurancesEnabled ? Math.floor(healthInsurance * LONG_TERM_CARE_INSURANCE_RATE_OF_HEALTH_INSURANCE) : 0;
  const employmentInsurance = insurancesEnabled ? Math.floor(totalSalary * EMPLOYMENT_INSURANCE_RATE) : 0;
  const totalInsuranceDeduction = nationalPension + healthInsurance + longTermCareInsurance + employmentInsurance;

  const taxAmount = taxEnabled ? Math.floor(totalSalary * taxRate) : 0;
  
  // 총 공제액 계산
  const totalDeduction = totalInsuranceDeduction + taxAmount;

  const finalSalary = totalSalary - totalDeduction;

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} 원`;

  return (
    <div className="mt-8 p-6 bg-slate-100 rounded-xl border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">급여 정산</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-lg">
           <button
            className="flex items-center gap-2 text-left"
            onClick={() => setIsBreakdownVisible(p => !p)}
            aria-expanded={isBreakdownVisible}
            aria-controls="salary-breakdown"
          >
            <span className="font-medium text-slate-600">총 급여 (세전)</span>
            {isBreakdownVisible ? <ChevronUpIcon className="w-4 h-4 text-slate-500" /> : <ChevronDownIcon className="w-4 h-4 text-slate-500" />}
          </button>
          <span className="font-bold text-slate-800">{formatCurrency(totalSalary)}</span>
        </div>
        
        <div
          id="salary-breakdown"
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isBreakdownVisible ? 'max-h-40' : 'max-h-0'}`}
        >
          <div className="pl-6 pr-2 pt-2 pb-1 space-y-1 text-sm bg-slate-200/50 rounded-md">
            <div className="flex justify-between items-center text-slate-600">
              <span>기본급</span>
              <span>{formatCurrency(baseSalary)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>수업 인센티브 ({incentiveRate}%)</span>
              <span>+ {formatCurrency(sessionIncentive)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>매출 인센티브 ({salesIncentiveRate}%)</span>
              <span>+ {formatCurrency(salesIncentive)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>성과급</span>
              <span>+ {formatCurrency(performanceBonus)}</span>
            </div>
          </div>
        </div>


        <div className="border-t border-slate-200 !mt-4 !mb-2"></div>

        {/* 4대 보험 */}
        <div className="flex justify-between items-center">
          <label htmlFor="insurancesToggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" id="insurancesToggle" className="sr-only" checked={insurancesEnabled} onChange={onToggleInsurances} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${insurancesEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${insurancesEnabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <span className="ml-3 font-medium text-slate-600">4대 보험 적용</span>
          </label>
          <span className={`font-semibold transition-colors ${insurancesEnabled ? 'text-red-500' : 'text-slate-500'}`}>
            - {formatCurrency(totalInsuranceDeduction)}
          </span>
        </div>

        {insurancesEnabled && (
          <div className="pl-8 pr-2 pt-1 pb-2 space-y-2 text-sm bg-slate-200/50 rounded-md">
            <div className="flex justify-between items-center text-slate-500">
              <span>국민연금 ({NATIONAL_PENSION_RATE * 100}%)</span>
              <span>- {formatCurrency(nationalPension)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>건강보험 ({HEALTH_INSURANCE_RATE * 100}%)</span>
              <span>- {formatCurrency(healthInsurance)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>장기요양보험</span>
              <span>- {formatCurrency(longTermCareInsurance)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>고용보험 ({EMPLOYMENT_INSURANCE_RATE * 100}%)</span>
              <span>- {formatCurrency(employmentInsurance)}</span>
            </div>
          </div>
        )}

        {/* 사업소득세 */}
        <div className="flex justify-between items-center">
          <label htmlFor="taxToggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" id="taxToggle" className="sr-only" checked={taxEnabled} onChange={onToggleTax} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${taxEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${taxEnabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <span className="ml-3 font-medium text-slate-600">사업소득세 적용 ({taxRate * 100}%)</span>
          </label>
          <span className={`font-semibold transition-colors ${taxEnabled ? 'text-red-500' : 'text-slate-500'}`}>
            - {formatCurrency(taxAmount)}
          </span>
        </div>

        {(taxEnabled || insurancesEnabled) && (
          <div className="border-t border-slate-300 !mt-4 pt-3">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium text-slate-600">총 공제액</span>
              <span className="font-bold text-red-600">- {formatCurrency(totalDeduction)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center border-t-2 border-slate-300 !mt-4 pt-4 text-2xl">
          <span className="font-bold text-slate-800">최종 지급액</span>
          <span className="font-extrabold text-blue-700">{formatCurrency(finalSalary)}</span>
        </div>
      </div>
    </div>
  );
};

export default SalarySummary;