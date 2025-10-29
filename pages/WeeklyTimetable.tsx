import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { WeeklyScheduleEntry, TrackedMemberWithStats, ScheduleStatus } from '../types';
import PlusIcon from '../components/icons/PlusIcon';
import MemberSearchInput from '../components/MemberSearchInput';
import XMarkIcon from '../components/icons/XMarkIcon';
import TrashIcon from '../components/icons/TrashIcon';

interface WeeklyTimetableProps {
  weeklySchedules: WeeklyScheduleEntry[];
  members: TrackedMemberWithStats[];
  onAdd: (dayOfWeek: number, startTime: string, endTime: string, memberId: string, status: ScheduleStatus) => void;
  onUpdate: (id: string, updatedData: Partial<Omit<WeeklyScheduleEntry, 'id'>>) => void;
  onDelete: (id: string) => void;
  plannedMonthlySessions: number;
}

const timeSlots = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);
const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
const dayOfWeekMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0 };

const statusConfig: Record<ScheduleStatus, { bg: string; border: string; text: string }> = {
  planned: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
};

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  members: TrackedMemberWithStats[];
  initialData?: Partial<WeeklyScheduleEntry> & { dayOfWeek: number; startTime: string };
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSave, onDelete, members, initialData }) => {
    const [selectedMember, setSelectedMember] = useState<TrackedMemberWithStats | null>(null);
    const [status, setStatus] = useState<ScheduleStatus>('planned');
    
    useEffect(() => {
        if (isOpen) {
            const member = members.find(m => m.id === initialData?.memberId) || null;
            setSelectedMember(member);
            setStatus(initialData?.status || 'planned');
        }
    }, [isOpen, initialData, members]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!selectedMember) {
            alert('회원을 선택해주세요.');
            return;
        }
        onSave({
            ...initialData,
            memberId: selectedMember.id,
            memberName: selectedMember.name,
            status,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{initialData?.id ? '수업 수정' : '수업 추가'}</h3>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4">
                    <p className="text-slate-600">{daysOfWeek[initialData!.dayOfWeek-1] || '일'}요일, {initialData!.startTime}</p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">회원</label>
                        <MemberSearchInput id="weekly-member" members={members} onMemberSelected={setSelectedMember} initialValue={selectedMember?.name || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">상태</label>
                        <select value={status} onChange={e => setStatus(e.target.value as ScheduleStatus)} className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="planned">예정</option>
                            <option value="confirmed">확정</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    {initialData?.id && onDelete ? (
                        <button onClick={() => { onDelete(initialData.id!); onClose(); }} className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center gap-2"><TrashIcon className="w-5 h-5"/>삭제</button>
                    ) : <div></div>}
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md">저장</button>
                </div>
            </div>
        </div>
    );
};

const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({ weeklySchedules, members, onAdd, onUpdate, onDelete, plannedMonthlySessions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<any>(null);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{ day: number; time: string } | null>(null);

    const schedulesByDayTime = useMemo(() => {
        const map = new Map<string, WeeklyScheduleEntry[]>();
        weeklySchedules.forEach(schedule => {
            const key = `${schedule.dayOfWeek}-${schedule.startTime}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(schedule);
        });
        return map;
    }, [weeklySchedules]);
    
    const handleCellClick = (dayOfWeek: number, startTime: string) => {
        setModalData({ dayOfWeek, startTime, endTime: `${String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0')}:00` });
        setIsModalOpen(true);
    };

    const handleEntryClick = (entry: WeeklyScheduleEntry) => {
        setModalData(entry);
        setIsModalOpen(true);
    };
    
    const handleSave = (data: any) => {
        if (data.id) { // Update
            onUpdate(data.id, { memberId: data.memberId, memberName: data.memberName, status: data.status });
        } else { // Add
            onAdd(data.dayOfWeek, data.startTime, data.endTime, data.memberId, data.status);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, entry: WeeklyScheduleEntry) => {
        e.dataTransfer.setData('application/json', JSON.stringify(entry));
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
          setDraggedItemId(entry.id);
        }, 0);
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
        setDragOverCell(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDragEnter = (dayOfWeek: number, startTime: string) => {
        setDragOverCell({ day: dayOfWeek, time: startTime });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDay: number, targetTime: string) => {
        e.preventDefault();
        setDragOverCell(null);
        const entryDataString = e.dataTransfer.getData('application/json');
        if (!entryDataString) return;

        try {
            const droppedEntry: WeeklyScheduleEntry = JSON.parse(entryDataString);
            
            const [startH, startM] = droppedEntry.startTime.split(':').map(Number);
            const [endH, endM] = droppedEntry.endTime.split(':').map(Number);
            const durationMinutes = (endH - startH) * 60 + (endM - startM);

            const [targetStartH, targetStartM] = targetTime.split(':').map(Number);
            
            const newEndMinutesTotal = targetStartH * 60 + targetStartM + durationMinutes;
            if (newEndMinutesTotal > 24 * 60) {
              return;
            }

            const newEndDate = new Date();
            newEndDate.setHours(targetStartH, targetStartM + durationMinutes, 0, 0);
            const newEndTime = `${String(newEndDate.getHours()).padStart(2, '0')}:${String(newEndDate.getMinutes()).padStart(2, '0')}`;

            if (droppedEntry.dayOfWeek !== targetDay || droppedEntry.startTime !== targetTime) {
                onUpdate(droppedEntry.id, {
                    dayOfWeek: targetDay,
                    startTime: targetTime,
                    endTime: newEndTime,
                });
            }
        } catch (error) {
            console.error("Failed to handle drop:", error);
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">주간 시간표 관리</h2>
            <p className="mb-6 text-slate-600">
                고정된 주간 수업 스케줄을 관리합니다. '확정'된 수업을 기준으로 월간 예상 수업 수가 계산됩니다.
            </p>
            <div className="mb-6 bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-700">이번 달 예상 수업 수</p>
                <p className="text-2xl font-bold text-blue-800">{plannedMonthlySessions}회</p>
            </div>
            <div className="overflow-x-auto">
                <div className="grid grid-cols-8 min-w-[800px]">
                    <div className="sticky left-0 bg-white z-10"></div>
                    {daysOfWeek.map(day => (
                        <div key={day} className="text-center font-semibold p-2 border-b-2 border-slate-200">{day}</div>
                    ))}
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="sticky left-0 bg-white z-10 p-2 text-right text-xs font-mono text-slate-500 border-r-2 border-slate-200">{time}</div>
                            {daysOfWeek.map(day => {
                                const dayNum = dayOfWeekMap[day as keyof typeof dayOfWeekMap];
                                const key = `${dayNum}-${time}`;
                                const entries = schedulesByDayTime.get(key);
                                const isDragOver = dragOverCell?.day === dayNum && dragOverCell?.time === time;

                                return (
                                    <div 
                                        key={day} 
                                        className={`relative h-20 border-b border-r border-slate-200 p-1 space-y-1 overflow-y-auto transition-colors ${isDragOver ? 'bg-blue-100' : ''}`}
                                        onClick={() => handleCellClick(dayNum, time)}
                                        onDragOver={handleDragOver}
                                        onDragEnter={() => handleDragEnter(dayNum, time)}
                                        onDrop={(e) => handleDrop(e, dayNum, time)}
                                    >
                                        {entries?.map(entry => (
                                            <div 
                                                key={entry.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, entry)}
                                                onDragEnd={handleDragEnd}
                                                onClick={(e) => { e.stopPropagation(); handleEntryClick(entry); }}
                                                className={`p-1 text-xs rounded border-l-4 cursor-move ${statusConfig[entry.status].bg} ${statusConfig[entry.status].border} ${statusConfig[entry.status].text} ${draggedItemId === entry.id ? 'opacity-30' : ''}`}
                                            >
                                                <p className="font-bold">{entry.memberName}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            {isModalOpen && (
                <ScheduleModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    onDelete={onDelete}
                    members={members}
                    initialData={modalData}
                />
            )}
        </div>
    );
};

export default WeeklyTimetable;
