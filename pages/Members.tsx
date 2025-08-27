
import React, { useState } from 'react';
import type { TrackedMemberWithStats, SaleEntry, MemberSession } from '../types';
import AddTrackedMemberForm from '../components/AddTrackedMemberForm';
import MemberStatsTable from '../components/MemberStatsTable';
import MemberDetailModal from '../components/MemberDetailModal';

interface MembersProps {
    members: TrackedMemberWithStats[];
    onAddMember: (name: string, totalSessions: number, unitPrice: number) => void;
    onDeleteMember: (id: string) => void;
    onUpdateMember: (id: string, data: { name: string; totalSessions: number; unitPrice: number; }) => void;
    sales: SaleEntry[];
    sessions: MemberSession[];
    onAddSale: (memberId: string, classCount: number, amount: number, saleDate: string) => void;
    onDeleteSale: (id: string) => void;
    onUpdateSale: (id: string, field: 'saleDate' | 'classCount' | 'amount', value: string | number) => void;
    onAddScheduleClick: (memberId: string) => void;
}

const Members: React.FC<MembersProps> = ({ members, onAddMember, onDeleteMember, onUpdateMember, sales, sessions, onAddSale, onDeleteSale, onUpdateSale, onAddScheduleClick }) => {
    const [selectedMember, setSelectedMember] = useState<TrackedMemberWithStats | null>(null);

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
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">전체 회원 목록</h3>
                    <MemberStatsTable
                        members={members}
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
