import React, { useState, useEffect } from 'react';
import { X, Save, Printer, Trash2, Calculator } from 'lucide-react';

const DealForm = ({ deal, onSave, onCancel, onDelete, allUsers = [] }) => {
    // 預設資料
    const [formData, setFormData] = useState(deal || {
        commissionNo: '', caseNo: '', caseName: '', address: '',
        dealDate: '', signDate: '', totalPrice: '', unitPrice: '', // 新增單價欄位
        store: '', storeCode: '', landPing: '', buildPing: '', // 新增坪數以便計算
        
        sellerName: '', sellerPhone: '', sellerAddress: '',
        buyerName: '', buyerPhone: '', buyerAddress: '',
        
        serviceFeeSeller: '', serviceFeeBuyer: '', 
        serviceFeeRenter: '', serviceFeeLandlord: '',
        deduction: '', subtotal: '', deposit: '',
        
        scrivenerType: [], scrivenerName: '', scrivenerPhone: '', 
        scrivenerSignTime: '', scrivenerAddress: '', scrivenerNotes: '',

        // 業績分配 (支援多人)
        devAgents: [{ user: '', percent: 100, amount: 0 }],
        salesAgents: [{ user: '', percent: 100, amount: 0 }],
    });

    const [total, setTotal] = useState(0);
    const [pools, setPools] = useState({ company: 0, bonus: 0, dev: 0, sales: 0 });

    // 1. 自動計算小計
    useEffect(() => {
        const sum = (Number(formData.serviceFeeSeller) || 0) + 
                    (Number(formData.serviceFeeBuyer) || 0) + 
                    (Number(formData.serviceFeeRenter) || 0) + 
                    (Number(formData.serviceFeeLandlord) || 0);
        const sub = sum - (Number(formData.deduction) || 0);
        setTotal(sub);
        setFormData(prev => ({ ...prev, subtotal: sub }));
    }, [formData.serviceFeeSeller, formData.serviceFeeBuyer, formData.serviceFeeRenter, formData.serviceFeeLandlord, formData.deduction]);

    // 2. 自動分配計算 (與之前邏輯相同)
    useEffect(() => {
        if (total > 0) {
            const companyTake = Math.round(total * 0.53);
            const bonusPool = total - companyTake;
            const devPool = Math.round(bonusPool * 0.55);
            const salesPool = Math.round(bonusPool * 0.45);
            setPools({ company: companyTake, bonus: bonusPool, dev: devPool, sales: salesPool });

            const updatedDev = formData.devAgents.map(agent => ({
                ...agent,
                amount: Math.round(devPool * (Number(agent.percent) / 100))
            }));
            const updatedSales = formData.salesAgents.map(agent => ({
                ...agent,
                amount: Math.round(salesPool * (Number(agent.percent) / 100))
            }));

            const isDiff = JSON.stringify(updatedDev) !== JSON.stringify(formData.devAgents) || 
                           JSON.stringify(updatedSales) !== JSON.stringify(formData.salesAgents);
            if (isDiff) setFormData(prev => ({ ...prev, devAgents: updatedDev, salesAgents: updatedSales }));
        }
    }, [total, formData.devAgents, formData.salesAgents]);

    // 3. 總價換算單價 (輔助功能)
    const handlePriceCalc = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // 如果有總價和坪數，自動算單價
            const t = parseFloat(updated.totalPrice);
            const p = parseFloat(updated.buildPing) || parseFloat(updated.landPing);
            if (!isNaN(t) && !isNaN(p) && p > 0) {
                // 假設總價是萬，單價是元/坪
                updated.unitPrice = Math.round((t * 10000) / p).toString();
            }
            return updated;
        });
    };

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

    const handleAgentChange = (type, index, field, value) => {
        const listName = type === 'dev' ? 'devAgents' : 'salesAgents';
        const list = [...formData[listName]];
        list[index][field] = value;
        setFormData({ ...formData, [listName]: list });
    };

    const addAgent = (type) => {
        const listName = type === 'dev' ? 'devAgents' : 'salesAgents';
        setFormData({ ...formData, [listName]: [...formData[listName], { user: '', percent: 0, amount: 0 }] });
    };

    const removeAgent = (type, index) => {
        const listName = type === 'dev' ? 'devAgents' : 'salesAgents';
        const list = [...formData[listName]];
        if (list.length > 1) {
            list.splice(index, 1);
            setFormData({ ...formData, [listName]: list });
        }
    };

    // ★★★ 全新列印引擎：強制橫式 (Landscape) ★★★
    const handlePrint = () => {
        const win = window.open('', '', 'height=800,width=1200');
        
        // 動態生成業績分配 HTML
        let devRows = '';
        formData.devAgents.forEach((agent, i) => {
            devRows += `
                <tr>
                    ${i === 0 ? `<td rowspan="${formData.devAgents.length}" class="center font-bold bg-gray">開發</td>` : ''}
                    <td class="center">${agent.user}</td>
                    <td class="center"></td>
                    <td class="center">${agent.amount.toLocaleString()}</td>
                    <td class="center">${agent.percent}%</td>
                    ${i === 0 ? `<td rowspan="${formData.devAgents.length + formData.salesAgents.length}" colspan="2" class="input-cell" style="vertical-align: top; font-size: 10px;">
                        <div>總業績: ${total.toLocaleString()}</div>
                        <div>公司留存(53%): ${pools.company.toLocaleString()}</div>
                        <div>獎金池(47%): ${pools.bonus.toLocaleString()}</div>
                        <hr>
                        <div>開發池(55%): ${pools.dev.toLocaleString()}</div>
                        <div>行銷池(45%): ${pools.sales.toLocaleString()}</div>
                    </td>` : ''}
                </tr>
            `;
        });

        let salesRows = '';
        formData.salesAgents.forEach((agent, i) => {
            salesRows += `
                <tr>
                    ${i === 0 ? `<td rowspan="${formData.salesAgents.length}" class="center font-bold bg-gray">行銷</td>` : ''}
                    <td class="center">${agent.user}</td>
                    <td class="center"></td>
                    <td class="center">${agent.amount.toLocaleString()}</td>
                    <td class="center">${agent.percent}%</td>
                </tr>
            `;
        });

        win.document.write('<html><head><title>成交報告單</title>');
        win.document.write('<style>');
        win.document.write(`
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: "Microsoft JhengHei", sans-serif; -webkit-print-color-adjust: exact; margin: 0; padding: 0; width: 100%; }
            h1 { text-align: center; font-size: 36px; font-family: "KaiTi", "BiauKai", serif; margin: 0 0 15px 0; font-weight: bold; letter-spacing: 10px; }
            table { width: 100%; border-collapse: collapse; border: 2px solid black; }
            td, th { border: 1px solid black; padding: 5px; font-size: 13px; height: 30px; vertical-align: middle; }
            .bg-gray { background-color: #e0e0e0; font-weight: bold; text-align: center; }
            .label-col { text-align: center; font-weight: bold; width: 10%; background-color: #f0f0f0; }
            .input-cell { text-align: left; padding-left: 8px; font-weight: bold; }
            .center { text-align: center; }
            .section-v { writing-mode: vertical-lr; text-align: center; font-weight: bold; background-color: #e0e0e0; width: 30px; letter-spacing: 5px; margin: 0 auto;}
            .checkbox-wrap { display: flex; flex-wrap: wrap; gap: 15px; align-items: center; justify-content: flex-start; }
            .check-box { display: inline-block; width: 12px; height: 12px; border: 1px solid black; margin-right: 5px; position: relative; top: 2px; }
            .check-box.checked { background-color: black; }
            .footer { display: flex; justify-content: space-between; margin-top: 30px; padding: 0 20px; }
            .sign-box { border-bottom: 1px solid black; width: 120px; text-align: center; padding-bottom: 5px; font-weight: bold; font-size: 16px; min-height: 30px; }
        `);
        win.document.write('</style></head><body>');
        
        win.document.write(`
            <h1>成交報告單</h1>
            <table>
                <tr>
                    <td class="label-col">委託書編號</td>
                    <td colspan="3" class="input-cell">${formData.commissionNo}</td>
                    <td class="label-col">成交日期</td>
                    <td class="center">${formData.dealDate}</td>
                    <td class="label-col">簽約日</td>
                    <td class="center">${formData.signDate}</td>
                </tr>
                <tr>
                    <td class="label-col">案件編號</td>
                    <td colspan="3" class="input-cell">${formData.caseNo}</td>
                    <td class="label-col">成交總價</td>
                    <td class="center">${formData.totalPrice}</td>
                    <td class="label-col">店別</td>
                    <td class="center">${formData.store}</td>
                </tr>
                <tr>
                    <td class="label-col">成交案名</td>
                    <td colspan="3" class="input-cell">${formData.caseName}</td>
                    <td class="label-col">地址</td>
                    <td colspan="3" class="input-cell">${formData.address}</td>
                </tr>

                <tr>
                    <td class="label-col">賣方姓名</td>
                    <td colspan="2" class="center">${formData.sellerName}</td>
                    <td class="label-col">電話</td>
                    <td colspan="4" class="input-cell">${formData.sellerPhone}</td>
                </tr>
                <tr>
                    <td class="label-col">賣方地址</td>
                    <td colspan="7" class="input-cell">${formData.sellerAddress}</td>
                </tr>
                <tr>
                    <td class="label-col">買方姓名</td>
                    <td colspan="2" class="center">${formData.buyerName}</td>
                    <td class="label-col">電話</td>
                    <td colspan="4" class="input-cell">${formData.buyerPhone}</td>
                </tr>
                <tr>
                    <td class="label-col">買方地址</td>
                    <td colspan="7" class="input-cell">${formData.buyerAddress}</td>
                </tr>

                <tr>
                    <td rowspan="6" class="bg-gray"><div class="section-v">佣收加項</div></td>
                    <td class="label-col">賣方</td>
                    <td colspan="2" class="center">${formData.serviceFeeSeller}</td>
                    <td rowspan="6" class="bg-gray"><div class="section-v">佣收減項</div></td>
                    <td class="label-col">介紹費</td>
                    <td colspan="2" class="center">${formData.deduction}</td>
                </tr>
                <tr>
                    <td class="label-col">買方</td>
                    <td colspan="2" class="center">${formData.serviceFeeBuyer}</td>
                    <td rowspan="4" colspan="3" style="background-color: #fafafa;"></td>
                </tr>
                <tr>
                    <td class="label-col">出租方</td>
                    <td colspan="2" class="center">${formData.serviceFeeRenter}</td>
                </tr>
                <tr>
                    <td class="label-col">承租方</td>
                    <td colspan="2" class="center">${formData.serviceFeeLandlord}</td>
                </tr>
                <tr>
                    <td class="label-col">小計</td>
                    <td colspan="2" class="center font-bold">${total.toLocaleString()}</td>
                </tr>
                <tr>
                    <td colspan="3" style="border:none;"></td>
                    <td class="label-col">訂金</td>
                    <td colspan="2" class="center">${formData.deposit}</td>
                </tr>

                <tr>
                    <td class="label-col" rowspan="2">代書作業</td>
                    <td colspan="7" class="input-cell">
                        <div class="checkbox-wrap">
                            <span><span class="check-box ${formData.scrivenerType?.includes('內簽內辦')?'checked':''}"></span>內簽內辦</span>
                            <span><span class="check-box ${formData.scrivenerType?.includes('內簽外辦')?'checked':''}"></span>內簽外辦</span>
                            <span><span class="check-box ${formData.scrivenerType?.includes('外簽外辦')?'checked':''}"></span>外簽外辦</span>
                            <span style="margin-left:20px;">(電話: ${formData.scrivenerPhone})</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td colspan="7" class="input-cell">
                        <div class="checkbox-wrap">
                            <span><span class="check-box ${formData.scrivenerType?.includes('特約代書')?'checked':''}"></span>特約代書</span>
                            <span><span class="check-box ${formData.scrivenerType?.includes('非特約代書')?'checked':''}"></span>非特約代書</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="label-col">簽約時間</td>
                    <td colspan="3" class="center">${formData.scrivenerSignTime}</td>
                    <td class="label-col">備註</td>
                    <td colspan="3" class="input-cell">${formData.scrivenerNotes}</td>
                </tr>
                <tr>
                    <td class="label-col">地址</td>
                    <td colspan="7" class="input-cell">${formData.scrivenerAddress}</td>
                </tr>

                <tr>
                    <td rowspan="${formData.devAgents.length + formData.salesAgents.length + 1}" class="bg-gray"><div class="section-v">業績分配</div></td>
                    <td class="label-col">部門</td>
                    <td class="label-col">人員</td>
                    <td class="label-col">電話</td>
                    <td class="label-col">金額</td>
                    <td class="label-col">%</td>
                    <td colspan="2" class="label-col">備註</td>
                </tr>
                ${devRows}
                ${salesRows}

            </table>

            <div class="footer">
                <div><div class="sign-box">店東</div></div>
                <div><div class="sign-box">總經理</div></div>
                <div><div class="sign-box">店長</div></div>
                <div><div class="sign-box">執行秘書</div></div>
                <div><div class="sign-box">主辦代書</div></div>
            </div>
            <div style="text-align: right; margin-top: 10px; font-size: 12px;">製表日期: ${new Date().toLocaleDateString()}</div>
        `);
        
        win.document.write('</body></html>');
        win.document.close();
        // 延遲一下確保渲染完成再列印
        setTimeout(() => win.print(), 500);
    };

    return (
        <div className="fixed inset-0 bg-gray-100 z-[60] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Save className="w-6 h-6 text-blue-600"/> 成交報告單編輯</h2>
                <div className="flex gap-3">
                    <button onClick={handlePrint} className="px-5 py-2 bg-purple-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-purple-700 shadow-lg"><Printer className="w-5 h-5"/> 列印 (橫式PDF)</button>
                    <button onClick={() => onSave(formData)} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg"><Save className="w-5 h-5"/> 儲存</button>
                    {deal && <button onClick={() => onDelete(deal.id)} className="px-5 py-2 bg-red-100 text-red-600 rounded-lg font-bold flex items-center gap-2 hover:bg-red-200"><Trash2 className="w-5 h-5"/> 刪除</button>}
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-6 h-6 text-gray-500"/></button>
                </div>
            </div>

            {/* Content: 單欄式輸入，不跑版 */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6">
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">1. 案件基本資料</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input name="commissionNo" value={formData.commissionNo} onChange={handleChange} placeholder="委託書編號" className="p-2 border rounded"/>
                            <input name="caseNo" value={formData.caseNo} onChange={handleChange} placeholder="案件編號" className="p-2 border rounded"/>
                            
                            {/* 總價計算區 */}
                            <div className="flex gap-2">
                                <input name="totalPrice" value={formData.totalPrice} onChange={handlePriceCalc} placeholder="成交總價 (萬)" className="w-2/3 p-2 border rounded text-blue-600 font-bold"/>
                                <input name="landPing" value={formData.landPing} onChange={handlePriceCalc} placeholder="坪數" className="w-1/3 p-2 border rounded"/>
                            </div>
                            <div className="col-span-3 text-xs text-gray-400">系統自動換算單價 (參考): {formData.unitPrice ? `${formData.unitPrice} 元/坪` : '-'}</div>

                            <input name="caseName" value={formData.caseName} onChange={handleChange} placeholder="成交案名" className="p-2 border rounded md:col-span-2"/>
                            <input name="address" value={formData.address} onChange={handleChange} placeholder="地址" className="p-2 border rounded md:col-span-3"/>
                            
                            <div className="flex gap-2 items-center">
                                <span className="text-sm font-bold text-gray-500 w-16">成交日:</span>
                                <input type="date" name="dealDate" value={formData.dealDate} onChange={handleChange} className="flex-1 p-2 border rounded"/>
                            </div>
                            <div className="flex gap-2 items-center">
                                <span className="text-sm font-bold text-gray-500 w-16">簽約日:</span>
                                <input type="date" name="signDate" value={formData.signDate} onChange={handleChange} className="flex-1 p-2 border rounded"/>
                            </div>
                            <div className="flex gap-2">
                                <input name="store" value={formData.store} onChange={handleChange} placeholder="店別" className="p-2 border rounded w-1/2"/>
                                <input name="storeCode" value={formData.storeCode} onChange={handleChange} placeholder="店代號" className="p-2 border rounded w-1/2"/>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">2. 買賣雙方</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 p-3 bg-gray-50 rounded">
                                <div className="font-bold text-gray-500">賣方</div>
                                <div className="flex gap-2"><input name="sellerName" value={formData.sellerName} onChange={handleChange} placeholder="姓名" className="flex-1 p-2 border rounded"/><input name="sellerPhone" value={formData.sellerPhone} onChange={handleChange} placeholder="電話" className="flex-1 p-2 border rounded"/></div>
                                <input name="sellerAddress" value={formData.sellerAddress} onChange={handleChange} placeholder="地址" className="w-full p-2 border rounded"/>
                            </div>
                            <div className="space-y-2 p-3 bg-gray-50 rounded">
                                <div className="font-bold text-gray-500">買方</div>
                                <div className="flex gap-2"><input name="buyerName" value={formData.buyerName} onChange={handleChange} placeholder="姓名" className="flex-1 p-2 border rounded"/><input name="buyerPhone" value={formData.buyerPhone} onChange={handleChange} placeholder="電話" className="flex-1 p-2 border rounded"/></div>
                                <input name="buyerAddress" value={formData.buyerAddress} onChange={handleChange} placeholder="地址" className="w-full p-2 border rounded"/>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">3. 佣收計算</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input name="serviceFeeSeller" value={formData.serviceFeeSeller} onChange={handleChange} placeholder="賣方服務費" className="p-2 border rounded"/>
                            <input name="serviceFeeBuyer" value={formData.serviceFeeBuyer} onChange={handleChange} placeholder="買方服務費" className="p-2 border rounded"/>
                            <input name="serviceFeeRenter" value={formData.serviceFeeRenter} onChange={handleChange} placeholder="出租方服務費" className="p-2 border rounded"/>
                            <input name="serviceFeeLandlord" value={formData.serviceFeeLandlord} onChange={handleChange} placeholder="承租方服務費" className="p-2 border rounded"/>
                        </div>
                        <div className="flex gap-4 items-center bg-blue-50 p-3 rounded border border-blue-100">
                            <span className="font-bold text-red-500">減項 (介紹費):</span>
                            <input name="deduction" value={formData.deduction} onChange={handleChange} placeholder="金額" className="p-2 border rounded border-red-200 text-red-600 font-bold"/>
                            <div className="flex-1 text-right font-black text-2xl text-blue-600">小計: {total.toLocaleString()}</div>
                        </div>
                        <div className="mt-4">
                            <input name="deposit" value={formData.deposit} onChange={handleChange} placeholder="訂金" className="w-full p-2 border rounded"/>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">4. 代書作業</h3>
                        <div className="flex flex-wrap gap-3 mb-4">
                            {['內簽內辦', '內簽外辦', '外簽外辦', '特約代書', '非特約代書'].map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer border px-3 py-2 rounded hover:bg-gray-50">
                                    <input type="checkbox" name="scrivenerType" value={opt} checked={formData.scrivenerType?.includes(opt)} onChange={handleChange} className="w-4 h-4"/>
                                    <span className="text-sm">{opt}</span>
                                </label>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="scrivenerSignTime" value={formData.scrivenerSignTime} onChange={handleChange} placeholder="簽約時間" className="p-2 border rounded"/>
                            <input name="scrivenerPhone" value={formData.scrivenerPhone} onChange={handleChange} placeholder="代書電話" className="p-2 border rounded"/>
                            <input name="scrivenerNotes" value={formData.scrivenerNotes} onChange={handleChange} placeholder="備註" className="p-2 border rounded md:col-span-2"/>
                            <input name="scrivenerAddress" value={formData.scrivenerAddress} onChange={handleChange} placeholder="代書地址" className="p-2 border rounded md:col-span-2"/>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg text-gray-700 mb-4 border-b pb-2">5. 業績分配 (系統自動計算)</h3>
                        
                        {/* 開發 */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-blue-600">開發部門 (Pool: {pools.dev.toLocaleString()})</h4>
                                <button onClick={() => addAgent('dev')} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-200"><Calculator className="w-3 h-3"/> 新增人員</button>
                            </div>
                            {formData.devAgents.map((agent, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <select value={agent.user} onChange={e => handleAgentChange('dev', idx, 'user', e.target.value)} className="flex-1 p-2 border rounded">
                                        <option value="">選擇人員</option>
                                        {allUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <input type="number" value={agent.percent} onChange={e => handleAgentChange('dev', idx, 'percent', e.target.value)} placeholder="%" className="w-16 p-2 border rounded text-center"/>
                                        <span>%</span>
                                    </div>
                                    <input value={agent.amount.toLocaleString()} readOnly className="w-24 p-2 border rounded text-right bg-gray-200 font-bold"/>
                                    <button onClick={() => removeAgent('dev', idx)} className="text-red-400 hover:bg-red-100 p-2 rounded"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>

                        {/* 行銷 */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-green-600">行銷部門 (Pool: {pools.sales.toLocaleString()})</h4>
                                <button onClick={() => addAgent('sales')} className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-green-200"><Calculator className="w-3 h-3"/> 新增人員</button>
                            </div>
                            {formData.salesAgents.map((agent, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <select value={agent.user} onChange={e => handleAgentChange('sales', idx, 'user', e.target.value)} className="flex-1 p-2 border rounded">
                                        <option value="">選擇人員</option>
                                        {allUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <input type="number" value={agent.percent} onChange={e => handleAgentChange('sales', idx, 'percent', e.target.value)} placeholder="%" className="w-16 p-2 border rounded text-center"/>
                                        <span>%</span>
                                    </div>
                                    <input value={agent.amount.toLocaleString()} readOnly className="w-24 p-2 border rounded text-right bg-gray-200 font-bold"/>
                                    <button onClick={() => removeAgent('sales', idx)} className="text-red-400 hover:bg-red-100 p-2 rounded"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DealForm;