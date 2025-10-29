import React, { useState, useMemo } from 'react';
import type { TrackedMemberWithStats, SaleEntry, MemberSession } from '../types';
import AddTrackedMemberForm from '../components/AddTrackedMemberForm';
import MemberStatsTable from '../components/MemberStatsTable';
import MemberDetailModal from '../components/MemberDetailModal';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import { RE_REGISTRATION_THRESHOLD } from '../constants';

interface MembersProps {
    members: TrackedMemberWithStats[];
    onAddMember: (name: string, totalSessions: number, amount: number, registrationDate: string, birthday: string) => void;
    onDeleteMember: (id: string) => void;
    onUpdateMember: (id: string, data: { name: string; totalSessions: number; unitPrice: number; }) => void;
    sales: SaleEntry[];
    sessions: MemberSession[];
    onAddSale: (memberId: string, classCount: number, amount: number, saleDate: string, paidAmount: number) => void;
    onDeleteSale: (id: string) => void;
    onUpdateSale: (id: string, field: 'saleDate' | 'classCount' | 'amount' | 'paidAmount', value: string | number) => void;
    onAddScheduleClick: (memberId: string) => void;
}

const filterOptions = [
    { id: 'all', label: '전체' },
    { id: 'active', label: '활성 회원' },
    { id: 'inactive', label: '비활성 회원' },
    { id: 'low-sessions', label: '세션 임박' },
];

const Members: React.FC<MembersProps> = ({ members, onAddMember, onDeleteMember, onUpdateMember, sales, sessions, onAddSale, onDeleteSale, onUpdateSale, onAddScheduleClick }) => {
    const [selectedMember, setSelectedMember] = useState<TrackedMemberWithStats | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const handleMemberClick = (member: TrackedMemberWithStats) => {
        setSelectedMember(member);
    };

    const handleCloseModal = () => {
        setSelectedMember(null);
    };

    const handleAddScheduleAndCloseDetail = (memberId: string) => {
        onAddScheduleClick(memberId);
        handleCloseModal();
    };

    const filteredMembers = useMemo(() => {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        let tempMembers = members;

        // Apply filter
        switch (activeFilter) {
            case 'active':
                tempMembers = tempMembers.filter(m => m.lastSessionDate && new Date(m.lastSessionDate) >= twoMonthsAgo);
                break;
            case 'inactive':
                tempMembers = tempMembers.filter(m => {
                    const remainingSessions = (m.cumulativeTotalSessions || 0) - (m.usedSessions || 0);
                    return remainingSessions > 0 && (!m.lastSessionDate || new Date(m.lastSessionDate) < twoMonthsAgo);
                });
                break;
            case 'low-sessions':
                tempMembers = tempMembers.filter(m => {
                    const remainingSessions = (m.cumulativeTotalSessions || 0) - (m.usedSessions || 0);
                    return remainingSessions >= 0 && remainingSessions <= RE_REGISTRATION_THRESHOLD;
                });
                break;
            default: // 'all'
                break;
        }

        // Apply search term
        if (!searchTerm.trim()) {
            return tempMembers;
        }

        return tempMembers.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [members, searchTerm, activeFilter]);


    return (
        <>
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">회원 등록 및 관리</h2>
                    <p className="text-slate-600">
                        신규 회원을 등록하거나 기존 회원의 상세 정보를 확인하고 관리합니다.
                    </p>
                </div>

                <AddTrackedMemberForm onAddMember={onAddMember} />

                <div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">전체 회원 목록</h3>
                    
                    <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white rounded-lg border border-slate-200">
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="회원 이름 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full">
                            {filterOptions.map(option => (
                                <button
                                key={option.id}
                                onClick={() => setActiveFilter(option.id)}
                                className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-full transition-colors ${
                                    activeFilter === option.id
                                    ? 'bg-white text-black shadow'
                                    : 'text-slate-700 hover:bg-slate-200'
                                }`}
                                >
                                {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <MemberStatsTable
                        members={filteredMembers}
                        onDeleteMember={onDeleteMember}
                        onMemberClick={handleMemberClick}
                    />
                </div>
            </div>

            {selectedMember && (
                <MemberDetailModal 
                    member={selectedMember}
                    allSales={sales}
                    allSessions={sessions}
                    onClose={handleCloseModal}
                    onUpdateMember={onUpdateMember}
                    onAddSale={onAddSale}
                    onDeleteSale={onDeleteSale}
                    onUpdateSale={onUpdateSale}
                    onAddScheduleClick={handleAddScheduleAndCloseDetail}
                />
            )}
        </>
    );
};

export default Members;