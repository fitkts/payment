import React, { useEffect, useState } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface ToastProps {
  message: string | null;
  type: 'warning' | 'success';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'warning', onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, type]);

  const handleClose = () => {
    setVisible(false);
    // Allow animation to finish before calling onClose
    setTimeout(onClose, 300); 
  };
  
  if (!message) return null;

  const isSuccess = type === 'success';

  const icon = isSuccess 
    ? <CheckCircleIcon className="h-6 w-6 text-green-500" /> 
    : <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />;
  
  const title = isSuccess ? '성공' : '재등록 알림';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-5 right-5 z-50 w-full max-w-sm transform transition-all duration-300 ease-in-out ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{message}</p>
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="sr-only">닫기</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
