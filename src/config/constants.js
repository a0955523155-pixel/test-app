import { Users, UserPlus, Phone, FileSignature, CheckCircle, XCircle } from 'lucide-react';

export const APP_NAME = '客戶追蹤系統';

// ★★★ 修正這裡：改回您舊的資料庫目錄名稱 ★★★
export const appId = 'greenshootteam'; 

// 註冊碼設定
export const ADMIN_CODE = '77777777';       // 行政及管理員
export const SUPER_ADMIN_CODE = '27650879'; // 經營者

// --- 預設選項 ---
export const DEFAULT_SOURCES = ["網路廣告", "路過客", "介紹", "同業", "舊客"];
export const DEFAULT_CATEGORIES = ["買方", "賣方", "承租", "出租", "合作"];
export const DEFAULT_LEVELS = ["A", "B", "C", "D"];

// --- 預設案場 ---
export const DEFAULT_PROJECTS = {
    "高雄區": ["美術1號院", "農16特區", "亞灣區"],
    "台南區": ["平實營區", "南科特區"]
};

// --- 系統預設公告 ---
export const SYSTEM_ANNOUNCEMENT = "歡迎使用客戶追蹤管理系統！祝今日業績長紅！🚀";

// --- 客戶狀態設定 ---
export const STATUS_CONFIG = {
    'new': { label: '新客戶', color: 'bg-blue-100 text-blue-800', icon: UserPlus },
    'contacting': { label: '接洽中', color: 'bg-yellow-100 text-yellow-800', icon: Phone },
    'offer': { label: '已收斡', color: 'bg-purple-100 text-purple-800', icon: FileSignature },
    'closed': { label: '已成交', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'lost': { label: '已無效', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

// --- 成交報告設定 (參數) ---
export const COMMISSION_RATES = {
    COMPANY: 0.10, // 公司抽成 10%
    DEV_POOL: 0.40, // 開發池 40%
    SALES_POOL: 0.60 // 銷售池 60%
};

// --- 每日勉勵詞 (隨機顯示) ---
export const DAILY_QUOTES = [
    "週日：休息是為了走更長遠的路，充電完畢再出發！☀️",
    "週一：全新的開始！設定好本週目標，全力以赴！🚀",
    "週二：堅持是成功的基石，今天的努力是明天的收穫！💪",
    "週三：小週末，調整節奏，保持熱情不減退！✨",
    "週四：黎明前的黑暗最深，堅持下去就能看見曙光！🌟",
    "週五：衝刺的時刻！把本週的工作完美收尾！🎉",
    "週六：回顧本週的成長，為自己的進步喝采！🥳"
];