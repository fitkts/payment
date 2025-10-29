import type { ToastInfo, CalendarEvent, EditMode, MemberSession, ForecastEntry, WeeklyScheduleEntry, SaleEntry } from '../types';
import type { SalaryDefaults } from '../components/SettingsModal';


// ===================================================================================
// 1. 여기에 배포된 Google Apps Script 웹 앱 URL을 붙여넣으세요.
// ===================================================================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxVv5FiWPaSkvSoX80q7fu4OAg58ZWysD1yG0RI3JoXqHYD7SjbA-76W4uSWaCWLH-x/exec";
// 예시: const SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";


// API POST 요청을 보내는 헬퍼 함수
async function postToAction(action: string, payload: any) {
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
        throw new Error("Google Apps Script URL이 설정되지 않았습니다. services/api.ts 파일의 SCRIPT_URL 상수를 본인의 웹 앱 URL로 교체해주세요.");
    }

    const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API POST 요청 실패: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
}

// API GET 요청을 보내는 헬퍼 함수
async function getFromAction(action: string, params: Record<string, string> = {}) {
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
        const message = "Google Apps Script URL이 설정되지 않았습니다. services/api.ts 파일의 SCRIPT_URL 상수를 본인의 웹 앱 URL로 교체해주세요.";
        console.warn(message);
        if (action === 'fetchAllData') {
             return { salaryDefaults: { baseSalary: 2100000, incentiveRate: 50, salesIncentiveRate: 0, taxEnabled: false, insurancesEnabled: false }, members: [], sales: [], sessions: [], forecastEntries: [], calendarEvents: [], weeklySchedules: [] };
        }
        throw new Error(message);
    }

    const url = new URL(SCRIPT_URL);
    url.searchParams.append('action', action);
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API GET 요청 실패: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
}


export const api = {
    fetchAllData: async (): Promise<any> => {
        return getFromAction('fetchAllData');
    },

    // Salary Defaults
    saveSalaryDefaults: (defaults: SalaryDefaults): Promise<{ success: boolean, message?: string, error?: string }> =>
        postToAction('saveSalaryDefaults', defaults),

    // Members
    addMember: (memberId: string, name: string, totalSessions: number, unitPrice: number, registrationDate: string, birthday: string, amount: number) => 
        postToAction('addMember', { memberId, name, totalSessions, unitPrice, registrationDate, birthday, amount }),
    deleteMember: (memberId: string) => 
        postToAction('deleteMember', { memberId }),
    updateMember: (memberId: string, updatedData: { name: string; totalSessions: number; unitPrice: number; }) => 
        postToAction('updateMember', { memberId, updatedData }),
    updateMemberForecastStatus: (memberId: string, status: 'manual_dormant' | 'manual_reregister' | null) =>
        postToAction('updateMemberForecastStatus', { memberId, status }),

    // Sales
    addSale: (saleId: string, memberId: string, classCount: number, amount: number, saleDate: string, paidAmount: number) =>
        postToAction('addSale', { saleId, memberId, classCount, amount, saleDate, paidAmount }),
    deleteSale: (saleId: string) =>
        postToAction('deleteSale', { saleId }),
    updateSale: (saleId: string, field: 'saleDate' | 'classCount' | 'amount' | 'paidAmount', value: string | number) =>
        postToAction('updateSale', { saleId, field, value }),
    
    // Sessions
    addSession: (sessionData: { sessionId: string, memberId: string, classCount: number, sessionDate: string, unitPrice?: number, completionSourceId?: string }): Promise<{ success: boolean, toast?: ToastInfo, error?: string }> =>
        postToAction('addSession', sessionData),
    deleteSession: (sessionId: string) =>
        postToAction('deleteSession', { sessionId }),
    updateSession: (sessionId: string, field: keyof MemberSession, value: string | number) =>
        postToAction('updateSession', { sessionId, field, value }),

    // Forecast
    addForecastEntry: (forecastId: string, memberName: string, classCount: number, amount: number, forecastDate: string) =>
        postToAction('addForecastEntry', { forecastId, memberName, classCount, amount, forecastDate }),
    deleteForecastEntry: (id: string) =>
        postToAction('deleteForecastEntry', { id }),
    updateForecastEntry: (id: string, field: keyof ForecastEntry, value: string | number) =>
        postToAction('updateForecastEntry', { id, field, value }),

    // Schedule
    addScheduleEvents: (events: CalendarEvent[]) =>
        postToAction('addScheduleEvents', { events }),
    updateScheduleEvent: (eventId: string, formData: Partial<CalendarEvent>, mode: EditMode) =>
        postToAction('updateScheduleEvent', { eventId, formData, mode }),
    deleteScheduleEvent: (eventId: string, mode: EditMode) =>
        postToAction('deleteScheduleEvent', { eventId, mode }),
    
    // Weekly Timetable
    addWeeklySchedule: (entry: WeeklyScheduleEntry) => 
        postToAction('addWeeklySchedule', { entry }),
    updateWeeklySchedule: (id: string, updatedData: Partial<Omit<WeeklyScheduleEntry, 'id'>>) =>
        postToAction('updateWeeklySchedule', { id, updatedData }),
    deleteWeeklySchedule: (id: string) =>
        postToAction('deleteWeeklySchedule', { id }),
};
