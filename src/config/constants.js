// src/config/constants.js

export const APP_NAME = "客戶追蹤測試網頁";

// 注意：這裡改回 appId (小寫開頭)，以配合 App.jsx 的引用
export const appId = "greenshootteam"; 
export const ADMIN_CODE = "77777777";
export const SUPER_ADMIN_CODE = "88888888";

export const COMMISSION_RATES = {
    COMPANY: 0.53,
    DEV_POOL: 0.55,
    SALES_POOL: 0.45
};

export const DEFAULT_SOURCES = ["FB", "帆布", "591", "小黃板", "DM", "他人介紹", "自行開發", "官方LINE", "其他"];
export const DEFAULT_CATEGORIES = ["買方", "賣方", "承租方", "出租方"];
export const DEFAULT_LEVELS = ["A", "B", "C"];

export const DEFAULT_PROJECTS = {
  "屏東工業地": ["大成工業城", "華富工業城一期", "華富工業城二期", "竹田工業城", "萬丹工業城", "弓鼎工業城"],
  "高雄工業地": ["九大工業城", "新鎮工業城", "環球工業城", "聖母工業城"],
  "高雄農地": ["松埔居", "義仁農地"]
};

export const STATUS_CONFIG = {
  new: { label: '新客戶', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  contacting: { label: '接洽中', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  offer: { label: '已收斡', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  closed: { label: '已成交', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  lost: { label: '海仔', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};
// src/config/constants.js

// ... (保留原本的 APP_NAME, APP_ID 等設定) ...

// ★★★ 新增：系統跑馬燈文字 ★★★
export const SYSTEM_ANNOUNCEMENT = "📢 歡迎使用客戶追蹤系統！系統每週一凌晨自動備份。請業務同仁記得每日更新客戶狀態，祝業績長紅！ 📢";

// ★★★ 新增：每日勉勵詞 (0=週日, 1=週一, ...) ★★★
export const DAILY_QUOTES = [
    "週日：休息是為了走更長遠的路，充電完畢，準備迎接新的一週！☀️",
    "週一：全新的開始！設定好本週目標，全力衝刺！🚀",
    "週二：堅持就是勝利，昨天的努力將在今天發芽！🌱",
    "週三：小週末，調整節奏，保持熱情，離目標更近一步！🏃",
    "週四：黎明前的堅持最重要，不要放棄任何一個潛在客戶！💪",
    "週五：最後衝刺！把本週完美的收尾，迎接美好的週末！🎉",
    "週六：回顧本週的成果，為下週的成功做好準備！📚"
];