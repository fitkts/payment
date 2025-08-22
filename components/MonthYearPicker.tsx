
import React, { useState, useEffect } from 'react';

interface MonthYearPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ selectedDate, onDateChange }) => {
  const [displayYear, setDisplayYear] = useState(selectedDate.getFullYear());

  // selectedDate가 외부에서 변경될 때 displayYear를 동기화
  useEffect(() => {
    setDisplayYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const selectedMonth = selectedDate.getFullYear() === displayYear ? selectedDate.getMonth() : -1;

  const months = Array.from({ length: 12 }, (_, i) => i);

  const handleMonthClick = (monthIndex: number) => {
    onDateChange(new Date(displayYear, monthIndex, 1));
  };

  const changeYear = (amount: number) => {
    setDisplayYear(prev => prev + amount);
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <button 
            onClick={() => changeYear(-1)} 
            className="p-2 rounded-full hover:bg-slate-200 transition-colors"
            aria-label="이전 년도"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xl font-bold text-slate-800 tabular-nums">{displayYear}년</span>
        <button 
            onClick={() => changeYear(1)} 
            className="p-2 rounded-full hover:bg-slate-200 transition-colors"
            aria-label="다음 년도"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {months.map(month => (
          <button
            key={month}
            onClick={() => handleMonthClick(month)}
            className={`py-3 px-2 rounded-lg text-center text-sm font-semibold transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              month === selectedMonth
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-white hover:bg-blue-100 text-slate-700 border border-slate-200 hover:border-blue-300'
            }`}
          >
            {month + 1}월
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthYearPicker;