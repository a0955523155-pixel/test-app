// 檔案路徑：src/utils/shiftHelper.js

// 檢查某一天是否為工作日 (0=週日, 1=週一... 6=週六)
const isWorkDay = (date, workDays) => {
    // 如果沒有設定 workDays，預設週一到週日全排
    const days = workDays || [0, 1, 2, 3, 4, 5, 6]; 
    return days.includes(date.getDay());
};

/**
 * 計算指定日期的值班人員
 */
export const getAgentOnDuty = (roster, startDateStr, targetDateStr, workDays = [1, 2, 3, 4, 5, 6, 0]) => {
    if (!roster || roster.length === 0 || !startDateStr) return null;

    const start = new Date(startDateStr);
    const target = new Date(targetDateStr);
    
    // 如果查詢日期早於起始日，不處理
    if (target < start) return null;

    let tempDate = new Date(start);
    let shiftIndex = 0; // 當前輪值到的索引

    // 簡單的模擬推進
    while (tempDate <= target) {
        // 如果這一天是工作日，才消耗一個人員名額
        if (isWorkDay(tempDate, workDays)) {
            // 如果剛好是目標日期，回傳當前人員
            if (tempDate.toDateString() === target.toDateString()) {
                return roster[shiftIndex % roster.length];
            }
            shiftIndex++;
        }
        // 日期 +1
        tempDate.setDate(tempDate.getDate() + 1);
    }
    
    return null; 
};

/**
 * 產生未來 N 天的預覽表
 */
export const generateSchedule = (roster, startDateStr, daysCount = 30, workDays = [1, 2, 3, 4, 5, 6, 0]) => {
    if (!roster || roster.length === 0 || !startDateStr) return [];

    const schedule = [];
    let currentDate = new Date(startDateStr);
    let shiftIndex = 0;

    for (let i = 0; i < daysCount; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();
        
        let agent = null;
        let isWorking = false;

        if (isWorkDay(currentDate, workDays)) {
            agent = roster[shiftIndex % roster.length];
            shiftIndex++;
            isWorking = true;
        }

        schedule.push({
            date: dateStr,
            dayOfWeek,
            agent: agent,
            isWorking
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return schedule;
};