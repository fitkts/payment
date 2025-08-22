import React, { useState, useRef, useEffect } from 'react';
import type { TrackedMember } from '../types';

interface MemberSearchInputProps {
  id: string;
  members: TrackedMember[];
  onMemberSelected: (member: TrackedMember) => void;
  onCustomInput?: (value: string) => void;
  initialValue: string;
  placeholder?: string;
  disabled?: boolean;
}

const MemberSearchInput: React.FC<MemberSearchInputProps> = ({
  id,
  members,
  onMemberSelected,
  onCustomInput,
  initialValue,
  placeholder,
  disabled,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const filteredMembers = inputValue
    ? members.filter(member =>
        member.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowResults(true);
    if (onCustomInput) {
      onCustomInput(value);
    }
  };

  const handleMemberClick = (member: TrackedMember) => {
    setInputValue(member.name);
    setShowResults(false);
    onMemberSelected(member);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-200"
        autoComplete="off"
        disabled={disabled}
      />
      {showResults && inputValue && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredMembers.length > 0 ? (
            filteredMembers.map(member => (
              <li
                key={member.id}
                onClick={() => handleMemberClick(member)}
                className="px-4 py-2 text-sm text-slate-700 hover:bg-blue-100 cursor-pointer"
              >
                {member.name}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-slate-500">
              {onCustomInput ? '새 항목으로 추가하려면 계속 입력하세요.' : '일치하는 회원이 없습니다.'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default MemberSearchInput;
