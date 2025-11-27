
import React, { RefObject, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ActionMode } from '../../types';
import { SUGGESTED_PROMPTS } from '../../constants';
import LegalToolbar from '../LegalToolbar';

interface ChatInputProps {
    userInput: string;
    setUserInput: (val: string | ((prev: string) => string)) => void;
    handleSendMessage: (prompt?: string) => void;
    handleStopGenerating: () => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    isLoading: boolean;
    isProcessingFile: boolean;
    uploadedImage: { dataUrl: string; mimeType: string } | null;
    setUploadedImage: (val: { dataUrl: string; mimeType: string } | null) => void;
    processingMessage: string;
    authError: string | null;
    actionMode: ActionMode;
    setActionMode: (mode: ActionMode) => void;
    chatHistoryLength: number;
    isApiKeyReady: boolean | null; // Added prop
}

const ChatInput: React.FC<ChatInputProps> = ({
    userInput,
    setUserInput,
    handleSendMessage,
    handleStopGenerating,
    handleFileChange,
    fileInputRef,
    textareaRef,
    isLoading,
    isProcessingFile,
    uploadedImage,
    setUploadedImage,
    processingMessage,
    authError,
    actionMode,
    setActionMode,
    chatHistoryLength,
    isApiKeyReady // Destructure prop
}) => {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    // Derived state for disabling inputs
    const isDisabled = isLoading || isProcessingFile || !isApiKeyReady;

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = true;
            recog.lang = 'ar-PS'; // Palestinian Arabic context

            recog.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setUserInput((prev: string) => prev.trim() + (prev.trim() ? ' ' : '') + finalTranscript);
                }
            };

            recog.onend = () => {
                setIsListening(false);
            };

            recog.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            setRecognition(recog);
        }
    }, [setUserInput]);

    const toggleListening = () => {
        if (!recognition) {
            alert("متصفحك لا يدعم خاصية الإملاء الصوتي.");
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    return (
        <div className="p-4 border-t border-gray-700 bg-gray-800">
            {/* API Key Warning */}
            {!isApiKeyReady && (
                <div className="mb-3 p-3 bg-yellow-600/20 border border-yellow-500/50 text-yellow-200 rounded-lg text-sm flex items-center justify-between">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>وضع القراءة فقط: يجب إدخال مفتاح API لمتابعة المحادثة.</span>
                    </div>
                    <Link to="/settings" className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors text-xs font-bold">
                        الإعدادات
                    </Link>
                </div>
            )}

            {authError && (
                <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg text-sm animate-pulse" role="alert">
                    <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="font-bold">خطأ في المصادقة</h3>
                            <p className="mt-1">{authError}</p>
                            <Link to="/settings" className="text-red-200 font-semibold hover:underline mt-2 inline-block">
                                الانتقال إلى الإعدادات لتصحيح المفتاح
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Legal Action Toolbar */}
            <LegalToolbar
                currentMode={actionMode}
                onModeChange={setActionMode}
                disabled={isDisabled}
            />

            {/* Suggested Prompts */}
            {chatHistoryLength > 0 && !isDisabled && (
                <div className="mb-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <span className="text-sm text-gray-400 font-medium whitespace-nowrap">اقتراحات:</span>
                        {SUGGESTED_PROMPTS.map((prompt, index) => (
                            <button
                                key={index}
                                onClick={() => handleSendMessage(prompt)}
                                className="px-3 py-1.5 bg-gray-700/80 text-gray-200 rounded-full text-sm whitespace-nowrap hover:bg-gray-600/80 transition-colors border border-gray-600/30"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {uploadedImage && (
                <div className="relative inline-block mb-2 group">
                    <img src={uploadedImage.dataUrl} alt="Preview" className="h-24 w-auto rounded-lg object-contain border border-gray-600 bg-gray-900" />
                    <button
                        onClick={() => setUploadedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 leading-none shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Processing Status */}
            {isProcessingFile && (
                <div className="flex items-center text-blue-300 mb-2 text-sm">
                    <svg className="animate-spin h-4 w-4 me-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>{processingMessage || 'جاري المعالجة...'}</span>
                </div>
            )}

            {/* Input Area */}
            <div className="flex items-center space-x-reverse space-x-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isDisabled} className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors flex-shrink-0" aria-label="إرفاق ملف" title="إرفاق صورة أو PDF">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                
                {/* Voice Dictation Button */}
                <button
                    onClick={toggleListening}
                    disabled={isDisabled}
                    className={`p-3 rounded-lg transition-colors flex-shrink-0 ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'}`}
                    aria-label="إملاء صوتي"
                    title={isListening ? "جاري الاستماع... (انقر للإيقاف)" : "تحدث للكتابة"}
                >
                    {isListening ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e) => {
                        setUserInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    className={`flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:outline-none resize-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${actionMode === 'loopholes' ? 'focus:ring-rose-500 placeholder-rose-300/30' :
                        actionMode === 'drafting' ? 'focus:ring-emerald-500 placeholder-emerald-300/30' :
                            actionMode === 'strategy' ? 'focus:ring-amber-500 placeholder-amber-300/30' :
                                'focus:ring-blue-500'
                        }`}
                    placeholder={
                        !isApiKeyReady ? "يرجى إدخال مفتاح API للمتابعة..." :
                        actionMode === 'loopholes' ? "أدخل تفاصيل القضية لكشف الثغرات ومهاجمة الأدلة..." :
                            actionMode === 'drafting' ? "أدخل الوقائع لصياغة وثيقة قانونية رسمية..." :
                                actionMode === 'strategy' ? "اشرح الوضع للحصول على خطة فوز استراتيجية..." :
                                    "اكتب رسالتك، أو استخدم الميكروفون للتحدث..."
                    }
                    rows={1}
                    style={{ maxHeight: '10rem' }}
                    disabled={isDisabled}
                />
                {isLoading ? (
                    <button onClick={handleStopGenerating} className="p-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex-shrink-0" aria-label="إيقاف الإنشاء">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                ) : (
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={isProcessingFile || (!userInput.trim() && !uploadedImage) || !isApiKeyReady}
                        className={`p-3 text-white font-semibold rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex-shrink-0 ${actionMode === 'loopholes' ? 'bg-rose-600 hover:bg-rose-700' :
                            actionMode === 'drafting' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                actionMode === 'strategy' ? 'bg-amber-600 hover:bg-amber-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                            }`}
                        aria-label="إرسال"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatInput;
