
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChatLogic } from '../hooks/useChatLogic';
import ChatHeader from '../components/chat/ChatHeader';
import PinnedPanel from '../components/chat/PinnedPanel';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';

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
            accentClass="border-t-4 border-emerald-600/30"
        />

            <PinnedPanel
                messages={logic.pinnedMessages}
                isOpen={logic.isPinnedPanelOpen}
                setIsOpen={logic.setIsPinnedPanelOpen}
                onUnpin={logic.handleUnpinMessage}
            />

            <div ref={logic.chatContainerRef} className="flex-grow p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <MessageList
                    messages={logic.chatHistory}
                    isLoading={logic.isLoading}
                    pinnedMessages={logic.pinnedMessages}
                    onPinMessage={logic.handlePinMessage}
                    onConvertCaseType={logic.handleConvertCaseType}
                />
            </div>

            <ChatInput
                userInput={logic.userInput}
                setUserInput={logic.setUserInput}
                handleSendMessage={logic.handleSendMessage}
                handleStopGenerating={logic.handleStopGenerating}
                handleFileChange={logic.handleFileChange}
                fileInputRef={logic.fileInputRef}
                textareaRef={logic.textareaRef}
                isLoading={logic.isLoading}
                isProcessingFile={logic.isProcessingFile}
                uploadedImage={logic.uploadedImage}
                setUploadedImage={logic.setUploadedImage}
                processingMessage={logic.processingMessage}
                authError={logic.authError}
                actionMode={logic.actionMode}
                setActionMode={logic.setActionMode}
                chatHistoryLength={logic.chatHistory.length}
                isApiKeyReady={logic.isApiKeyReady}
            />
        </div>
    );
};

export default ShariaPage;
