import React, { useState, useRef } from 'react';
import { useFitnessData } from './hooks/useFitnessData';
import SalaryCalculator from './components/SalaryCalculator';
import SalesForecast from './pages/SalesForecast';
import Statistics from './pages/Statistics';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Schedule from './pages/Schedule';
import Toast from './components/Toast';
import SettingsModal from './components/SettingsModal';
import AddScheduleModal from './components/AddScheduleModal';
import EditScheduleModal from './components/EditScheduleModal';

type ActiveTab = 'dashboard' | 'calculator' | 'forecast' | 'statistics' | 'members' | 'schedule';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const navRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const {
    isLoading,
    sessions,
    sales,
    forecastEntries,
    membersWithStats,
    toastInfo,
    isSettingsModalOpen,
    isAddScheduleModalOpen,
    // FIX: Destructure isEditScheduleModalOpen from useFitnessData
    isEditScheduleModalOpen,
    // FIX: Destructure editingEvent from useFitnessData
    editingEvent,
    scheduleModalContext,
    salaryDefaults,
    baseSalary,
    incentiveRate,
    performanceBonus,
    salesIncentiveRate,
    taxEnabled,
    insurancesEnabled,
    statisticsDateRange,
    salaryStatsDateRange,
    scheduleDateRange,
    statisticsData,
    salaryStatisticsData,
    currentMonthSales,
    membersToReRegister,
    calendarEvents,
    setToastInfo,
    setIsSettingsModalOpen,
    setIsAddScheduleModalOpen,
    // FIX: Destructure setIsEditScheduleModalOpen from useFitnessData
    setIsEditScheduleModalOpen,
    // FIX: Destructure setEditingEvent from useFitnessData
    setEditingEvent,
    setScheduleModalContext,
    setBaseSalary,
    setIncentiveRate,
    setPerformanceBonus,
    setSalesIncentiveRate,
    setStatisticsDateRange,
    setSalaryStatsDateRange,
    setScheduleDateRange,
    handleToggleTax,
    handleToggleInsurances,
    handleSaveSettings,
    handleAddMember,
    handleDeleteMember,
    handleUpdateMember,
    handleAddSale,
    handleDeleteSale,
    handleUpdateSale,
    handleAddSession,
    handleDeleteSession,
    handleUpdateSession,
    handleAddForecastEntry,
    handleDeleteForecastEntry,
    handleUpdateForecastEntry,
    handleAddSchedule,
    // FIX: Destructure handleUpdateSchedule from useFitnessData
    handleUpdateSchedule,
    // FIX: Destructure handleDeleteSchedule from useFitnessData
    handleDeleteSchedule,
    handleCompleteDay,
    handleCompleteSession
  } = useFitnessData();

  const getTabClass = (tabName: ActiveTab) => {
    return activeTab === tabName
      ? 'bg-blue-600 text-white'
      : 'bg-white text-slate-600 hover:bg-slate-100';
  };
  
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const tabs = tabButtonRefs.current.filter(t => t) as HTMLButtonElement[];
    if (!tabs.length) return;

    const currentIndex = tabs.findIndex(tab => tab === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    if (nextIndex !== currentIndex) {
      e.preventDefault();
      const nextTab = tabs[nextIndex];
      nextTab.focus();
      nextTab.click(); 
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-4 text-slate-600">데이터를 불러오는 중입니다...</span>
            </div>
        );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            membersWithUsage={membersWithStats}
            forecastEntries={forecastEntries}
          />
        );
      case 'calculator':
        return (
          <SalaryCalculator
            sessions={sessions}
            allSales={sales}
            membersWithStats={membersWithStats}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onUpdateSession={handleUpdateSession}
            onShowToast={setToastInfo}
            taxEnabled={taxEnabled}
            onToggleTax={handleToggleTax}
            insurancesEnabled={insurancesEnabled}
            onToggleInsurances={handleToggleInsurances}
            baseSalary={baseSalary}
            setBaseSalary={setBaseSalary}
            incentiveRate={incentiveRate}
            setIncentiveRate={setIncentiveRate}
            performanceBonus={performanceBonus}
            setPerformanceBonus={setPerformanceBonus}
            salesIncentiveRate={salesIncentiveRate}
            setSalesIncentiveRate={setSalesIncentiveRate}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        );
      case 'forecast':
        return (
          <SalesForecast
            currentMonthSales={currentMonthSales}
            onAddSale={handleAddSale}
            onDeleteSale={handleDeleteSale}
            onUpdateSale={handleUpdateSale}
            entries={forecastEntries}
            membersToReRegister={membersToReRegister}
            trackedMembers={membersWithStats}
            onAddEntry={handleAddForecastEntry}
            onDeleteEntry={handleDeleteForecastEntry}
            onUpdateEntry={handleUpdateForecastEntry}
          />
        );
       case 'schedule':
        return (
          <Schedule
            dateRange={scheduleDateRange}
            onDateRangeChange={setScheduleDateRange}
            events={calendarEvents}
            onAddScheduleClick={(date) => {
                setScheduleModalContext({ memberId: null, date });
                setIsAddScheduleModalOpen(true);
            }}
            onEditScheduleClick={(event) => {
                setEditingEvent(event);
                setIsEditScheduleModalOpen(true);
            }}
            handleCompleteDay={handleCompleteDay}
            handleCompleteSession={handleCompleteSession}
          />
        );
      case 'statistics':
        return (
          <Statistics 
             stats={{...statisticsData, salaryStatisticsData}}
             membersToReRegister={membersToReRegister}
             dateRange={statisticsDateRange}
             onDateRangeChange={setStatisticsDateRange}
             salaryDateRange={salaryStatsDateRange}
             onSalaryDateRangeChange={setSalaryStatsDateRange}
          />
        );
      case 'members':
        return (
          <Members
             members={membersWithStats}
             onAddMember={handleAddMember}
             onDeleteMember={handleDeleteMember}
             onUpdateMember={handleUpdateMember}
             sales={sales}
             sessions={sessions}
             onAddSale={handleAddSale}
             onDeleteSale={handleDeleteSale}
             onUpdateSale={handleUpdateSale}
             onAddScheduleClick={(memberId) => {
                setScheduleModalContext({ memberId, date: new Date().toISOString().split('T')[0] });
                setIsAddScheduleModalOpen(true);
             }}
          />
        );
      default:
        return null;
    }
  };


  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <Toast 
        message={toastInfo.message} 
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: null, type: 'warning' })} 
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        defaults={salaryDefaults}
      />
      {isAddScheduleModalOpen && (
          <AddScheduleModal
            isOpen={isAddScheduleModalOpen}
            onClose={() => setIsAddScheduleModalOpen(false)}
            context={scheduleModalContext}
            members={membersWithStats}
            onAddSchedule={handleAddSchedule}
            calendarEvents={calendarEvents}
          />
      )}
      {isEditScheduleModalOpen && editingEvent && (
          <EditScheduleModal
            isOpen={isEditScheduleModalOpen}
            onClose={() => setIsEditScheduleModalOpen(false)}
            event={editingEvent}
            members={membersWithStats}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            calendarEvents={calendarEvents}
          />
      )}
      <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900">피트니스 AI 애널리틱스 대시보드</h1>
          <p className="mt-2 text-lg text-slate-600">급여 정산, 매출 예상, 회원 통계 및 AI 분석을 한번에 관리하세요.</p>
        </header>

        <nav ref={navRef} onKeyDown={handleTabKeyDown} className="mb-8 flex justify-center p-1 bg-slate-200 rounded-xl shadow-inner" role="tablist" aria-label="메인 메뉴">
          <button
            ref={el => { tabButtonRefs.current[0] = el; }}
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2.5 px-2 text-center font-semibold rounded-lg transition-all duration-300 text-sm md:text-base ${getTabClass('dashboard')}`}
            role="tab"
            aria-selected={activeTab === 'dashboard'}
          >
            AI 대시보드
          </button>
          <button
            ref={el => { tabButtonRefs.current[1] = el; }}
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2.5 px-2 text-center font-semibold rounded-lg transition-all duration-300 text-sm md:text-base ${getTabClass('members')}`}
             role="tab"
            aria-selected={activeTab === 'members'}
          >
            회원 관리
          </button>
          <button
            ref={el => { tabButtonRefs.current[2] = el; }}
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-2.5 px-2 text-center font-semibold rounded-lg transition-all duration-300 text-sm md:text-base ${getTabClass('schedule')}`}
             role="tab"
            aria-selected={activeTab === 'schedule'}
          >
            스케줄 관리
          </button>
          <button
            ref={el => { tabButtonRefs.current[3] = el; }}
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2.5 px-2 text-center font-semibold rounded-lg transition-all duration-300 text-sm md:text-base ${getTabClass('calculator')}`}
            role="tab"
            aria-selected={activeTab === 'calculator'}
          >
            급여 정산
          </button>
          <button
            ref={el => { tabButtonRefs.current[4] = el; }}
            onClick={() => setActiveTab('forecast')}
            className={`flex-1 py-2.5 px-2 text-center font-semibold rounded-lg transition-all duration-300 text-sm md:text-base ${getTabClass('forecast')}`}
            role="tab"
            aria-selected={activeTab === 'forecast'}
          >
            매출 예상
          </button>
          <button
            ref={el => { tabButtonRefs.current[5] = el; }}
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 py-2.5 px-2 text-center font-semibold rounded-lg transition-all duration-300 text-sm md:text-base ${getTabClass('statistics')}`}
             role="tab"
            aria-selected={activeTab === 'statistics'}
          >
            통계
          </button>
        </nav>

        <main>
          {renderContent()}
        </main>

        <footer className="text-center mt-8 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Fitness Management System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;