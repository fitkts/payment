import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { TrackedMemberWithStats } from '../types';
import TrashIcon from './icons/TrashIcon';
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

interface SortableMember extends TrackedMemberWithStats {
    remainingSessions: number;
    progress: number;
}
type SortKeys = keyof SortableMember | 'name';
type SortConfigItem = { key: SortKeys; direction: 'ascending' | 'descending' };

interface MemberStatsTableProps {
  members: TrackedMemberWithStats[];
  onDeleteMember: (id: string) => void;
  onMemberClick: (member: TrackedMemberWithStats) => void;
}

const MemberStatsTable: React.FC<MemberStatsTableProps> = ({ members, onDeleteMember, onMemberClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfigItem[]>([{ key: 'ltv', direction: 'descending' }]);
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const membersForSort: SortableMember[] = useMemo(() => {
    return members.map(member => ({
      ...member,
      remainingSessions: member.cumulativeTotalSessions - member.usedSessions,
      progress: member.cumulativeTotalSessions > 0 ? (member.usedSessions / member.cumulativeTotalSessions) * 100 : 0,
    }));
  }, [members]);

  const sortedMembers = useMemo(() => {
    let sortableItems = [...membersForSort];
    if (sortConfig.length > 0) {
        sortableItems.sort((a, b) => {
             for (const config of sortConfig) {
                const { key, direction } = config;
                const aValue = a[key as keyof SortableMember];
                const bValue = b[key as keyof SortableMember];
                
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
  }, [membersForSort, sortConfig]);

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

  useEffect(() => {
    const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(sortedMembers.length / itemsPerPage);
    if (sortedMembers.length > 0 && totalPages < currentPage) {
        setCurrentPage(1);
    }
  }, [sortedMembers, itemsPerPage, currentPage]);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setItemsPerPage(Number(e.target.value));
      setCurrentPage(1);
  };
  
  const totalItems = sortedMembers.length;
  const isAllSelected = itemsPerPage === -1;
  const totalPages = isAllSelected ? 1 : Math.ceil(totalItems / itemsPerPage);

  const paginatedMembers = useMemo(() => {
      if (isAllSelected) {
          return sortedMembers;
      }
      const startIndex = (currentPage - 1) * itemsPerPage;
      return sortedMembers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedMembers, currentPage, itemsPerPage, isAllSelected]);
  
  useEffect(() => {
    setFocusedRowIndex(-1);
  }, [paginatedMembers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedRowIndex(prev => Math.min(prev + 1, paginatedMembers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedRowIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusedRowIndex > -1) {
      e.preventDefault();
      onMemberClick(paginatedMembers[focusedRowIndex]);
    }
  };
  
  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginationRange = usePagination({
      currentPage,
      totalCount: totalItems,
      pageSize: itemsPerPage,
      siblingCount: 1,
  });

  if (members.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <h3 className="text-lg font-medium text-slate-600">등록된 회원이 없습니다.</h3>
        <p className="text-sm text-slate-500 mt-1">위 '신규 회원 등록' 양식을 사용하여 첫 회원을 추가하세요.</p>
      </div>
    );
  }

  return (
    <div 
        ref={tableContainerRef} 
        onKeyDown={handleKeyDown} 
        tabIndex={0} 
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        aria-label="회원 목록 테이블. 화살표 키로 탐색하고 Enter 키로 상세 정보를 확인하세요."
    >
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                <tr>
                    <th scope="col" className="w-16 px-4 py-2 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">번호</th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <button onClick={(e) => requestSort('name', e)} className="flex items-center">
                            회원명
                            {getSortIndicator('name')}
                        </button>
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <button onClick={(e) => requestSort('ltv', e)} className="flex items-center">
                            총 누적 매출 (LTV)
                            {getSortIndicator('ltv')}
                        </button>
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <button onClick={(e) => requestSort('remainingSessions', e)} className="flex items-center">
                            잔여/누적 횟수
                            {getSortIndicator('remainingSessions')}
                        </button>
                    </th>
                    <th scope="col" className="w-[220px] px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <button onClick={(e) => requestSort('progress', e)} className="flex items-center">
                            진행률
                            {getSortIndicator('progress')}
                        </button>
                    </th>
                    <th scope="col" className="relative px-4 py-2">
                    <span className="sr-only">삭제</span>
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                {paginatedMembers.map((member, index) => {
                    const progressWidth = Math.min(member.progress, 100);

                    let progressBarColorClass = 'bg-blue-600';
                    let progressTextColorClass = 'text-slate-700';

                    if (member.progress > 100) {
                    progressBarColorClass = 'bg-red-600';
                    progressTextColorClass = 'text-red-600';
                    } else if (member.progress >= 90) {
                    progressBarColorClass = 'bg-orange-500';
                    progressTextColorClass = 'text-orange-600';
                    }

                    return (
                    <tr 
                        key={member.id} 
                        className={`cursor-pointer transition-colors ${focusedRowIndex === index ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : 'hover:bg-slate-50'}`}
                        onClick={() => onMemberClick(member)}
                        onMouseEnter={() => setFocusedRowIndex(index)}
                        onMouseLeave={() => setFocusedRowIndex(-1)}
                    >
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium text-slate-500">
                            {isAllSelected ? index + 1 : startIndex + index + 1}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">{member.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-slate-700">{(member.ltv || 0).toLocaleString()} 원</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${member.remainingSessions < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {member.remainingSessions} / {member.cumulativeTotalSessions}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div 
                                className={`${progressBarColorClass} h-2.5 rounded-full transition-all duration-300`} 
                                style={{ width: `${progressWidth}%` }}
                            ></div>
                            </div>
                            <span className={`ml-3 text-sm font-medium ${progressTextColorClass}`}>{Math.round(member.progress)}%</span>
                        </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent modal from opening when deleting
                                onDeleteMember(member.id);
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100"
                            aria-label={`${member.name} 회원 삭제`}
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
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
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="30">30</option>
                      <option value="50">50</option>
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

export default MemberStatsTable;