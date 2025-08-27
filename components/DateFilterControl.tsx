import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { DateRange, ViewType } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, formatDateISO } from '../utils';

interface DateFilterControlProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  availableViews?: ViewType[];
  currentView: ViewType;
  onCurrentViewChange: (view: ViewType) => void;
}

const defaultAvailableViews: ViewType[] = ['month', 'week', 'day', 'custom'];

const DateFilterControl: React.FC<DateFilterControlProps> = ({
  dateRange,
  onDateRangeChange,
  availableViews = defaultAvailableViews,
  currentView,
  onCurrentViewChange,
}) => {
  const [displayDate, setDisplayDate] = useState(dateRange.start);
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const viewButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  
  useEffect(() => {
    setDisplayDate(dateRange.start);
    setIsCustomPickerOpen(currentView === 'custom');
  }, [dateRange.start, currentView]);
  
  const updateRangeForView = (date: Date, view: ViewType) => {
    let newRange: DateRange;
    switch (view) {
      case 'month':
        newRange = { start: startOfMonth(date), end: endOfMonth(date) };
        break;
      case 'week':
        newRange = { start: startOfWeek(date), end: endOfWeek(date) };
        break;
      case 'day':
        newRange = { start: startOfDay(date), end: endOfDay(date) };
        break;
      default:
        return;
    }
    onDateRangeChange(newRange);
  };
  
  const handleViewChange = (view: ViewType) => {
    onCurrentViewChange(view);
    
    if (view !== 'custom') {
      const today = new Date();
      updateRangeForView(today, view);
      setDisplayDate(today);
    }
  };
  
  const handleViewKeyDown = (e: React.KeyboardEvent) => {
    const buttons = viewButtonsRef.current.filter(b => b) as HTMLButtonElement[];
    if (!buttons.length) return;

    const currentIndex = buttons.findIndex(btn => btn === document.activeElement);
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    }
    
    if (nextIndex !== currentIndex) {
      e.preventDefault();
      buttons[nextIndex].focus();
    }
  };

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    let newDisplayDate;
    if (direction === 'today') {
      newDisplayDate = new Date();
    } else {
      const amount = direction === 'prev' ? -1 : 1;
      const d = new Date(displayDate);
      switch (currentView) {
        case 'month':
          d.setMonth(d.getMonth() + amount);
          newDisplayDate = d;
          break;
        case 'week':
          d.setDate(d.getDate() + (7 * amount));
          newDisplayDate = d;
          break;
        case 'day':
          d.setDate(d.getDate() + amount);
          newDisplayDate = d;
          break;
        default:
          return;
      }
    }
    setDisplayDate(newDisplayDate);
    updateRangeForView(newDisplayDate, currentView);
  };
  
  const handleCustomDateChange = (part: 'start' | 'end', value: string) => {
    try {
      const newStart = part === 'start' ? new Date(value) : dateRange.start;
      const newEnd = part === 'end' ? new Date(value) : dateRange.end;
      if (!isNaN(newStart.getTime()) && !isNaN(newEnd.getTime()) && newStart <= newEnd) {
        newEnd.setHours(23, 59, 59, 999);
        onDateRangeChange({ start: newStart, end: newEnd });
      }
    } catch (e) { /* ignore invalid date string during typing */ }
  };
  
  const displayRangeString = useMemo(() => {
    const start = dateRange.start;
    const end = dateRange.end;
    switch (currentView) {
      case 'month':
        return `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
      case 'week':
        return `${start.toLocaleDateString('ko-KR')} - ${end.toLocaleDateString('ko-KR')}`;
      case 'day':
        return start.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      case 'custom':
        return '기간 직접 설정';
      default:
        return '';
    }
  }, [dateRange, currentView]);

  const getButtonClass = (view: ViewType) =>
    currentView === view
      ? 'bg-blue-600 text-white shadow-sm'
      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300';
  
  const viewMap: { [key in ViewType]?: string } = {
      month: '월',
      week: '주',
      day: '일',
      custom: '기간 설정',
  };

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left side: Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('today')} className="px-3 py-1.5 text-sm font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors">오늘</button>
          <div className="flex items-center">
            <button onClick={() => navigate('prev')} disabled={currentView === 'custom'} aria-label="이전" className="p-2 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
            </button>
            <span className="w-48 text-center text-md font-bold text-slate-800 tabular-nums">
              {displayRangeString}
            </span>
            <button onClick={() => navigate('next')} disabled={currentView === 'custom'} aria-label="다음" className="p-2 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRightIcon className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
        
        {/* Right side: View toggles */}
        <div onKeyDown={handleViewKeyDown} className="flex items-center gap-2 flex-wrap justify-center" role="group" aria-label="기간 보기 유형">
            {availableViews.map((view, index) => (
                <button
                    ref={el => { viewButtonsRef.current[index] = el; }}
                    key={view}
                    onClick={() => handleViewChange(view)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${getButtonClass(view)}`}
                >
                    {viewMap[view]}
                </button>
            ))}
        </div>
      </div>
      {isCustomPickerOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-center gap-2">
            <input
                type="date"
                value={formatDateISO(dateRange.start)}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="시작일"
            />
            <span className="text-slate-500">~</span>
            <input
                type="date"
                value={formatDateISO(dateRange.end)}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="종료일"
            />
        </div>
      )}
    </div>
  );
};

export default DateFilterControl;