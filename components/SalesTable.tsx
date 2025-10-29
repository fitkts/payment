

import React, { useState, useMemo } from 'react';
import type { SaleEntry } from '../types';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency, parseCurrency } from '../utils';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpDownIcon from './icons/ChevronUpDownIcon';


interface SalesTableProps {
  sales: SaleEntry[];
  onDeleteSale: (id: string) => void;
  onUpdateSale: (id: string, field: 'saleDate' | 'classCount' | 'amount' | 'paidAmount', value: string | number) => void;
}

type SortKeys = keyof SaleEntry | 'unpaidAmount';
type SortConfigItem = { key: SortKeys; direction: 'ascending' | 'descending' };

const SalesTable: React.FC<SalesTableProps> = ({ sales, onDeleteSale, onUpdateSale }) => {
  const [sortConfig, setSortConfig] = useState<SortConfigItem[]>([{ key: 'saleDate', direction: 'descending' }]);

  const sortedSales = useMemo(() => {
    let sortableItems = sales.map(s => ({ ...s, unpaidAmount: (s.amount || 0) - (s.paidAmount || 0) }));
    if (sortConfig.length > 0) {
        sortableItems.sort((a, b) => {
            for (const config of sortConfig) {
                const { key, direction } = config;
                const aValue = a[key as keyof typeof a];
                const bValue = b[key as keyof typeof b];
                
                let comparison = 0;
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
                }

                if (comparison !== 0) {
                    return direction === 'ascending' ? comparison : comparison * -1;
                }
            }
            return 0;
        });
    }
    return sortableItems;
  }, [sales, sortConfig]);

  const requestSort = (key: SortKeys, event: React.MouseEvent) => {
    const isShiftPressed = event.shiftKey;
    let newConfig = [...sortConfig];
    const existingConfigIndex = newConfig.findIndex(c => c.key === key);

    if (isShiftPressed) {
        if (existingConfigIndex > -1) {
            newConfig[existingConfigIndex].direction = newConfig[existingConfigIndex].direction === 'ascending' ? 'descending' : 'ascending';
        } else {
            newConfig.push({ key, direction: 'ascending' });
        }
    } else {
        if (existingConfigIndex === 0 && newConfig.length === 1) {
            newConfig[0].direction = newConfig[0].direction === 'ascending' ? 'descending' : 'ascending';
        } else {
            newConfig = [{ key, direction: 'ascending' }];
        }
    }
    setSortConfig(newConfig);
  };

  const getSortIndicator = (key: SortKeys) => {
    const configIndex = sortConfig.findIndex(c => c.key === key);
    
    const indicatorContent = (() => {
        if (configIndex === -1) {
            return <ChevronUpDownIcon className="w-4 h-4 text-slate-400" />;
        }
        
        const config = sortConfig[configIndex];
        const IconComponent = config.direction === 'ascending' ? ChevronUpIcon : ChevronDownIcon;
        const sortOrder = sortConfig.length > 1 ? <span className="text-[10px] font-bold text-slate-600 mr-0.5">{configIndex + 1}</span> : null;

        return (
            <div className="flex items-center">
                {sortOrder}
                <IconComponent className="w-4 h-4 text-slate-700" />
            </div>
        );
    })();

    return <div className="ml-1 w-6 h-4 flex items-center justify-center">{indicatorContent}</div>;
  };

  if (sales.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <h3 className="text-lg font-medium text-slate-600">이달에 기록된 매출이 없습니다.</h3>
        <p className="text-sm text-slate-500 mt-1">위 양식을 사용하여 신규 매출을 추가하세요.</p>
      </div>
    );
  }

  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.amount || 0), 0);
  const totalPaid = sales.reduce((acc, sale) => acc + (sale.paidAmount || 0), 0);
  const totalUnpaid = totalRevenue - totalPaid;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-100">
          <tr>
            <th scope="col" className="w-16 px-3 py-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">번호</th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('saleDate', e)} className="flex items-center">매출 일자{getSortIndicator('saleDate')}</button>
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('memberName', e)} className="flex items-center">회원명{getSortIndicator('memberName')}</button>
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('classCount', e)} className="flex items-center">수업 수{getSortIndicator('classCount')}</button>
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('amount', e)} className="flex items-center">총 금액{getSortIndicator('amount')}</button>
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('paidAmount', e)} className="flex items-center">결제 금액{getSortIndicator('paidAmount')}</button>
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('unpaidAmount', e)} className="flex items-center">미수금{getSortIndicator('unpaidAmount')}</button>
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">상태</th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('unitPrice', e)} className="flex items-center">단가{getSortIndicator('unitPrice')}</button>
            </th>
            <th scope="col" className="relative px-3 py-2">
              <span className="sr-only">삭제</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {sortedSales.map((sale, index) => {
             const unpaidAmount = (sale.amount || 0) - (sale.paidAmount || 0);
             const status = unpaidAmount <= 0 
                ? { text: '완납', className: 'bg-green-100 text-green-800' }
                : { text: '미납', className: 'bg-orange-100 text-orange-800' };
             return (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center font-medium text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">
                    <input type="date" value={sale.saleDate} onChange={(e) => onUpdateSale(sale.id, 'saleDate', e.target.value)} className="w-36 px-2 py-0.5 text-sm border border-slate-300 rounded-md shadow-sm bg-slate-100 text-slate-800"/>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900">{sale.memberName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input type="number" value={sale.classCount} onChange={(e) => onUpdateSale(sale.id, 'classCount', parseInt(e.target.value) || 0)} className="w-20 px-2 py-0.5 text-sm border border-slate-300 rounded-md shadow-sm bg-slate-100 text-slate-800" min="0"/>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input type="text" inputMode="numeric" value={formatCurrency(sale.amount)} onChange={(e) => onUpdateSale(sale.id, 'amount', parseCurrency(e.target.value))} className="w-28 px-2 py-0.5 text-sm border border-slate-300 rounded-md shadow-sm bg-slate-100 text-slate-800"/>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input type="text" inputMode="numeric" value={formatCurrency(sale.paidAmount)} onChange={(e) => onUpdateSale(sale.id, 'paidAmount', parseCurrency(e.target.value))} className="w-28 px-2 py-0.5 text-sm border border-slate-300 rounded-md shadow-sm bg-slate-100 text-slate-800"/>
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm font-semibold ${unpaidAmount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {formatCurrency(unpaidAmount)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>{status.text}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 font-semibold">
                    {((sale.classCount || 0) > 0 ? Math.floor((sale.amount || 0) / (sale.classCount)) : 0).toLocaleString()} 원
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onDeleteSale(sale.id)} className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100" aria-label={`${sale.memberName} 매출 삭제`}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-slate-100 border-t-2 border-slate-300">
          <tr className="text-sm font-semibold text-slate-700">
            <td colSpan={4} className="px-3 py-2 text-right">합계</td>
            <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-800">{formatCurrency(totalRevenue)}</td>
            <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-800">{formatCurrency(totalPaid)}</td>
            <td className="px-3 py-2 whitespace-nowrap font-bold text-red-700">{formatCurrency(totalUnpaid)}</td>
            <td colSpan={3} className="px-3 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default SalesTable;