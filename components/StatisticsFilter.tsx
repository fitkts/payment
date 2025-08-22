import React, { useState, useEffect } from 'react';
import type { DateRange } from '../types';

interface StatisticsFilterProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const formatDate = (date: Date): string => {
    try {
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
}

const StatisticsFilter: React.FC<StatisticsFilterProps> = ({ dateRange, setDateRange }) => {
  const [activePreset, setActivePreset] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'>('thisMonth');
  const [customRange, setCustomRange] = useState({ start: formatDate(dateRange.start), end: formatDate(dateRange.end) });

  useEffect(() => {
    // Sync custom range if external dateRange changes (e.g., initial load)
    const newStart = formatDate(dateRange.start);
    const newEnd = formatDate(dateRange.end);
    if (newStart !== customRange.start || newEnd !== customRange.end) {
        setCustomRange({ start: newStart, end: newEnd });
        // Also try to match a preset
        const today = new Date();
        const thisMonthStart = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
        if (newStart === thisMonthStart) {
            setActivePreset('thisMonth');
        } else {
            setActivePreset('custom');
        }
    }
  }, [dateRange]);

  const setPreset = (preset: 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    let start: Date, end: Date;

    switch (preset) {
      case 'thisMonth':
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0);
        break;
      case 'thisYear':
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
        break;
    }
    end.setHours(23, 59, 59, 999);
    setDateRange({ start, end });
    setActivePreset(preset);
  };

  const handleCustomDateChange = (part: 'start' | 'end', value: string) => {
    const newCustomRange = { ...customRange, [part]: value };
    setCustomRange(newCustomRange);
    
    try {
      const newStart = new Date(newCustomRange.start);
      const newEnd = new Date(newCustomRange.end);
      if(!isNaN(newStart.getTime()) && !isNaN(newEnd.getTime()) && newStart <= newEnd) {
        newEnd.setHours(23, 59, 59, 999); // Ensure end date includes the whole day
        setDateRange({ start: newStart, end: newEnd });
        setActivePreset('custom');
      }
    } catch(e) {
        // ignore invalid date during typing
    }
  };

  const getButtonClass = (preset: string) => {
    return activePreset === preset
      ? 'bg-slate-700 text-white'
      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300';
  };

  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-700 mr-2">기간:</span>
                <button onClick={() => setPreset('thisMonth')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${getButtonClass('thisMonth')}`}>이번 달</button>
                <button onClick={() => setPreset('lastMonth')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${getButtonClass('lastMonth')}`}>지난 달</button>
                <button onClick={() => setPreset('thisYear')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${getButtonClass('thisYear')}`}>올해</button>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={customRange.start}
                    onChange={(e) => handleCustomDateChange('start', e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black text-white"
                    style={{ colorScheme: 'dark' }}
                    aria-label="시작일"
                />
                <span className="text-slate-500">~</span>
                <input
                    type="date"
                    value={customRange.end}
                    onChange={(e) => handleCustomDateChange('end', e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-black text-white"
                    style={{ colorScheme: 'dark' }}
                    aria-label="종료일"
                />
            </div>
        </div>
    </div>
  );
};

export default StatisticsFilter;