
import React, { useState, useMemo } from 'react';
import type { ForecastEntry } from '../types';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency, parseCurrency } from '../utils';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpDownIcon from './icons/ChevronUpDownIcon';

interface ForecastTableProps {
  entries: ForecastEntry[];
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (id: string, field: keyof ForecastEntry, value: string | number) => void;
}

type SortKeys = keyof ForecastEntry;
type SortConfigItem = { key: SortKeys; direction: 'ascending' | 'descending' };


const ForecastTable: React.FC<ForecastTableProps> = ({ entries, onDeleteEntry, onUpdateEntry }) => {
  const [sortConfig, setSortConfig] = useState<SortConfigItem[]>([{ key: 'amount', direction: 'descending' }]);

  const sortedEntries = useMemo(() => {
    let sortableItems = [...entries];
    if (sortConfig.length > 0) {
        sortableItems.sort((a, b) => {
           for (const config of sortConfig) {
                const { key, direction } = config;
                const aValue = a[key];
                const bValue = b[key];
                
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
  }, [entries, sortConfig]);

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

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <h3 className="text-lg font-medium text-slate-600">예상 매출 항목이 없습니다.</h3>
        <p className="text-sm text-slate-500 mt-1">위 양식을 사용하거나 재등록 예상 회원을 추가하세요.</p>
      </div>
    );
  }

  const totalRevenue = entries.reduce((acc, entry) => acc + entry.amount, 0);

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-100">
          <tr>
            <th scope="col" className="w-16 px-6 py-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">번호</th>
            <th scope="col" className="px-6 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('memberName', e)} className="flex items-center">
                  회원명/항목명
                  {getSortIndicator('memberName')}
              </button>
            </th>
            <th scope="col" className="px-6 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('classCount', e)} className="flex items-center">
                  수업 수
                  {getSortIndicator('classCount')}
              </button>
            </th>
             <th scope="col" className="px-6 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('amount', e)} className="flex items-center">
                  금액 (원)
                  {getSortIndicator('amount')}
              </button>
            </th>
            <th scope="col" className="px-6 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              <button onClick={(e) => requestSort('unitPrice', e)} className="flex items-center">
                  단가 (원)
                  {getSortIndicator('unitPrice')}
              </button>
            </th>
            <th scope="col" className="relative px-6 py-2">
              <span className="sr-only">삭제</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {sortedEntries.map((entry, index) => (
            <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-2 whitespace-nowrap text-sm text-center font-medium text-slate-500">{index + 1}</td>
              <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-slate-900">{entry.memberName}</td>
              <td className="px-6 py-2 whitespace-nowrap">
                <input
                  type="number"
                  value={entry.classCount}
                  onChange={(e) => onUpdateEntry(entry.id, 'classCount', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-slate-800"
                  min="0"
                />
              </td>
              <td className="px-6 py-2 whitespace-nowrap">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(entry.amount)}
                  onChange={(e) => onUpdateEntry(entry.id, 'amount', parseCurrency(e.target.value))}
                  className="w-32 px-2 py-0.5 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 text-slate-800"
                />
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-slate-700 font-semibold">
                {entry.unitPrice.toLocaleString()}
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onDeleteEntry(entry.id)}
                  className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100"
                  aria-label={`${entry.memberName} 항목 삭제`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-100 border-t-2 border-slate-300">
          <tr className="text-lg font-bold text-slate-800">
            <td colSpan={3} className="px-6 py-2 text-right">매출 합계</td>
            <td className="px-6 py-2 whitespace-nowrap">
              {totalRevenue.toLocaleString()} 원
            </td>
            <td colSpan={2} className="px-6 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ForecastTable;