import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TrackedMemberWithStats, SaleEntry, MemberSession, SaleWithUsage } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import { formatCurrency, parseCurrency } from '../utils';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpDownIcon from './icons/ChevronUpDownIcon';


interface MemberDetailModalProps {
  member: TrackedMemberWithStats;
  allSales: SaleEntry[];
  allSessions: MemberSession[];
  onClose: () => void;
  onUpdateMember: (id: string, data: { name: string; totalSessions: number; unitPrice: number; }) => void;
  onAddSale: (memberId: string, classCount: number, unitPrice: number, saleDate: string) => void;
  onDeleteSale: (id: string) => void;
  onUpdateSale: (id: string, field: keyof Omit<SaleEntry, 'id' | 'memberId' | 'memberName' | 'amount'>, value: string | number) => void;
}

type SaleSortKeys = keyof SaleEntry;
type SortConfigItem = { key: SaleSortKeys; direction: 'ascending' | 'descending' };

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, allSales, allSessions, onClose, onUpdateMember, onAddSale, onDeleteSale, onUpdateSale }) => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [editedData, setEditedData] = useState({
      name: member.name,
      totalSessions: String(member.totalSessions),
      unitPrice: formatCurrency(member.unitPrice)
  });

  const [newSaleData, setNewSaleData] = useState({
      saleDate: new Date().toISOString().split('T')[0],
      classCount: '',
      unitPrice: ''
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfigItem[]>([{ key: 'saleDate', direction: 'descending' }]);

  useEffect(() => {
    setEditedData({
        name: member.name,
        totalSessions: String(member.totalSessions),
        unitPrice: formatCurrency(member.unitPrice)
    });
    setIsEditing(false); // 모달이 다른 회원으로 열릴 때 수정 모드 해제
    setAnalysisResult(''); // 분석 결과 초기화
    setError(''); // 에러 초기화
  }, [member]);


  const { memberSales, memberSessions } = useMemo(() => {
    return {
      memberSales: allSales.filter(s => s.memberId === member.id),
      memberSessions: allSessions.filter(s => s.memberId === member.id),
    };
  }, [member.id, allSales, allSessions]);

  const sortedMemberSales = useMemo(() => {
    let sortableItems = [...memberSales];
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
  }, [memberSales, sortConfig]);

  const requestSort = (key: SaleSortKeys, event: React.MouseEvent) => {
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

  const getSortIndicator = (key: SaleSortKeys) => {
    const configIndex = sortConfig.findIndex(c => c.key === key);
    
    const indicatorContent = (() => {
        if (configIndex === -1) {
            return <ChevronUpDownIcon className="w-3 h-3 text-slate-400" />;
        }
        
        const config = sortConfig[configIndex];
        const IconComponent = config.direction === 'ascending' ? ChevronUpIcon : ChevronDownIcon;
        const sortOrder = sortConfig.length > 1 ? <span className="text-[9px] font-bold text-slate-600 mr-0.5">{configIndex + 1}</span> : null;

        return (
            <div className="flex items-center">
                {sortOrder}
                <IconComponent className="w-3 h-3 text-slate-700" />
            </div>
        );
    })();

    return <div className="ml-1 w-5 h-3 flex items-center justify-center">{indicatorContent}</div>;
  };

  const salesWithUsage = useMemo<SaleWithUsage[]>(() => {
    const sortedSales = [...memberSales].sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
    
    let usedSessionsCounter = member.usedSessions;

    const salesWithUsageDetails = sortedSales.map(sale => {
        const usedForThisSale = Math.min(sale.classCount, usedSessionsCounter);
        usedSessionsCounter -= usedForThisSale;
        
        return {
            ...sale,
            usedCount: usedForThisSale,
        };
    });
    return salesWithUsageDetails.reverse();
  }, [memberSales, member.usedSessions]);


  const remainingSessions = member.cumulativeTotalSessions - member.usedSessions;
  
  const handleAnalysis = async () => {
    setLoading(true);
    setAnalysisResult('');
    setError('');

    if (!process.env.API_KEY) {
      setError('API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
      setLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `
        당신은 최고의 피트니스 센터 비즈니스 분석가이자 CRM 전문가입니다. 한 명의 회원 데이터를 분석하여 한국어로 실행 가능한 간결한 리포트를 마크다운 형식으로 작성해주세요.

        **목표:**
        센터 직원이 회원의 현재 상태를 정확히 이해하고, 참여도를 높이고 재등록을 유도할 수 있는 개인화된 전략을 제공하는 것입니다.

        **회원 데이터:**
        - 이름: ${member.name}
        - 총 누적 매출 (LTV): ${member.ltv.toLocaleString()}원
        - 총 누적 등록 세션 수: ${member.cumulativeTotalSessions}회
        - 총 사용 세션 수: ${member.usedSessions}회
        - 잔여 세션 수: ${remainingSessions}회
        - 마지막 수업일: ${member.lastSessionDate || '기록 없음'}
        - 전체 매출 이력:
        \`\`\`json
        ${JSON.stringify(memberSales, null, 2)}
        \`\`\`
        - 전체 수업 참여 이력:
        \`\`\`json
        ${JSON.stringify(memberSessions, null, 2)}
        \`\`\`

        **리포트 작성 지침:**

        1.  **### 회원 분석 요약:**
            *   회원의 현재 상태를 2~3 문장으로 요약합니다.
            *   LTV와 수업 참여 빈도를 바탕으로 충성도(예: VIP, 우수, 일반, 신규, 이탈 위험)를 언급하세요.
            *   세션 소진 속도에 대해 평가해주세요.

        2.  **### 재등록 가능성:**
            *   잔여 세션과 과거 행동 패턴을 기반으로 재등록 가능성을 "매우 높음", "높음", "보통", "낮음"으로 예측해주세요.

        3.  **### 맞춤형 액션 아이템:**
            *   직원이 바로 실행할 수 있는 구체적이고 개인화된 제안 2-3가지를 제시해주세요.
            *   **(잔여 세션이 적을 경우)** "재등록 시 10% 할인 또는 추가 2회 세션 제공을 제안하며 다음 예약을 유도하세요." 와 같이 구체적인 재등록 캠페인을 제안하세요.
            *   **(마지막 수업일이 오래된 경우)** "최근 방문이 뜸하신데, 불편한 점은 없으셨는지 가벼운 안부 문자를 보내 동기를 부여하세요." 처럼 이탈 방지 메시지를 제안하세요.
            *   **(LTV가 높은 VIP 고객일 경우)** "VIP 고객님께 감사의 의미로 작은 선물(음료, 보충제 샘플 등)을 제공하며 유대감을 강화하세요." 처럼 특별 관리 방안을 제안하세요.
            *   **(신규 회원일 경우)** "운동 목표는 잘 달성하고 계신지, 어려운 점은 없는지 확인하며 세심한 관리를 보여주세요." 처럼 만족도 확인을 제안하세요.

        위 내용을 바탕으로, 최종 결과물을 명확하고 읽기 쉬운 마크다운으로 작성해주세요. 제목은 \`### ${member.name}님 상세 분석 리포트\` 로 시작해주세요.
      `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

      setAnalysisResult(response.text);
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
          setError(`분석 중 오류가 발생했습니다: ${e.message}`);
      } else {
          setError(`분석 중 알 수 없는 오류가 발생했습니다: ${String(e)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
        ...prev,
        [name]: name === 'unitPrice' ? formatCurrency(value) : value
    }));
  };

  const handleSave = () => {
    if (!editedData.name.trim()) {
        alert('회원 이름은 비워둘 수 없습니다.');
        return;
    }
    onUpdateMember(member.id, {
        name: editedData.name,
        totalSessions: Number(editedData.totalSessions) || 0,
        unitPrice: parseCurrency(editedData.unitPrice)
    });
    setIsEditing(false);
  };

  const handleNewSaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
     setNewSaleData(prev => ({
        ...prev,
        [name]: name === 'unitPrice' ? formatCurrency(value) : value
    }));
  };

  const handleAddNewSale = (e: React.FormEvent) => {
      e.preventDefault();
      const classCount = parseInt(newSaleData.classCount, 10);
      const unitPrice = parseCurrency(newSaleData.unitPrice);
      if (!newSaleData.saleDate || !classCount || !unitPrice) {
          alert('모든 필드를 입력해주세요.');
          return;
      }
      onAddSale(member.id, classCount, unitPrice, newSaleData.saleDate);
      setNewSaleData({
          saleDate: new Date().toISOString().split('T')[0],
          classCount: '',
          unitPrice: ''
      });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{member.name} 회원 상세 정보</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-700">
                {isEditing ? '회원 정보 수정' : '기본 정보'}
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 p-1"
                >
                  <PencilIcon className="w-4 h-4" />
                  수정
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-600">이름</label>
                  <input type="text" name="name" id="name" value={editedData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="totalSessions" className="block text-sm font-medium text-slate-600">등록 세션 (최신)</label>
                  <input type="number" name="totalSessions" id="totalSessions" value={editedData.totalSessions} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm" min="0" />
                </div>
                <div>
                  <label htmlFor="unitPrice" className="block text-sm font-medium text-slate-600">단가 (최신, 원)</label>
                  <input type="text" inputMode="numeric" name="unitPrice" id="unitPrice" value={editedData.unitPrice} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                      <span className="font-medium text-slate-600">이름</span>
                      <span className="font-semibold text-slate-800">{member.name}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="font-medium text-slate-600">최근 등록 정보</span>
                      <span className="font-semibold text-slate-800">{member.totalSessions}회 / {member.unitPrice.toLocaleString()}원</span>
                  </div>
                   <div className="flex justify-between">
                        <span className="font-medium text-slate-600">총 누적 매출 (LTV)</span>
                        <span className="font-bold text-blue-600">{member.ltv.toLocaleString()} 원</span>
                    </div>
                     <div className="flex justify-between">
                      <span className="font-medium text-slate-600">마지막 수업일</span>
                      <span className="font-semibold text-slate-800">{member.lastSessionDate || '기록 없음'}</span>
                    </div>
              </div>
            )}
          </div>
          
          <div className={`${isEditing ? 'hidden' : 'block'} space-y-6`}>
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">개별 등록 현황 (선입선출)</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 text-sm">
                    {salesWithUsage.length > 0 ? (
                        salesWithUsage.map(sale => {
                            const progress = sale.classCount > 0 ? (sale.usedCount / sale.classCount) * 100 : 0;
                            const progressWidth = Math.min(progress, 100);
                            const lastActiveSale = [...salesWithUsage].reverse().find(s => s.usedCount < s.classCount);
                            const isActive = lastActiveSale && lastActiveSale.id === sale.id;

                            return (
                                <div key={sale.id}>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="font-semibold text-slate-700">
                                            {sale.saleDate} 등록 ({sale.classCount}회 / {sale.unitPrice.toLocaleString()}원)
                                            {isActive && <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">사용중</span>}
                                        </span>
                                        <span className="font-medium text-slate-600">{sale.usedCount} / {sale.classCount} 회</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div 
                                            className={`${isActive ? 'bg-blue-500' : 'bg-green-500'} h-2 rounded-full transition-all duration-300`} 
                                            style={{ width: `${progressWidth}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                      <p className="text-slate-500 text-center py-4">등록 내역이 없습니다.</p>
                    )}
                    <div className="!mt-4 pt-4 border-t border-slate-200">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-600">총 잔여 세션</span>
                        <span className={`${remainingSessions < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            {remainingSessions}회
                        </span>
                      </div>
                    </div>
                </div>
              </div>
              
              <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">매출 이력</h3>
                    <div className="max-h-60 overflow-y-auto bg-white rounded-lg shadow-inner border border-slate-200">
                        {memberSales.length > 0 ? (
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-100 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-3 py-2 text-left font-medium text-slate-500">
                                            <button onClick={(e) => requestSort('saleDate', e)} className="flex items-center">
                                                일자{getSortIndicator('saleDate')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left font-medium text-slate-500">
                                            <button onClick={(e) => requestSort('classCount', e)} className="flex items-center">
                                                수업 수{getSortIndicator('classCount')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left font-medium text-slate-500">
                                            <button onClick={(e) => requestSort('unitPrice', e)} className="flex items-center">
                                                단가{getSortIndicator('unitPrice')}
                                            </button>
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left font-medium text-slate-500">
                                            <button onClick={(e) => requestSort('amount', e)} className="flex items-center">
                                                금액{getSortIndicator('amount')}
                                            </button>
                                        </th>
                                        <th scope="col" className="relative px-3 py-2"><span className="sr-only">삭제</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {sortedMemberSales.map(sale => (
                                        <tr key={sale.id}>
                                            <td className="px-3 py-1 whitespace-nowrap">
                                                <input
                                                    type="date"
                                                    value={sale.saleDate}
                                                    onChange={(e) => onUpdateSale(sale.id, 'saleDate', e.target.value)}
                                                    className="w-36 p-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-3 py-1 whitespace-nowrap">
                                                <input
                                                    type="number"
                                                    value={sale.classCount}
                                                    onChange={(e) => onUpdateSale(sale.id, 'classCount', parseInt(e.target.value) || 0)}
                                                    className="w-20 p-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-3 py-1 whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={formatCurrency(sale.unitPrice)}
                                                    onChange={(e) => onUpdateSale(sale.id, 'unitPrice', parseCurrency(e.target.value))}
                                                    className="w-24 p-1 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap font-semibold text-slate-800">{sale.amount.toLocaleString()} 원</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => onDeleteSale(sale.id)}
                                                    className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                                                    aria-label={`${sale.memberName} 매출 삭제`}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-10 text-slate-500 text-sm">매출 이력이 없습니다.</div>
                        )}
                    </div>
                     {/* Add new sale form */}
                    <div className="mt-4">
                        <h4 className="text-md font-semibold text-slate-700 mb-2">신규 매출 추가</h4>
                        <form onSubmit={handleAddNewSale} className="grid grid-cols-5 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="col-span-1">
                                <label htmlFor="newSaleDate" className="block text-xs font-medium text-slate-600 mb-1">일자</label>
                                <input
                                    id="newSaleDate"
                                    name="saleDate"
                                    type="date"
                                    value={newSaleData.saleDate}
                                    onChange={handleNewSaleInputChange}
                                    className="w-full text-sm p-1.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-1">
                                <label htmlFor="newClassCount" className="block text-xs font-medium text-slate-600 mb-1">수업 수</label>
                                <input
                                    id="newClassCount"
                                    name="classCount"
                                    type="number"
                                    placeholder="예: 30"
                                    value={newSaleData.classCount}
                                    onChange={handleNewSaleInputChange}
                                    className="w-full text-sm p-1.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                    min="0"
                                />
                            </div>
                            <div className="col-span-1">
                                <label htmlFor="newUnitPrice" className="block text-xs font-medium text-slate-600 mb-1">단가</label>
                                <input
                                    id="newUnitPrice"
                                    name="unitPrice"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="예: 50,000"
                                    value={newSaleData.unitPrice}
                                    onChange={handleNewSaleInputChange}
                                    className="w-full text-sm p-1.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-slate-600 mb-1">금액</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={formatCurrency((parseInt(newSaleData.classCount,10) || 0) * parseCurrency(newSaleData.unitPrice))}
                                    className="w-full text-sm p-1.5 border border-slate-300 rounded-md bg-slate-200 cursor-not-allowed"
                                />
                            </div>
                            <div className="col-span-1">
                                <button
                                    type="submit"
                                    aria-label="신규 매출 추가"
                                    title="신규 매출 추가"
                                    className="w-10 h-10 ml-auto flex items-center justify-center bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span className="sr-only">추가</span>
                                </button>
                            </div>
                        </form>
                    </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-slate-700">AI 회원 분석</h3>
                <button
                    onClick={handleAnalysis}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            분석 중...
                        </>
                    ) : (
                    <>
                        <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                        AI 분석 보기
                    </>
                    )}
                </button>
                </div>

                {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                    <p><span className="font-bold">오류:</span> {error}</p>
                </div>
                )}

                <div className="min-h-[150px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 p-4">
                    {analysisResult && !loading ? (
                        <div className="prose prose-sm prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full p-4">
                            <SparklesIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                            <p className="font-semibold">버튼을 클릭하여 AI 분석을 시작하세요.</p>
                            <p className="text-xs mt-1">회원의 모든 기록을 바탕으로 맞춤형 관리 방안을 제안합니다.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailModal;