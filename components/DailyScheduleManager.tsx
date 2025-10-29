import React, { useState } from 'react';
import type { CalendarEvent, CalendarEventType } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import PencilIcon from './icons/PencilIcon';
import { formatTimeToHHMM } from '../utils';
import XMarkIcon from './icons/XMarkIcon';
import TrashIcon from './icons/TrashIcon';

interface DailyScheduleManagerProps {
    date: string;
    events: CalendarEvent[];
    onCompleteAll: (date: string) => void;
    onCompleteSession: (eventId: string) => void;
    onEditSession: (event: CalendarEvent) => void;
    onDeleteMultipleSchedules: (eventIds: string[]) => Promise<void>;
    onCompleteMultipleSessions: (eventIds: string[]) => Promise<void>;
}

const eventTypeConfig: Record<CalendarEventType, { bg: string, text: string, name: string }> = {
    new_member: { bg: 'bg-indigo-100', text: 'text-indigo-800', name: '신규 회원' },
    sale: { bg: 'bg-green-100', text: 'text-green-800', name: '매출 발생' },
    workout: { bg: 'bg-blue-100', text: 'text-blue-800', name: '수업' },
    refund: { bg: 'bg-red-100', text: 'text-red-800', name: '환불' },
    consultation: { bg: 'bg-yellow-100', text: 'text-yellow-800', name: '상담' },
};

const eventStatusConfig = {
    scheduled: { text: '예정', color: 'bg-blue-100 text-blue-800' },
    completed: { text: '완료', color: 'bg-green-100 text-green-800' },
    cancelled: { text: '취소', color: 'bg-slate-100 text-slate-500' },
};

const DailyScheduleManager: React.FC<DailyScheduleManagerProps> = ({ date, events, onCompleteAll, onCompleteSession, onEditSession, onDeleteMultipleSchedules, onCompleteMultipleSessions }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

    const scheduledEventsCount = events.filter(e => e.type === 'workout' && e.status === 'scheduled').length;

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        setSelectedEvents([]);
    };

    const handleSelectEvent = (eventId: string) => {
        setSelectedEvents(prev =>
            prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedEvents.length === 0) return;
        if (window.confirm(`${selectedEvents.length}개의 스케줄을 삭제하시겠습니까?`)) {
            try {
                await onDeleteMultipleSchedules(selectedEvents);
                toggleEditMode();
            } catch (e) {
                console.error("Failed to delete selected schedules", e);
                // Error toast is already handled by the hook
            }
        }
    };

    const handleCompleteSelected = async () => {
        if (selectedEvents.length === 0) return;
        await onCompleteMultipleSessions(selectedEvents);
        toggleEditMode();
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-8 px-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 h-full flex flex-col justify-center">
                <h3 className="text-lg font-medium text-slate-600">{new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}</h3>
                <p className="text-sm text-slate-500 mt-1">예정된 이벤트가 없습니다.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 relative pb-20">
            <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2 mb-4">
                <h3 className="text-xl font-bold text-slate-800">{new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}</h3>
                {!isEditing && scheduledEventsCount > 0 && (
                    <button
                        onClick={() => onCompleteAll(date)}
                        className="flex-shrink-0 flex items-center justify-center gap-1.5 text-sm text-blue-600 font-semibold py-1 px-2 rounded-md hover:bg-blue-50 transition-colors"
                    >
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>전체 완료 ({scheduledEventsCount})</span>
                    </button>
                )}
                 {!isEditing && (
                    <button onClick={toggleEditMode} className="flex-shrink-0 flex items-center justify-center gap-1.5 text-sm text-slate-600 font-semibold py-1 px-2 rounded-md hover:bg-slate-100 transition-colors">
                        <PencilIcon className="w-4 h-4"/>
                        <span>편집</span>
                    </button>
                 )}
                  {isEditing && (
                    <button onClick={toggleEditMode} className="flex-shrink-0 flex items-center justify-center gap-1.5 text-sm text-blue-600 font-semibold py-1 px-2 rounded-md hover:bg-blue-50 transition-colors">
                        <XMarkIcon className="w-4 h-4"/>
                        <span>취소</span>
                    </button>
                 )}
            </div>
            <ul className="divide-y divide-slate-200">
                {events.map(event => {
                    const isSelected = selectedEvents.includes(event.id);
                    if (event.type === 'workout') {
                        return (
                            <li key={event.id} className={`py-3 transition-colors ${isSelected ? 'bg-blue-50' : ''}`} onClick={() => isEditing && handleSelectEvent(event.id)}>
                                <div className="flex items-start gap-3">
                                    {isEditing && <input type="checkbox" checked={isSelected} onChange={() => handleSelectEvent(event.id)} onClick={(e) => e.stopPropagation()} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white"/>}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-bold text-slate-800">{formatTimeToHHMM(event.startTime)}</span>
                                                <span className="text-sm text-slate-500">~ {formatTimeToHHMM(event.endTime)}</span>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${event.status ? eventStatusConfig[event.status].color : ''}`}>
                                                {event.status ? eventStatusConfig[event.status].text : '상태 없음'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-slate-900">{event.title}</span>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {!isEditing && (
                                                    <>
                                                        <button onClick={() => onEditSession(event)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-full" title="수정"><PencilIcon className="w-4 h-4" /></button>
                                                        {event.status === 'scheduled' && (
                                                            <button onClick={() => onCompleteSession(event.id)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-full" title="완료 처리"><CheckCircleIcon className="w-5 h-5" /></button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    } else {
                         return (
                            <li key={event.id} className="py-3">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-slate-800">{formatTimeToHHMM(event.startTime)}</span>
                                        {event.endTime && <span className="text-sm text-slate-500">~ {formatTimeToHHMM(event.endTime)}</span>}
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${eventTypeConfig[event.type].bg} ${eventTypeConfig[event.type].text}`}>
                                        {eventTypeConfig[event.type].name}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-slate-900">{event.title}</span>
                                </div>
                            </li>
                        );
                    }
                })}
            </ul>
             {isEditing && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-sm border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-semibold text-blue-700">{selectedEvents.length}개 선택됨</span>
                    <div className="flex gap-2">
                        <button onClick={handleDeleteSelected} disabled={selectedEvents.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md disabled:bg-slate-400">
                            <TrashIcon className="w-4 h-4"/> 삭제
                        </button>
                        <button onClick={handleCompleteSelected} disabled={selectedEvents.length === 0 || selectedEvents.some(id => events.find(e => e.id === id)?.status !== 'scheduled')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md disabled:bg-slate-400">
                           <CheckCircleIcon className="w-4 h-4"/> 완료
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyScheduleManager;
