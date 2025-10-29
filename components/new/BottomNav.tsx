

import React from 'react';
import SparklesIcon from '../icons/SparklesIcon';
import UserGroupIcon from '../icons/UserGroupIcon';
import CalendarDaysIcon from '../icons/CalendarDaysIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import EllipsisHorizontalIcon from './icons/EllipsisHorizontalIcon';

type ActiveTab = 'dashboard' | 'calculator' | 'forecast' | 'statistics' | 'members' | 'schedule' | 'weekly-timetable' | 'more';

interface BottomNavProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

interface NavItemProps {
    tabName: ActiveTab;
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    label: string;
    children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ tabName, activeTab, setActiveTab, label, children }) => {
    const isActive = activeTab === tabName;
    return (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
        >
            {children}
            <span className={`text-xs font-semibold mt-1 ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>{label}</span>
        </button>
    );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-lg flex justify-around items-center z-30">
            <NavItem tabName="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="대시보드">
                <SparklesIcon className="w-6 h-6" />
            </NavItem>
            <NavItem tabName="members" activeTab={activeTab} setActiveTab={setActiveTab} label="회원관리">
                <UserGroupIcon className="w-6 h-6" />
            </NavItem>
            <NavItem tabName="schedule" activeTab={activeTab} setActiveTab={setActiveTab} label="스케줄">
                <CalendarDaysIcon className="w-6 h-6" />
            </NavItem>
            <NavItem tabName="weekly-timetable" activeTab={activeTab} setActiveTab={setActiveTab} label="시간표">
                <ClipboardDocumentListIcon className="w-6 h-6" />
            </NavItem>
            <NavItem tabName="more" activeTab={activeTab} setActiveTab={setActiveTab} label="더보기">
                <EllipsisHorizontalIcon className="w-6 h-6" />
            </NavItem>
        </nav>
    );
};

export default BottomNav;