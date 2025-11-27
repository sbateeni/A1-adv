
import React from 'react';
import { ApiSource, Case } from '../../types';

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
    onSummarize
}) => {
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
            </div>
        </div>
    );
};

export default ChatHeader;
