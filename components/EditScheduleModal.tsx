

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { TrackedMemberWithStats, CalendarEvent, EditMode, MemberSession } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import TrashIcon from './icons/TrashIcon';
import { formatDateISO, formatCurrency } from '../utils';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import ArrowUturnLeftIcon from './icons/ArrowUturnLeftIcon';

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent;
  members: TrackedMemberWithStats[];
  onUpdateSchedule: (eventId: string, formData: Partial<CalendarEvent>, mode: EditMode) => Promise<void>;
  onDeleteSchedule: (eventId: string, mode: EditMode) => Promise<void>;
  onCompleteSession: (eventId: string) => Promise<void>;
  onUncompleteSession: (eventId: string) => Promise<void>;
  calendarEvents: CalendarEvent[];
  allSessions: MemberSession[];
}

const timeOptions = Array.from({ length: 30 }, (_, i) => {
    const hour = String(Math.floor(i / 2) + 7).padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
});

const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ isOpen, onClose, event, members, onUpdateSchedule, onDeleteSchedule, onCompleteSession, onUncompleteSession, calendarEvents, allSessions }) => {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(50);
    const [editMode, setEditMode] = useState<EditMode>('single');
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const member = useMemo(() => members.find(m => m.id === event.memberId), [members, event.memberId]);

    const memberSessions = useMemo(() => {
        if (!event.memberId) return [];
        return allSessions
            .filter(s => s.memberId === event.memberId)
            .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
            .slice(0, 5); // Show last 5 sessions
    }, [allSessions, event.memberId]);

    useEffect(() => {
        if (isOpen) {
            setDate(event.date);
            setStartTime(event.startTime);
            const start = new Date(`1970-01-01T${event.startTime}:00`);
            const end = new Date(`1970-01-01T${event.endTime}:00`);
            const diffMinutes = (end.getTime() - start.getTime()) / 60000;
            setDuration(diffMinutes > 0 ? diffMinutes : 50);
            setEditMode('single');
            setIsConfirmingDelete(false);
        }
    }, [isOpen, event]);
    
     useEffect(() => {
        if (!isOpen) return;
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'Tab' && focusableElements.length > 0) {
                if (e.shiftKey) { 
                    if (document.activeElement === firstElement) { lastElement?.focus(); e.preventDefault(); }
                } else {
                    if (document.activeElement === lastElement) { firstElement?.focus(); e.preventDefault(); }
                }
            }
        };
        
        setTimeout(() => firstElement?.focus(), 100);
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, editMode, isConfirmingDelete]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const [h, m] = startTime.split(':').map(Number);
        const newEndTime = new Date();
        newEndTime.setHours(h, m + duration);
        
        const formData = {
            date,
            startTime,
            endTime: `${String(newEndTime.getHours()).padStart(2, '0')}:${String(newEndTime.getMinutes()).padStart(2, '0')}`
        };
        await onUpdateSchedule(event.id, formData, editMode);
        onClose();
    };

    const handleDelete = () => {
        setIsConfirmingDelete(true);
    };
    
    const handleConfirmDelete = async () => {
        await onDeleteSchedule(event.id, editMode);
        onClose();
    };

    const handleComplete = async () => {
        await onCompleteSession(event.id);
        onClose();
    };

    const handleUncomplete = async () => {
        await onUncompleteSession(event.id);
        onClose();
    };


    const confirmMessage = useMemo(() => {
        return editMode === 'single' 
            ? '이 스케줄을 정말 삭제하시겠습니까?' 
            : (editMode === 'future' 
                ? '이 스케줄 및 향후 모든 반복 스케줄을 삭제하시겠습니까?' 
                : '전체 반복 시리즈를 삭제하시겠습니까?');
    }, [editMode]);

    if (!isOpen || !member) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-0 sm:p-4" onClick={onClose}>
            <div ref={modalRef} className="relative bg-white w-full h-full sm:rounded-2xl shadow-2xl sm:max-w-lg sm:h-auto sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">스케줄 수정</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200" aria-label="닫기"><XMarkIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto flex-1">
                    {isConfirmingDelete && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg" role="alert">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-bold text-red-800">삭제 확인</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{confirmMessage}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <fieldset disabled={isConfirmingDelete} className="space-y-6">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">회원</label>
                                <input type="text" value={member.name} readOnly className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md bg-slate-100 text-slate-500 cursor-not-allowed"/>
                             </div>

                            <div className="grid grid-cols-3 gap-4">
                               <div>
                                    <label htmlFor="editDate" className="block text-sm font-medium text-slate-700 mb-1">수업일</label>
                                    <input id="editDate" type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm bg-white"/>
                               </div>
                               <div>
                                    <label htmlFor="editStartTime" className="block text-sm font-medium text-slate-700 mb-1">시작 시간</label>
                                    <select id="editStartTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm bg-white">
                                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                               </div>
                               <div>
                                    <label htmlFor="editDuration" className="block text-sm font-medium text-slate-700 mb-1">수업 시간(분)</label>
                                    <input id="editDuration" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} required className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm bg-white" />
                               </div>
                            </div>

                            {event.recurrenceId && (
                                <div className="pt-4 border-t border-slate-200">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">반복 일정 수정 옵션</label>
                                    <div className="space-y-2 text-sm">
                                        <div><input type="radio" id="editSingle" name="editMode" value="single" checked={editMode === 'single'} onChange={() => setEditMode('single')} className="mr-2"/><label htmlFor="editSingle">이 일정만 변경</label></div>
                                        <div><input type="radio" id="editFuture" name="editMode" value="future" checked={editMode === 'future'} onChange={() => setEditMode('future')} className="mr-2"/><label htmlFor="editFuture">이 일정 및 향후 일정 모두 변경</label></div>
                                        <div><input type="radio" id="editAll" name="editMode" value="all" checked={editMode === 'all'} onChange={() => setEditMode('all')} className="mr-2"/><label htmlFor="editAll">시리즈 전체 변경</label></div>
                                    </div>
                                </div>
                            )}
                        </fieldset>
                         {!isConfirmingDelete && memberSessions.length > 0 && (
                            <div className="pt-4 border-t border-slate-200">
                                <h3 className="text-sm font-medium text-slate-700 mb-2">{member.name}님 최근 수업 이력</h3>
                                <ul className="space-y-2 text-xs text-slate-600">
                                    {memberSessions.map(session => (
                                        <li key={session.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                            <span>{session.sessionDate}</span>
                                            <span>{session.classCount}회</span>
                                            <span className="font-semibold">{formatCurrency((session.unitPrice || 0) * (session.classCount || 0))} 원</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </form>
                </main>
                 <footer className="flex-shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    {isConfirmingDelete ? (
                         <>
                            <span className="text-sm font-medium text-red-700 sr-only">삭제 확인</span>
                            <div className="flex-1 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100">취소</button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                >
                                    <TrashIcon className="w-4 h-4"/>
                                    삭제 확인
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                           <div className="flex gap-2">
                                {event.type === 'workout' && event.status === 'scheduled' && (
                                    <button type="button" onClick={handleComplete} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-600 rounded-md hover:bg-green-100">
                                        <CheckCircleIcon className="w-4 h-4"/> 완료 처리
                                    </button>
                                )}
                                {event.type === 'workout' && event.status === 'completed' && (
                                     <button type="button" onClick={handleUncomplete} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-yellow-600 rounded-md hover:bg-yellow-100">
                                        <ArrowUturnLeftIcon className="w-4 h-4"/> 예정으로
                                    </button>
                                )}
                                <button type="button" onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-100">
                                    <TrashIcon className="w-4 h-4"/> 삭제
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100">취소</button>
                                <button type="submit" onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    <CheckCircleIcon className="w-5 h-5"/>
                                    변경 사항 저장
                                </button>
                            </div>
                        </>
                    )}
                </footer>
            </div>
        </div>
    )
};

export default EditScheduleModal;