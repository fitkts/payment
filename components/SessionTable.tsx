import React, { useMemo, useState } from 'react';
import type { MemberSession } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpDownIcon from './icons/ChevronUpDownIcon';


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

    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount + 5;

    /*
      Case 1:
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageNumbers >= totalPageCount) {
      return range(1, totalPageCount);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount
    );

    /*
      We do not want to show dots if there is only one position left 
      after/before the left/right page count as that would lead to a change if our Pagination
      component size which we do not want
    */
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

interface MemberSessionSummary {
    memberId: string;
    memberName: string;
    totalClassCount: number;
    totalRevenue: number;
    averageUnitPrice: number;
}

type SortKeys = keyof MemberSessionSummary;
type SortConfigItem = { key: SortKeys; direction: 'ascending' | 'descending' };

interface SessionTableProps {
  sessions: MemberSession[];
  onViewDetails: (memberId: string, memberName: string) => void;
}

const SessionTable: React.FC<SessionTableProps> = ({ sessions, onViewDetails }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState<SortConfigItem[]>([{ key: 'totalRevenue', direction: 'descending' }]);

    const memberSummaries: MemberSessionSummary[] = useMemo(() => {
        const summaryMap = new Map<string, { memberName: string; totalClassCount: number; totalRevenue: number; }>();

        sessions.forEach(session => {
            if (!summaryMap.has(session.memberId)) {
                summaryMap.set(session.memberId, {
                    memberName: session.memberName,
                    totalClassCount: 0,
                    totalRevenue: 0,
                });
            }
            const current = summaryMap.get(session.memberId)!;
            current.totalClassCount += Number(session.classCount) || 0;
            current.totalRevenue += (Number(session.classCount) || 0) * (Number(session.unitPrice) || 0);
        });

        return Array.from(summaryMap.entries()).map(([memberId, data]) => ({
            memberId,
            memberName: data.memberName,
            totalClassCount: data.totalClassCount,
            totalRevenue: data.totalRevenue,
            averageUnitPrice: data.totalClassCount > 0 ? Math.floor(data.totalRevenue / data.totalClassCount) : 0,
        }));
    }, [sessions]);

    const sortedSummaries = useMemo(() => {
        let sortableItems = [...memberSummaries];
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
    }, [memberSummaries, sortConfig]);

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
    
    // Reset to page 1 if data changes and current page is out of bounds
    React.useEffect(() => {
        const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(sortedSummaries.length / itemsPerPage);
        if (sortedSummaries.length > 0 && totalPages < currentPage) {
            setCurrentPage(1);
        }
    }, [sortedSummaries, itemsPerPage, currentPage]);

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page
    };
    
    const totalItems = sortedSummaries.length;
    const isAllSelected = itemsPerPage === -1;
    const totalPages = isAllSelected ? 1 : Math.ceil(totalItems / itemsPerPage);

    const paginatedSummaries = useMemo(() => {
        if (isAllSelected) {
            return sortedSummaries;
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedSummaries.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedSummaries, currentPage, itemsPerPage, isAllSelected]);
    
    const startIndex = (currentPage - 1) * itemsPerPage;

    const paginationRange = usePagination({
        currentPage,
        totalCount: totalItems,
        pageSize: itemsPerPage,
        siblingCount: 1,
    });


  if (sessions.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <h3 className="text-lg font-medium text-slate-600">선택된 월에 세션 정보가 없습니다.</h3>
        <p className="text-sm text-slate-500 mt-1">다른 월을 선택하시거나, '신규 세션 추가'를 통해 세션을 추가하세요.</p>
      </div>
    );
  }

  const totalClassCount = memberSummaries.reduce((acc, summary) => acc + summary.totalClassCount, 0);
  const totalRevenue = memberSummaries.reduce((acc, summary) => acc + summary.totalRevenue, 0);
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyAverageClassCount = totalClassCount > 0 ? totalClassCount / daysInMonth : 0;


  return (
    <div>
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th scope="col" className="w-16 px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">번호</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                <button onClick={(e) => requestSort('memberName', e)} className="flex items-center">
                    회원명
                    {getSortIndicator('memberName')}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                <button onClick={(e) => requestSort('totalClassCount', e)} className="flex items-center">
                    총 수업 수
                    {getSortIndicator('totalClassCount')}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                <button onClick={(e) => requestSort('averageUnitPrice', e)} className="flex items-center">
                    평균 단가 (원)
                    {getSortIndicator('averageUnitPrice')}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                <button onClick={(e) => requestSort('totalRevenue', e)} className="flex items-center">
                    합계 (원)
                    {getSortIndicator('totalRevenue')}
                </button>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">상세보기</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedSummaries.map((summary, index) => (
              <tr key={summary.memberId} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-slate-500">
                  {isAllSelected ? index + 1 : startIndex + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{summary.memberName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{summary.totalClassCount} 회</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{summary.averageUnitPrice.toLocaleString()} 원</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-semibold">
                  {summary.totalRevenue.toLocaleString()} 원
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onViewDetails(summary.memberId, summary.memberName)} 
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    aria-label={`${summary.memberName} 수업 상세 내역 보기`}
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr className="text-sm font-semibold text-slate-700">
                  <td colSpan={2} className="px-6 py-3 text-center">합계</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                      <div>총 {totalClassCount} 회</div>
                      <div className="text-xs text-slate-500 font-normal">일 평균 {dailyAverageClassCount.toFixed(1)} 회</div>
                  </td>
                  <td className="px-6 py-3"></td>
                  <td className="px-6 py-3 whitespace-nowrap font-bold text-slate-800">
                      {totalRevenue.toLocaleString()} 원
                  </td>
                  <td className="px-6 py-3"></td>
              </tr>
          </tfoot>
        </table>
      </div>
      {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4 px-2 py-1 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                  <span>단위:</span>
                  <select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      className="bg-white border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      aria-label="단위"
                  >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="30">30</option>
                      <option value="-1">전체</option>
                  </select>
              </div>

              <div className="flex items-center gap-4">
                  <span>
                      {isAllSelected ? `총 ${totalItems}개 항목` : `${totalPages} 페이지 중 ${currentPage}`}
                  </span>
                  <div className="flex items-center gap-1">
                      <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || isAllSelected}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="이전 페이지"
                      >
                          <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                        
                        {!isAllSelected && paginationRange?.map((pageNumber, index) => {
                            if (pageNumber === DOTS) {
                                return <span key={`${DOTS}-${index}`} className="px-2 py-1.5 text-slate-500 select-none">...</span>;
                            }

                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => setCurrentPage(pageNumber as number)}
                                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                                        currentPage === pageNumber
                                            ? 'bg-blue-600 text-white shadow-sm'
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
                          disabled={currentPage === totalPages || isAllSelected}
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
  );
};

export default SessionTable;