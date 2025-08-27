import React, { useState, useMemo } from 'react';
import type { SalaryPeriodStats, SalaryStatisticsData } from '../types';
import ChartPieIcon from './icons/ChartPieIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpDownIcon from './icons/ChevronUpDownIcon';

const formatCurrency = (amount: number) => `${Math.floor(amount).toLocaleString()} 원`;

const Tooltip: React.FC<{ data: SalaryPeriodStats }> = ({ data }) => (
    <div className="absolute bottom-full mb-2 w-56 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200">
        <h4 className="font-bold text-sm mb-2 border-b border-slate-600 pb-1">{data.period}</h4>
        <div className="space-y-1">
            <div className="flex justify-between"><span>세전 총급여:</span> <span className="font-semibold">{formatCurrency(data.totalSalary)}</span></div>
            <div className="flex justify-between text-slate-300"><span>└ 기본급:</span> <span>{formatCurrency(data.baseSalary)}</span></div>
            <div className="flex justify-between text-slate-300"><span>└ 수업 인센티브:</span> <span>{formatCurrency(data.sessionIncentive)}</span></div>
            <div className="flex justify-between text-slate-300"><span>└ 매출 인센티브:</span> <span>{formatCurrency(data.salesIncentive)}</span></div>
            <div className="flex justify-between"><span>총 공제액:</span> <span className="font-semibold text-red-400">-{formatCurrency(data.totalDeduction)}</span></div>
            <div className="flex justify-between mt-1 pt-1 border-t border-slate-600"><span>최종 지급액:</span> <span className="font-bold text-blue-400">{formatCurrency(data.finalSalary)}</span></div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
    </div>
);

const DOTS = '...';

const range = (start: number, end: number) => {
  let length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const usePagination = ({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage,
}: {
  totalCount: number;
  pageSize: number;
  siblingCount?: number;
  currentPage: number;
}): (string | number)[] | undefined => {
  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(totalCount / pageSize);

    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPageCount) {
      return range(1, totalPageCount);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount
    );

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = range(1, leftItemCount);

      return [...leftRange, DOTS, totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount
      );
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
  }, [totalCount, pageSize, siblingCount, currentPage]);

  return paginationRange;
};

type SortKeys = keyof SalaryPeriodStats;
type SortConfigItem = { key: SortKeys; direction: 'ascending' | 'descending' };

const SalaryStatistics: React.FC<{ salaryStats: SalaryStatisticsData }> = ({ salaryStats }) => {
    const [activeView, setActiveView] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [sortConfig, setSortConfig] = useState<SortConfigItem[]>([{ key: 'period', direction: 'ascending' }]);

    if (!salaryStats) {
        return <div>급여 통계 데이터를 불러오는 중입니다...</div>;
    }

    const { monthly, quarterly, yearly } = salaryStats;
    const dataMap = useMemo(() => ({ monthly, quarterly, yearly }), [monthly, quarterly, yearly]);
    
    const currentData = useMemo(() => dataMap[activeView] || [], [activeView, dataMap]);

    const sortedData = useMemo(() => {
      let sortableItems = [...currentData];
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
    }, [currentData, sortConfig]);

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


    React.useEffect(() => {
        setCurrentPage(1);
    }, [activeView]);

    const paginatedData = useMemo(() => {
        if (!sortedData || itemsPerPage === -1) {
            return sortedData;
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalItems = sortedData?.length || 0;
    const isAllSelected = itemsPerPage === -1;
    const totalPages = isAllSelected || totalItems === 0 ? 1 : Math.ceil(totalItems / itemsPerPage);

    const paginationRange = usePagination({
        currentPage,
        totalCount: totalItems,
        pageSize: itemsPerPage,
        siblingCount: 1,
    });
    
    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };
    
    const maxSalary = Math.max(...currentData.map(d => d.finalSalary), 1);
    
    const getButtonClass = (view: typeof activeView) => {
        return activeView === view
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-300';
    };

    const totals = useMemo(() => {
        if (!currentData || currentData.length === 0) {
            return { totalSalary: 0, baseSalary: 0, sessionIncentive: 0, salesIncentive: 0, totalDeduction: 0, finalSalary: 0 };
        }
        return currentData.reduce((acc, item) => {
            acc.totalSalary += item.totalSalary;
            acc.baseSalary += item.baseSalary;
            acc.sessionIncentive += item.sessionIncentive;
            acc.salesIncentive += item.salesIncentive;
            acc.totalDeduction += item.totalDeduction;
            acc.finalSalary += item.finalSalary;
            return acc;
        }, { totalSalary: 0, baseSalary: 0, sessionIncentive: 0, salesIncentive: 0, totalDeduction: 0, finalSalary: 0 });
    }, [currentData]);

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center space-x-3 mb-2">
                    <ChartPieIcon className="w-8 h-8 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-slate-800">급여 통계</h2>
                </div>
                <p className="text-slate-600">
                    현재 급여 조건에 기반한 급여 내역입니다. '급여 정산' 탭에서 조건을 변경하면 통계가 업데이트됩니다.
                </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <button onClick={() => setActiveView('monthly')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${getButtonClass('monthly')}`}>월별 (12개월)</button>
                    <button onClick={() => setActiveView('quarterly')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${getButtonClass('quarterly')}`}>분기별 (8분기)</button>
                    <button onClick={() => setActiveView('yearly')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${getButtonClass('yearly')}`}>연간 (3년)</button>
                </div>

                {currentData && currentData.length > 0 ? (
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-lg font-semibold text-slate-700 mb-2">급여 추이 차트</h4>
                            <div className="w-full h-80 bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
                                <div className="flex items-end justify-around h-full gap-2">
                                    {currentData.map(item => (
                                        <div key={item.period} className="group relative flex-1 flex flex-col justify-end items-center h-full">
                                            <Tooltip data={item}/>
                                            <div
                                                className="w-4/5 bg-indigo-500 hover:bg-indigo-700 rounded-t-md transition-all duration-300 ease-in-out"
                                                style={{ height: `${(item.finalSalary / maxSalary) * 100}%` }}
                                                title={`${item.period}: ${formatCurrency(item.finalSalary)}`}
                                            >
                                            </div>
                                            <div className="mt-2 text-xs text-slate-600 font-medium text-center whitespace-nowrap">
                                                {item.period}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-lg font-semibold text-slate-700 mb-2">상세 데이터 표</h4>
                            <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th scope="col" className="px-4 py-2 text-left font-bold text-slate-600 uppercase tracking-wider">
                                                <button onClick={(e) => requestSort('period', e)} className="flex items-center">기간{getSortIndicator('period')}</button>
                                            </th>
                                            <th scope="col" className="px-4 py-2 text-right font-bold text-slate-600 uppercase tracking-wider">
                                                <button onClick={(e) => requestSort('totalSalary', e)} className="flex items-center w-full justify-end">세전 총급여{getSortIndicator('totalSalary')}</button>
                                            </th>
                                            <th scope="col" className="px-4 py-2 text-right font-bold text-slate-600 uppercase tracking-wider">
                                                <button onClick={(e) => requestSort('baseSalary', e)} className="flex items-center w-full justify-end">기본급{getSortIndicator('baseSalary')}</button>
                                            </th>
                                            <th scope="col" className="px-4 py-2 text-right font-bold text-slate-600 uppercase tracking-wider">
                                                <button onClick={(e) => requestSort('sessionIncentive', e)} className="flex items-center w-full justify-end">수업 인센티브{getSortIndicator('sessionIncentive')}</button>
                                            </th>
                                            <th scope="col" className="px-4 py-2 text-right font-bold text-slate-600 uppercase tracking-wider">
                                                <button onClick={(e) => requestSort('salesIncentive', e)} className="flex items-center w-full justify-end">매출 인센티브{getSortIndicator('salesIncentive')}</button>
                                            </th>
                                            <th scope="col" className="px-4 py-2 text-right font-bold text-slate-600 uppercase tracking-wider">
                                                <button onClick={(e) => requestSort('totalDeduction', e)} className="flex items-center w-full justify-end">총 공제액{getSortIndicator('totalDeduction')}</button>
                                            </th>
                                            <th scope="col" className="px-4 py-2 text-right font-bold text-slate-600 uppercase tracking-wider">
                                                <button onClick={(e) => requestSort('finalSalary', e)} className="flex items-center w-full justify-end">최종 지급액{getSortIndicator('finalSalary')}</button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {paginatedData.map((item) => (
                                            <tr key={item.period} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 whitespace-nowrap font-medium text-slate-800">{item.period}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-right text-slate-700">{formatCurrency(item.totalSalary)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-right text-slate-600">{formatCurrency(item.baseSalary)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-right text-slate-600">{formatCurrency(item.sessionIncentive)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-right text-slate-600">{formatCurrency(item.salesIncentive)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-right text-red-600">-{formatCurrency(item.totalDeduction)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-right font-bold text-blue-700">{formatCurrency(item.finalSalary)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                        <tr className="font-bold text-slate-800">
                                            <td className="px-4 py-2 whitespace-nowrap text-left">합계</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{formatCurrency(totals.totalSalary)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{formatCurrency(totals.baseSalary)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{formatCurrency(totals.sessionIncentive)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right">{formatCurrency(totals.salesIncentive)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right text-red-700">-{formatCurrency(totals.totalDeduction)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-right text-blue-800">{formatCurrency(totals.finalSalary)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 px-2 py-1 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <span>단위:</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={handleItemsPerPageChange}
                                            className="bg-white border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            aria-label="단위"
                                        >
                                            <option value="6">6</option>
                                            <option value="12">12</option>
                                            <option value="-1">전체</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span>
                                            {totalPages} 페이지 중 {currentPage}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                aria-label="이전 페이지"
                                            >
                                                <ChevronLeftIcon className="w-5 h-5" />
                                            </button>
                                              
                                              {paginationRange?.map((pageNumber, index) => {
                                                  if (pageNumber === DOTS) {
                                                      return <span key={`${DOTS}-${index}`} className="px-2 py-1.5 text-slate-500 select-none">...</span>;
                                                  }

                                                  return (
                                                      <button
                                                          key={pageNumber}
                                                          onClick={() => setCurrentPage(pageNumber as number)}
                                                          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                                                              currentPage === pageNumber
                                                                  ? 'bg-indigo-600 text-white shadow-sm'
                                                                  : 'text-slate-600 hover:bg-slate-100'
                                                          }`}
                                                          aria-current={currentPage === pageNumber ? 'page' : undefined}
                                                      >
                                                          {pageNumber}
                                                      </button>
                                                  );
                                              })}

                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                aria-label="다음 페이지"
                                            >
                                                <ChevronRightIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-white rounded-lg border-2 border-dashed border-slate-200">
                         <ChartPieIcon className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                        <h3 className="text-lg font-medium text-slate-600">데이터가 부족합니다.</h3>
                        <p className="text-sm text-slate-500 mt-1">해당 기간의 급여 데이터를 표시할 수 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalaryStatistics;