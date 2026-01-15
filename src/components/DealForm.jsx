import React, { useState, useEffect } from 'react';
import { X, Save, Printer, Trash2, Plus, Calculator } from 'lucide-react';

const DealForm = ({ deal, onSave, onCancel, onDelete, allUsers = [] }) => {
    // 預設資料結構 (包含多人員陣列)
    const [formData, setFormData] = useState(deal || {
        commissionNo: '', caseNo: '', caseName: '', address: '',
        sellerName: '', sellerPhone: '', sellerAddress: '',
        buyerName: '', buyerPhone: '', buyerAddress: '',
        serviceFeeSeller: '', serviceFeeBuyer: '', 
        serviceFeeRenter: '', serviceFeeLandlord: '',
        deduction: '', subtotal: '', deposit: '',
        scrivenerType: [], signDate: '', dealDate: '', scrivenerNotes: '',
        scrivenerPhone: '', scrivenerAddress: '',
        
        // ★ 改為陣列結構以支援多人
        devAgents: [{ user: '', percent: 100, amount: 0 }],
        salesAgents: [{ user: '', percent: 100, amount: 0 }],
        
        totalPrice: '', store: '', storeCode: '',
    });

    const [total, setTotal] = useState(0); // 總業績
    const [pools, setPools] = useState({ company: 0, bonus: 0, dev: 0, sales: 0 }); // 各池金額

    // 1. 自動計算總業績 (小計)
    useEffect(() => {
        const sum = (Number(formData.serviceFeeSeller) || 0) + 
                    (Number(formData.serviceFeeBuyer) || 0) + 
                    (Number(formData.serviceFeeRenter) || 0) + 
                    (Number(formData.serviceFeeLandlord) || 0);
        const sub = sum - (Number(formData.deduction) || 0);
        setTotal(sub);
        setFormData(prev => ({ ...prev, subtotal: sub }));
    }, [formData.serviceFeeSeller, formData.serviceFeeBuyer, formData.serviceFeeRenter, formData.serviceFeeLandlord, formData.deduction]);

    // 2. 自動分配計算 (核心邏輯)
    useEffect(() => {
        if (total > 0) {
            // A. 公司扣除 53%
            const companyTake = Math.round(total * 0.53);
            // B. 剩餘獎金池 (47%)
            const bonusPool = total - companyTake;
            
            // C. 開發池 (剩餘的 55%)
            const devPool = Math.round(bonusPool * 0.55);
            // D. 行銷池 (剩餘的 45%)
            const salesPool = Math.round(bonusPool * 0.45);

            setPools({ company: companyTake, bonus: bonusPool, dev: devPool, sales: salesPool });

            // E. 分配給開發人員 (依輸入 %)
            const updatedDev = formData.devAgents.map(agent => ({
                ...agent,
                amount: Math.round(devPool * (Number(agent.percent) / 100))
            }));

            // F. 分配給行銷人員 (依輸入 %)
            const updatedSales = formData.salesAgents.map(agent => ({
                ...agent,
                amount: Math.round(salesPool * (Number(agent.percent) / 100))
            }));

            // 避免無限迴圈：只有當數值真的改變時才更新
            const isDiff = JSON.stringify(updatedDev) !== JSON.stringify(formData.devAgents) || 
                           JSON.stringify(updatedSales) !== JSON.stringify(formData.salesAgents);
            
            if (isDiff) {
                setFormData(prev => ({ ...prev, devAgents: updatedDev, salesAgents: updatedSales }));
            }
        }
    }, [total, formData.devAgents, formData.salesAgents]); // 監聽總額與人員佔比變化

    // 通用欄位變更
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            const current = formData[name] || [];
            if (checked) setFormData({ ...formData, [name]: [...current, value] });
            else setFormData({ ...formData, [name]: current.filter(v => v !== value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // 人員陣列變更 (新增/刪除/修改)
    const handleAgentChange = (type, index, field, value) => {
        const listName = type === 'dev' ? 'devAgents' : 'salesAgents';
        const list = [...formData[listName]];
        list[index][field] = value;
        // 如果改的是 %, 讓 useEffect 去重算金額，這裡只更新狀態
        setFormData({ ...formData, [listName]: list });
    };

    const addAgent = (type) => {
        const listName = type === 'dev' ? 'devAgents' : 'salesAgents';
        setFormData({ ...formData, [listName]: [...formData[listName], { user: '', percent: 0, amount: 0 }] });
    };

    const removeAgent = (type, index) => {
        const listName = type === 'dev' ? 'devAgents' : 'salesAgents';
        const list = [...formData[listName]];
        if (list.length > 1) { // 至少保留一列
            list.splice(index, 1);
            setFormData({ ...formData, [listName]: list });
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('paper-preview').innerHTML;
        const win = window.open('', '', 'height=800,width=1100');
        win.document.write('<html><head><title>成交報告單</title>');
        win.document.write('<style>');
        win.document.write(`
            @page { size: A4; margin: 10mm; }
            body { font-family: "Microsoft JhengHei", sans-serif; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
            .paper { width: 100%; border: 2px solid black; padding: 5px; box-sizing: border-box; }
            h1 { text-align: center; font-size: 32px; font-family: "KaiTi", "BiauKai", serif; margin: 10px 0 20px 0; font-weight: bold; letter-spacing: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            td, th { border: 1px solid black; padding: 4px 8px; font-size: 14px; height: 35px; vertical-align: middle; }
            .label-col { text-align: center; font-weight: bold; width: 12%; background-color: #f0f0f0; }
            .input-cell { text-align: left; padding-left: 10px; }
            .center { text-align: center; }
            .checkbox-item { display: inline-block; margin-right: 15px; }
            .checkbox-box { display: inline-block; width: 12px; height: 12px; border: 1px solid black; margin-right: 4px; position: relative; top: 2px; }
            .checkbox-box.checked { background-color: black; }
            .section-title { writing-mode: vertical-lr; text-align: center; font-weight: bold; background-color: #e0e0e0; width: 30px; letter-spacing: 5px; }
            .footer { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
            .sign-box { border-bottom: 1px solid black; width: 100px; text-align: center; padding-bottom: 5px; font-weight: bold; }
            .calc-info { font-size: 10px; color: #666; margin-bottom: 2px; }
        `);
        win.document.write('</style></head><body>');
        win.document.write('<div class="paper">');
        win.document.write(printContent);
        win.document.write('</div>');
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    };

    return (
        <div className="fixed inset-0 bg-gray-100 z-[60] flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-md z-10">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Save className="w-6 h-6 text-blue-600"/> 成交報告單編輯</h2>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="px-5 py-2 bg-purple-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all"><Printer className="w-5 h-5"/> 列印 / 下載 PDF</button>
                    <button onClick={() => onSave(formData)} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"><Save className="w-5 h-5"/> 儲存</button>
                    {deal && <button onClick={() => onDelete(deal.id)} className="px-5 py-2 bg-red-100 text-red-600 rounded-lg font-bold flex items-center gap-2 hover:bg-red-200 transition-all"><Trash2 className="w-5 h-5"/> 刪除</button>}
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500"/></button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* 左側：輸入表單 */}
                <div className="w-1/2 p-6 overflow-y-auto border-r bg-white custom-scrollbar">
                    <div className="space-y-8 max-w-2xl mx-auto">
                        
                        {/* 1-4 區塊保持不變，僅簡化顯示 */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">基本資料與佣收</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="commissionNo" value={formData.commissionNo} onChange={handleChange} placeholder="委託書編號" className="p-2 border rounded"/>
                                <input name="caseNo" value={formData.caseNo} onChange={handleChange} placeholder="案件編號" className="p-2 border rounded"/>
                                <input name="caseName" value={formData.caseName} onChange={handleChange} placeholder="成交案名" className="p-2 border rounded col-span-2"/>
                                <input name="address" value={formData.address} onChange={handleChange} placeholder="地址" className="p-2 border rounded col-span-2"/>
                                <input type="date" name="dealDate" value={formData.dealDate} onChange={handleChange} className="p-2 border rounded"/>
                                <input type="date" name="signDate" value={formData.signDate} onChange={handleChange} className="p-2 border rounded"/>
                                <input name="totalPrice" value={formData.totalPrice} onChange={handleChange} placeholder="成交總價" className="p-2 border rounded"/>
                                <div className="flex gap-2">
                                    <input name="store" value={formData.store} onChange={handleChange} placeholder="店別" className="p-2 border rounded w-1/2"/>
                                    <input name="storeCode" value={formData.storeCode} onChange={handleChange} placeholder="店代號" className="p-2 border rounded w-1/2"/>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                                <input name="serviceFeeSeller" value={formData.serviceFeeSeller} onChange={handleChange} placeholder="賣方服務費" className="p-2 border rounded"/>
                                <input name="serviceFeeBuyer" value={formData.serviceFeeBuyer} onChange={handleChange} placeholder="買方服務費" className="p-2 border rounded"/>
                                <input name="serviceFeeRenter" value={formData.serviceFeeRenter} onChange={handleChange} placeholder="出租方服務費" className="p-2 border rounded"/>
                                <input name="serviceFeeLandlord" value={formData.serviceFeeLandlord} onChange={handleChange} placeholder="承租方服務費" className="p-2 border rounded"/>
                                <input name="deduction" value={formData.deduction} onChange={handleChange} placeholder="減項(介紹費)" className="p-2 border rounded text-red-500 border-red-200"/>
                                <div className="text-right font-black text-xl text-blue-600 self-center">總業績: {total}</div>
                            </div>
                        </div>

                        {/* 5. 業績分配 (重點修改) */}
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm">
                            <h3 className="font-bold text-lg text-blue-800 mb-2 flex items-center gap-2"><Calculator className="w-5 h-5"/> 業績分配計算</h3>
                            <div className="text-xs text-blue-600 mb-4 bg-blue-100 p-2 rounded">
                                公式：總業績 - 53%(公司) = 剩餘獎金池 <br/>
                                開發池 = 剩餘 × 55% │ 行銷池 = 剩餘 × 45%
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                                <div className="bg-white p-2 rounded border"><div className="text-xs text-gray-500">公司留存 (53%)</div><div className="font-bold">{pools.company}</div></div>
                                <div className="bg-white p-2 rounded border border-blue-300"><div className="text-xs text-gray-500">開發池 (55%)</div><div className="font-bold text-blue-600">{pools.dev}</div></div>
                                <div className="bg-white p-2 rounded border border-green-300"><div className="text-xs text-gray-500">行銷池 (45%)</div><div className="font-bold text-green-600">{pools.sales}</div></div>
                            </div>

                            {/* 開發部門 */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-sm text-gray-700">開發部門 (分配池: {pools.dev})</h4>
                                    <button onClick={() => addAgent('dev')} className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1"><Plus className="w-3 h-3"/> 新增人員</button>
                                </div>
                                {formData.devAgents.map((agent, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2 items-center">
                                        <select 
                                            value={agent.user} 
                                            onChange={e => handleAgentChange('dev', idx, 'user', e.target.value)} 
                                            className="flex-1 p-2 border rounded text-sm"
                                        >
                                            <option value="">選擇人員</option>
                                            {allUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                        </select>
                                        <input 
                                            type="number" 
                                            value={agent.percent} 
                                            onChange={e => handleAgentChange('dev', idx, 'percent', e.target.value)} 
                                            placeholder="%" 
                                            className="w-16 p-2 border rounded text-sm text-center"
                                        />
                                        <span className="text-sm">%</span>
                                        <input 
                                            value={agent.amount} 
                                            readOnly 
                                            className="w-24 p-2 border rounded text-sm bg-gray-100 text-right font-bold"
                                        />
                                        <button onClick={() => removeAgent('dev', idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>

                            {/* 行銷部門 */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-sm text-gray-700">行銷部門 (分配池: {pools.sales})</h4>
                                    <button onClick={() => addAgent('sales')} className="text-xs bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1"><Plus className="w-3 h-3"/> 新增人員</button>
                                </div>
                                {formData.salesAgents.map((agent, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2 items-center">
                                        <select 
                                            value={agent.user} 
                                            onChange={e => handleAgentChange('sales', idx, 'user', e.target.value)} 
                                            className="flex-1 p-2 border rounded text-sm"
                                        >
                                            <option value="">選擇人員</option>
                                            {allUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                        </select>
                                        <input 
                                            type="number" 
                                            value={agent.percent} 
                                            onChange={e => handleAgentChange('sales', idx, 'percent', e.target.value)} 
                                            placeholder="%" 
                                            className="w-16 p-2 border rounded text-sm text-center"
                                        />
                                        <span className="text-sm">%</span>
                                        <input 
                                            value={agent.amount} 
                                            readOnly 
                                            className="w-24 p-2 border rounded text-sm bg-gray-100 text-right font-bold"
                                        />
                                        <button onClick={() => removeAgent('sales', idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 其他資料 (買賣方等，保持原樣或隱藏) */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">買賣方與代書</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="sellerName" value={formData.sellerName} onChange={handleChange} placeholder="賣方姓名" className="p-2 border rounded"/>
                                <input name="buyerName" value={formData.buyerName} onChange={handleChange} placeholder="買方姓名" className="p-2 border rounded"/>
                                <input name="deposit" value={formData.deposit} onChange={handleChange} placeholder="訂金" className="p-2 border rounded"/>
                                <input name="scrivenerNotes" value={formData.scrivenerNotes} onChange={handleChange} placeholder="代書備註" className="p-2 border rounded"/>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 右側：即時預覽 (Paper Look) */}
                <div className="w-1/2 bg-gray-500 p-8 overflow-y-auto flex justify-center">
                    <div id="paper-preview" className="bg-white shadow-2xl p-8" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                        
                        <h1>成交報告單</h1>

                        <table>
                            <tbody>
                                {/* 1. 基本資料表頭 (保持不變) */}
                                <tr>
                                    <td className="label-col">委託書編號</td>
                                    <td colSpan="3" className="input-cell">{formData.commissionNo}</td>
                                    <td className="label-col">成交日期</td>
                                    <td className="center">{formData.dealDate}</td>
                                    <td className="label-col">簽約日</td>
                                    <td className="center">{formData.signDate}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">案件編號</td>
                                    <td colSpan="3" className="input-cell">{formData.caseNo}</td>
                                    <td className="label-col">成交總價</td>
                                    <td className="center">{formData.totalPrice}</td>
                                    <td className="label-col">店別</td>
                                    <td className="center">{formData.store}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">成交案名</td>
                                    <td colSpan="3" className="input-cell">{formData.caseName}</td>
                                    <td className="label-col">地址</td>
                                    <td colSpan="3" className="input-cell">{formData.address}</td>
                                </tr>
                                
                                {/* 買賣方 (略為縮減以節省篇幅) */}
                                <tr>
                                    <td className="label-col">賣方姓名</td>
                                    <td colSpan="2" className="center">{formData.sellerName}</td>
                                    <td className="label-col">電話</td>
                                    <td colSpan="4" className="input-cell">{formData.sellerPhone}</td>
                                </tr>
                                <tr>
                                    <td className="label-col">買方姓名</td>
                                    <td colSpan="2" className="center">{formData.buyerName}</td>
                                    <td className="label-col">電話</td>
                                    <td colSpan="4" className="input-cell">{formData.buyerPhone}</td>
                                </tr>

                                {/* 佣收 */}
                                <tr>
                                    <td rowSpan="6" className="section-title">佣收加項</td>
                                    <td className="label-col">賣方</td>
                                    <td colSpan="2" className="center">{formData.serviceFeeSeller}</td>
                                    <td rowSpan="6" className="section-title">佣收減項</td>
                                    <td className="label-col">介紹費</td>
                                    <td colSpan="2" className="center">{formData.deduction}</td>
                                </tr>
                                <tr><td className="label-col">買方</td><td colSpan="2" className="center">{formData.serviceFeeBuyer}</td><td rowSpan="5" colSpan="3" style={{backgroundColor: '#fafafa'}}></td></tr>
                                <tr><td className="label-col">出租方</td><td colSpan="2" className="center">{formData.serviceFeeRenter}</td></tr>
                                <tr><td className="label-col">承租方</td><td colSpan="2" className="center">{formData.serviceFeeLandlord}</td></tr>
                                <tr><td className="label-col">小計</td><td colSpan="2" className="center font-bold">{total}</td></tr>
                                <tr><td colSpan="3" style={{border: 'none'}}></td></tr>

                                {/* 總計 */}
                                <tr>
                                    <td className="label-col">總計</td>
                                    <td className="label-col">小計</td>
                                    <td colSpan="2" className="center font-bold">{total}</td>
                                    <td className="label-col">訂金</td>
                                    <td colSpan="3" className="input-cell">{formData.deposit}</td>
                                </tr>

                                {/* 代書 (略) */}
                                <tr>
                                    <td className="label-col">代書作業</td>
                                    <td colSpan="7" className="input-cell">
                                        {formData.scrivenerType.join(', ')} 
                                        {formData.scrivenerNotes && ` (${formData.scrivenerNotes})`}
                                    </td>
                                </tr>

                                {/* ★★★ 業績分配 (動態列) ★★★ */}
                                {/* 計算總列數：標題1 + 開發人數 + 行銷人數 */}
                                {(() => {
                                    const devCount = formData.devAgents.length;
                                    const salesCount = formData.salesAgents.length;
                                    const totalRows = devCount + salesCount;
                                    
                                    return (
                                        <>
                                            {/* 標題列 */}
                                            <tr>
                                                <td rowSpan={totalRows + 1} className="section-title">業績分配</td>
                                                <td className="label-col">部門</td>
                                                <td className="label-col">人員</td>
                                                <td className="label-col">電話</td>
                                                <td className="label-col">金額</td>
                                                <td className="label-col">% (佔池)</td>
                                                <td colSpan="2" className="label-col">備註</td>
                                            </tr>

                                            {/* 開發人員列表 */}
                                            {formData.devAgents.map((agent, i) => (
                                                <tr key={`dev-${i}`}>
                                                    {i === 0 && <td rowSpan={devCount} className="center font-bold">開發</td>}
                                                    <td className="center">{agent.user}</td>
                                                    <td className="center">-</td>
                                                    <td className="center">{agent.amount}</td>
                                                    <td className="center">{agent.percent}%</td>
                                                    {/* 第一列顯示計算公式 */}
                                                    {i === 0 && <td rowSpan={totalRows} colSpan="2" className="input-cell" style={{verticalAlign:'top', fontSize:'12px', color:'#666'}}>
                                                        <div>公司留存 53%: {pools.company}</div>
                                                        <div>剩餘池 47%: {pools.bonus}</div>
                                                        <hr style={{margin:'5px 0'}}/>
                                                        <div>開發池 (55%): {pools.dev}</div>
                                                        <div>行銷池 (45%): {pools.sales}</div>
                                                    </td>}
                                                </tr>
                                            ))}

                                            {/* 行銷人員列表 */}
                                            {formData.salesAgents.map((agent, i) => (
                                                <tr key={`sales-${i}`}>
                                                    {i === 0 && <td rowSpan={salesCount} className="center font-bold">行銷</td>}
                                                    <td className="center">{agent.user}</td>
                                                    <td className="center">-</td>
                                                    <td className="center">{agent.amount}</td>
                                                    <td className="center">{agent.percent}%</td>
                                                </tr>
                                            ))}
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>

                        {/* Footer */}
                        <div className="footer">
                            <div><div className="sign-box">店東</div></div>
                            <div><div className="sign-box">總經理</div></div>
                            <div><div className="sign-box">店長</div></div>
                            <div><div className="sign-box">執行秘書</div></div>
                            <div><div className="sign-box">主辦代書</div></div>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '12px' }}>
                            製表日期：{new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealForm;