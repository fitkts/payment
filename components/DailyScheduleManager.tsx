import React from 'react';
import type { CalendarEvent } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import PencilIcon from './icons/PencilIcon';

interface DailyScheduleManagerProps {
    date: string;
    events: CalendarEvent[];
    onCompleteAll: (date: string) => void;
    onCompleteSession: (eventId: string) => void;
    onEditSession: (event: CalendarEvent) => void;
}

const eventStatusConfig = {
    scheduled: { text: '예정', color: 'bg-blue-100 text-blue-800' },
    completed: { text: '완료', color: 'bg-green-100 text-green-800' },
    cancelled: { text: '취소', color: 'bg-slate-100 text-slate-500' },
};

const DailyScheduleManager: React.FC<DailyScheduleManagerProps> = ({ date, events, onCompleteAll, onCompleteSession, onEditSession }) => {
    const workoutEvents = events.filter(e => e.type === 'workout');
    const scheduledEventsCount = workoutEvents.filter(e => e.status === 'scheduled').length;

    if (workoutEvents.length === 0) {
        return (
            <div className="text-center py-8 px-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <h3 className="text-lg font-medium text-slate-600">{new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}</h3>
                <p className="text-sm text-slate-500 mt-1">예정된 수업이 없습니다.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2 mb-4">
                <h3 className="text-xl font-bold text-slate-800">{new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}</h3>
                <button
                    onClick={() => onCompleteAll(date)}
                    disabled={scheduledEventsCount === 0}
                    className="flex-shrink-0 flex items-center justify-center gap-1.5 text-sm text-blue-600 font-semibold py-1 px-2 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>전체 완료 ({scheduledEventsCount})</span>
                </button>
            </div>
            <ul className="divide-y divide-slate-200">
                {workoutEvents.map(event => (
                    <li key={event.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col text-center w-16">
                                <span className="font-semibold text-slate-700">{event.startTime}</span>
                                <span className="text-xs text-slate-500">{event.endTime}</span>
                            </div>
                            <div className="font-medium text-slate-900">{event.title}</div>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${event.status ? eventStatusConfig[event.status].color : ''}`}>
                                {event.status ? eventStatusConfig[event.status].text : '상태 없음'}
                            </span>
                            <button
                                onClick={() => onEditSession(event)}
                                className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
                                title="수정"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            {event.status === 'scheduled' && (
                                <button
                                    onClick={() => onCompleteSession(event.id)}
                                    className="p-1.5 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                    title="완료 처리"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DailyScheduleManager;