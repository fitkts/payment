
import React from 'react';

const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className || "w-6 h-6"}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-3.181-3.182l-3.182 3.182a8.25 8.25 0 01-11.664 0l-3.182-3.182m3.182-3.182L6.17 9.348a8.25 8.25 0 0111.664 0l3.182 3.182"
    />
  </svg>
);

export default ArrowPathIcon;
