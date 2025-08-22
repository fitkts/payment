import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { TrackedMemberWithStats, ScannedSession } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';

type Step = 'camera' | 'preview' | 'loading' | 'confirm' | 'error';

interface CameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSessions: (sessions: { memberId: string, sessionDate: string }[]) => void;
  trackedMembers: TrackedMemberWithStats[];
  workMonthDate: Date;
}

const CameraScanModal: React.FC<CameraScanModalProps> = ({ isOpen, onClose, onAddSessions, trackedMembers, workMonthDate }) => {
  const [step, setStep] = useState<Step>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannedSessions, setScannedSessions] = useState<ScannedSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("카메라 접근 오류:", err);
      setError('카메라에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.');
      setStep('error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep('camera');
      setError(null);
      setScannedSessions([]);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);
  
  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      setStep('preview');
      stopCamera();
    }
  };

  const handleRetake = () => {
    setStep('camera');
    startCamera();
  };

  const handleUsePhoto = async () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg');

    setStep('loading');
    setError(null);
    
    try {
        if (!process.env.API_KEY) {
            throw new Error('API 키가 설정되지 않았습니다.');
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: dataUrl.split(',')[1],
            },
        };
        
        const workMonthString = `${workMonthDate.getFullYear()}-${String(workMonthDate.getMonth() + 1).padStart(2, '0')}`;
        
        const prompt = `
            이 이미지는 피트니스 센터의 수업 출석부입니다. 
            이미지에서 '회원 이름'과 '수업 날짜'를 추출해주세요.
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
            contents: { parts: [imagePart, { text: prompt }] },
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

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                 <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="text-xl font-semibold text-slate-800">AI가 이미지를 분석 중입니다...</h3>
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
                    <button onClick={handleRetake} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow">다시 시도</button>
                    <button onClick={onClose} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow">닫기</button>
                 </div>
            </div>
        );
      default:
        return null;
    }
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-blue-600"/>
            <h2 className="text-xl font-bold text-slate-800">AI 세션 스캐너</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-4 overflow-y-auto">
          {(step === 'camera' || step === 'preview') && (
            <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${step === 'camera' ? 'block' : 'hidden'}`}
              ></video>
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-contain ${step === 'preview' ? 'block' : 'hidden'}`}
              ></canvas>
              
              {step === 'camera' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <button onClick={handleTakePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500"></button>
                </div>
              )}
              {step === 'preview' && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4 z-10">
                  <button onClick={handleRetake} className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow">다시 찍기</button>
                  <button onClick={handleUsePhoto} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow">이 사진 사용</button>
                </div>
              )}
            </div>
          )}
          {step !== 'camera' && step !== 'preview' && renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CameraScanModal;