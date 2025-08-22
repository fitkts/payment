
import React from 'react';

const UserGroupIcon = ({ className }: { className?: string }) => (
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
      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM10.5 1.5a9 9 0 105.25 15.085M18.75 1.5a9 9 0 10-5.25 15.085M10.5 10.5h.008v.008h-.008V10.5z"
    />
  </svg>
);

export default UserGroupIcon;
