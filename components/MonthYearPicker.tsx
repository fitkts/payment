import React from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface MonthYearPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ selectedDate, onDateChange }) => {
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  const handleYearChange = (amount: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + amount);
    onDateChange(newDate);
  };

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, 15); // Use 15th to avoid month-end issues
    onDateChange(newDate);
  };
  
  const getButtonClass = (isActive: boolean) => {
    return isActive
      ? 'bg-slate-700 text-white shadow-sm'
      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300';
  };

  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="flex items-center justify-end gap-x-4 gap-y-2 flex-wrap">
      <div className="flex items-center flex-shrink-0">
        <button 
            onClick={() => handleYearChange(-1)} 
            className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="이전 연도"
        >
          <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-lg font-bold text-slate-800 tabular-nums w-20 text-center">
          {selectedYear}년
        </span>
        <button 
            onClick={() => handleYearChange(1)} 
            className="p-2 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="다음 연도"
        >
          <ChevronRightIcon className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {months.map(monthIndex => (
            <button 
                key={monthIndex}
                onClick={() => handleMonthClick(monthIndex)}
                className={`w-8 h-8 flex-shrink-0 text-sm font-semibold rounded-md transition-colors ${getButtonClass(monthIndex === selectedMonth)}`}
                aria-pressed={monthIndex === selectedMonth}
            >
                {monthIndex + 1}
            </button>
        ))}
      </div>
    </div>
  );
};

export default MonthYearPicker;
