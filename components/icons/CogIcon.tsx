
import React from 'react';

const CogIcon = ({ className }: { className?: string }) => (
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
      d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5"
    />
     <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6.75h.008v.008h-.008v-.008Zm0 10.5h.008v.008h-.008v-.008Zm-7.5 0h.008v.008h-.008v-.008Zm0-10.5h.008v.008h-.008v-.008Zm7.5 5.25h.008v.008h-.008v-.008Zm-7.5 0h.008v.008h-.008v-.008Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.26.713.53.967l.82-1.118a.875.875 0 0 1 1.302.247l1.288 2.229a.875.875 0 0 1-.247 1.302l-1.118.82c-.254.188-.457.493-.53.867l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.26-.713-.53-.967l-.82 1.118a.875.875 0 0 1-1.302-.247l-1.288-2.229a.875.875 0 0 1 .247-1.302l1.118-.82c.254-.188.457-.493.53-.867l.213-1.281z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
    />
  </svg>
);

export default CogIcon;
