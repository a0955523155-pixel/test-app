// src/utils/helpers.js

export const getDateFromFirestore = (timestamp) => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d;
    }
    return new Date();
};

export const formatDateString = (date) => {
    if (!date) return '';
    let d;
    try {
        d = getDateFromFirestore(date); 
    } catch (e) {
        return '';
    }
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getAdStatus = (startDate, endDate, now = new Date()) => {
    if (!endDate) return { daysLeft: null, percent: 0, status: 'unknown' };
    const today = new Date(now);
    today.setHours(0,0,0,0);
    const start = startDate ? new Date(startDate) : today;
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { daysLeft: null, percent: 0, status: 'unknown' };
    
    const totalDuration = end - start;
    const timeLeft = end - today;
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    
    let percent = 100;
    if (totalDuration > 0) percent = Math.max(0, Math.min(100, (1 - (timeLeft / totalDuration)) * 100));
    
    let status = 'active';
    if (daysLeft < 0) status = 'expired';
    else if (daysLeft <= 3) status = 'warning';
    
    return { daysLeft, percent, status };
};

export const getWeekRangeDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    if (isNaN(current.getTime())) return '';

    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); 
    
    const monday = new Date(current);
    monday.setDate(diff);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const format = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
    return `(${format(monday)} ~ ${format(sunday)})`;
};

export const isDateInRange = (dateStr, mode, year, month, weekDateStr) => {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    if (isNaN(target.getTime())) return false;

    if (mode === 'year') {
        return y === year;
    } else if (mode === 'month') {
        return y === year && m === month;
    } else if (mode === 'week') {
        const [wy, wm, wd] = weekDateStr.split('-').map(Number);
        const current = new Date(wy, wm - 1, wd);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        
        const monday = new Date(current);
        monday.setDate(diff);
        monday.setHours(0,0,0,0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);
        
        return target >= monday && target <= sunday;
    }
    return false;
};