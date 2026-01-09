import React, { useState, useEffect } from 'react';
import { Briefcase, Loader2, UserCircle, ShieldCheck } from 'lucide-react';
import { APP_NAME, ADMIN_CODE, SUPER_ADMIN_CODE } from '../config/constants';

const LoginScreen = ({ onLogin, onRegister, loading, darkMode }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', name: '', role: 'user', adminCode: '', companyCode: '', rememberMe: false });
    const [captcha, setCaptcha] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");

    useEffect(() => {
        const savedLogin = localStorage.getItem('crm-login-info');
        if (savedLogin) {
            try { const { username, password, companyCode } = JSON.parse(atob(savedLogin)); setForm(prev => ({ ...prev, username, password, companyCode, rememberMe: true })); } catch (e) {}
        }
    }, []);

    const generateCaptcha = () => { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let result = ""; for(let i=0; i<4; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); } setCaptcha(result); setCaptchaInput(""); };
    useEffect(() => { if(isRegister) generateCaptcha(); }, [isRegister]);

    const submit = async (e) => {
      e.preventDefault();
      if (!form.companyCode.trim()) return alert("請輸入公司統編");
      if (isRegister) {
        if (captchaInput.toUpperCase() !== captcha) { alert("驗證碼錯誤"); generateCaptcha(); return; }
        if (form.role === 'admin' && form.adminCode !== ADMIN_CODE && form.adminCode !== SUPER_ADMIN_CODE) return alert("註冊碼錯誤");
        onRegister(form.username, form.password, form.name, form.role, form.adminCode, form.companyCode);
      } else {
          onLogin(form.username, form.password, form.companyCode, form.rememberMe);
      }
    };

    return (
      <div className={`fixed inset-0 z-50 overflow-y-auto bg-gray-100 dark:bg-slate-950`} style={{ colorScheme: darkMode ? 'dark' : 'light' }}>
         <div className="flex min-h-full items-center justify-center p-0 sm:p-4 bg-gray-100 dark:bg-slate-950 transform-gpu">
            <div className={`w-full min-h-[100dvh] sm:min-h-0 sm:h-auto sm:max-w-md p-8 sm:rounded-2xl sm:shadow-xl flex flex-col justify-center transition-colors duration-300 ${darkMode ? 'bg-slate-900 sm:border border-slate-800' : 'bg-white'}`} style={{ WebkitTapHighlightColor: 'transparent' }}>
                <div className="text-center mb-8 shrink-0">
                   <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30"><Briefcase className="w-8 h-8" /></div>
                   <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{APP_NAME}</h1>
                </div>
                <form onSubmit={submit} className="space-y-4 shrink-0">
                    <div><label className="text-xs font-bold text-gray-400 uppercase">公司統編</label><input required className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-200'}`} value={form.companyCode} onChange={e => setForm({...form, companyCode: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">帳號</label><input required className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-200'}`} value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">密碼</label><input type="password" required className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-200'}`} value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
                    {!isRegister && <div className="flex items-center ml-1"><input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm({...form, rememberMe: e.target.checked})}/><label className="ml-2 text-sm text-gray-500">記住我</label></div>}
                    {isRegister && (
                      <div className="space-y-4">
                          <div><label className="text-xs font-bold text-gray-400 uppercase">姓名</label><input required className={`w-full px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-200'}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                          <div>
                             <label className="text-xs font-bold text-gray-400 uppercase ml-1">角色</label>
                             <div className="grid grid-cols-2 gap-3 mt-1">
                                 <button type="button" onClick={() => setForm({...form, role: 'user'})} className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 ${form.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : (darkMode ? 'bg-slate-800 text-gray-400 border-slate-700' : 'bg-white text-gray-500 border-gray-200')}`}><UserCircle className="w-4 h-4" /> 業務</button>
                                 <button type="button" onClick={() => setForm({...form, role: 'admin'})} className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 ${form.role === 'admin' ? 'bg-purple-600 text-white border-purple-600' : (darkMode ? 'bg-slate-800 text-gray-400 border-slate-700' : 'bg-white text-gray-500 border-gray-200')}`}><ShieldCheck className="w-4 h-4" /> 行政及管理員</button>
                             </div>
                          </div>
                          <div className="flex gap-2 items-center"><div className="bg-gray-200 px-4 py-2 rounded-xl font-mono tracking-widest line-through select-none text-gray-900">{captcha}</div><input required className="flex-1 px-4 py-2 rounded-xl border outline-none notranslate" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} placeholder="驗證碼" translate="no" /></div>
                          {form.role === 'admin' && <div><label className="text-xs font-bold text-purple-500">註冊碼</label><input type="password" required className={`w-full px-4 py-3 rounded-xl border-2 border-purple-100 outline-none ${darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-purple-100'}`} value={form.adminCode} onChange={e => setForm({...form, adminCode: e.target.value})} /></div>}
                      </div>
                    )}
                    <button className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform">{loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : (isRegister ? '註冊' : '登入')}</button>
                </form>
                <div className="mt-6 text-center shrink-0"><button onClick={() => setIsRegister(!isRegister)} className="text-sm text-gray-500 hover:text-blue-500">{isRegister ? '已有帳號？登入' : '註冊帳號'}</button></div>
            </div>
         </div>
      </div>
    );
};

export default LoginScreen;