import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';

const Marquee = ({ text, darkMode }) => {
  const [isVisible, setIsVisible] = useState(true);

  // 如果沒有文字或跑完後，就隱藏
  if (!text || !isVisible) return null;

  return (
    <div className={`relative w-full overflow-hidden py-2 flex items-center z-40 ${darkMode ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-600 text-white'}`}>
      <div className="absolute left-0 z-10 px-2 h-full flex items-center bg-inherit">
        <Megaphone className="w-4 h-4 animate-pulse"/>
      </div>
      
      {/* 跑馬燈本體 */}
      <div 
        className="whitespace-nowrap animate-marquee inline-block pl-10"
        onAnimationEnd={() => setIsVisible(false)} // ★★★ 關鍵：動畫結束後將元件隱藏
      >
        <span className="text-sm font-bold tracking-wide mx-4">
          {text}
        </span>
      </div>

      {/* 手動關閉按鈕 (選配) */}
      <button 
        onClick={() => setIsVisible(false)} 
        className="absolute right-2 z-10 p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
      >
        <X className="w-3 h-3"/>
      </button>
      
      {/* 內嵌 CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          /* ★★★ 關鍵：最後一個參數 1 代表只跑一次 ★★★ */
          animation: marquee 20s linear 1 forwards; 
        }
      `}</style>
    </div>
  );
};

export default Marquee;