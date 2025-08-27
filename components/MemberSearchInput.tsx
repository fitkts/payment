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
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resultsListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setInputValue(initialValue);
    if (initialValue === '') {
        setActiveIndex(-1);
    }
  }, [initialValue]);

  const filteredMembers = inputValue
    ? members.filter(member =>
        member.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [inputValue]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && resultsListRef.current) {
        const activeItem = resultsListRef.current.children[activeIndex] as HTMLLIElement;
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }
  }, [activeIndex]);

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
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showResults && filteredMembers.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prevIndex => (prevIndex + 1) % filteredMembers.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prevIndex => (prevIndex - 1 + filteredMembers.length) % filteredMembers.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0) {
                handleMemberClick(filteredMembers[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowResults(false);
            setActiveIndex(-1);
        }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setActiveIndex(-1);
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
        onKeyDown={handleKeyDown}
        onFocus={() => setShowResults(true)}
        placeholder={placeholder}
        className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-200"
        autoComplete="off"
        disabled={disabled}
      />
      {showResults && inputValue && (
        <ul ref={resultsListRef} className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member, index) => (
              <li
                key={member.id}
                onClick={() => handleMemberClick(member)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-4 py-2 text-sm text-slate-700 cursor-pointer ${
                    index === activeIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
                }`}
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