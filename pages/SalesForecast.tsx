
import React, { useState } from 'react';
import type { ForecastEntry, TrackedMember, SaleEntry, TrackedMemberWithStats } from '../types';
import AddForecastEntryForm from '../components/AddForecastEntryForm';
import ForecastTable from '../components/ForecastTable';
import ReRegistrationForecastList from '../components/ReRegistrationForecastList';
import AddSaleForm from '../components/AddSaleForm';
import SalesTable from '../components/SalesTable';
import { VAT_RATE } from '../constants';

interface SalesForecastProps {
    currentMonthSales: SaleEntry[];
    onAddSale: (memberId: string, classCount: number, unitPrice: number, saleDate: string) => void;
    onDeleteSale: (id: string) => void;
    onUpdateSale: (id: string, field: keyof Omit<SaleEntry, 'id' | 'memberId' | 'memberName' | 'amount'>, value: string | number) => void;
    entries: ForecastEntry[];
    membersToReRegister: TrackedMemberWithStats[];
    trackedMembers: TrackedMember[];
    onAddEntry: (memberName: string, classCount: number, unitPrice: number) => void;
    onDeleteEntry: (id: string) => void;
    onUpdateEntry: (id: string, field: keyof ForecastEntry, value: string | number) => void;
}

const SalesForecast: React.FC<SalesForecastProps> = ({
    currentMonthSales,
    onAddSale,
    onDeleteSale,
    onUpdateSale,
    entries,
    membersToReRegister,
    trackedMembers,
    onAddEntry,
    onDeleteEntry,
    onUpdateEntry,
}) => {
    const [vatEnabled, setVatEnabled] = useState(true);

    const handleToggleVat = () => {
      setVatEnabled(prev => !prev);
    };

    const formatCurrency = (amount: number) => `${amount.toLocaleString()} 원`;

    const currentMonthActualRevenue = currentMonthSales.reduce((acc, sale) => acc + sale.amount, 0);
    const currentMonthSalesCount = currentMonthSales.length;
    const currentMonthTotalClasses = currentMonthSales.reduce((acc, sale) => acc + sale.classCount, 0);

    const totalForecastRevenue = entries.reduce((acc, entry) => acc + (entry.classCount * entry.unitPrice), 0);
    const vatAmount = vatEnabled ? Math.floor(totalForecastRevenue * VAT_RATE) : 0;
    const totalWithVat = totalForecastRevenue + vatAmount;

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-8">
            <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200">
                <h2 className="text-xl font-bold text-indigo-800 mb-2">이달 실적 요약</h2>
                <p className="text-sm text-indigo-700 mb-4">
                    이번 달에 발생한 실제 매출 내역의 합산입니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-sm font-medium text-slate-500">총 매출</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(currentMonthActualRevenue)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-sm font-medium text-slate-500">총 판매 건수</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{currentMonthSalesCount}건</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-sm font-medium text-slate-500">총 판매 수업 수</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{currentMonthTotalClasses}회</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">이달 매출 관리</h2>
                <p className="mb-6 text-slate-600">
                    이번 달에 발생한 실제 매출을 기록하고 관리합니다. 이 데이터는 '이달 실적 요약'과 '급여 정산'에 자동으로 반영됩니다.
                </p>
                <AddSaleForm onAddSale={onAddSale} trackedMembers={trackedMembers} />
                <div className="mt-8">
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">이달 매출 목록</h3>
                    <SalesTable 
                        sales={currentMonthSales} 
                        onDeleteSale={onDeleteSale}
                        onUpdateSale={onUpdateSale}
                    />
                </div>
            </div>

            <hr className="my-4 border-slate-200" />

            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">익월 매출 예상 보고서</h2>
                <p className="mb-6 text-slate-600">
                    재등록 예상 회원을 확인하거나 신규 항목을 직접 추가하여 익월 총매출을 예측합니다.
                </p>

                <ReRegistrationForecastList 
                    members={membersToReRegister}
                    forecastEntries={entries}
                    onAddMemberToForecast={onAddEntry}
                />

                <AddForecastEntryForm onAddEntry={onAddEntry} trackedMembers={trackedMembers} />
                
                <div className="mt-8">
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">예상 매출 목록</h3>
                    <ForecastTable 
                        entries={entries} 
                        onDeleteEntry={onDeleteEntry}
                        onUpdateEntry={onUpdateEntry}
                    />
                </div>

                <div className="mt-8 p-6 bg-slate-100 rounded-xl border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">매출 요약 (예상)</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-lg">
                        <span className="font-medium text-slate-600">매출 합계 (공급가액)</span>
                        <span className="font-bold text-slate-800">{formatCurrency(totalForecastRevenue)}</span>
                        </div>

                        <div className="border-t border-slate-200 !mt-4 !mb-2"></div>

                        <div className="flex justify-between items-center">
                        <label htmlFor="vatToggle" className="flex items-center cursor-pointer">
                            <div className="relative">
                            <input type="checkbox" id="vatToggle" className="sr-only" checked={vatEnabled} onChange={handleToggleVat} />
                            <div className={`block w-14 h-8 rounded-full transition-colors ${vatEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${vatEnabled ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <span className="ml-3 font-medium text-slate-600">부가세 적용 ({VAT_RATE * 100}%)</span>
                        </label>
                        <span className={`font-semibold transition-colors ${vatEnabled ? 'text-green-600' : 'text-slate-500'}`}>
                            + {formatCurrency(vatAmount)}
                        </span>
                        </div>

                        <div className="flex justify-between items-center border-t-2 border-slate-300 !mt-4 pt-4 text-2xl">
                        <span className="font-bold text-slate-800">최종 합계</span>
                        <span className="font-extrabold text-blue-700">{formatCurrency(totalWithVat)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SalesForecast;
