
import React, { RefObject } from 'react';
import { Case, CaseStatus } from '../../types';
import { STATUS_OPTIONS, STATUS_MAP } from '../../constants';

interface CaseGridItemProps {
    caseItem: Case;
    editingCaseId: string | null;
    newTitle: string;
    setNewTitle: (title: string) => void;
    handleEditClick: (caseItem: Case) => void;
    handleSaveTitle: (id: string) => void;
    handleTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, id: string) => void;
    titleInputRef: RefObject<HTMLInputElement | null>;
    openStatusMenu: string | null;
    setOpenStatusMenu: (id: string | null) => void;
    handleStatusChange: (id: string, status: CaseStatus) => void;
    deleteCase: (id: string) => void;
    onNavigate: (id: string) => void;
    statusMenuRef: RefObject<HTMLDivElement | null>;
}

const CaseGridItem: React.FC<CaseGridItemProps> = ({
    caseItem,
    editingCaseId,
    newTitle,
    setNewTitle,
    handleEditClick,
    handleSaveTitle,
    handleTitleKeyDown,
    titleInputRef,
    openStatusMenu,
    setOpenStatusMenu,
    handleStatusChange,
    deleteCase,
    onNavigate,
    statusMenuRef
}) => {
    const isIslamic = caseItem.caseType === 'inheritance' || caseItem.caseType === 'sharia';
    // Safe fallback for status style
    const statusStyle = STATUS_MAP[caseItem.status] || { label: caseItem.status || 'غير محدد', color: 'bg-gray-500' };
    const isYellow = statusStyle.color.includes('yellow');
    
    return (
        <div className={`rounded-lg shadow-lg p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${isIslamic ? 'bg-gray-800 border-b-4 border-emerald-600 hover:shadow-emerald-500/20' : 'bg-gray-800 border-b-4 border-blue-600 hover:shadow-blue-500/20'}`}>
            <div>
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 w-full">
                        {isIslamic ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                        )}
                        
                        {editingCaseId === caseItem.id ? (
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onBlur={() => handleSaveTitle(caseItem.id)}
                                onKeyDown={(e) => handleTitleKeyDown(e, caseItem.id)}
                                className="w-full bg-gray-600 text-gray-100 p-1 rounded text-xl font-semibold"
                            />
                        ) : (
                            <h2 className="text-xl font-semibold text-gray-100 break-words w-full me-2 cursor-pointer hover:text-blue-400" onClick={() => onNavigate(caseItem.id)}>
                                {caseItem.title}
                            </h2>
                        )}
                    </div>
                    <button onClick={() => editingCaseId === caseItem.id ? handleSaveTitle(caseItem.id) : handleEditClick(caseItem)} className="p-1 text-gray-400 hover:text-white flex-shrink-0">
                        {editingCaseId === caseItem.id ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                        )}
                    </button>
                </div>
                <div className="relative inline-block text-left mb-3 ms-8">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setOpenStatusMenu(openStatusMenu === caseItem.id ? null : caseItem.id); }} 
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center space-x-1.5 space-x-reverse ${statusStyle.color} ${isYellow ? 'text-gray-900' : 'text-white'}`}
                    >
                        <span>{statusStyle.label}</span>
                        <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {openStatusMenu === caseItem.id && (
                        <div ref={statusMenuRef} className="absolute top-full start-0 mt-2 w-36 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20">
                            {STATUS_OPTIONS.map(option => (
                                <button 
                                    key={option.value} 
                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(caseItem.id, option.value); setOpenStatusMenu(null); }} 
                                    className="block w-full text-right px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-md p-3 my-4 ms-2">
                    <p className="text-gray-300 text-sm break-words line-clamp-3 leading-relaxed">{caseItem.summary}</p>
                </div>
                <p className="text-xs text-gray-500 mb-4 ms-2">
                    تاريخ الإنشاء: {new Date(caseItem.createdAt).toLocaleString('ar-EG')}
                </p>
            </div>
            <div className="flex justify-between items-center mt-2">
                {isIslamic ? (
                     <button onClick={() => onNavigate(caseItem.id)} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 transition-colors flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 me-2" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        فتح
                    </button>
                ) : (
                    <button onClick={() => onNavigate(caseItem.id)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors">
                        فتح
                    </button>
                )}
                
                <button onClick={(e) => { e.stopPropagation(); deleteCase(caseItem.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors" aria-label="حذف القضية">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    );
};

export default CaseGridItem;
