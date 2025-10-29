import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { TrackedMember, TrackedMemberWithStats, CalendarEvent } from '../types';
import type { AddScheduleFormData } from '../hooks/useFitnessData';
import XMarkIcon from './icons/XMarkIcon';
import MemberSearchInput from './MemberSearchInput';
import CalendarPlusIcon from './icons/CalendarPlusIcon';
import { formatDateISO } from '../utils';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: { memberId: string | null; date: string | null };
  members: TrackedMemberWithStats[];
  onAddSchedule: (formData: AddScheduleFormData) => void;
  calendarEvents: CalendarEvent[];
}

const timeOptions = Array.from({ length: 30 }, (_, i) => {
    const hour = String(Math.floor(i / 2) + 7).padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
});

const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

const AddScheduleModal: React.FC<AddScheduleModalProps> = ({ isOpen, onClose, context, members, onAddSchedule, calendarEvents }) => {
    const [selectedMember, setSelectedMember] = useState<TrackedMemberWithStats | null>(null);
    const [scheduleType, setScheduleType] = useState<'single' | 'recurring'>('single');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('14:00');
    const [duration, setDuration] = useState(50);
    const [recurrence, setRecurrence] = useState<'weekly' | 'bi-weekly'>('weekly');
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
    const [endCondition, setEndCondition] = useState('occurrences');
    const [occurrences, setOccurrences] = useState('10');
    const [endDate, setEndDate] = useState('');
    
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            const member = members.find(m => m.id === context.memberId) || null;
            setSelectedMember(member);
            const initialDate = context.date || formatDateISO(new Date());
            setStartDate(initialDate);
            
            // Reset form fields
            setScheduleType('single');
            setStartTime('14:00');
            setDuration(50);
            setDaysOfWeek(context.date ? [new Date(initialDate+'T12:00:00Z').getUTCDay()] : []);
            setRecurrence('weekly');
            setEndCondition('occurrences');
            setOccurrences('10');
            const oneMonthLater = new Date(initialDate);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            setEndDate(oneMonthLater.toISOString().split('T')[0]);
        }
    }, [isOpen, context, members]);

    useEffect(() => {
    if (!isOpen) return;

    const modalNode = modalRef.current;
    if (!modalNode) return;

    const focusableElements = modalNode.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab' && focusableElements.length > 0) {
        if (e.shiftKey) { 
          if (document.activeElement === firstElement) {
            lastElement?.focus(); e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus(); e.preventDefault();
          }
        }
      }
    };
    
    setTimeout(() => firstElement?.focus(), 100);

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, scheduleType, endCondition]);
  
    const availableSessions = useMemo(() => {
        if (!selectedMember) return 0;
        const total = selectedMember.cumulativeTotalSessions || 0;
        const used = selectedMember.usedSessions || 0;
        const scheduled = selectedMember.scheduledSessions || 0;
        return total - used - scheduled;
    }, [selectedMember]);

    const existingBookingsByDate = useMemo(() => {
        const map = new Map<string, Set<string>>();
        calendarEvents.forEach(event => {
            const dateKey = event.date;
            if (!map.has(dateKey)) {
                map.set(dateKey, new Set());
            }
            
            const [startHour, startMin] = event.startTime.split(':').map(Number);
            const [endHour, endMin] = event.endTime.split(':').map(Number);
            const eventStart = new Date();
            eventStart.setHours(startHour, startMin, 0, 0);
            const eventEnd = new Date();
            eventEnd.setHours(endHour, endMin, 0, 0);

            let currentTime = new Date(eventStart);
            while(currentTime < eventEnd) {
                const timeSlot = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
                map.get(dateKey)!.add(timeSlot);
                currentTime.setMinutes(currentTime.getMinutes() + 30);
            }
        });
        return map;
    }, [calendarEvents]);
    
    const singleConflict = useMemo(() => {
        if (scheduleType !== 'single' || !startDate || !startTime) return null;
        const isBooked = existingBookingsByDate.get(startDate)?.has(startTime);
        if (isBooked) {
            return `${startDate} ${startTime}`;
        }
        return null;
    }, [scheduleType, startDate, startTime, existingBookingsByDate]);

    const recurringConflicts = useMemo(() => {
        if (scheduleType !== 'recurring' || daysOfWeek.length === 0) return [];
        
        const conflictsFound: string[] = [];
        let currentDate = new Date(`${startDate}T00:00:00`);
        const anchorDate = new Date(currentDate);
        const endDateLimit = endCondition === 'date' ? new Date(`${endDate}T00:00:00`) : null;
        let occurrencesCount = 0;

        const maxOccurrences = endCondition === 'occurrences' 
            ? Number(occurrences) 
            : (endCondition === 'sessions' ? availableSessions : 200);

        while (occurrencesCount < maxOccurrences) {
            if (endDateLimit && currentDate > endDateLimit) break;
            if (conflictsFound.length >= 5) break;

            const dayOfWeek = currentDate.getDay();
            if (daysOfWeek.includes(dayOfWeek)) {
                let shouldCheck = false;
                if (recurrence === 'weekly') {
                    shouldCheck = true;
                } else { // bi-weekly
                    const weekDiff = Math.floor((currentDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    if (weekDiff % 2 === 0) shouldCheck = true;
                }

                if (shouldCheck) {
                    const dateKey = formatDateISO(currentDate);
                    if (existingBookingsByDate.get(dateKey)?.has(startTime)) {
                        conflictsFound.push(`${dateKey} ${startTime}`);
                    }
                    occurrencesCount++;
                }
            }

            if (occurrencesCount >= 200) break;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return conflictsFound;
    }, [scheduleType, startDate, startTime, recurrence, daysOfWeek, endCondition, occurrences, endDate, existingBookingsByDate, availableSessions]);
    
    const handleDayToggle = (dayIndex: number) => {
        setDaysOfWeek(prev => 
            prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort()
        );
    };
    
    const scheduleSummary = useMemo(() => {
        if (!selectedMember) return "회원을 먼저 선택해주세요.";

        if (singleConflict) {
            return `⚠️ 스케줄 충돌: ${singleConflict}에 이미 예약이 있습니다.`;
        }

        if (recurringConflicts.length > 0) {
            const conflictMessage = `⚠️ 스케줄 충돌: ${recurringConflicts.join(', ')}에 이미 예약이 있습니다. 시간을 변경해주세요.`;
            return conflictMessage;
        }

        if (scheduleType === 'single') return `${startDate} ${startTime}에 단일 수업이 추가됩니다.`;

        if (daysOfWeek.length === 0) return "반복할 요일을 선택해주세요.";
        
        const dayStr = daysOfWeek.map(d => dayLabels[d]).join(', ');
        const recurrenceStr = recurrence === 'weekly' ? '매주' : '격주';
        let endStr = '';

        if (endCondition === 'occurrences') {
            const totalCount = Number(occurrences) || 0;
            endStr = `총 ${totalCount}회 반복됩니다.`
        } else if (endCondition === 'date') {
             endStr = `${endDate}까지 반복됩니다.`
        } else { // sessions
             const totalCount = availableSessions > 0 ? availableSessions : 0;
             endStr = `남은 ${totalCount}개의 세션을 모두 사용합니다.`
        }
        
        return `${recurrenceStr} ${dayStr}요일마다 스케줄이 생성되며, ${endStr}`;

    }, [selectedMember, scheduleType, startDate, startTime, recurrence, daysOfWeek, endCondition, occurrences, endDate, availableSessions, recurringConflicts, singleConflict]);

    const handleMemberSelected = (member: TrackedMember) => {
        const fullMember = members.find(m => m.id === member.id);
        setSelectedMember(fullMember || null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) {
            alert('회원을 선택해주세요.');
            return;
        }

        const formData: AddScheduleFormData = {
            memberId: selectedMember.id,
            type: scheduleType,
            startDate,
            startTime,
            duration,
            recurrence,
            daysOfWeek,
            endCondition: {
                type: endCondition as 'occurrences' | 'date' | 'sessions',
                value: endCondition === 'date' ? endDate : (endCondition === 'occurrences' ? Number(occurrences) : availableSessions)
            }
        };
        onAddSchedule(formData);
    };
    
    const isSubmitDisabled = !selectedMember || (scheduleType === 'recurring' && recurringConflicts.length > 0) || (scheduleType === 'single' && !!singleConflict);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-0 sm:p-4" onClick={onClose}>
            <div ref={modalRef} className="relative bg-white w-full h-full sm:rounded-2xl shadow-2xl sm:max-w-lg sm:h-auto sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 p-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">스케줄 추가</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200" aria-label="닫기"><XMarkIcon className="w-6 h-6" /></button>
                </header>
                <main className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">회원</label>
                            <MemberSearchInput id="scheduleMember" members={members} onMemberSelected={handleMemberSelected} initialValue={selectedMember?.name || ''} placeholder="-- 회원 검색 --" disabled={!!context.memberId}/>
                            {selectedMember && <p className="text-xs text-blue-600 mt-1">잔여 세션: {availableSessions}회 (사용 {selectedMember.usedSessions} / 예약 {selectedMember.scheduledSessions} / 전체 {selectedMember.cumulativeTotalSessions})</p>}
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">수업 종류</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setScheduleType('single')} className={`flex-1 py-2 rounded-md font-semibold text-sm ${scheduleType === 'single' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>단일 수업</button>
                                <button type="button" onClick={() => setScheduleType('recurring')} className={`flex-1 py-2 rounded-md font-semibold text-sm ${scheduleType === 'recurring' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>반복 수업</button>
                            </div>
                         </div>

                        <div className="grid grid-cols-3 gap-4">
                           <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">{scheduleType === 'single' ? '수업일' : '시작일'}</label>
                                <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"/>
                           </div>
                           <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-1">시작 시간</label>
                                <select id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                                    {timeOptions.map(t => {
                                        const isBooked = scheduleType === 'single' && existingBookingsByDate.get(startDate)?.has(t);
                                        return <option key={t} value={t} disabled={isBooked}>{t}{isBooked ? ' (예약됨)' : ''}</option>;
                                    })}
                                </select>
                           </div>
                           <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-slate-700 mb-1">수업 시간(분)</label>
                                <input id="duration" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} required className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" />
                           </div>
                        </div>

                        {scheduleType === 'recurring' && (
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="recurrence" className="block text-sm font-medium text-slate-700 mb-1">주기</label>
                                        <select id="recurrence" value={recurrence} onChange={e => setRecurrence(e.target.value as 'weekly' | 'bi-weekly')} className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                                            <option value="weekly">매주</option>
                                            <option value="bi-weekly">격주</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">요일</label>
                                        <div className="flex justify-between gap-1">
                                            {dayLabels.map((label, i) => (
                                                <button type="button" key={i} onClick={() => handleDayToggle(i)} className={`w-7 h-7 text-xs rounded-full ${daysOfWeek.includes(i) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{label}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">종료 조건</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="flex-1">
                                            <input type="radio" id="endOccurrences" name="endCondition" value="occurrences" checked={endCondition === 'occurrences'} onChange={() => setEndCondition('occurrences')} className="mr-2"/>
                                            <label htmlFor="endOccurrences" className="text-sm">횟수 지정</label>
                                            <input type="number" value={occurrences} onChange={e => setOccurrences(e.target.value)} disabled={endCondition !== 'occurrences'} className="w-16 ml-2 text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-200"/>
                                        </div>
                                        <div className="flex-1">
                                            <input type="radio" id="endDate" name="endCondition" value="date" checked={endCondition === 'date'} onChange={() => setEndCondition('date')} className="mr-2"/>
                                            <label htmlFor="endDate" className="text-sm">날짜 지정</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={endCondition !== 'date'} className="ml-2 text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-slate-200"/>
                                        </div>
                                        <div className="flex-1">
                                            <input type="radio" id="endSessions" name="endCondition" value="sessions" checked={endCondition === 'sessions'} onChange={() => setEndCondition('sessions')} className="mr-2" disabled={availableSessions <= 0}/>
                                            <label htmlFor="endSessions" className="text-sm">잔여 세션 모두 사용</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={`p-3 rounded-lg text-center text-sm border ${singleConflict || recurringConflicts.length > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {scheduleSummary}
                        </div>
                    </form>
                </main>
                 <footer className="flex-shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100">취소</button>
                    <button type="submit" onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400" disabled={isSubmitDisabled}>
                        <CalendarPlusIcon className="w-5 h-5"/>
                        스케줄 추가하기
                    </button>
                </footer>
            </div>
        </div>
    )
};

export default AddScheduleModal;