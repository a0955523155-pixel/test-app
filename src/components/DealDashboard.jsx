import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, FileText as ReportIcon, PieChart } from 'lucide-react';
import { COMMISSION_RATES } from '../config/constants';

const DealDashboard = ({ deals, allUsers, companyProjects, darkMode, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'sale', 
        project: '',
        partyA_name: '', partyA_phone: '', partyA_addr: '', partyA_fee: '',
        partyB_name: '', partyB_phone: '', partyB_addr: '', partyB_fee: '',
        commission: '',
        companySplit: '',
        companySplitPercent: (COMMISSION_RATES.COMPANY * 100).toString(),
        distributions: [] 
    });

    const [newDistAgent, setNewDistAgent] = useState('');
    const [newDistRole, setNewDistRole] = useState('銷售'); 
    const [newDistPercent, setNewDistPercent] = useState(100); 

    // 自動計算總服務費與公司抽成
    useEffect(() => {
        const feeA = Number(formData.partyA_fee) || 0;
        const feeB = Number(formData.partyB_fee) || 0;
        const total = feeA + feeB;
        
        // 使用設定檔的比例計算
        const companyAmt = Math.round(total * COMMISSION_RATES.COMPANY);
        
        setFormData(prev => ({ 
            ...prev, 
            commission: total,
            companySplit: companyAmt,
            companySplitPercent: (COMMISSION_RATES.COMPANY * 100).toString()
        }));
    }, [formData.partyA_fee, formData.partyB_fee]);

    // 計算各池金額
    const remaining = (Number(formData.commission) || 0) - (Number(formData.companySplit) || 0);
    const devPool = Math.round(remaining * COMMISSION_RATES.DEV_POOL);
    const salesPool = remaining - devPool; 

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setIsEditing(false);
        resetForm();
    };

    const resetForm = () => {
         setFormData({
            date: new Date().toISOString().split('T')[0],
            type: 'sale',
            project: '',
            partyA_name: '', partyA_phone: '', partyA_addr: '', partyA_fee: '',
            partyB_name: '', partyB_phone: '', partyB_addr: '', partyB_fee: '',
            commission: '',
            companySplit: '',
            companySplitPercent: (COMMISSION_RATES.COMPANY * 100).toString(),
            distributions: []
        });
        setNewDistAgent('');
        setNewDistRole('銷售');
        setNewDistPercent(100);
    }

    const handleEdit = (deal) => {
        setFormData(deal);
        setIsEditing(true);
    };

    const addDistribution = () => {
        if (!newDistAgent) return;
        const agentName = allUsers.find(u => u.username === newDistAgent)?.name || newDistAgent;
        
        const poolAmount = newDistRole === '開發' ? devPool : salesPool;
        const amount = Math.round(poolAmount * (Number(newDistPercent) / 100));

        const newDist = {
            userId: newDistAgent,
            agentName: agentName,
            role: newDistRole,
            percent: newDistPercent,
            amount: amount,
        };
        
        setFormData(prev => ({ ...prev, distributions: [...(prev.distributions || []), newDist] }));
        setNewDistAgent('');
        setNewDistPercent(100); 
    };

    const removeDistribution = (index) => {
        setFormData(prev => ({
            ...prev,
            distributions: prev.distributions.filter((_, i) => i !== index)
        }));
    };

    const distDevTotal = (formData.distributions || []).filter(d => d.role === '開發').reduce((a,c) => a + c.amount, 0);
    const distSalesTotal = (formData.distributions || []).filter(d => d.role === '銷售').reduce((a,c) => a + c.amount, 0);

    const remainingDev = devPool - distDevTotal;
    const remainingSales = salesPool - distSalesTotal;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2 text-green-600"><ReportIcon className="w-5 h-5"/> 成交報告單管理</h3>
                <button onClick={() => { resetForm(); setIsEditing(true); }} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-green-700 cursor-pointer"><Plus className="w-4 h-4" /> 新增成交</button>
            </div>

            {isEditing && (
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-green-100 shadow-sm'}`}>
                    <h4 className="font-bold mb-4 border-b pb-2">填寫成交報告</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">成交日期</label>
                                <input type="date" required className={`w-full px-3 py-2 rounded border outline-none ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50'}`} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">類型</label>
                                <select className={`w-full px-3 py-2 rounded border outline-none ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50'}`} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option value="sale">買賣</option>
                                    <option value="rent">租賃</option>
                                </select>
                            </div>
                             <div className="col-span-2">
                                <label className="text-xs font-bold text-gray-400 block mb-1">案場 (選填)</label>
                                <select className={`w-full px-3 py-2 rounded border outline-none ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-gray-50'}`} value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})}>
                                    <option value="">無</option>
                                    {Object.entries(companyProjects).map(([region, sites]) => (
                                        <optgroup key={region} label={region}>{sites.map(s => <option key={s} value={s}>{s}</option>)}</optgroup>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700">
                            {/* 甲方 */}
                            <div className="space-y-3">
                                <h5 className="font-bold text-blue-600 border-b pb-1">{formData.type === 'sale' ? '買方資料' : '承租方資料'}</h5>
                                <input placeholder="姓名" className={`w-full px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`} value={formData.partyA_name} onChange={e => setFormData({...formData, partyA_name: e.target.value})} />
                                <input placeholder="電話" className={`w-full px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`} value={formData.partyA_phone} onChange={e => setFormData({...formData, partyA_phone: e.target.value})} />
                                <input placeholder="地址" className={`w-full px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`} value={formData.partyA_addr} onChange={e => setFormData({...formData, partyA_addr: e.target.value})} />
                                <div className="flex items-center">
                                    <span className="text-xs mr-2">服務費</span>
                                    <input type="number" placeholder="金額" className={`flex-1 px-3 py-1 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`} value={formData.partyA_fee} onChange={e => setFormData({...formData, partyA_fee: e.target.value})} />
                                </div>
                            </div>
                            {/* 乙方 */}
                            <div className="space-y-3">
                                <h5 className="font-bold text-red-600 border-b pb-1">{formData.type === 'sale' ? '賣方資料' : '出租方資料'}</h5>
                                <input placeholder="姓名" className={`w-full px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`} value={formData.partyB_name} onChange={e => setFormData({...formData, partyB_name: e.target.value})} />
                                <input placeholder="電話" className={`w-full px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`} value={formData.partyB_phone} onChange={e => setFormData({...formData, partyB_phone: e.target.value})} />
                                <input placeholder="地址" className={`w-full px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`} value={formData.partyB_addr} onChange={e => setFormData({...formData, partyB_addr: e.target.value})} />
                                <div className="flex items-center">
                                    <span className="text-xs mr-2">服務費</span>
                                    <input type="number" placeholder="金額" className={`flex-1 px-3 py-1 rounded border text-sm ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`} value={formData.partyB_fee} onChange={e => setFormData({...formData, partyB_fee: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* 業績分配區塊 */}
                        <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/30">
                            <h5 className="font-bold text-yellow-700 dark:text-yellow-500 mb-3 flex items-center gap-2"><PieChart className="w-4 h-4"/> 業績分配</h5>
                            
                            <div className="mb-4 flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[140px]">
                                    <label className="text-xs font-bold text-gray-500 block mb-1">公司抽成 ({COMMISSION_RATES.COMPANY * 100}%)</label>
                                    <div className="font-mono text-lg font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded">${formData.companySplit.toLocaleString()}</div>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="text-xs font-bold text-blue-600 block mb-1">開發池 (剩餘之{COMMISSION_RATES.DEV_POOL * 100}%)</label>
                                    <div className="font-mono text-lg font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded">${devPool.toLocaleString()}</div>
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="text-xs font-bold text-green-600 block mb-1">銷售池 (剩餘之{COMMISSION_RATES.SALES_POOL * 100}%)</label>
                                    <div className="font-mono text-lg font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded">${salesPool.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="text-xs font-bold text-gray-500 block mb-1">新增人員分配</label>
                                <div className="flex gap-2 mb-2 items-center flex-wrap">
                                    <select className={`flex-1 min-w-[120px] px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white'}`} value={newDistAgent} onChange={e => setNewDistAgent(e.target.value)}>
                                        <option value="">選擇人員...</option>
                                        {allUsers.map(u => <option key={u.id} value={u.username}>{u.name}</option>)}
                                    </select>
                                    <select 
                                        className={`w-28 px-2 py-1 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white'}`} 
                                        value={newDistRole} 
                                        onChange={e => {
                                            setNewDistRole(e.target.value);
                                            setNewDistPercent(100); 
                                        }}
                                    >
                                        <option value="銷售">銷售</option>
                                        <option value="開發">開發</option>
                                    </select>
                                    <div className="flex items-center gap-1 w-32">
                                        <input 
                                            type="number" 
                                            placeholder="該池佔比"
                                            className={`w-full px-2 py-1 rounded border text-sm text-center ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white'}`} 
                                            value={newDistPercent} 
                                            onChange={e => setNewDistPercent(e.target.value)} 
                                        />
                                        <span className="text-xs text-gray-500">%</span>
                                    </div>
                                    <button type="button" onClick={addDistribution} className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 flex-shrink-0"><Plus className="w-4 h-4"/></button>
                                </div>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                    {(formData.distributions || []).map((dist, idx) => (
                                        <div key={idx} className={`flex justify-between items-center p-2 rounded border text-sm ${dist.role === '開發' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100' : 'bg-green-50 dark:bg-green-900/10 border-green-100'}`}>
                                            <div>
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded mr-2 ${dist.role === '開發' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{dist.role}</span>
                                                <span>{dist.agentName}</span>
                                                <span className="text-gray-400 text-xs ml-1">(佔{dist.percent}%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold">${dist.amount.toLocaleString()}</span>
                                                <button type="button" onClick={() => removeDistribution(idx)} className="text-red-500 hover:bg-red-50 rounded-full p-1"><X className="w-3 h-3"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mt-3 pt-2 border-t border-yellow-300/30 flex justify-between text-xs font-bold text-gray-500">
                                <span>開發池餘額: <span className={remainingDev !== 0 ? 'text-red-500' : 'text-green-500'}>${remainingDev.toLocaleString()}</span></span>
                                <span>銷售池餘額: <span className={remainingSales !== 0 ? 'text-red-500' : 'text-green-500'}>${remainingSales.toLocaleString()}</span></span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => { setIsEditing(false); resetForm(); }} className="flex-1 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg text-sm font-bold">取消</button>
                            <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold">儲存報告單</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {deals.map(deal => {
                    const agentName = deal.distributions && deal.distributions.length > 0 
                        ? deal.distributions.map(d => `${d.agentName}(${d.role})`).join(', ') 
                        : (allUsers.find(u => u.username === deal.agent)?.name || deal.agent);

                    return (
                        <div key={deal.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${deal.type === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{deal.type === 'sale' ? '買賣' : '租賃'}</span>
                                    <span className="text-xs text-gray-400">{deal.date}</span>
                                </div>
                                <div className="text-sm space-y-1">
                                    <p><span className="text-gray-400 text-xs mr-1">{deal.type==='sale'?'買':'承租'}:</span> {deal.partyA_name} <span className="text-gray-400 text-xs">({deal.partyA_phone})</span></p>
                                    <p><span className="text-gray-400 text-xs mr-1">{deal.type==='sale'?'賣':'出租'}:</span> {deal.partyB_name} <span className="text-gray-400 text-xs">({deal.partyB_phone})</span></p>
                                </div>
                                {/* 顯示參與人員 */}
                                <div className="mt-2 text-xs bg-gray-100 dark:bg-slate-700 p-1.5 rounded text-gray-600 dark:text-gray-300">
                                    <span className="font-bold text-gray-500 mr-1">參與:</span>
                                    {agentName}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 self-end md:self-center">
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 block">總業績</span>
                                    <span className="text-lg font-bold text-green-500 font-mono">${Number(deal.commission).toLocaleString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(deal)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => onDelete(deal.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {deals.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">尚無成交紀錄</div>}
            </div>
        </div>
    );
};

export default DealDashboard;