// src/utils/industryHelper.js

export const detectIndustry = (inputText) => {
    if (!inputText) return [];

    const text = inputText.toLowerCase();
    const suggestions = new Set();

    // ★★★ 定義行業別與關鍵字映射表 ★★★
    const MAPPINGS = [
        {
            category: "農林漁牧",
            keywords: ["蛋", "雞", "鴨", "鵝", "畜", "牧", "農", "養殖", "飼料", "肥料", "植", "花", "果", "菜", "豬", "牛", "羊", "魚", "蝦", "洗選"]
        },
        {
            category: "食品餐飲",
            keywords: ["食", "餐", "飲", "飯", "麵", "茶", "咖啡", "酒", "烘焙", "點心", "蛋糕", "糖", "飲料", "小吃", "加工", "冷凍", "洗選"]
        },
        {
            category: "批發零售",
            keywords: ["商行", "百貨", "超商", "超市", "賣場", "批發", "零售", "代購", "團購", "電商", "網拍", "貿易", "進出口", "雜貨"]
        },
        {
            category: "製造業",
            keywords: ["工廠", "製造", "加工", "金屬", "塑膠", "橡膠", "電子", "機械", "設備", "零件", "模具", "鋼", "鐵", "鋁", "五金", "紡織", "印刷"]
        },
        {
            category: "營建工程",
            keywords: ["營造", "建設", "工程", "水電", "裝潢", "設計", "土木", "建築", "室內", "油漆", "磁磚", "防水", "門窗", "玻璃", "鐵工"]
        },
        {
            category: "運輸物流",
            keywords: ["貨運", "物流", "快遞", "搬家", "交通", "運輸", "倉儲", "報關", "海運", "空運", "車隊"]
        },
        {
            category: "科技資訊",
            keywords: ["軟體", "硬體", "系統", "網路", "雲端", "數據", "AI", "半導體", "晶片", "光電", "通訊", "數位", "APP"]
        },
        {
            category: "服務業",
            keywords: ["清潔", "保全", "人力", "顧問", "代書", "會計", "法律", "美容", "美髮", "按摩", "健身", "補習", "教育", "旅遊", "旅館"]
        },
        {
            category: "醫療生技",
            keywords: ["診所", "醫院", "藥", "醫材", "生技", "護理", "長照", "保健"]
        }
    ];

    // 進行比對
    MAPPINGS.forEach(group => {
        if (group.keywords.some(keyword => text.includes(keyword))) {
            suggestions.add(group.category);
        }
    });

    // 如果完全沒有對應，回傳空陣列
    return Array.from(suggestions);
};