import React, { useState, useMemo, useEffect } from 'react';
import type { DateRange, CalendarEvent, ViewType } from '../types';
import DateFilterControl from '../components/DateFilterControl';
import Calendar from '../components/Calendar';
import CalendarPlusIcon from '../components/icons/CalendarPlusIcon';
import DailyScheduleManager from '../components/DailyScheduleManager';
import { startOfDay, endOfDay, formatDateISO } from '../utils';


interface ScheduleProps {
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
    events: CalendarEvent[];
    onAddScheduleClick: (date?: string) => void;
    onEditScheduleClick: (event: CalendarEvent) => void;
    handleCompleteDay: (date: string) => void;
    handleCompleteSession: (eventId: string) => void;
    handleDeleteMultipleSchedules: (eventIds: string[]) => Promise<void>;
    handleCompleteMultipleSessions: (eventIds: string[]) => Promise<void>;
}

const Schedule: React.FC<ScheduleProps> = ({ dateRange, onDateRangeChange, events, onAddScheduleClick, onEditScheduleClick, handleCompleteDay, handleCompleteSession, handleDeleteMultipleSchedules, handleCompleteMultipleSessions }) => {
    const [view, setView] = useState<ViewType>('month');
    const [selectedDate, setSelectedDate] = useState<string>(formatDateISO(new Date()));

    const eventsForSelectedDay = useMemo(() => {
        return events.filter(e => e.date.split('T')[0] === selectedDate).sort((a,b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
    }, [events, selectedDate]);
    
    // When dateRange changes from filter, if selectedDate is outside the new range, update it to be the start of the new range.
    useEffect(() => {
        const selected = new Date(selectedDate.replace(/-/g, '/'));
        selected.setHours(0, 0, 0, 0);
        
        const rangeStart = new Date(dateRange.start);
        rangeStart.setHours(0, 0, 0, 0);
        
        const rangeEnd = new Date(dateRange.end);
        rangeEnd.setHours(23, 59, 59, 999);

        if (selected < rangeStart || selected > rangeEnd) {
            setSelectedDate(formatDateISO(dateRange.start));
        }
    }, [dateRange]);


    return (
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-8">
            <section className="space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mt-1">
                            <CalendarPlusIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">스케줄 관리</h2>
                            <p className="text-slate-600 mt-1">
                                월간 이벤트를 캘린더에서 한 눈에 파악하고 관리하세요.
                            </p>
                        </div>
                    </div>
                     <button
                        onClick={() => onAddScheduleClick(selectedDate)}
                        className="flex-shrink-0 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <CalendarPlusIcon className="w-5 h-5" />
                        스케줄 추가
                      </button>
                </div>

                <DateFilterControl 
                    dateRange={dateRange} 
                    onDateRangeChange={onDateRangeChange} 
                    availableViews={['month', 'week']} 
                    currentView={view}
                    onCurrentViewChange={setView}
                />

                <div className="grid grid-cols-1 md:grid-cols-10 gap-8">
                    <div className="md:col-span-7">
                        <Calendar 
                            dateRange={dateRange} 
                            events={events} 
                            view={view} 
                            onDayClick={(dateStr) => setSelectedDate(dateStr)}
                            onEventClick={onEditScheduleClick}
                            selectedDate={selectedDate}
                        />
                    </div>
                     <div className="md:col-span-3">
                        <DailyScheduleManager
                            date={selectedDate}
                            events={eventsForSelectedDay}
                            onCompleteAll={handleCompleteDay}
                            onCompleteSession={handleCompleteSession}
                            onEditSession={onEditScheduleClick}
                            onDeleteMultipleSchedules={handleDeleteMultipleSchedules}
                            onCompleteMultipleSessions={handleCompleteMultipleSessions}
                        />
                    </div>
                </div>

            </section>
        </div>
    );
};

export default Schedule;
