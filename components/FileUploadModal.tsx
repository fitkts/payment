import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { TrackedMemberWithStats, ScannedSession } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';
import DocumentArrowUpIcon from './icons/DocumentArrowUpIcon';

type Step = 'select' | 'preview' | 'loading' | 'confirm' | 'error';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSessions: (sessions: { memberId: string, sessionDate: string }[]) => void;
  trackedMembers: TrackedMemberWithStats[];
  workMonthDate: Date;
}

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const mimeType = result.split(';')[0].split(':')[1];
        const base64Data = result.split(',')[1];
        resolve({ mimeType, data: base64Data });
    };
    reader.onerror = error => reject(error);
  });
};


const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, onAddSessions, trackedMembers, workMonthDate }) => {
  const [step, setStep] = useState<Step>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scannedSessions, setScannedSessions] = useState<ScannedSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const resetState = () => {
    setStep('select');
    setError(null);
    setScannedSessions([]);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;

    const modalNode = modalRef.current;
    if (!modalNode) return;

    const focusableElements = modalNode.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusableElements.length > 0) {
        if (e.shiftKey) { 
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    setTimeout(() => firstElement?.focus(), 100);

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, step]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
      setStep('preview');
    }
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setStep('loading');
    setError(null);
    
    try {
        if (!process.env.API_KEY) {
            throw new Error('API 키가 설정되지 않았습니다.');
        }

        const { mimeType, data: base64Data } = await fileToBase64(selectedFile);
        
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(mimeType)) {
             throw new Error('지원되지 않는 파일 형식입니다. JPG, PNG, PDF 파일만 업로드할 수 있습니다.');
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const filePart = { inlineData: { mimeType, data: base64Data } };
        
        const workMonthString = `${workMonthDate.getFullYear()}-${String(workMonthDate.getMonth() + 1).padStart(2, '0')}`;
        
        const prompt = `
            이 파일은 피트니스 센터의 수업 출석부입니다. 
            파일에서 '회원 이름'과 '수업 날짜'를 추출해주세요.
            - 각 항목은 한 번의 수업(classCount: 1)을 의미합니다.
            - 모든 날짜는 ${workMonthString} 월에 속해야 합니다. 만약 연도나 월 정보가 없다면 ${workMonthString}으로 간주해주세요.
            - 날짜는 반드시 'YYYY-MM-DD' 형식으로 반환해야 합니다.
            - 이름이 명확하지 않으면 최대한 추측하여 기입해주세요.
            - 아래에 정의된 JSON 스키마에 따라 결과를 반환해주세요. 다른 텍스트는 포함하지 마세요.
        `;
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    memberName: {
                        type: Type.STRING,
                        description: '회원의 전체 이름',
                    },
                    sessionDate: {
                        type: Type.STRING,
                        description: 'YYYY-MM-DD 형식의 수업 날짜',
                    },
                },
                required: ["memberName", "sessionDate"]
            },
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [filePart, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            }
        });

        const parsedData: { memberName: string; sessionDate: string }[] = JSON.parse(response.text);

        const processedSessions = parsedData.map(item => {
            const nameToMatch = item.memberName.toLowerCase().trim();
            const matchedMember = trackedMembers.find(m => m.name.toLowerCase().trim() === nameToMatch);
            
            return {
                ...item,
                status: matchedMember ? 'matched' : 'unmatched',
                matchedId: matchedMember?.id,
                unitPrice: matchedMember?.unitPrice,
                selected: !!matchedMember,
            } as ScannedSession;
        });

        setScannedSessions(processedSessions);
        setStep('confirm');

    } catch (e: unknown) {
        console.error("AI 분석 오류:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(`AI 분석 중 오류가 발생했습니다: ${errorMessage}`);
        setStep('error');
    }
  };

  const handleToggleSelection = (index: number) => {
    setScannedSessions(prev => 
        prev.map((session, i) => 
            i === index && session.status === 'matched' ? { ...session, selected: !session.selected } : session
        )
    );
  };
  
  const handleConfirmAdd = () => {
    const sessionsToAdd = scannedSessions
      .filter(s => s.selected && s.status === 'matched' && s.matchedId)
      .map(s => ({
        memberId: s.matchedId!,
        sessionDate: s.sessionDate,
      }));
    onAddSessions(sessionsToAdd);
  };
  
  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        setStep('preview');
      }
  };


  const renderContent = () => {
    switch (step) {
      case 'select':
        return (
            <div 
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-lg text-center h-80"
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <DocumentArrowUpIcon className="w-12 h-12 text-slate-400 mb-4"/>
                <h3 className="text-xl font-semibold text-slate-800">출석부 파일 업로드</h3>
                <p className="text-slate-500 mt-1">이미지(JPG, PNG) 또는 PDF 파일을 여기에 끌어다 놓거나</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png,application/pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700">
                    파일 선택
                </button>
            </div>
        );
      case 'preview':
        return (
            <div>
                 <div className="w-full aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                    {selectedFile?.type.startsWith('image/') ? (
                        <img src={previewUrl!} alt="Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <div className="text-center p-4">
                            <DocumentArrowUpIcon className="w-12 h-12 text-slate-500 mx-auto"/>
                            <p className="font-semibold mt-2">{selectedFile?.name}</p>
                            <p className="text-sm text-slate-600">{selectedFile?.type}</p>
                        </div>
                    )}
                 </div>
                 <div className="mt-6 flex justify-center gap-4">
                    <button onClick={resetState} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow">다시 선택</button>
                    <button onClick={handleAnalyzeFile} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow">이 파일 분석</button>
                </div>
            </div>
        );
      case 'loading':
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                 <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="text-xl font-semibold text-slate-800">AI가 파일을 분석 중입니다...</h3>
                <p className="text-slate-500 mt-1">잠시만 기다려 주세요.</p>
            </div>
        );
      case 'confirm':
        return (
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">분석 결과 확인</h3>
                <p className="text-sm text-slate-600 mb-4">등록된 회원과 이름이 일치하는 항목만 추가할 수 있습니다. 추가할 세션을 선택해주세요.</p>
                <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left"><input type="checkbox" disabled /></th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-600">회원명</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-600">수업일자</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-600">상태</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {scannedSessions.map((s, i) => (
                                <tr key={i} className={s.status === 'unmatched' ? 'bg-red-50' : 'hover:bg-slate-50'}>
                                    <td className="px-4 py-2">
                                        <input type="checkbox" checked={s.selected} onChange={() => handleToggleSelection(i)} disabled={s.status === 'unmatched'} />
                                    </td>
                                    <td className="px-4 py-2 text-slate-800">{s.memberName}</td>
                                    <td className="px-4 py-2 text-slate-800">{s.sessionDate}</td>
                                    <td className="px-4 py-2">
                                        {s.status === 'matched' ? (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">일치</span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">불일치</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow">취소</button>
                    <button onClick={handleConfirmAdd} disabled={!scannedSessions.some(s => s.selected)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow disabled:bg-slate-400">
                        선택한 세션 추가
                    </button>
                </div>
            </div>
        );
      case 'error':
         return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <svg className="h-10 w-10 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-800">오류 발생</h3>
                <p className="text-slate-600 mt-2 max-w-sm">{error}</p>
                 <div className="mt-6 flex justify-center gap-4">
                    <button onClick={resetState} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow">다시 시도</button>
                    <button onClick={onClose} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow">닫기</button>
                 </div>
            </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative bg-white w-full h-full sm:rounded-2xl shadow-2xl sm:max-w-xl sm:h-auto sm:max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-blue-600"/>
            <h2 className="text-xl font-bold text-slate-800">AI 파일 스캐너</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-4 flex-1 overflow-y-auto">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default FileUploadModal;