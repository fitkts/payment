import React, { useMemo } from 'react';
import type { CalendarEvent, CalendarEventType, DateRange, ViewType } from '../types';
import { startOfWeek, formatDateISO, formatTimeToHHMM } from '../utils';
import CheckCircleIcon from './icons/CheckCircleIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import PencilIcon from './icons/PencilIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

interface CalendarProps {
  dateRange: DateRange;
  events: CalendarEvent[];
  view: ViewType;
  onDayClick: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  selectedDate?: string;
}

interface CalendarViewProps {
    dateRange: DateRange;
    eventsByDate: Map<string, CalendarEvent[]>;
    onDayClick: (date: string) => void;
    onEventClick: (event: CalendarEvent) => void;
    selectedDate?: string;
}

const eventTypeConfig: Record<CalendarEventType, { bg: string, text: string, name: string }> = {
    new_member: { bg: 'bg-indigo-100', text: 'text-indigo-800', name: '신규 회원' },
    sale: { bg: 'bg-green-100', text: 'text-green-800', name: '매출 발생' },
    workout: { bg: 'bg-blue-100', text: 'text-blue-800', name: '수업' },
    refund: { bg: 'bg-red-100', text: 'text-red-800', name: '환불' },
    consultation: { bg: 'bg-yellow-100', text: 'text-yellow-800', name: '상담' },
};

const EventTag: React.FC<{event: CalendarEvent, onClick: (e: React.MouseEvent) => void}> = ({ event, onClick }) => {
    const config = eventTypeConfig[event.type];
    
    const titleText = event.type === 'workout' 
        ? `${formatTimeToHHMM(event.startTime)} ${event.title}` 
        : event.title;

    let visualIndicator: React.ReactNode = null;
    let containerClasses = `flex items-center text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-transform hover:scale-105 ${config.bg} ${config.text}`;
    let titleElement = <span className="font-semibold truncate">{titleText}</span>;
    const iconClass = "w-3 h-3 mr-1 flex-shrink-0";

    switch (event.type) {
        case 'workout':
            if (event.status === 'completed') {
                visualIndicator = <CheckCircleIcon className={iconClass} />;
                containerClasses = `flex items-center text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-transform hover:scale-105 bg-green-100 text-green-800`;
            } else if (event.status === 'cancelled') {
                titleElement = <s className="font-semibold truncate">{titleText}</s>;
                containerClasses = `flex items-center text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer bg-slate-100 text-slate-500`;
            } else {
                 visualIndicator = <ClipboardDocumentListIcon className={iconClass} />;
            }
            break;
        case 'new_member':
            visualIndicator = <UserPlusIcon className={iconClass} />;
            break;
        case 'sale':
            visualIndicator = <BanknotesIcon className={iconClass} />;
            break;
        case 'refund':
            visualIndicator = <ExclamationTriangleIcon className={iconClass} />;
            break;
        case 'consultation':
            visualIndicator = <PencilIcon className={iconClass} />;
            break;
        default:
            break;
    }

    return (
        <div 
            title={titleText}
            onClick={onClick}
            onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onClick(e as any);}}
            tabIndex={0}
            role="button"
            className={containerClasses}
        >
           {visualIndicator}
           {titleElement}
        </div>
    )
}

const MonthView: React.FC<CalendarViewProps> = ({ dateRange, eventsByDate, onDayClick, onEventClick, selectedDate }) => {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const { year, month } = useMemo(() => {
        const d = dateRange.start;
        return { year: d.getFullYear(), month: d.getMonth() };
    }, [dateRange]);

    const calendarDays = useMemo(() => {
        const days = [];
        const firstDayOfMonth = new Date(year, month, 1);
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay()); // Start from Sunday of the first week

        for (let i = 0; i < 42; i++) { // 6 weeks for a consistent grid
            days.push(new Date(startDate));
            startDate.setDate(startDate.getDate() + 1);
        }
        return days;
    }, [year, month]);

    const weekdayHeaders = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-600 mb-2">
                {weekdayHeaders.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const dayKey = formatDateISO(day);
                    const dayEvents = eventsByDate.get(dayKey) || [];
                    const isCurrentMonth = day.getMonth() === month;
                    const isToday = day.getTime() === today.getTime();
                    const isSelected = dayKey === selectedDate;
                    
                    return (
                        <div 
                            key={index}
                            onClick={() => onDayClick(dayKey)}
                            className={`h-28 rounded-lg p-1 border transition-colors cursor-pointer hover:bg-slate-100 ${
                                isCurrentMonth ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'
                            } ${isToday ? '!border-blue-500 border-2' : ''} ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
                        >
                            <div className={`text-xs font-bold text-right ${
                                isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                            } ${isToday ? 'bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center ml-auto' : ''}`}
                            >
                                {day.getDate()}
                            </div>
                            <div className="mt-1 space-y-0.5 overflow-hidden">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <EventTag key={event.id} event={event} onClick={(e) => { e.stopPropagation(); onEventClick(event); }} />
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-[10px] text-slate-500 font-medium px-1">+ {dayEvents.length - 3}개 더보기</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const WeekView: React.FC<CalendarViewProps> = ({ dateRange, eventsByDate, onDayClick, onEventClick, selectedDate }) => {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const weekDays = useMemo(() => {
        const start = startOfWeek(dateRange.start);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [dateRange.start]);

    return (
        <div>
            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, index) => {
                    const dayKey = formatDateISO(day);
                    const dayEvents = eventsByDate.get(dayKey) || [];
                    const isToday = day.getTime() === today.getTime();
                    const isSelected = dayKey === selectedDate;
                    
                    return (
                        <div key={index} onClick={() => onDayClick(dayKey)} className={`rounded-lg p-2 border cursor-pointer hover:bg-slate-50 ${isToday ? 'border-blue-500 bg-blue-50' : 'bg-white border-slate-200'} ${isSelected ? 'ring-2 ring-blue-600 ring-offset-1' : ''} min-h-[12rem]`}>
                            <div className={`text-center font-semibold mb-2 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                                {day.toLocaleDateString('ko-KR', { weekday: 'short', day: 'numeric' })}
                            </div>
                            <div className="space-y-1">
                                {dayEvents.length > 0 ? dayEvents.map((event) => (
                                    <EventTag key={event.id} event={event} onClick={(e) => { e.stopPropagation(); onEventClick(event); }} />
                                )) : <div className="text-xs text-slate-400 text-center pt-4">이벤트 없음</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Calendar: React.FC<CalendarProps> = ({ dateRange, events, view, onDayClick, onEventClick, selectedDate }) => {
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
        const dateKey = event.date.split('T')[0];
        if (!map.has(dateKey)) {
            map.set(dateKey, []);
        }
        map.get(dateKey)!.push(event);
    });
    // Sort events within each day
    map.forEach((dayEvents, dateKey) => {
        dayEvents.sort((a,b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
    });
    return map;
  }, [events]);

  const renderView = () => {
      switch(view) {
          case 'week':
              return <WeekView dateRange={dateRange} eventsByDate={eventsByDate} onDayClick={onDayClick} onEventClick={onEventClick} selectedDate={selectedDate} />;
          case 'month':
          default:
              return <MonthView dateRange={dateRange} eventsByDate={eventsByDate} onDayClick={onDayClick} onEventClick={onEventClick} selectedDate={selectedDate} />;
      }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
        {renderView()}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
             <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${eventTypeConfig.workout.bg}`}></span>
                <span>{eventTypeConfig.workout.name}</span>
            </div>
             <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${eventTypeConfig.new_member.bg}`}></span>
                <span>{eventTypeConfig.new_member.name}</span>
            </div>
             <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${eventTypeConfig.sale.bg}`}></span>
                <span>{eventTypeConfig.sale.name}</span>
            </div>
             <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${eventTypeConfig.refund.bg}`}></span>
                <span className="text-slate-400">{eventTypeConfig.refund.name} (미구현)</span>
            </div>
             <div className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${eventTypeConfig.consultation.bg}`}></span>
                <span className="text-slate-400">{eventTypeConfig.consultation.name} (미구현)</span>
            </div>
        </div>
    </div>
  );
};

export default Calendar;