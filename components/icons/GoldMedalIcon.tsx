
import React from 'react';

const GoldMedalIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9.5 2L5 5V10L9.5 7" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 2L19 5V10L14.5 7" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="15" r="5" fill="#FBBF24"/>
    <path d="M12 12.5L13.1126 14.594L15.4271 14.9385L13.7148 16.516L14.1251 18.8115L12 17.65L9.87494 18.8115L10.2852 16.516L8.57294 14.9385L10.8874 14.594L12 12.5Z" fill="#FFFBEB"/>
  </svg>
);

export default GoldMedalIcon;
