
import React from 'react';

const BronzeMedalIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9.5 2L5 5V10L9.5 7" stroke="#A16207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 2L19 5V10L14.5 7" stroke="#A16207" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="15" r="5" fill="#F59E0B"/>
    <text x="12" y="17.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#78350F">3</text>
  </svg>
);

export default BronzeMedalIcon;
