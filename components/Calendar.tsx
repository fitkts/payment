import React, { useMemo } from 'react';
import type { CalendarEvent, CalendarEventType, DateRange } from '../types';

interface CalendarProps {
  dateRange: DateRange;
  events: CalendarEvent[];
}

const eventTypeConfig: Record<CalendarEventType, { bg: string, text: string, name: string }> = {
    new_member: { bg: 'bg-blue-500', text: 'text-white', name: '신규 회원' },
    sale: { bg: 'bg-green-500', text: 'text-white', name: '매출 발생' },
    refund: { bg: 'bg-red-500', text: 'text-white', name: '환불' },
    consultation: { bg: 'bg-yellow-500', text: 'text-black', name: '상담' },
};

const EventTag: React.FC<{event: CalendarEvent}> = ({ event }) => {
    const config = eventTypeConfig[event.type];

    return (
        <div 
            title={event.description}
            className={`flex items-center text-[11px] px-1 py-0.5 rounded truncate cursor-pointer transition-transform hover:scale-105 ${config.bg} ${config.text}`}
        >
           <span className="font-semibold truncate">{event.description}</span>
        </div>
    )
}

const Calendar: React.FC<CalendarProps> = ({ dateRange, events }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { year, month } = useMemo(() => {
    const d = dateRange.start;
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [dateRange]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
        const dateKey = event.date.split('T')[0];
        if (!map.has(dateKey)) {
            map.set(dateKey, []);
        }
        map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

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
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-600 mb-2">
            {weekdayHeaders.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
                const dayKey = day.toISOString().split('T')[0];
                const dayEvents = eventsByDate.get(dayKey) || [];
                const isCurrentMonth = day.getMonth() === month;
                const isToday = day.getTime() === today.getTime();
                
                return (
                    <div 
                        key={index}
                        className={`h-20 rounded-lg p-1 border transition-colors ${
                            isCurrentMonth ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'
                        } ${isToday ? '!border-blue-500 border-2' : ''}`}
                    >
                        <div className={`text-xs font-bold text-right ${
                            isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                        } ${isToday ? 'bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center ml-auto' : ''}`}
                        >
                            {day.getDate()}
                        </div>
                        <div className="mt-1 space-y-0.5 overflow-hidden">
                            {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                <EventTag key={eventIndex} event={event} />
                            ))}
                            {dayEvents.length > 2 && (
                                <div className="text-[10px] text-slate-500 font-medium px-1">+ {dayEvents.length - 2}개 더보기</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
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
