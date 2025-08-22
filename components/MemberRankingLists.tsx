
import React from 'react';
import type { MemberStat } from '../types';
import Podium from './Podium';
import ArrowUpTrendingIcon from './icons/ArrowUpTrendingIcon';
import ArrowDownTrendingIcon from './icons/ArrowDownTrendingIcon';
import StarIcon from './icons/StarIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';


interface RankingCardProps {
    title: string;
    stat: MemberStat;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
}

const RankingCard: React.FC<RankingCardProps> = ({ title, stat, icon, bgColor, textColor }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-start h-full">
        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${bgColor} ${textColor}`}>
            {icon}
        </div>
        <div className="ml-4 overflow-hidden">
            <p className="text-sm font-semibold text-slate-700 truncate">{title}</p>
            {stat.name !== '없음' && stat.value !== 0 ? (
                <>
                    <p className="text-lg font-bold text-slate-900 truncate">{stat.name}</p>
                    <p className="text-sm text-slate-500">
                        {stat.value.toLocaleString()} {stat.unit}
                    </p>
                </>
            ) : (
                <p className="text-sm text-slate-500 pt-2">해당 데이터 없음</p>
            )}
        </div>
    </div>
);


interface MemberRankingListsProps {
    stats: {
        topAttendantsThisMonth: MemberStat[];
        mostImprovedMember: MemberStat;
        attendanceDropMember: MemberStat;
        topRegistrantAllTime: MemberStat;
        mostFrequentRegistrant: MemberStat;
    };
}

const MemberRankingLists: React.FC<MemberRankingListsProps> = ({ stats }) => {
    return (
        <div>
            <Podium topAttendants={stats.topAttendantsThisMonth} />
            
            <div className="mt-8">
                <h3 className="text-xl font-semibold text-slate-700 mb-3">기타 주요 랭킹</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RankingCard 
                        title="성실 개근상" 
                        stat={stats.mostImprovedMember} 
                        icon={<ArrowUpTrendingIcon className="w-6 h-6" />}
                        bgColor="bg-green-100"
                        textColor="text-green-600"
                    />
                    <RankingCard 
                        title="잠재 이탈 경고" 
                        stat={stats.attendanceDropMember} 
                        icon={<ArrowDownTrendingIcon className="w-6 h-6" />}
                        bgColor="bg-red-100"
                        textColor="text-red-600"
                    />
                    <RankingCard 
                        title="최고 누적 등록" 
                        stat={stats.topRegistrantAllTime} 
                        icon={<StarIcon className="w-6 h-6" />}
                        bgColor="bg-blue-100"
                        textColor="text-blue-600"
                    />
                    <RankingCard 
                        title="최다 재등록" 
                        stat={stats.mostFrequentRegistrant} 
                        icon={<ArrowPathIcon className="w-6 h-6" />}
                        bgColor="bg-indigo-100"
                        textColor="text-indigo-600"
                    />
                </div>
            </div>
        </div>
    )
};

export default MemberRankingLists;
