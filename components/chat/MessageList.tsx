
import React, { useState, useEffect } from 'react';
import { ChatMessage, CaseType } from '../../types';
import ChatMessageItem from '../ChatMessageItem';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    pinnedMessages: ChatMessage[];
    onPinMessage: (msg: ChatMessage) => void;
    onConvertCaseType?: (type: CaseType) => void; // New prop for transfer action
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, pinnedMessages, onPinMessage, onConvertCaseType }) => {
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

    // Cleanup speech synthesis on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedMessageId(id);
            setTimeout(() => setCopiedMessageId(null), 2000);
        });
    };

    const handleDownload = (content: string, id: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `legal-advisor-response-${id.slice(0, 6)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSpeak = (text: string, id: string) => {
        if (speakingMessageId === id) {
            // Stop if clicking the playing message
            window.speechSynthesis.cancel();
            setSpeakingMessageId(null);
            return;
        }

        // Stop any previous speech
        window.speechSynthesis.cancel();

        // Simple cleanup to make reading smoother (remove markdown symbols)
        const cleanText = text.replace(/[*#`_]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'ar-SA'; // Set to Arabic
        utterance.rate = 1.0; // Normal speed

        utterance.onend = () => setSpeakingMessageId(null);
        utterance.onerror = () => setSpeakingMessageId(null);

        setSpeakingMessageId(id);
        window.speechSynthesis.speak(utterance);
    };

    // Helper to parse potential Redirect JSON from the model
    const parseRedirectMessage = (content: string) => {
        const jsonMatch = content.match(/```json\s*(\{[\s\S]*?"redirect"[\s\S]*?\})\s*```/);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);
                if (data.redirect) return data;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    if (messages.length === 0 && !isLoading) {
        return (
            <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full p-8">
                <div className="bg-gray-700/30 p-8 rounded-full mb-6 border border-gray-600/50 shadow-xl">
                    {/* Scales of Justice Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="h-24 w-24 text-amber-500">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-100 tracking-wide">المستشار القانوني الفلسطيني</h2>
                <p className="mb-8 max-w-lg text-lg leading-relaxed text-gray-300">
                    مرحباً بك. أنا هنا لمساعدتك في فهم القانون الفلسطيني.
                    <br />
                    ابدأ بوصف قضيتك، أو استخدم الأوضاع المتخصصة في الأسفل للحصول على استشارة دقيقة.
                </p>
            </div>
        );
    }

    const getModelDisplayName = (modelId?: string): string => {
        if (!modelId) return '';
        if (modelId.includes('gemini')) return 'Gemini AI';
        return modelId;
    };

    return (
        <div className="space-y-6 pb-4">
            {messages.map((msg) => {
                const isPinned = pinnedMessages.some(p => p.id === msg.id);
                const hasGrounding = msg.groundingMetadata?.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0;
                const redirectData = msg.role === 'model' ? parseRedirectMessage(msg.content) : null;
                
                return (
                    <div key={msg.id} className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xl lg:max-w-3xl px-5 py-4 rounded-2xl relative shadow-md ${msg.isError ? 'bg-red-500/20 text-red-200 border border-red-500/30' : msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-700 text-gray-200 rounded-bl-sm'}`}>
                            
                            {/* Standard Controls (Pin/Copy/Speak) */}
                            {!redirectData && (
                                <div className="absolute top-2 left-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onPinMessage(msg)} className="p-1.5 bg-black/20 rounded-full text-gray-300 hover:bg-black/40 disabled:opacity-50 disabled:cursor-default transition-colors" title={isPinned ? "تم التثبيت" : "تثبيت الرسالة"} disabled={isPinned}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isPinned ? 'text-yellow-400' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.49 2.23a.75.75 0 00-1.02-.04l-7.5 6.25a.75.75 0 00.99 1.18L8 5.44V14a1 1 0 102 0V5.44l5.03 4.18a.75.75 0 00.99-1.18l-7.5-6.25z" clipRule="evenodd" />
                                            <path d="M4 14a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM16 14a1 1 0 011 1v1a1 1 0 011-1z" />
                                        </svg>
                                    </button>
                                    {msg.role === 'model' && (
                                        <>
                                            <button onClick={() => handleSpeak(msg.content, msg.id)} className={`p-1.5 bg-black/20 rounded-full hover:bg-black/40 transition-colors ${speakingMessageId === msg.id ? 'text-green-400 animate-pulse' : 'text-gray-300'}`} aria-label="قراءة صوتية" title={speakingMessageId === msg.id ? "إيقاف القراءة" : "قراءة النص"}>
                                                {speakingMessageId === msg.id ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button onClick={() => handleCopy(msg.content, msg.id)} className="p-1.5 bg-black/20 rounded-full text-gray-300 hover:bg-black/40 transition-colors" aria-label="نسخ" title="نسخ النص">
                                                {copiedMessageId === msg.id ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                )}
                                            </button>
                                            <button onClick={() => handleDownload(msg.content, msg.id)} className="p-1.5 bg-black/20 rounded-full text-gray-300 hover:bg-black/40 transition-colors" aria-label="تحميل" title="تحميل كملف نصي">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Images Rendering */}
                            {msg.images && msg.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {msg.images.map((image, index) => (
                                        <img key={index} src={image.dataUrl} alt={`محتوى مرفق ${index + 1}`} className="rounded-lg max-w-xs max-h-64 object-contain bg-black/50 border border-white/10" />
                                    ))}
                                </div>
                            )}

                            {/* SPECIAL: Redirect Card Rendering */}
                            {redirectData ? (
                                <div className="bg-red-900/30 border-2 border-red-500/50 p-4 rounded-xl text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-3 bg-red-900/50 rounded-full text-red-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-red-200">تنبيه اختصاص قضائي</h3>
                                        <p className="text-red-100/90 text-sm leading-relaxed max-w-md">
                                            {redirectData.reason}
                                            <br />
                                            الاختصاص الصحيح هو: <strong>{redirectData.court}</strong>.
                                        </p>
                                        {onConvertCaseType && (
                                            <button 
                                                onClick={() => onConvertCaseType(redirectData.redirect)}
                                                className="mt-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all hover:scale-105"
                                            >
                                                <span>نقل القضية فوراً</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Standard Message Rendering */
                                <ChatMessageItem content={msg.content || '...'} isModel={msg.role === 'model'} />
                            )}

                            {/* Render Grounding Sources if available (and not a redirect message) */}
                            {hasGrounding && !redirectData && (
                                <div className="mt-5 pt-4 border-t border-gray-600/50 bg-gray-800/30 rounded-lg p-3 -mx-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[11px] uppercase tracking-wider text-blue-300 font-bold flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 me-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                            المصادر والمراجع (تم التحقق)
                                        </p>
                                        {msg.groundingMetadata?.webSearchQueries && msg.groundingMetadata.webSearchQueries.length > 0 && (
                                            <span className="text-[10px] text-gray-400 truncate max-w-[150px]" title={`تم البحث عن: ${msg.groundingMetadata.webSearchQueries.join(', ')}`}>
                                                بحث: {msg.groundingMetadata.webSearchQueries[0]}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {msg.groundingMetadata?.groundingChunks.map((chunk, idx) => (
                                            chunk.web && (
                                                <a
                                                    key={idx}
                                                    href={chunk.web.uri}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center p-2 rounded bg-gray-900/50 hover:bg-blue-600/10 border border-gray-700 hover:border-blue-500/50 transition-all group/link"
                                                >
                                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center text-xs font-mono me-2 border border-blue-500/20 group-hover/link:bg-blue-600 group-hover/link:text-white group-hover/link:border-blue-500">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <p className="text-xs font-medium text-blue-200 truncate group-hover/link:text-blue-100">
                                                            {chunk.web.title || "مصدر ويب"}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 truncate font-mono group-hover/link:text-blue-300/70">
                                                            {new URL(chunk.web.uri).hostname.replace('www.', '')}
                                                        </p>
                                                    </div>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600 ms-1 group-hover/link:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {msg.role === 'model' && msg.model && !msg.isError && msg.content && !redirectData && (
                            <div className="px-3 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{getModelDisplayName(msg.model)}</span>
                            </div>
                        )}
                    </div>
                )
            })}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role !== 'model' && (
                <div className="flex justify-start">
                    <div className="max-w-xl px-6 py-4 rounded-2xl bg-gray-700 rounded-bl-none">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageList;
