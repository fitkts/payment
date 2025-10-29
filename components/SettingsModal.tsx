import React, { useState, useEffect, useRef } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import { formatCurrency, parseCurrency } from '../utils';

export interface SalaryDefaults {
  baseSalary: number;
  incentiveRate: number;
  salesIncentiveRate: number;
  taxEnabled: boolean;
  insurancesEnabled: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (defaults: SalaryDefaults) => void;
  defaults: SalaryDefaults;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, defaults }) => {
  const [settings, setSettings] = useState<SalaryDefaults>({
    ...defaults,
    baseSalary: defaults.baseSalary, // ensure it's a number for state
  });
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setSettings(defaults);
    }
  }, [isOpen, defaults]);

  useEffect(() => {
    if (!isOpen) return;

    const modalNode = modalRef.current;
    if (!modalNode) return;

    const focusableElements = modalNode.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusableElements.length > 0) {
        if (e.shiftKey) { // Shift+Tab
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    firstElement?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else {
      const parsedValue = name === 'baseSalary' ? parseCurrency(value) : parseInt(value, 10) || 0;
      setSettings(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative bg-white w-full h-full sm:rounded-2xl shadow-2xl sm:max-w-md sm:h-auto sm:max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">기본값 설정</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label htmlFor="baseSalary" className="block text-sm font-medium text-slate-600 mb-1">
              기본급 (원)
            </label>
            <input
              id="baseSalary"
              name="baseSalary"
              type="text"
              inputMode="numeric"
              value={formatCurrency(settings.baseSalary)}
              onChange={(e) => setSettings(prev => ({ ...prev, baseSalary: parseCurrency(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100"
            />
          </div>
          <div>
            <label htmlFor="incentiveRate" className="block text-sm font-medium text-slate-600 mb-1">
              수업 인센티브 (%)
            </label>
            <input
              id="incentiveRate"
              name="incentiveRate"
              type="number"
              value={settings.incentiveRate}
              onChange={handleInputChange}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label htmlFor="salesIncentiveRate" className="block text-sm font-medium text-slate-600 mb-1">
              매출 인센티브 (%)
            </label>
            <input
              id="salesIncentiveRate"
              name="salesIncentiveRate"
              type="number"
              value={settings.salesIncentiveRate}
              onChange={handleInputChange}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100"
              min="0"
              max="100"
            />
          </div>
          <div className="border-t border-slate-200 pt-4 space-y-3">
             <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-600">4대 보험 기본 적용</span>
                <div className="relative">
                    <input type="checkbox" name="insurancesEnabled" className="sr-only" checked={settings.insurancesEnabled} onChange={handleInputChange} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${settings.insurancesEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.insurancesEnabled ? 'transform translate-x-6' : ''}`}></div>
                </div>
            </label>
             <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-600">사업소득세 기본 적용</span>
                <div className="relative">
                    <input type="checkbox" name="taxEnabled" className="sr-only" checked={settings.taxEnabled} onChange={handleInputChange} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${settings.taxEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.taxEnabled ? 'transform translate-x-6' : ''}`}></div>
                </div>
            </label>
          </div>
        </main>
        <footer className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            저장
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;