import React, { useState, useMemo } from 'react';
import { 
  X, Phone, MapPin, Trash2, Edit, Printer, 
  StickyNote, Briefcase, CheckCircle, Plus, Target, CheckSquare, 
  Image as ImageIcon, FileText, Map, Navigation, Layout, UploadCloud, Maximize2, Sliders, AlignCenter, ArrowUp, ArrowDown, User
} from 'lucide-react';
import { STATUS_CONFIG } from '../config/constants';

const StatusBadge = ({ status }) => {
    const labelMap = { 'new': '新案件', 'contacting': '洽談中', 'commissioned': '已委託', 'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' };
    const label = labelMap[status] || (STATUS_CONFIG[status] || STATUS_CONFIG['new']).label;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{label}</span>;
};

// Base64 轉 Blob
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

// Lightbox
const ImageLightbox = ({ src, onClose }) => {
    if (!src) return null;
    const isPdf = src.startsWith('data:application/pdf');
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"><X className="w-8 h-8"/></button>
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {isPdf ? <iframe src={src} className="w-full h-full bg-white rounded-lg border-none"></iframe> : <img src={src} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />}
            </div>
        </div>
    );
};

const CustomerDetail = ({ customer, allCustomers = [], currentUser, onEdit, onDelete, onAddNote, onDeleteNote, onBack, darkMode, allUsers = [] }) => {
    const [noteContent, setNoteContent] = useState('');
    const [activeTab, setActiveTab] = useState('info'); 
    
    // Modal
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // Lightbox & Watermark
    const [previewImage, setPreviewImage] = useState(null);
    const [watermarkImg, setWatermarkImg] = useState(null);

    const [printOptions, setPrintOptions] = useState({
        cover: true, cadastral: true, route: true, location: true, plan: true,
        coverFit: false, 
        coverPos: 50 // 0-100
    });

    const isSeller = ['賣方', '出租', '出租方'].includes(customer.category);
    const isRental = customer.category && customer.category.includes('出租');
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const isOwner = currentUser?.username === customer.owner;
    const canEdit = isAdmin || isOwner;

    const typeStr = customer.propertyType || customer.type || '';
    const isLand = typeStr.includes('土地') || typeStr.includes('農地') || typeStr.includes('建地') || typeStr.includes('工業地');

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

    const handlePrintClick = () => { setShowPrintModal(true); };

    const handleWatermarkUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setWatermarkImg(reader.result); };
            reader.readAsDataURL(file);
        }
    };

    const getAutoFontSize = (text) => {
        const len = (text || '').length;
        if (len > 500) return '11px';
        if (len > 300) return '13px';
        if (len > 150) return '15px';
        return '18px';
    };

    // ★★★ 列印執行邏輯 (分頁重構版) ★★★
    const executePrint = () => {
        const watermarkText = prompt("請輸入浮水印文字 (預設：綠芽團隊 0800666738)", "綠芽團隊 0800666738") || "綠芽團隊 0800666738";
        const win = window.open('', '', 'height=800,width=1200');
        
        let finalAgent = currentUser; 
        if (customer.assignedAgent) {
            const foundAgent = (allUsers || []).find(u => u.name === customer.assignedAgent);
            if (foundAgent) { finalAgent = foundAgent; }
        }

        const agentName = finalAgent?.name || '專案經紀人';
        const agentPhone = finalAgent?.phone || '09xx-xxx-xxx';
        const agentLine = finalAgent?.lineId || ''; 
        
        // 生成純淨圖片頁面 (白底、無框、滿版)
        const generateImagePage = (src, id) => {
            if (!src) return '';
            const isPdf = src.startsWith('data:application/pdf');
            if (isPdf) {
                const blob = base64ToBlob(src);
                const blobUrl = blob ? URL.createObjectURL(blob) : '';
                return `
                    <div class="page-sheet image-page">
                        <div class="pdf-full-wrapper">
                            <div class="pdf-controls no-print"><span>⚠️ PDF 需單獨列印</span><button onclick="printPdfFrame('${id}')">🖨️ 單獨列印</button></div>
                            <iframe id="${id}" src="${blobUrl}" class="pdf-frame"></iframe>
                        </div>
                        <div class="page-number"></div>
                    </div>`;
            } else {
                return `
                    <div class="page-sheet image-page">
                        <div class="img-full-bleed"><img src="${src}" /></div>
                        <div class="page-number" style="color: #333;"></div>
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
        if (printOptions.cadastral) attachmentsHtml += generateImagePage(customer.imgCadastral, "pdf-cadastral");
        if (printOptions.route) attachmentsHtml += generateImagePage(customer.imgRoute, "pdf-route");
        if (printOptions.location) attachmentsHtml += generateImagePage(customer.imgLocation, "pdf-location");
        if (printOptions.plan) attachmentsHtml += generateImagePage(customer.imgPlan, "pdf-plan");

        const displayCity = customer.city || customer.vendorCity || '高雄市'; 
        const displayArea = customer.reqRegion || customer.vendorDistrict || customer.area || '';
        
        let displayAddressShort = "";
        if (customer.road) displayAddressShort = customer.road;
        else if (customer.landSection) displayAddressShort = customer.landSection;
        else if (customer.address) displayAddressShort = customer.address.replace(/[0-9]+號.*/, '').replace(/-[0-9]+.*/, '');
        else displayAddressShort = "詳洽專員";

        let specsHtml = '';
        if (isLand) {
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

        const calculatedFontSize = getAutoFontSize(customer.nearby);

        win.document.write('<html><head><title>' + (customer.caseName || customer.name) + '</title>');
        win.document.write('<meta name="format-detection" content="telephone=no">');
        win.document.write('<style>');
        win.document.write(`
            /* ★ 全局設置：移除瀏覽器預設邊距 (隱藏網址/標題) ★ */
            @page { 
                size: A4 portrait; 
                margin: 0; 
            }
            html, body { 
                margin: 0; padding: 0; 
                font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif; 
                background: white; /* 預設白底 (給圖資頁用) */
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                width: 100%; height: 100%;
                /* 啟用 CSS 計數器 */
                counter-reset: page-counter;
            }
            
            @media print {
                .no-print { display: none !important; }
                .pdf-wrapper { border: none; height: 100%; display: flex; align-items: center; justify-content: center; }
                .pdf-frame { display: none; }
                /* 針對手機瀏覽器的安全縮放 */
                body { transform: scale(0.99); transform-origin: top left; width: 101%; }
            }

            /* 控制列 */
            .control-bar { padding: 10px; background: #0f172a; border-bottom: 1px solid #1e293b; text-align: right; position: sticky; top: 0; z-index: 999; display: flex; justify-content: space-between; align-items: center; color: white; }
            .btn { padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; border: none; margin-left: 10px; font-size: 13px; }
            .btn-print { background: #d4af37; color: #022c22; }
            .btn-close { background: #374151; color: white; }
            .hint { font-size: 11px; color: #94a3b8; }

            /* 通用頁面容器 */
            .page-sheet {
                width: 210mm;
                height: 297mm;
                position: relative;
                overflow: hidden;
                box-sizing: border-box;
                page-break-after: always;
                counter-increment: page-counter; /* 頁碼 +1 */
            }

            /* ★★★ 首頁樣式 (綠底+金框) ★★★ */
            .first-page {
                height: 270mm; /* 稍微縮短高度，防止手機分頁溢出 */
                background: #064e3b;
                color: #f0fdf4;
                padding: 5mm 8mm;
                border: 3px double #d4af37;
                display: flex; flex-direction: column;
                margin: 0 auto; /* 置中 */
            }

            /* ★★★ 圖資頁樣式 (白底+滿版) ★★★ */
            .image-page {
                background: white;
                display: flex; align-items: center; justify-content: center;
                padding: 0;
            }

            .watermark-layer {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
                z-index: 0; pointer-events: none; width: 80%; display: flex; justify-content: center; align-items: center; opacity: 0.15;
            }
            .watermark-layer img { width: 100%; height: auto; }

            /* 自訂頁碼與日期 */
            .page-number {
                position: absolute;
                bottom: 5px;
                right: 10px;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.5); /* 首頁白色 */
                font-family: monospace;
                z-index: 100;
                pointer-events: none;
            }
            /* 頁碼內容生成 */
            .page-number::after {
                content: "Page " counter(page-counter) " • " attr(data-date);
            }

            /* Header */
            .header { border-bottom: 2px double #d4af37; padding-bottom: 5px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; flex-shrink: 0; }
            .header::after { content: '◈'; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); color: #d4af37; background: #064e3b; padding: 0 8px; font-size: 12px; }
            .header h1 { margin: 0; font-size: 24px; color: #d4af37; font-weight: 900; letter-spacing: 2px; }
            .header span { font-size: 12px; font-weight: bold; color: #a7f3d0; text-transform: uppercase; letter-spacing: 2px; }
            
            /* 圖片區 */
            .img-box { margin-bottom: 6px; border: 2px solid #d4af37; border-radius: 4px; overflow: hidden; position: relative; z-index: 1; flex-shrink: 0; }
            .img-title { background: #d4af37; color: #022c22; padding: 4px 8px; font-size: 12px; font-weight: bold; }
            .img-box img { width: 100%; height: 260px; } 
            .img-box iframe { width: 100%; height: 260px !important; border: none; }

            .pdf-wrapper { width: 100%; height: 100%; border: none; display: flex; flex-direction: column; position: relative; z-index: 1; }
            .pdf-full-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; }
            .pdf-controls { background: #fffbeb; padding: 5px; text-align: center; border-bottom: 1px solid #d4af37; display: flex; justify-content: space-between; align-items: center; color: #333;}
            .pdf-controls button { background: #064e3b; color: white; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
            .pdf-frame { width: 100%; height: 100%; border: none; background: white; }

            .img-full-bleed { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: white; }
            .img-full-bleed img { width: 100%; height: 100%; object-fit: contain; }

            .title-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; position: relative; z-index: 1; flex-shrink: 0; }
            .title-info { width: 60%; }
            .case-name { font-size: 26px; font-weight: 900; color: #ffffff; margin: 0 0 4px 0; line-height: 1.1; }
            .address { font-size: 14px; color: #d4af37; font-weight: bold; display: flex; align-items: center; gap: 5px; }
            .price-info { width: 40%; text-align: right; }
            .price-val { font-size: 48px; font-weight: 900; color: #d4af37; line-height: 1; font-family: 'Arial Black', sans-serif; }
            .price-unit { font-size: 18px; color: #fcd34d; }

            .specs-box { 
                background: rgba(255,255,255,0.05); 
                border: 1px solid rgba(212, 175, 55, 0.4); 
                border-radius: 8px; padding: 10px; margin-bottom: 6px; position: relative; z-index: 1; flex-shrink: 0; 
            }
            .specs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 15px; row-gap: 8px; }
            .spec-item { border-bottom: 1px dashed rgba(212, 175, 55, 0.3); padding-bottom: 2px; }
            .spec-label { font-size: 13px; color: #9ca3af; text-transform: uppercase; margin-bottom: 2px; }
            .spec-value { font-size: 18px; font-weight: bold; color: #ffffff; }

            /* 物件優勢 */
            .highlight-box { 
                background: rgba(212, 175, 55, 0.05); 
                border-left: 4px solid #d4af37; 
                padding: 8px 10px; border-radius: 0 8px 8px 0; 
                margin-bottom: 5px; 
                position: relative; z-index: 1; 
                flex: 1; 
                min-height: 40px; 
                display: flex; flex-direction: column;
                overflow: hidden; 
            }
            .highlight-title { color: #d4af37; font-weight: bold; margin-bottom: 2px; font-size: 16px; letter-spacing: 1px; display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
            .highlight-content { 
                color: #e5e7eb; line-height: 1.4; 
                font-size: ${calculatedFontSize}; 
                font-weight: bold; 
                white-space: pre-wrap; word-wrap: break-word; 
                flex: 1; overflow: hidden; 
            }

            .footer { 
                background: #022c22; 
                color: white; padding: 8px 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; 
                margin-top: 0; 
                border-top: 2px double #d4af37; 
                position: relative; z-index: 1; box-shadow: none; flex-shrink: 0; 
            }
            .agent-info h3 { margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; }
            .agent-info div { color: #d4af37; font-size: 12px; margin-top: 2px; letter-spacing: 2px; text-transform: uppercase; }
            .contact-info { text-align: right; }
            .phone { font-size: 48px; font-weight: 900; color: #d4af37 !important; font-family: 'Arial Black', sans-serif; line-height: 1; }
            .phone a { color: #d4af37 !important; text-decoration: none !important; }
            .line-id { color: #a7f3d0; font-size: 14px; margin-top: 4px; font-weight: bold; }
        `);
        win.document.write('</style></head><body>');
        
        // ★ 取得今日日期 ★
        const todayStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

        // ★ 控制列 ★
        win.document.write(`
            <div class="control-bar no-print">
                <span class="hint">手機修正版：已移除網址標題，加入自訂頁碼。</span>
                <div>
                    <button class="btn btn-print" onclick="window.print()">🖨️ 列印 / 另存 PDF</button>
                    <button class="btn btn-close" onclick="window.close()">關閉</button>
                </div>
            </div>
        `);

        // --- 頁面 1 (首頁：綠底) ---
        // ★ 關鍵：高度設定為 270mm 以預留邊距 ★
        win.document.write(`
            <div class="page-sheet first-page">
                ${watermarkImg ? `<div class="watermark-layer"><img src="${watermarkImg}" /></div>` : ''}
                <div class="header"><h1>綠芽團隊</h1><span>GreenShootTeam</span></div>
                ${coverHtml}
                <div class="title-section">
                    <div class="title-info"><h2 class="case-name">${customer.caseName || customer.name}</h2><div class="address">📍 ${displayCity} ${displayArea} ${displayAddressShort}</div></div>
                    <div class="price-info"><div class="price-val">${customer.totalPrice} <span class="price-unit">${isRental ? '元' : '萬'}</span></div></div>
                </div>
                <div class="specs-box"><div class="specs-grid">${specsHtml}</div></div>
                ${customer.nearby ? 
                    `<div class="highlight-box"><div class="highlight-title">🌟 物件優勢</div><div class="highlight-content">${customer.nearby}</div></div>` : 
                    `<div style="flex:1;"></div>`} 
                <div class="footer">
                    <div class="agent-info"><h3>${agentName}</h3><div>誠信服務 • 專業熱忱</div></div>
                    <div class="contact-info"><div class="phone">☎ ${agentPhone}</div>${agentLine ? `<div class="line-id">LINE ID: ${agentLine}</div>` : ''}</div>
                </div>
                <div class="page-number" data-date="${todayStr}"></div>
            </div>
        `);

        // --- 頁面 2+ (圖資：白底) ---
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

    const renderDocument = (src, title, icon) => {
        if (!src) return null;
        const isPdf = src.startsWith('data:application/pdf');
        
        return (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-50 dark:bg-slate-800 p-3 border-b dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        {icon} {title}
                    </span>
                    <button 
                        onClick={() => {
                            if (isPdf) {
                                const w = window.open("");
                                w.document.write(`<iframe width="100%" height="100%" src="${src}"></iframe>`);
                            } else {
                                setPreviewImage(src);
                            }
                        }} 
                        className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1"
                    >
                        <Maximize2 className="w-3 h-3"/> 全螢幕
                    </button>
                </div>
                <div className="p-0 cursor-pointer" onClick={() => !isPdf && setPreviewImage(src)}>
                    {isPdf ? (
                        <div className="w-full h-64 bg-gray-100 relative group">
                            <iframe 
                                src={`${src}#toolbar=0&navpanes=0&scrollbar=0`} 
                                className="w-full h-full border-none"
                                title={title}
                            />
                            <div className="absolute inset-0 bg-transparent"></div>
                        </div>
                    ) : (
                        <img src={src} className="w-full h-64 object-contain bg-gray-50" alt={title} />
                    )}
                </div>
            </div>
        );
    };

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
                const minPing = safeFloat(customer.minPing);
                const maxPing = safeFloat(customer.maxPing);
                const targetSize = Math.max(safeFloat(target.landPing), safeFloat(target.buildPing));
                if (minPing > 0 && targetSize < minPing) return false;
                if (maxPing > 0 && targetSize > maxPing) return false;
                return true;
            } else {
                if (targetIsSeller) return false;
                const myAddr = [customer.city, customer.reqRegion, customer.assignedRegion, customer.road, customer.landSection].join('');
                const buyerReqs = (target.reqRegion || '').split(',').map(s=>s.trim()).filter(Boolean);
                if (buyerReqs.length > 0 && !buyerReqs.some(req => myAddr.includes(req))) return false;
                const myPrice = safeFloat(customer.totalPrice);
                const buyerBudget = safeFloat(target.value);
                if (myPrice > 0 && buyerBudget > 0) { if (myPrice > buyerBudget * 1.15) return false; }
                const buyerMin = safeFloat(target.minPing);
                const buyerMax = safeFloat(target.maxPing);
                const mySize = Math.max(safeFloat(customer.landPing), safeFloat(customer.buildPing));
                if (buyerMin > 0 && mySize < buyerMin) return false;
                if (buyerMax > 0 && mySize > buyerMax) return false;
                return true;
            }
        });
    }, [customer, allCustomers, isSeller, isAdmin, currentUser]);

    const handleAddNoteSubmit = (e) => { e.preventDefault(); if (!noteContent.trim()) return; onAddNote(customer.id, noteContent); setNoteContent(''); };

    return (
        <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'}`}>
            {/* Lightbox 預覽 */}
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
                    <button onClick={() => setActiveTab('notes')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'notes' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>回報紀錄 ({customer.notes?.length || 0})</button>
                    <button onClick={() => setActiveTab('match')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'match' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow' : 'text-gray-500'}`}>智慧配對 ({matchedObjects.length})</button>
                </div>

                {activeTab === 'info' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-xs text-gray-400 block mb-1">承辦專員</label><div className="flex items-center gap-2 font-bold text-blue-600"><Briefcase className="w-4 h-4"/> {customer.assignedAgent || customer.ownerName || '未指定'}</div></div>
                                <div><label className="text-xs text-gray-400 block mb-1">聯絡電話</label><div className="flex items-center gap-2 font-mono text-lg font-bold"><Phone className="w-4 h-4 text-blue-500"/> {customer.phone || '未填寫'} <a href={`tel:${customer.phone}`} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">撥打</a></div></div>
                                <div><label className="text-xs text-gray-400 block mb-1">{isSeller ? (isRental ? '租金' : '開價') : '需求預算'}</label><div className="text-2xl font-black text-green-500">{isSeller ? customer.totalPrice : customer.value || 0} <span className="text-sm text-gray-500 ml-1">{isRental ? '元' : '萬'}</span></div></div>
                                {isSeller ? (
                                    <>
                                        <div><label className="text-xs text-gray-400 block mb-1">物件類型</label><div className="font-bold">{customer.propertyType || '未指定'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">地坪/建坪</label><div className="font-bold">{customer.landPing || 0} / {customer.buildPing || 0} 坪</div></div>
                                        <div className="md:col-span-2"><label className="text-xs text-gray-400 block mb-1">地址資訊</label><div className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4"/> {customer.city} {customer.reqRegion} {formatAddress()}</div>{(customer.landSection || customer.landNumber) && canEdit && <div className="text-sm text-gray-500 mt-1 pl-6">段號：{customer.landSection} {customer.landNumber}</div>}</div>
                                    </>
                                ) : (
                                    <>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求區域</label><div className="font-bold">{customer.reqRegion || '不限'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求類型</label><div className="font-bold">{customer.targetPropertyType || '不限'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求坪數</label><div className="font-bold">{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</div></div>
                                    </>
                                )}
                                <div className="md:col-span-2 pt-4 border-t dark:border-slate-700"><label className="text-xs text-gray-400 block mb-2 flex items-center gap-1"><StickyNote className="w-3 h-3"/> 備註事項</label><div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">{customer.remarks || "無備註內容"}</div></div>
                            </div>
                        </div>

                        {/* 圖片與文件列表 */}
                        {isSeller && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {renderDocument(customer.photoUrl, "現況封面", <ImageIcon className="w-4 h-4 text-blue-500"/>)}
                                {renderDocument(customer.imgCadastral, "地籍圖", <Map className="w-4 h-4 text-green-500"/>)}
                                {renderDocument(customer.imgRoute, "路線圖", <Navigation className="w-4 h-4 text-purple-500"/>)}
                                {renderDocument(customer.imgLocation, "位置圖", <MapPin className="w-4 h-4 text-red-500"/>)}
                                {renderDocument(customer.imgPlan, "規劃圖", <Layout className="w-4 h-4 text-orange-500"/>)}
                            </div>
                        )}
                    </div>
                )}

                {/* 智慧配對：案件顯示名稱及區域 */}
                {activeTab === 'match' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-purple-800 dark:text-purple-200 text-sm mb-4"><h3 className="font-bold flex items-center gap-2 mb-1"><Target className="w-4 h-4"/> 配對條件 ({isSeller ? '本案條件' : '需求條件'})</h3><ul className="list-disc list-inside opacity-80 text-xs">{isSeller ? (<><li>本案區域：{customer.reqRegion || customer.assignedRegion}</li><li>本案類型：{customer.propertyType || '未指定'}</li><li>本案坪數：地 {customer.landPing} / 建 {customer.buildPing}</li></>) : (<><li>需求區域：{customer.reqRegion || '不限'} (含歸檔區)</li><li>需求類型：{customer.targetPropertyType || '不限'}</li><li>需求坪數：{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</li></>)}</ul></div>
                        {matchedObjects.length === 0 ? (<div className="text-center py-20 opacity-50"><p>{isSeller ? '目前沒有符合需求的買方' : '目前沒有符合條件的物件'}</p></div>) : (<div className="grid grid-cols-1 gap-3">{matchedObjects.map(obj => (<div key={obj.id} className={`flex justify-between p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} hover:border-purple-400 transition-colors`}>
                            <div>
                                <div className="font-bold flex flex-col gap-1">
                                    {['賣方', '出租', '出租方'].includes(obj.category) ? (
                                        <>
                                            <span className="text-lg">{obj.caseName || obj.name}</span>
                                            <div className="flex flex-wrap gap-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3"/> {obj.city}{obj.reqRegion || obj.assignedRegion}</span>
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><User className="w-3 h-3"/> 屋主: {obj.name}</span>
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><Briefcase className="w-3 h-3"/> 承辦: {obj.assignedAgent || obj.ownerName}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg">{obj.name}</span>
                                            <div className="flex flex-wrap gap-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3"/> {obj.reqRegion || '不限'}</span>
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><Briefcase className="w-3 h-3"/> 承辦: {obj.ownerName}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>))}</div>)}
                    </div>
                )}
            </div>

            {/* 列印選項 Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Printer className="w-5 h-5"/> 選擇列印內容</h3>
                        
                        {/* 浮水印上傳區 */}
                        <div className="mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <label className="block text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2"><UploadCloud className="w-4 h-4"/> 上傳浮水印 (建議透明背景 PNG)</label>
                            <input type="file" accept="image/png, image/jpeg" onChange={handleWatermarkUpload} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200"/>
                            {watermarkImg && <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 已載入浮水印</div>}
                        </div>

                        {/* 封面調整區 */}
                        <div className="mb-4 border-b pb-4">
                            <label className="flex items-center gap-2 p-2 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer mb-2">
                                <input type="checkbox" checked={printOptions.coverFit} onChange={e => setPrintOptions({...printOptions, coverFit: e.target.checked})} className="w-4 h-4 text-blue-600"/>
                                <span className="text-blue-800 font-bold text-sm">封面完整顯示 (DM不裁切)</span>
                            </label>
                            {!printOptions.coverFit && (
                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>上</span>
                                        <span>封面位置微調</span>
                                        <span>下</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={printOptions.coverPos} 
                                        onChange={(e) => setPrintOptions({...printOptions, coverPos: Number(e.target.value)})}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
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
                        <div className="flex gap-3 mt-6"><button onClick={() => setShowPrintModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold">取消</button><button onClick={executePrint} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">確認列印</button></div>
                    </div>
                </div>
            )}

            {/* 刪除確認 Modal */}
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