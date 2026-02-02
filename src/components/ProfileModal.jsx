import React, { useState } from 'react';
import { UserCircle, X } from 'lucide-react';

const ProfileModal = ({ currentUser, onClose, onSave }) => {
    const [profileData, setProfileData] = useState(currentUser || {});

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 800 * 1024) return alert("圖片太大 (限 800KB)");
            const reader = new FileReader();
            reader.onloadend = () => setProfileData(prev => ({ ...prev, photoUrl: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(profileData);
    };

    return (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><UserCircle className="w-5 h-5"/> 個人資料設定</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
                            {profileData.photoUrl ? <img src={profileData.photoUrl} className="w-full h-full object-cover"/> : <div className="text-gray-400 text-xs text-center px-2">上傳照片</div>}
                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold">更換照片</div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-400 mb-1 block">姓名 (不可改)</label><input disabled value={profileData.name || ''} className="w-full p-2 border rounded bg-gray-100 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed"/></div>
                        <div><label className="text-xs font-bold text-gray-400 mb-1 block">權限</label><input disabled value={profileData.role === 'admin' ? '管理員' : '一般業務'} className="w-full p-2 border rounded bg-gray-100 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed"/></div>
                    </div>

                    <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">聯絡電話 (顯示於傳單)</label><input required value={profileData.phone || ''} onChange={e=>setProfileData({...profileData, phone: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="09xx-xxx-xxx"/></div>
                    <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">LINE ID</label><input value={profileData.lineId || ''} onChange={e=>setProfileData({...profileData, lineId: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white"/></div>
                    <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">證照號碼</label><input value={profileData.licenseId || ''} onChange={e=>setProfileData({...profileData, licenseId: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white"/></div>

                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4 hover:bg-blue-700 shadow-lg transition-transform active:scale-95">儲存變更</button>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;