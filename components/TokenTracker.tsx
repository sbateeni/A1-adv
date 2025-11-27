
import React, { useEffect, useState } from 'react';
import { getTokenUsage } from '../services/dbService';

const TokenTracker: React.FC = () => {
  const [requests, setRequests] = useState(0);
  const DAILY_LIMIT = 1500; // Gemini Free Tier (1,500 Requests Per Day)

  const updateUsage = async () => {
    const count = await getTokenUsage();
    setRequests(count);
  };

  useEffect(() => {
    updateUsage();

    // Listen for updates from db service
    const handleUpdate = (e: CustomEvent) => {
        if (e.detail !== undefined) setRequests(e.detail);
        else updateUsage();
    };

    window.addEventListener('tokensUpdated', handleUpdate as EventListener);
    return () => {
        window.removeEventListener('tokensUpdated', handleUpdate as EventListener);
    };
  }, []);

  const percentage = Math.min(100, (requests / DAILY_LIMIT) * 100);
  const remaining = Math.max(0, DAILY_LIMIT - requests);
  
  // Color logic based on usage
  let colorClass = "bg-green-500";
  let iconColorClass = "text-indigo-400 fill-indigo-400";
  
  if (percentage > 50) colorClass = "bg-yellow-500";
  if (percentage > 80) colorClass = "bg-orange-500";
  if (percentage > 95) {
      colorClass = "bg-red-600";
      iconColorClass = "text-red-500 animate-pulse";
  }

  return (
    <div className="flex items-center gap-2 md:gap-3 bg-slate-100/10 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-slate-200/20 shadow-sm backdrop-blur-sm" title={`تم استخدام ${requests} طلب من أصل ${DAILY_LIMIT} طلب يومياً`}>
      <div className="flex flex-col items-end">
        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 flex items-center gap-1">
           <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 ${iconColorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
           <span className="hidden sm:inline">الطلبات اليومية</span>
        </div>
        <div className="w-16 md:w-24 h-1.5 bg-slate-700/50 rounded-full mt-1 overflow-hidden">
          <div 
             className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} 
             style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex flex-col items-end justify-center border-r border-slate-200/20 pr-2 md:pr-3 min-w-[40px] md:min-w-[50px]">
         <span className={`text-[10px] md:text-xs font-mono font-black leading-none ${remaining < 50 ? 'text-red-400' : 'text-slate-300'}`}>
           {remaining}
         </span>
         <span className="text-[8px] md:text-[9px] text-slate-500 font-bold mt-0.5">متبقي</span>
      </div>
    </div>
  );
};

export default TokenTracker;
