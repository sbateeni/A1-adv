
import React, { useState } from 'react';
import { ApiSource, Case, ActionMode } from '../../types';

interface ChatHeaderProps {
    caseData: Case | null;
    apiSource: ApiSource;
    tokenCount: number;
    isLoading: boolean;
    isSummaryLoading: boolean;
    chatHistoryLength: number;
    thinkingMode: boolean;
    setThinkingMode: (value: boolean) => void;
    onSummarize: () => void;
    onRunWorkflow: (chain?: ActionMode[]) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    caseData,
    apiSource,
    tokenCount,
    isLoading,
    isSummaryLoading,
    chatHistoryLength,
    thinkingMode,
    setThinkingMode,
    onSummarize,
    onRunWorkflow
}) => {
    const defaultChain: ActionMode[] = (caseData?.caseType === 'sharia')
        ? ['interrogator','research','citation_builder','verifier','drafting','strategy']
        : ['interrogator','research','citation_builder','verifier','drafting','strategy'];
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedModes, setSelectedModes] = useState<ActionMode[]>(defaultChain);

    const toggleMode = (mode: ActionMode) => {
        setSelectedModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]);
    };
    const runCustom = () => { setIsDropdownOpen(false); onRunWorkflow(selectedModes); };
    const MODE_LABELS: Record<ActionMode, string> = {
        analysis: 'تحليل', loopholes: 'كشف الثغرات', drafting: 'الصائغ القانوني', strategy: 'المايسترو الاستراتيجي', research: 'المحقق', interrogator: 'المستجوب', verifier: 'المدقق', citation_builder: 'مراجع حرفية', registrar: 'التسجيل العقاري', sharia_advisor: 'المرشد الشرعي', reconciliation: 'الصلح', custody: 'الحضانة', alimony: 'النفقة'
    };
    return (
        <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center flex-wrap gap-2 sticky top-0 z-10 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-gray-200 truncate">{caseData?.title || 'قضية جديدة'}</h2>
            <div className="flex items-center gap-x-3">
                {apiSource === 'gemini' && tokenCount > 0 && (
                    <div className="text-sm text-gray-400 hidden sm:block" title="إجمالي التوكن المستخدمة في هذه المحادثة">
                        <span>الاستهلاك: </span>
                        <span className="font-mono font-semibold text-gray-300">{tokenCount.toLocaleString('ar-EG')}</span>
                        <span> توكن</span>
                    </div>
                )}
                {apiSource === 'gemini' && (
                    <button
                        onClick={onSummarize}
                        disabled={isLoading || isSummaryLoading || chatHistoryLength === 0}
                        className="flex items-center space-x-2 space-x-reverse px-3 py-1.5 bg-gray-700 text-gray-200 rounded-md text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="تلخيص المحادثة الحالية"
                    >
                        {isSummaryLoading ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zM12 13a1 1 0 100 2h-4a1 1 0 100-2h4zm-1-3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" /></svg>
                        )}
                        <span>تلخيص</span>
                    </button>
                )}
                {apiSource === 'gemini' && (
                    <div className="flex items-center space-x-2 space-x-reverse bg-gray-900/50 p-1 rounded-full">
                        <label htmlFor="thinking-mode-toggle" className="text-xs font-medium text-gray-300 cursor-pointer px-2">تفكير عميق</label>
                        <button id="thinking-mode-toggle" role="switch" aria-checked={thinkingMode} onClick={() => setThinkingMode(!thinkingMode)}
                            className={`${thinkingMode ? 'bg-blue-600' : 'bg-gray-600'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none`}>
                            <span className={`${thinkingMode ? 'translate-x-4' : 'translate-x-1'} inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`} />
                        </button>
                    </div>
                )}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(v => !v)}
                        disabled={isLoading}
                        className="flex items-center space-x-2 space-x-reverse px-3 py-1.5 bg-purple-700 text-gray-100 rounded-md text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="السلسلة المخصصة"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15.5v-11zm5.707 2.793a1 1 0 00-1.414 1.414L9.586 11 7.293 13.293a1 1 0 001.414 1.414L11 12.414l2.293 2.293a1 1 0 001.414-1.414L12.414 11l2.293-2.293a1 1 0 00-1.414-1.414L11 9.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        <span>السلسلة المخصصة</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" /></svg>
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-3 z-20">
                            <div className="text-xs text-gray-300 mb-2">اختر الأوضاع للتشغيل بالتتابع</div>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {defaultChain.map(mode => (
                                    <label key={mode} className="flex items-center gap-2 text-sm text-gray-200">
                                        <input type="checkbox" checked={selectedModes.includes(mode)} onChange={() => toggleMode(mode)} />
                                        <span>{MODE_LABELS[mode]}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => setIsDropdownOpen(false)} className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-md text-sm">إلغاء</button>
                                <button onClick={runCustom} className="px-3 py-1.5 bg-purple-700 text-gray-100 rounded-md text-sm">تشغيل</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;
