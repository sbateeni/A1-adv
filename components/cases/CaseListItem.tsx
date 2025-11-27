
import React from 'react';
import { Case, CaseStatus } from '../../types';
import { STATUS_OPTIONS, STATUS_MAP } from '../../constants';

interface CaseListItemProps {
    caseItem: Case;
    handleStatusChange: (id: string, status: CaseStatus) => void;
    deleteCase: (id: string) => void;
    onNavigate: (id: string) => void;
}

const CaseListItem: React.FC<CaseListItemProps> = ({
    caseItem,
    handleStatusChange,
    deleteCase,
    onNavigate
}) => {
    const isIslamic = caseItem.caseType === 'inheritance' || caseItem.caseType === 'sharia';
    // Pass ID only, let parent decide URL
    const handleNav = () => onNavigate(caseItem.id);
    
    // Safe fallback for status style
    const statusStyle = STATUS_MAP[caseItem.status] || { label: caseItem.status || 'غير محدد', color: 'bg-gray-500' };
    const isYellow = statusStyle.color.includes('yellow');

    return (
        <div onClick={handleNav} className={`rounded-md p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-700/60 cursor-pointer transition-colors duration-200 ${isIslamic ? 'border-s-4 border-emerald-500' : 'border-s-4 border-blue-500'}`}>
            <div className="flex-grow mb-3 sm:mb-0 sm:me-4 w-full flex items-center">
                {isIslamic ? (
                    <div className="bg-emerald-900/50 p-2 rounded-full me-3 text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                ) : (
                    <div className="bg-blue-900/50 p-2 rounded-full me-3 text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                    </div>
                )}
                <div>
                    <h2 className="text-lg font-semibold text-gray-100 line-clamp-1">{caseItem.title}</h2>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1">{caseItem.summary}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse w-full sm:w-auto justify-between sm:justify-end">
                <select
                    value={caseItem.status}
                    onChange={(e) => handleStatusChange(caseItem.id, e.target.value as CaseStatus)}
                    onClick={(e) => e.stopPropagation()}
                    className={`bg-gray-700 border-none rounded p-1 text-xs focus:ring-2 focus:ring-blue-500 ${isYellow ? 'text-gray-900' : 'text-white'}`}
                    style={{ backgroundColor: statusStyle.color.startsWith('bg-') ? '' : statusStyle.color }}
                >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>

                <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(caseItem.createdAt).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
                <button
                    onClick={(e) => { e.stopPropagation(); deleteCase(caseItem.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-900/50 rounded-full transition-colors"
                    aria-label="حذف القضية"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default CaseListItem;
