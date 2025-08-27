

import type { TrackedMember, SaleEntry, MemberSession, ForecastEntry, TrackedMemberWithStats, ToastInfo, CalendarEvent, EditMode } from '../types';

// In-memory database simulation with initial data
const db: {
  members: TrackedMember[];
  sales: SaleEntry[];
  sessions: MemberSession[];
  forecastEntries: ForecastEntry[];
  calendarEvents: CalendarEvent[];
} = {
  members: [
    { id: 'member-1', name: '오건강', totalSessions: 30, usedSessions: 0, unitPrice: 50000 },
    { id: 'member-2', name: '김체력', totalSessions: 20, usedSessions: 0, unitPrice: 55000 },
    { id: 'member-3', name: '박활력', totalSessions: 50, usedSessions: 0, unitPrice: 48000 },
    { id: 'member-4', name: '이근육', totalSessions: 25, usedSessions: 0, unitPrice: 52000 },
  ],
  sales: [],
  sessions: [],
  forecastEntries: [
    { id: 'forecast-1', memberName: '최신규', classCount: 20, unitPrice: 52000, amount: 1040000 },
    { id: 'forecast-2', memberName: '정예상', classCount: 30, unitPrice: 50000, amount: 1500000 },
  ],
  calendarEvents: [],
};

// --- Initialize DB with relational data ---
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

db.members.forEach(member => {
    // Create initial sale for each member
    const saleDate = new Date(currentYear, currentMonth - 2, Math.floor(Math.random() * 28) + 1);
    const saleDateStr = saleDate.toISOString().split('T')[0];
    db.sales.push({
        id: `sale-${member.id}`,
        saleDate: saleDateStr,
        memberId: member.id,
        memberName: member.name,
        classCount: member.totalSessions,
        unitPrice: member.unitPrice,
        amount: member.totalSessions * member.unitPrice,
    });
    db.calendarEvents.push({ id: crypto.randomUUID(), date: saleDateStr, type: 'new_member', title: `신규: ${member.name}`, memberId: member.id, startTime: '00:00', endTime: '00:00' });


    // Create some session data
    const usedCount = Math.floor(Math.random() * (member.totalSessions - 2)) + 2; // Use 2 to (total-2) sessions
    for (let i = 0; i < usedCount; i++) {
        const sessionDate = new Date(currentYear, currentMonth - 1, Math.floor(Math.random() * 28) + 1);
        db.sessions.push({
            id: crypto.randomUUID(),
            sessionDate: sessionDate.toISOString().split('T')[0],
            memberId: member.id,
            memberName: member.name,
            classCount: 1,
            unitPrice: member.unitPrice,
        });
    }
});

// Add some workout events to the calendar
const todayStr = new Date().toISOString().split('T')[0];
db.calendarEvents.push({id: crypto.randomUUID(), date: todayStr, type: 'workout', title: '오건강', memberId: 'member-1', startTime: '14:00', endTime: '15:00', status: 'scheduled' });


const simulateLatency = <T>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 300));

// This function calculates stats on the fly, simulating what a backend would do.
const calculateMemberStats = (): TrackedMemberWithStats[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    return db.members.map(member => {
        const memberSales = db.sales.filter(s => s.memberId === member.id);
        const memberSessions = db.sessions.filter(s => s.memberId === member.id);
        const scheduledWorkoutEvents = db.calendarEvents.filter(e => e.memberId === member.id && e.type === 'workout' && e.status === 'scheduled');


        const ltv = memberSales.reduce((sum, sale) => sum + sale.amount, 0);
        const cumulativeTotalSessions = memberSales.reduce((sum, sale) => sum + sale.classCount, 0);
        const usedSessions = memberSessions.reduce((sum, session) => sum + session.classCount, 0);
        const scheduledSessions = scheduledWorkoutEvents.length;
        
        const lastSession = [...memberSessions].sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())[0];

        // This ensures the main member object's data is also up-to-date
        const latestSale = [...memberSales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())[0];

        return {
            id: member.id,
            name: member.name,
            totalSessions: latestSale ? latestSale.classCount : member.totalSessions,
            unitPrice: latestSale ? latestSale.unitPrice : member.unitPrice,
            usedSessions, // This is calculated from sessions, not stored on member
            scheduledSessions,
            ltv,
            cumulativeTotalSessions,
            lastSessionDate: lastSession ? lastSession.sessionDate : undefined,
        };
    });
};

export const api = {
    fetchAllData: async () => {
        const membersWithStats = calculateMemberStats();
        return simulateLatency({
            members: membersWithStats,
            sales: db.sales,
            sessions: db.sessions,
            forecastEntries: db.forecastEntries,
            calendarEvents: db.calendarEvents,
        });
    },

    // Members
    addMember: async (name: string, totalSessions: number, unitPrice: number) => {
        const newMember: TrackedMember = { id: crypto.randomUUID(), name, totalSessions, usedSessions: 0, unitPrice };
        db.members.push(newMember);
        
        const saleDate = new Date().toISOString().split('T')[0];
        const newSale: SaleEntry = { id: crypto.randomUUID(), saleDate, memberId: newMember.id, memberName: name, classCount: totalSessions, unitPrice, amount: totalSessions * unitPrice };
        db.sales.push(newSale);
        
        const newCalendarEvent: CalendarEvent = { id: crypto.randomUUID(), date: saleDate, type: 'new_member', title: `신규: ${name}`, memberId: newMember.id, startTime: '00:00', endTime: '00:00' };
        db.calendarEvents.push(newCalendarEvent);

        return simulateLatency({ newMember, newSale, newCalendarEvent });
    },
    deleteMember: async (memberId: string) => {
        db.members = db.members.filter(m => m.id !== memberId);
        db.sales = db.sales.filter(s => s.memberId !== memberId);
        db.sessions = db.sessions.filter(s => s.memberId !== memberId);
        db.calendarEvents = db.calendarEvents.filter(e => e.memberId !== memberId);
        return simulateLatency({ success: true });
    },
    updateMember: async (memberId: string, updatedData: { name: string; totalSessions: number; unitPrice: number; }) => {
        // This is tricky. Updating a "member" record should probably update the *latest* sale.
        const memberSales = db.sales.filter(s => s.memberId === memberId).sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
        if (memberSales.length > 0) {
            const latestSaleId = memberSales[0].id;
            db.sales = db.sales.map(s => {
                if (s.id === latestSaleId) {
                    const newSale = { ...s, classCount: updatedData.totalSessions, unitPrice: updatedData.unitPrice, amount: updatedData.totalSessions * updatedData.unitPrice };
                    return newSale;
                }
                return s;
            });
        }
        db.members = db.members.map(m => m.id === memberId ? { ...m, name: updatedData.name, unitPrice: updatedData.unitPrice, totalSessions: updatedData.totalSessions } : m);

        return simulateLatency({ success: true });
    },

    // Sales
    addSale: async (memberId: string, classCount: number, amount: number, saleDate: string) => {
        const member = db.members.find(m => m.id === memberId);
        if (!member) throw new Error("Member not found");
        const unitPrice = classCount > 0 ? Math.floor(amount / classCount) : 0;
        const newSale: SaleEntry = { id: crypto.randomUUID(), saleDate, memberId, memberName: member.name, classCount, unitPrice, amount };
        db.sales.push(newSale);
        return simulateLatency(newSale);
    },
    deleteSale: async (saleId: string) => {
        db.sales = db.sales.filter(s => s.id !== saleId);
        return simulateLatency({ success: true });
    },
    updateSale: async (saleId: string, field: 'saleDate' | 'classCount' | 'amount', value: string | number) => {
       db.sales = db.sales.map(s => {
           if (s.id === saleId) {
               const newSale = { ...s, [field]: value };
               if (field === 'classCount' || field === 'amount') {
                  newSale.unitPrice = newSale.classCount > 0 ? Math.floor(newSale.amount / newSale.classCount) : 0;
               }
               return newSale;
           }
           return s;
       });
       return simulateLatency({ success: true });
    },
    
    // Sessions
    addSession: async (sessionData: { memberId: string, classCount: number, sessionDate: string, unitPrice?: number }) => {
        const { memberId, classCount, sessionDate, unitPrice } = sessionData;

        const member = db.members.find(m => m.id === memberId);
        if (!member) return simulateLatency({ success: false, error: "회원을 찾을 수 없습니다." });

        const memberSales = db.sales.filter(s => s.memberId === memberId).sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
        if (memberSales.length === 0 && unitPrice === undefined) { 
            return simulateLatency({ success: false, error: "매출 기록이 없어 단가를 계산할 수 없습니다. 세션을 추가할 수 없습니다." });
        }

        const previouslyUsedSessions = db.sessions.filter(s => s.memberId === memberId).reduce((sum, s) => sum + s.classCount, 0);
        let sessionsToAllocate = classCount;
        let cumulativeSessionsFromSales = 0;
        const newSessions: Omit<MemberSession, 'id'>[] = [];
        let toast: ToastInfo | null = null;

        if (unitPrice !== undefined) {
            newSessions.push({ sessionDate, memberId, memberName: member.name, classCount, unitPrice });
        } else {
            for (const sale of memberSales) {
                if (sessionsToAllocate <= 0) break;
                const saleEndSessionCount = cumulativeSessionsFromSales + sale.classCount;
                const startPointForAllocation = Math.max(cumulativeSessionsFromSales, previouslyUsedSessions);
                if (startPointForAllocation < saleEndSessionCount) {
                    const availableSlots = saleEndSessionCount - startPointForAllocation;
                    const sessionsToTake = Math.min(sessionsToAllocate, availableSlots);
                    if (sessionsToTake > 0) {
                        newSessions.push({ sessionDate, memberId, memberName: member.name, classCount: sessionsToTake, unitPrice: sale.unitPrice });
                        sessionsToAllocate -= sessionsToTake;
                    }
                }
                cumulativeSessionsFromSales += sale.classCount;
            }

            if (sessionsToAllocate > 0) {
                const lastSale = memberSales[memberSales.length - 1];
                newSessions.push({ sessionDate, memberId, memberName: member.name, classCount: sessionsToAllocate, unitPrice: lastSale.unitPrice });
                toast = { message: `잔여 세션을 초과하여 ${sessionsToAllocate}개의 세션이 추가되었습니다.`, type: 'warning' };
            }
        }

        if (newSessions.length > 0) {
            const createdSessions = newSessions.map(s => ({...s, id: crypto.randomUUID()}));
            db.sessions.push(...createdSessions);
        }

        return simulateLatency({ success: true, toast });
    },
    deleteSession: async (sessionId: string) => {
        db.sessions = db.sessions.filter(s => s.id !== sessionId);
        return simulateLatency({ success: true });
    },
    updateSession: async (sessionId: string, field: keyof MemberSession, value: string | number) => {
        db.sessions = db.sessions.map(s => s.id === sessionId ? { ...s, [field]: value } : s);
        return simulateLatency({ success: true });
    },

    // Forecast
    addForecastEntry: async (memberName: string, classCount: number, amount: number) => {
        const unitPrice = classCount > 0 ? Math.floor(amount / classCount) : 0;
        const newEntry: ForecastEntry = { id: crypto.randomUUID(), memberName, classCount, unitPrice, amount };
        db.forecastEntries.push(newEntry);
        return simulateLatency(newEntry);
    },
    deleteForecastEntry: async (id: string) => {
        db.forecastEntries = db.forecastEntries.filter(e => e.id !== id);
        return simulateLatency({ success: true });
    },
    updateForecastEntry: async (id: string, field: keyof ForecastEntry, value: string | number) => {
        db.forecastEntries = db.forecastEntries.map(e => {
            if (e.id === id) {
                const updatedEntry = { ...e, [field]: value };
                if (field === 'classCount' || field === 'amount') {
                    const count = Number(updatedEntry.classCount);
                    const amount = Number(updatedEntry.amount);
                    updatedEntry.unitPrice = count > 0 ? Math.floor(amount / count) : 0;
                }
                return updatedEntry;
            }
            return e;
        });
        return simulateLatency({ success: true });
    },

    // Schedule
    addScheduleEvents: async (events: Omit<CalendarEvent, 'id'>[]) => {
        const newEvents = events.map(e => ({
            ...e,
            id: crypto.randomUUID(),
            ...(e.type === 'workout' && { status: 'scheduled' as const })
        }));
        db.calendarEvents.push(...newEvents);
        return simulateLatency(newEvents);
    },
    updateScheduleEvent: async (eventId: string, formData: Partial<CalendarEvent>, mode: EditMode) => {
        const targetEvent = db.calendarEvents.find(e => e.id === eventId);
        if (!targetEvent) return simulateLatency({ success: false });

        const updatedData = {
            date: formData.date || targetEvent.date,
            startTime: formData.startTime || targetEvent.startTime,
            endTime: formData.endTime || targetEvent.endTime,
        };
        
        if (mode === 'single' || !targetEvent.recurrenceId) {
             db.calendarEvents = db.calendarEvents.map(e => e.id === eventId ? { ...e, ...updatedData } : e);
        } else {
            const seriesEvents = db.calendarEvents.filter(e => e.recurrenceId === targetEvent.recurrenceId);
            const pivotDate = new Date(targetEvent.date);
            
            seriesEvents.forEach(event => {
                const eventDate = new Date(event.date);
                if (mode === 'all' || (mode === 'future' && eventDate >= pivotDate)) {
                    const originalEvent = db.calendarEvents.find(e => e.id === event.id);
                    if (originalEvent) {
                        Object.assign(originalEvent, updatedData);
                    }
                }
            });
        }
        return simulateLatency({ success: true });
    },
    deleteScheduleEvent: async (eventId: string, mode: EditMode) => {
        const targetEvent = db.calendarEvents.find(e => e.id === eventId);
        if (!targetEvent) return simulateLatency({ success: false });
        
        if (mode === 'single' || !targetEvent.recurrenceId) {
            db.calendarEvents = db.calendarEvents.filter(e => e.id !== eventId);
        } else {
            const seriesEvents = db.calendarEvents.filter(e => e.recurrenceId === targetEvent.recurrenceId);
            const pivotDate = new Date(targetEvent.date);
            const idsToDelete = new Set<string>();

            seriesEvents.forEach(event => {
                const eventDate = new Date(event.date);
                 if (mode === 'all' || (mode === 'future' && eventDate >= pivotDate)) {
                    idsToDelete.add(event.id);
                }
            });
            db.calendarEvents = db.calendarEvents.filter(e => !idsToDelete.has(e.id));
        }
        return simulateLatency({ success: true });
    },
    completeScheduledEvents: async (eventIds: string[]) => {
        const eventsToComplete = db.calendarEvents.filter(e => 
            eventIds.includes(e.id) && 
            e.type === 'workout' && 
            e.status === 'scheduled'
        );

        const newSessions: MemberSession[] = [];
        
        for (const event of eventsToComplete) {
            const sessionExists = db.sessions.some(s => s.completionSourceId === event.id);
            if (sessionExists) {
                console.warn(`Session for event ${event.id} already exists. Skipping session creation.`);
                continue;
            }

            const member = db.members.find(m => m.id === event.memberId);
            if (!member) continue;

            const memberSales = db.sales.filter(s => s.memberId === event.memberId).sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
            const previouslyUsedSessions = db.sessions.filter(s => s.memberId === event.memberId).reduce((sum, s) => sum + s.classCount, 0);
            
            let unitPrice = member.unitPrice;
            let cumulativeSessionsFromSales = 0;
            
            for (const sale of memberSales) {
                const saleEndSessionCount = cumulativeSessionsFromSales + sale.classCount;
                if (previouslyUsedSessions < saleEndSessionCount) {
                    unitPrice = sale.unitPrice;
                    break;
                }
                cumulativeSessionsFromSales += sale.classCount;
            }

            const newSession: MemberSession = {
                id: crypto.randomUUID(),
                sessionDate: event.date,
                memberId: event.memberId,
                memberName: event.title,
                classCount: 1,
                unitPrice: unitPrice,
                completionSourceId: event.id,
            };
            newSessions.push(newSession);
        }
        
        db.sessions.push(...newSessions);
        
        db.calendarEvents = db.calendarEvents.map(e => {
            if (eventIds.includes(e.id)) {
                return { ...e, status: 'completed' };
            }
            return e;
        });

        return simulateLatency({ success: true, addedCount: newSessions.length });
    },
};