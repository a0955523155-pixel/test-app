import React, { useState, useMemo, useEffect } from 'react';
import { X, Printer, Edit, Trash2, CheckCircle, UploadCloud, Maximize2 } from 'lucide-react';
import { STATUS_CONFIG } from '../config/constants';

// --- 引入子組件 ---
import InfoTab from './CustomerDetail/InfoTab';
import NotesTab from './CustomerDetail/NotesTab';
import MatchTab from './CustomerDetail/MatchTab';

// --- 輔助元件與函式 ---

// 狀態標籤元件
const StatusBadge = ({ status }) => {
    const labelMap = { 'new': '新案件', 'contacting': '洽談中', 'commissioned': '已委託', 'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' };
    const label = labelMap[status] || (STATUS_CONFIG[status] || STATUS_CONFIG['new']).label;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{label}</span>;
};

// Base64 轉 Blob (用於 PDF 預覽)
const base64ToBlob = (base64) => {
    try {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        return new Blob([u8arr], { type: mime });
    } catch (e) { return null; }
};

// 圖片燈箱元件
const ImageLightbox = ({ src, onClose }) => {
    if (!src) return null;
    const isPdf = src.startsWith('data:application/pdf');
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"><X className="w-8 h-8"/></button>
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {isPdf ? <iframe src={src} className="w-full h-full bg-white rounded-lg border-none" title="PDF Preview"></iframe> : <img src={src} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" alt="Preview" />}
            </div>
        </div>
    );
};

// --- 主元件 ---
const CustomerDetail = ({ 
    customer, 
    allCustomers = [], 
    currentUser, 
    onEdit, 
    onDelete, 
    onAddNote, 
    onDeleteNote, 
    onEditNote, 
    onBack, 
    darkMode, 
    allUsers = [], 
    onUpdateCustomer,
    noteType // 從 App.js 傳入的預設記事類型 ('client' 或 'vendor')，即 viewMode
}) => {
    // 頁籤狀態：'info' | 'notes' | 'match'
    const [activeTab, setActiveTab] = useState('info'); 
    
    // Modal 與 UI 狀態
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [watermarkImg, setWatermarkImg] = useState(null);
    
    // 記事本切換狀態 (預設使用從 App.js 傳來的類型)
    const [activeNoteTab, setActiveNoteTab] = useState(noteType || 'client');

    // 當外部傳入的 noteType 改變時 (例如從 App.js 切換了廠商/客戶分頁)，同步更新內部狀態
    useEffect(() => {
        if (noteType) {
            setActiveNoteTab(noteType);
        }
    }, [noteType]);

    // 自動偵測廠商身分 (用來決定是否在客戶模式下顯示切換按鈕)
    const isVendorIdentity = useMemo(() => {
        const hasIndustry = customer.industry && customer.industry.trim().length > 0;
        const hasVendorInfo = customer.vendorInfo && customer.vendorInfo.trim().length > 0;
        const isCategoryVendor = customer.category === '廠商';
        return hasIndustry || hasVendorInfo || isCategoryVendor;
    }, [customer]);

    // 保護機制：如果不是廠商身分，且不是在廠商模式下，強制切回客戶記事
    useEffect(() => {
        if (!isVendorIdentity && noteType !== 'vendor' && activeNoteTab === 'vendor') {
            setActiveNoteTab('client');
        }
    }, [isVendorIdentity, activeNoteTab, noteType]);

    // 列印選項設定
    const [printOptions, setPrintOptions] = useState({
        cover: true, cadastral: true, route: true, location: true, plan: true,
        coverFit: false, 
        coverPos: customer.coverImagePosition || 50 
    });

    // 權限與身分判斷
    const isSeller = ['賣方', '出租', '出租方'].includes(customer.category);
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const isOwner = currentUser?.username === customer.owner;
    const canEdit = isAdmin || isOwner;

    // --- 輔助功能：格式化地址 ---
    const formatAddress = () => {
        if (canEdit) {
            if (customer.road) return customer.road + (customer.houseNumber ? ` ${customer.houseNumber}` : '');
            if (customer.landSection) return customer.landSection + (customer.landNumber ? ` ${customer.landNumber}` : '');
            return customer.landNo || customer.address || '';
        }
        if (customer.road) return customer.road; 
        if (customer.landSection) return customer.landSection; 
        const addr = customer.landNo || customer.address || '';
        if (addr.includes('段')) return addr.split('段')[0] + '段';
        return "詳洽專員"; 
    };

    // --- 輔助功能：渲染文件縮圖 (給 InfoTab 用) ---
    const renderDocument = (src, title, icon) => {
        if (!src) return null;
        const isPdf = src.startsWith('data:application/pdf');
        
        return (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-50 dark:bg-slate-800 p-3 border-b dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        {icon} {title}
                    </span>
                    <button onClick={() => isPdf ? window.open("").document.write(`<iframe width="100%" height="100%" src="${src}"></iframe>`) : setPreviewImage(src)} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3"/> 全螢幕
                    </button>
                </div>
                <div className="p-0 cursor-pointer" onClick={() => !isPdf && setPreviewImage(src)}>
                    {isPdf ? <div className="w-full h-64 bg-gray-100"><iframe src={`${src}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title={title}/></div> : <img src={src} className="w-full h-64 object-contain bg-gray-50" alt={title} />}
                </div>
            </div>
        );
    };

    // --- 智慧配對邏輯 ---
    const matchedObjects = useMemo(() => {
        const safeFloat = (v) => { if (!v) return 0; const num = parseFloat(String(v).replace(/,/g, '').replace(/[^0-9.]/g, '')); return isNaN(num) ? 0 : num; };
        return allCustomers.filter(target => {
            if (target.id === customer.id) return false;
            if (!isAdmin) {
                const targetIsCase = ['賣方', '出租', '出租方'].includes(target.category);
                const targetIsMine = target.owner === currentUser?.username;
                if (!targetIsCase && !targetIsMine) return false;
            }
            const targetIsSeller = ['賣方', '出租', '出租方'].includes(target.category);
            
            if (!isSeller) {
                if (!targetIsSeller) return false;
                const buyerReqs = (customer.reqRegion || '').split(',').map(s=>s.trim()).filter(Boolean);
                const targetAddr = [target.city, target.reqRegion, target.assignedRegion, target.road, target.landSection, target.address, target.landNo].join('');
                if (buyerReqs.length > 0 && !buyerReqs.some(req => targetAddr.includes(req))) return false;
                const buyerBudget = safeFloat(customer.value);
                const targetPrice = safeFloat(target.totalPrice);
                if (buyerBudget > 0 && targetPrice > 0) { if (targetPrice > buyerBudget * 1.15) return false; }
                return true;
            } else {
                if (targetIsSeller) return false;
                const myAddr = [customer.city, customer.reqRegion, customer.assignedRegion, customer.road, customer.landSection].join('');
                const buyerReqs = (target.reqRegion || '').split(',').map(s=>s.trim()).filter(Boolean);
                if (buyerReqs.length > 0 && !buyerReqs.some(req => myAddr.includes(req))) return false;
                const myPrice = safeFloat(customer.totalPrice);
                const buyerBudget = safeFloat(target.value);
                if (myPrice > 0 && buyerBudget > 0) { if (myPrice > buyerBudget * 1.15) return false; }
                return true;
            }
        });
    }, [customer, allCustomers, isSeller, isAdmin, currentUser]);

    // --- 列印功能相關 ---
    const handlePrintClick = () => { 
        setPrintOptions(prev => ({ ...prev, coverPos: customer.coverImagePosition || 50 }));
        setShowPrintModal(true); 
    };

    const handleWatermarkUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setWatermarkImg(reader.result); };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCoverPos = () => {
        if (onUpdateCustomer) {
            onUpdateCustomer(customer.id, { coverImagePosition: printOptions.coverPos });
        }
    };

    // ★★★ 完整列印執行函式 ★★★
    const executePrint = () => {
        const todayStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
        
        const win = window.open('', '', 'height=800,width=1200');
        if (!win) { alert('請允許開啟彈跳視窗以進行列印'); return; }
        
        let finalAgent = currentUser; 
        if (customer.assignedAgent) {
            const foundAgent = (allUsers || []).find(u => u.name === customer.assignedAgent);
            if (foundAgent) { finalAgent = foundAgent; }
        }

        const agentName = finalAgent?.name || '專案經紀人';
        const agentPhone = finalAgent?.phone || '09xx-xxx-xxx';
        const agentLine = finalAgent?.lineId || ''; 
        
        const typeStr = customer.propertyType || customer.type || '';
        const isLandCase = typeStr.includes('土地') || typeStr.includes('農地') || typeStr.includes('建地') || typeStr.includes('工業地');
        const isRentalCase = customer.category && customer.category.includes('出租');

        const generateImagePage = (src, title, id) => {
            if (!src) return '';
            const isPdf = src.startsWith('data:application/pdf');
            if (isPdf) {
                const blob = base64ToBlob(src);
                const blobUrl = blob ? URL.createObjectURL(blob) : '';
                return `
                    <div class="page-sheet image-page">
                        <div class="pdf-full-wrapper">
                            <div class="pdf-controls no-print"><span>⚠️ PDF 需單獨列印</span><button onclick="printPdfFrame('${id}')">🖨️ 單獨列印此頁</button></div>
                            <iframe id="${id}" src="${blobUrl}" class="pdf-frame"></iframe>
                        </div>
                        <div class="image-page-footer">Page <span class="counter"></span> • ${todayStr}</div>
                        <div class="image-title-overlay">${customer.caseName || customer.name} - ${title}</div>
                    </div>`;
            } else {
                return `
                    <div class="page-sheet image-page">
                        <img src="${src}" class="full-page-img" />
                        <div class="image-page-footer">Page <span class="counter"></span> • ${todayStr}</div>
                        <div class="image-title-overlay">${customer.caseName || customer.name} - ${title}</div>
                    </div>`;
            }
        };
        
        let coverHtml = '';
        if (printOptions.cover && customer.photoUrl) {
            const isPdf = customer.photoUrl.startsWith('data:application/pdf');
            if (isPdf) {
                const blob = base64ToBlob(customer.photoUrl);
                const blobUrl = blob ? URL.createObjectURL(blob) : '';
                coverHtml = `
                    <div class="img-box pdf-wrapper-inline">
                        <div class="pdf-controls no-print"><span class="pdf-alert">⚠️ PDF 需單獨列印</span><button onclick="printPdfFrame('cover-pdf')">🖨️ 列印</button></div>
                        <iframe id="cover-pdf" src="${blobUrl}"></iframe>
                    </div>`;
            } else {
                const objectFit = printOptions.coverFit ? 'contain' : 'cover';
                const objectPos = `center ${printOptions.coverPos}%`; 
                coverHtml = `
                    <div class="img-box">
                        <div class="img-title">現況封面</div>
                        <img src="${customer.photoUrl}" style="object-fit: ${objectFit}; object-position: ${objectPos};" />
                    </div>`;
            }
        }

        let attachmentsHtml = '';
        if (printOptions.cadastral) attachmentsHtml += generateImagePage(customer.imgCadastral, "地籍圖", "pdf-cadastral");
        if (printOptions.route) attachmentsHtml += generateImagePage(customer.imgRoute, "路線圖", "pdf-route");
        if (printOptions.location) attachmentsHtml += generateImagePage(customer.imgLocation, "位置圖", "pdf-location");
        if (printOptions.plan) attachmentsHtml += generateImagePage(customer.imgPlan, "規劃圖", "pdf-plan");

        const displayCity = customer.city || customer.vendorCity || '高雄市'; 
        const displayArea = customer.reqRegion || customer.vendorDistrict || customer.area || '';
        
        let displayAddressShort = "";
        if (customer.road) displayAddressShort = customer.road;
        else if (customer.landSection) displayAddressShort = customer.landSection;
        else if (customer.address) displayAddressShort = customer.address.replace(/[0-9]+號.*/, '').replace(/-[0-9]+.*/, '');
        else displayAddressShort = "詳洽專員";

        let specsHtml = '';
        if (isLandCase) {
            specsHtml = `
                <div class="spec-item"><div class="spec-label">總地坪</div><div class="spec-value">${customer.landPing || '-'} 坪</div></div>
                <div class="spec-item"><div class="spec-label">使用分區</div><div class="spec-value">${customer.usageZone || '-'}</div></div>
                <div class="spec-item"><div class="spec-label">單價</div><div class="spec-value">${customer.unitPrice ? customer.unitPrice + ' 萬/坪' : '-'}</div></div>
                <div class="spec-item mt-1"><div class="spec-label">面寬</div><div class="spec-value">${customer.faceWidth || '-'} 米</div></div>
                <div class="spec-item mt-1"><div class="spec-label">臨路</div><div class="spec-value">${customer.roadWidth || '-'} 米</div></div>
                <div class="spec-item mt-1"><div class="spec-label">座向</div><div class="spec-value">${customer.direction || '-'}</div></div>
            `;
        } else {
            specsHtml = `
                <div class="spec-item"><div class="spec-label">建物坪數</div><div class="spec-value">${customer.buildPing || '-'} 坪</div></div>
                <div class="spec-item"><div class="spec-label">土地坪數</div><div class="spec-value">${customer.landPing || '-'} 坪</div></div>
                <div class="spec-item"><div class="spec-label">格局</div><div class="spec-value">${customer.room || '-'}房 ${customer.hall || '-'}廳 ${customer.bath || '-'}衛</div></div>
                <div class="spec-item mt-1"><div class="spec-label">屋齡</div><div class="spec-value">${customer.age || '-'} 年</div></div>
                <div class="spec-item mt-1"><div class="spec-label">樓層</div><div class="spec-value">${customer.floor || '-'} / ${customer.totalFloor || '-'} 樓</div></div>
                <div class="spec-item mt-1"><div class="spec-label">型態</div><div class="spec-value">${customer.propertyType || '電梯大樓'}</div></div>
            `;
        }

        const getAutoFontSize = (text) => {
            const len = (text || '').length;
            if (len > 500) return '11px';
            if (len > 300) return '13px';
            if (len > 150) return '15px';
            return '18px';
        };
        const calculatedFontSize = getAutoFontSize(customer.nearby);

        win.document.write('<html><head><title>' + (customer.caseName || customer.name) + '</title>');
        win.document.write('<meta name="format-detection" content="telephone=no">');
        win.document.write('<style>');
        win.document.write(`
            @page { 
                size: A4 portrait; 
                margin: 0; 
            }
            html, body { 
                margin: 0; padding: 0; 
                font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif; 
                background: white;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                width: 100%; height: 100%; 
                counter-reset: page-counter;
                overflow: visible;
            }
            
            @media print {
                .no-print { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; }
                body { background: white; } 
            }

            .counter::after { content: counter(page-counter); }

            .page-sheet {
                width: 210mm;
                height: 297mm;
                position: relative;
                overflow: hidden;
                box-sizing: border-box;
                page-break-after: always;
                counter-increment: page-counter;
                margin: 0 auto;
            }

            .first-page {
                background: #064e3b; 
                color: #f0fdf4;
                padding: 6mm 10mm; 
                border: 4px double #d4af37;
                display: flex; flex-direction: column;
            }

            .image-page {
                background: white; 
                display: flex; justify-content: center; align-items: center;
                padding: 0;
                border: none;
            }

            .full-page-img {
                width: 100%; height: 100%;
                object-fit: contain;
                z-index: 10;
            }

            .image-title-overlay {
                position: absolute; top: 10px; left: 10px;
                background: rgba(0,0,0,0.6); color: #fbbf24;
                padding: 5px 12px; border-radius: 4px;
                font-size: 14px; font-weight: bold;
                z-index: 20;
            }

            .image-page-footer {
                position: absolute; bottom: 10px; right: 10px;
                font-size: 10px; color: #666;
                font-family: monospace;
                z-index: 20;
                background: rgba(255,255,255,0.8);
                padding: 2px 5px; border-radius: 4px;
            }

            .first-page-footer-date {
                position: absolute; bottom: 5px; right: 10px;
                font-size: 10px; color: rgba(255,255,255,0.4);
                font-family: monospace;
            }

            .watermark-layer {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
                z-index: 5; pointer-events: none; width: 70%; opacity: 0.15;
            }
            .watermark-layer img { width: 100%; height: auto; }

            .header { border-bottom: 2px double #d4af37; padding-bottom: 5px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; flex-shrink: 0; }
            .header::after { content: '◈'; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); color: #d4af37; background: #064e3b; padding: 0 8px; font-size: 12px; }
            .header h1 { margin: 0; font-size: 24px; color: #d4af37; font-weight: 900; letter-spacing: 2px; }
            .header span { font-size: 12px; font-weight: bold; color: #a7f3d0; text-transform: uppercase; letter-spacing: 2px; }

            .img-box { margin-bottom: 6px; border: 2px solid #d4af37; border-radius: 4px; overflow: hidden; position: relative; z-index: 1; flex-shrink: 0; }
            .img-title { background: #d4af37; color: #022c22; padding: 4px 8px; font-size: 12px; font-weight: bold; }
            .img-box img { width: 100%; height: 260px; } 
            
            .title-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; position: relative; z-index: 1; flex-shrink: 0; }
            .title-info { width: 60%; }
            .case-name { font-size: 26px; font-weight: 900; color: #ffffff; margin: 0 0 2px 0; line-height: 1.1; }
            .address { font-size: 14px; color: #d4af37; font-weight: bold; display: flex; align-items: center; gap: 5px; }
            .price-info { width: 40%; text-align: right; }
            .price-val { font-size: 48px; font-weight: 900; color: #d4af37; line-height: 1; font-family: 'Arial Black', sans-serif; }
            .price-unit { font-size: 18px; color: #fcd34d; }

            .specs-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 8px; padding: 10px; margin-bottom: 6px; position: relative; z-index: 1; flex-shrink: 0; }
            .specs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 15px; row-gap: 8px; }
            .spec-item { border-bottom: 1px dashed rgba(212, 175, 55, 0.3); padding-bottom: 2px; }
            .spec-label { font-size: 13px; color: #9ca3af; text-transform: uppercase; margin-bottom: 2px; }
            .spec-value { font-size: 18px; font-weight: bold; color: #ffffff; }

            .highlight-box { 
                background: rgba(212, 175, 55, 0.05); 
                border-left: 4px solid #d4af37; 
                padding: 8px 10px; border-radius: 0 8px 8px 0; 
                margin-bottom: 5px; 
                position: relative; z-index: 1; 
                flex: 1; min-height: 40px; display: flex; flex-direction: column; overflow: hidden; 
            }
            .highlight-title { color: #d4af37; font-weight: bold; margin-bottom: 2px; font-size: 16px; letter-spacing: 1px; display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
            .highlight-content { color: #e5e7eb; line-height: 1.4; font-size: ${calculatedFontSize}; font-weight: bold; white-space: pre-wrap; word-wrap: break-word; flex: 1; overflow: hidden; }

            .footer { background: #022c22; color: white; padding: 8px 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-top: 0; border-top: 2px double #d4af37; position: relative; z-index: 1; box-shadow: none; flex-shrink: 0; }
            .agent-info h3 { margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; }
            .agent-info div { color: #d4af37; font-size: 12px; margin-top: 2px; letter-spacing: 2px; text-transform: uppercase; }
            .contact-info { text-align: right; }
            .phone { font-size: 48px; font-weight: 900; color: #d4af37 !important; font-family: 'Arial Black', sans-serif; line-height: 1; }
            .phone a { color: #d4af37 !important; text-decoration: none !important; }
            .line-id { color: #a7f3d0; font-size: 14px; margin-top: 4px; font-weight: bold; }

            .control-bar { padding: 10px; background: #0f172a; text-align: right; display: flex; justify-content: space-between; align-items: center; color: white; margin-bottom: 20px; }
            .pdf-wrapper { width: 100%; height: 100%; border: none; display: flex; flex-direction: column; position: relative; z-index: 1; }
            .pdf-controls { background: #fffbeb; padding: 5px; text-align: center; border-bottom: 1px solid #d4af37; }
            .pdf-frame { width: 100%; height: 100%; border: none; background: white; }
        `);
        win.document.write('</style></head><body>');
        
        win.document.write(`
            <div class="control-bar no-print">
                <span class="hint">請手動調整手機列印縮放以達滿版。</span>
                <div>
                    <button class="btn btn-print" onclick="window.print()">🖨️ 列印 / 另存 PDF</button>
                    <button class="btn btn-close" onclick="window.close()">關閉</button>
                </div>
            </div>
        `);

        // 首頁內容
        win.document.write(`
            <div class="page-sheet first-page">
                ${watermarkImg ? `<div class="watermark-layer"><img src="${watermarkImg}" /></div>` : ''}
                <div class="header"><h1>綠芽團隊</h1><span>GreenShootTeam</span></div>
                ${coverHtml}
                <div class="title-section">
                    <div class="title-info"><h2 class="case-name">${customer.caseName || customer.name}</h2><div class="address">📍 ${displayCity} ${displayArea} ${displayAddressShort}</div></div>
                    <div class="price-info"><div class="price-val">${customer.totalPrice} <span class="price-unit">${isRentalCase ? '元' : '萬'}</span></div></div>
                </div>
                <div class="specs-box"><div class="specs-grid">${specsHtml}</div></div>
                ${customer.nearby ? 
                    `<div class="highlight-box"><div class="highlight-title">🌟 物件優勢</div><div class="highlight-content">${customer.nearby}</div></div>` : 
                    `<div style="flex:1;"></div>`} 
                <div class="footer">
                    <div class="agent-info"><h3>${agentName}</h3><div>誠信服務 • 專業熱忱</div></div>
                    <div class="contact-info"><div class="phone">☎ ${agentPhone}</div>${agentLine ? `<div class="line-id">LINE ID: ${agentLine}</div>` : ''}</div>
                </div>
                <div class="first-page-footer-date">Page <span class="counter"></span> • ${todayStr}</div>
            </div>
        `);

        // 寫入附圖頁面
        win.document.write(attachmentsHtml);

        win.document.write(`
            <script>
                function printPdfFrame(id) {
                    const iframe = document.getElementById(id);
                    if (iframe) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    } else {
                        alert("找不到 PDF 檔案");
                    }
                }
                window.onload = function() { setTimeout(function() { window.print(); }, 1200); }
            </script>
        `);

        win.document.write('</body></html>');
        win.document.close();
        setShowPrintModal(false);
    };

    return (
        <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'}`}>
            {previewImage && <ImageLightbox src={previewImage} onClose={() => setPreviewImage(null)} />}

            <div className={`sticky top-0 z-20 px-4 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold truncate max-w-[200px]">{customer.name}</h1>
                    <StatusBadge status={customer.status} />
                </div>
                <div className="flex gap-2">
                    {isSeller && (
                        <button onClick={handlePrintClick} className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex items-center gap-1 font-bold shadow-sm" title="匯出 PDF">
                            <Printer className="w-5 h-5"/> <span className="hidden sm:inline text-xs">匯出 PDF</span>
                        </button>
                    )}
                    {canEdit && (
                        <>
                            <button onClick={onEdit} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full"><Edit className="w-5 h-5"/></button>
                            <button onClick={() => setShowDeleteModal(true)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full"><Trash2 className="w-5 h-5"/></button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
                <div className="flex p-1 bg-gray-200 dark:bg-slate-800 rounded-xl">
                    <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>基本資料</button>
                    <button onClick={() => setActiveTab('notes')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'notes' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>
                        {activeNoteTab === 'client' ? '回報紀錄' : '廠商紀錄'} ({(customer.notes || []).filter(n => activeNoteTab === 'vendor' ? n.type === 'vendor' : n.type !== 'vendor').length})
                    </button>
                    <button onClick={() => setActiveTab('match')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'match' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow' : 'text-gray-500'}`}>智慧配對 ({matchedObjects.length})</button>
                </div>

                {activeTab === 'info' && (
                    <InfoTab 
                        customer={customer} 
                        isSeller={isSeller} 
                        canEdit={canEdit} 
                        formatAddress={formatAddress} 
                        renderDocument={renderDocument}
                        darkMode={darkMode}
                    />
                )}

                {activeTab === 'notes' && (
                    <NotesTab 
                        customer={customer} 
                        currentUser={currentUser} 
                        isAdmin={isAdmin} 
                        onAddNote={onAddNote} 
                        onDeleteNote={onDeleteNote} 
                        onEditNote={onEditNote} 
                        darkMode={darkMode}
                        activeNoteTab={activeNoteTab}
                        setActiveNoteTab={setActiveNoteTab}
                        isVendorIdentity={isVendorIdentity}
                        viewMode={noteType} 
                    />
                )}

                {activeTab === 'match' && (
                    <MatchTab 
                        matchedObjects={matchedObjects} 
                        isSeller={isSeller} 
                        customer={customer} 
                        darkMode={darkMode}
                    />
                )}
            </div>

            {/* 列印 Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Printer className="w-5 h-5"/> 選擇列印內容</h3>
                        <div className="mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <label className="block text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2"><UploadCloud className="w-4 h-4"/> 上傳浮水印 (建議透明背景 PNG)</label>
                            <input type="file" accept="image/png, image/jpeg" onChange={handleWatermarkUpload} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200"/>
                            {watermarkImg && <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 已載入浮水印</div>}
                        </div>
                        <div className="mb-4 border-b pb-4">
                            <label className="flex items-center gap-2 p-2 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer mb-2">
                                <input type="checkbox" checked={printOptions.coverFit} onChange={e => setPrintOptions({...printOptions, coverFit: e.target.checked})} className="w-4 h-4 text-blue-600"/>
                                <span className="text-blue-800 font-bold text-sm">封面完整顯示 (DM不裁切)</span>
                            </label>
                            {!printOptions.coverFit && (
                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>上</span><span>封面位置微調</span><span>下</span></div>
                                    <input type="range" min="0" max="100" value={printOptions.coverPos} onChange={(e) => setPrintOptions({...printOptions, coverPos: Number(e.target.value)})} onMouseUp={handleSaveCoverPos} onTouchEnd={handleSaveCoverPos} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                                    <div className="text-center text-xs font-bold text-blue-600 mt-1">{printOptions.coverPos}%</div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.cover} onChange={e => setPrintOptions({...printOptions, cover: e.target.checked})} className="w-4 h-4"/> <span>封面現況照片</span></label>
                            {customer.imgCadastral && <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.cadastral} onChange={e => setPrintOptions({...printOptions, cadastral: e.target.checked})} className="w-4 h-4"/> <span>地籍圖</span></label>}
                            {customer.imgRoute && <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.route} onChange={e => setPrintOptions({...printOptions, route: e.target.checked})} className="w-4 h-4"/> <span>路線圖</span></label>}
                            {customer.imgLocation && <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.location} onChange={e => setPrintOptions({...printOptions, location: e.target.checked})} className="w-4 h-4"/> <span>位置圖</span></label>}
                            {customer.imgPlan && <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.plan} onChange={e => setPrintOptions({...printOptions, plan: e.target.checked})} className="w-4 h-4"/> <span>規劃圖</span></label>}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowPrintModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold">取消</button>
                            <button onClick={executePrint} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">確認列印</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 刪除 Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl border-2 border-red-500">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full mb-4"><Trash2 className="w-8 h-8 text-red-600"/></div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">確認刪除資料？</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">此操作無法復原，您確定要永久刪除此筆資料嗎？</p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors">取消</button>
                                <button onClick={onDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg transition-colors">確認刪除</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDetail;