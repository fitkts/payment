
import React from 'react';
import GoldMedalIcon from './icons/GoldMedalIcon';
import SilverMedalIcon from './icons/SilverMedalIcon';
import BronzeMedalIcon from './icons/BronzeMedalIcon';
import TrophyIcon from './icons/TrophyIcon';
import type { MemberStat } from '../types';

interface PodiumProps {
  topAttendants: MemberStat[];
}

const PodiumItem: React.FC<{ rank: number; member: MemberStat; icon: React.ReactNode; heightClass: string; bgColor: string; orderClass: string }> = ({ rank, member, icon, heightClass, bgColor, orderClass }) => (
  <div className={`flex flex-col items-center w-1/3 ${orderClass}`}>
    <div className="flex flex-col items-center">
      {icon}
      <span className="text-lg font-bold text-slate-800 mt-2 text-center">{member.name}</span>
      <span className="text-sm font-semibold text-slate-600">{member.value}{member.unit}</span>
    </div>
    <div className={`mt-2 w-full rounded-t-lg shadow-md flex items-center justify-center ${heightClass} ${bgColor}`}>
      <span className="text-3xl font-extrabold text-white text-opacity-80">#{rank}</span>
    </div>
  </div>
);

const Podium: React.FC<PodiumProps> = ({ topAttendants }) => {
  const [first, second, third] = topAttendants;

  if (topAttendants.length === 0) {
    return (
        <div className="text-center py-10 px-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <TrophyIcon className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <h3 className="text-lg font-medium text-slate-600">이달의 출석 데이터가 부족합니다.</h3>
            <p className="text-sm text-slate-500 mt-1">세션 데이터가 기록되면 랭킹이 표시됩니다.</p>
        </div>
    );
  }

  return (
    <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
        <h3 className="text-xl font-bold text-center text-slate-800 mb-4">🏆 이달의 출석왕</h3>
        <div className="flex items-end justify-center gap-2 sm:gap-4 text-center min-h-[180px]">
            {second && (
                <PodiumItem
                    rank={2}
                    member={second}
                    icon={<SilverMedalIcon className="w-16 h-16" />}
                    heightClass="h-24"
                    bgColor="bg-slate-400"
                    orderClass="order-1"
                />
            )}
            {first && (
                <PodiumItem
                    rank={1}
                    member={first}
                    icon={<GoldMedalIcon className="w-20 h-20" />}
                    heightClass="h-32"
                    bgColor="bg-amber-400"
                    orderClass="order-2"
                />
            )}
            {third && (
                <PodiumItem
                    rank={3}
                    member={third}
                    icon={<BronzeMedalIcon className="w-14 h-14" />}
                    heightClass="h-20"
                    bgColor="bg-orange-400"
                    orderClass="order-3"
                />
            )}
        </div>
    </div>
  );
};

export default Podium;
