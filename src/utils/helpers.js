// src/utils/helpers.js

// 檢查日期是否符合篩選範圍
export const checkDateMatch = (dateRef, timeFrame, targetYear, targetMonth, targetWeekStr) => {
    if (!dateRef) return false;
    let date;
    if (dateRef.seconds) { date = new Date(dateRef.seconds * 1000); } 
    else { date = new Date(dateRef); }
    if (isNaN(date.getTime())) return false;

    if (timeFrame === 'all') return true;
    if (timeFrame === 'year') return date.getFullYear() === targetYear;
    if (timeFrame === 'month') return date.getFullYear() === targetYear && (date.getMonth() + 1) === targetMonth;
    
    if (timeFrame === 'week') {
        if (!targetWeekStr) return false;
        const [wYear, wWeek] = targetWeekStr.split('-W').map(Number);
        const simpleDate = new Date(wYear, 0, 1 + (wWeek - 1) * 7);
        const dow = simpleDate.getDay();
        const ISOweekStart = simpleDate;
        if (dow <= 4) ISOweekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
        else ISOweekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());
        const startDate = new Date(ISOweekStart);
        startDate.setHours(0,0,0,0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        return date >= startDate && date < endDate;
    }
    return false;
};

// 取得當前週次字串 (YYYY-WXX)
export const getCurrentWeekStr = () => { 
    const today = new Date(); 
    const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())); 
    const dayNum = d.getUTCDay() || 7; 
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); 
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)); 
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7); 
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`; 
};

// 安全取得日期字串 (處理 Timestamp)
export const getSafeDateStr = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val.split('T')[0];
    if (val?.toDate) return val.toDate().toISOString().split('T')[0];
    if (val instanceof Date) return val.toISOString().split('T')[0];
    return null;
};

// ★★★ 補上這個遺失的函式 ★★★
export const getContactThreshold = (level, status) => {
    if (status === 'lost') return 999;
    if (status === 'closed') return 30;
    if (status === 'commissioned') { 
        if (level === 'A') return 7; 
        if (level === 'B') return 14; 
        return 30; 
    }
    if (level === 'A') return 3; 
    if (level === 'B') return 7; 
    return 14; 
};