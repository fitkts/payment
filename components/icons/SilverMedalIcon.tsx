
import React from 'react';

const SilverMedalIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9.5 2L5 5V10L9.5 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 2L19 5V10L14.5 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="15" r="5" fill="#D1D5DB"/>
    <text x="12" y="17.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#4B5563">2</text>
  </svg>
);

export default SilverMedalIcon;
