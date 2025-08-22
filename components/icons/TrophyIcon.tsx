
import React from 'react';

const TrophyIcon = ({ className }: { className?: string }) => (
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
      d="M16.5 18.75h-9a9.75 9.75 0 01-4.874-1.971A2.25 2.25 0 012.626 13.34l.923-1.428a2.25 2.25 0 013.414-.502l.923 1.428 1.082-1.658a2.25 2.25 0 013.414 0l1.082 1.658.923-1.428a2.25 2.25 0 013.414.502l.923 1.428a2.25 2.25 0 01-.502 3.414A9.75 9.75 0 0116.5 18.75z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15.75l-1.24-4.337a4.5 4.5 0 013.48-5.356l2.528-.505A4.5 4.5 0 0121.75 9.75v.75c0 1.953-1.02 3.738-2.616 4.755L15 16.5m-3 0v2.25m0-2.25-1.5-1.5m1.5 1.5-1.5 1.5m0-1.5-1.5-1.5m1.5 1.5L9 16.5"
    />
  </svg>
);

export default TrophyIcon;
