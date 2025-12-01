
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChatLogic } from '../hooks/useChatLogic';
import ChatHeader from '../components/chat/ChatHeader';
import PinnedPanel from '../components/chat/PinnedPanel';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import ShariaToolbar from '../components/ShariaToolbar';

interface ShariaPageProps {
    caseId?: string;
}

const ShariaPage: React.FC<ShariaPageProps> = ({ caseId }) => {
    const navigate = useNavigate();
    // Pass 'sharia' as the intended case type
    const logic = useChatLogic(caseId, 'sharia');

    // Set default mode to sharia_advisor when mounting this page
    useEffect(() => {
        if (logic.actionMode === 'analysis') {
            logic.setActionMode('sharia_advisor');
        }
    }, []); // Run once on mount

    // 1. Loading State
    if (logic.isLoading && !logic.caseData && caseId) {
        return (
            <div className="w-full flex-grow flex items-center justify-center p-8 text-lg">
                <svg className="animate-spin h-6 w-6 text-emerald-500 me-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>جاري استرجاع بيانات القضية الشرعية...</span>
            </div>
        );
    }

    // 2. Not Found State
    if (logic.isNotFound) {
        return (
            <div className="w-full flex-grow flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold mb-4 text-red-400">عذراً، لم يتم العثور على القضية</h2>
                <button onClick={() => navigate('/cases')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    العودة للقضايا
                </button>
            </div>
        );
    }

    // 3. API Key Check
    const isNewCaseWithoutKey = logic.isApiKeyReady === false && logic.chatHistory.length === 0;

    if (isNewCaseWithoutKey) {
        const isGemini = logic.apiSource === 'gemini';
        return (
            <div className="w-full flex-grow flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-200">مطلوب مفتاح API</h2>
                <p className="text-gray-400 mb-6 max-w-2xl">للاستشارة الشرعية، يرجى تفعيل مفتاح API أولاً.</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    {isGemini && window.aistudio && (
                        <button onClick={logic.handleSelectApiKey} className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700">
                            تحديد مفتاح عبر Google AI
                        </button>
                    )}
                    <button onClick={() => navigate('/settings')} className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">
                        الانتقال إلى الإعدادات
                    </button>
                </div>
            </div>
        );
    }

    return (
    <div className="w-full flex flex-col flex-grow bg-gray-800 overflow-hidden">
        <ChatHeader
            caseData={logic.caseData}
            apiSource={logic.apiSource}
            tokenCount={logic.tokenCount}
            isLoading={logic.isLoading}
            isSummaryLoading={logic.isSummaryLoading}
            chatHistoryLength={logic.chatHistory.length}
            thinkingMode={logic.thinkingMode}
            setThinkingMode={logic.setThinkingMode}
            onSummarize={logic.handleSummarize}
            onRunWorkflow={(chain) => logic.handleRunWorkflow(chain)}
        />

        <div className="p-4 border-t border-gray-700 bg-gray-800 border-t-4 border-emerald-600/20">
        {!logic.isApiKeyReady && (
            <div className="mb-3 p-3 bg-yellow-600/20 border border-yellow-500/50 text-yellow-200 rounded-lg text-sm flex items-center justify-between">
                <span>وضع القراءة فقط: يجب إدخال مفتاح API لمتابعة الاستشارة.</span>
                <Link to="/settings" className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors text-xs font-bold">الإعدادات</Link>
            </div>
        )}

        <ShariaToolbar
            currentMode={logic.actionMode}
            onModeChange={logic.setActionMode}
            disabled={logic.isLoading || logic.isProcessingFile || !logic.isApiKeyReady}
        />

        <div className="flex items-center space-x-reverse space-x-2">
            <input type="file" ref={logic.fileInputRef} onChange={logic.handleFileChange} accept="image/*,application/pdf" className="hidden" />
            <button onClick={() => logic.fileInputRef.current?.click()} disabled={logic.isLoading || !logic.isApiKeyReady} className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <textarea
                ref={logic.textareaRef}
                value={logic.userInput}
                onChange={(e) => {
                    const target = e.target;
                    logic.setUserInput(target.value);
                    // Use requestAnimationFrame to avoid layout thrashing and ensure state update is processed
                    requestAnimationFrame(() => {
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    });
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); logic.handleSendMessage(); } }}
                className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none disabled:opacity-50"
                placeholder={!logic.isApiKeyReady ? "أدخل المفتاح..." : "اكتب سؤالك الشرعي، أو صف الحالة العائلية..."}
                rows={1}
                style={{ maxHeight: '10rem' }}
                disabled={logic.isLoading || !logic.isApiKeyReady}
            />
            <button onClick={() => logic.handleSendMessage()} disabled={logic.isLoading || !logic.userInput.trim() || !logic.isApiKeyReady} className="p-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
        </div>
        </div>
    </div>
    );
};

export default ShariaPage;
