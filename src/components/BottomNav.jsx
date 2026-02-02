import React from 'react';
import { List, Wrench, LayoutDashboard } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab, isAdmin, systemAlerts }) => {
    return (
        <div className="fixed bottom-0 w-full border-t flex justify-around items-center py-2 z-40 shadow-lg bg-white border-gray-200 dark:bg-slate-950 dark:border-slate-800">
            <button onClick={() => setActiveTab('clients')} className={`flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'clients' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>
                <List className="w-6 h-6"/>
                <span className="text-[10px] mt-1">列表</span>
            </button>
            
            <button onClick={() => setActiveTab('vendors')} className={`flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'vendors' ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
                <Wrench className="w-6 h-6"/>
                <span className="text-[10px] mt-1">廠商</span>
            </button>

            {isAdmin && (
                <button onClick={() => setActiveTab('dashboard')} className={`relative flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'dashboard' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>
                    <LayoutDashboard className="w-6 h-6"/>
                    {systemAlerts.length > 0 && <span className="absolute top-2 right-6 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}
                    <span className="text-[10px] mt-1">後台</span>
                </button>
            )}
        </div>
    );
};

export default BottomNav;