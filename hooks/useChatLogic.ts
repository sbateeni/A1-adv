
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Case, ChatMessage, ApiSource, OpenRouterModel, GroundingMetadata, ActionMode, LegalRegion, CaseType } from '../types';
import * as dbService from '../services/dbService';
import { streamChatResponseFromGemini, countTokensForGemini, proofreadTextWithGemini, summarizeChatHistory } from '../pages/geminiService';
import { streamChatResponseFromOpenRouter } from '../services/openRouterService';
import { DEFAULT_OPENROUTER_MODELS } from '../constants';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@5.4.394/build/pdf.worker.js';

export const useChatLogic = (caseId?: string, initialCaseType: CaseType = 'chat') => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(!!caseId);
    const [isNotFound, setIsNotFound] = useState(false);
    
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isApiKeyReady, setIsApiKeyReady] = useState<boolean | null>(null);
    const [apiSource, setApiSource] = useState<ApiSource>('gemini');
    const [region, setRegion] = useState<LegalRegion>('westbank'); 
    const [openRouterApiKey, setOpenRouterApiKey] = useState<string>('');
    const [openRouterModel, setOpenRouterModel] = useState<string>(DEFAULT_OPENROUTER_MODELS[0].id);
    const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(DEFAULT_OPENROUTER_MODELS);
    const [thinkingMode, setThinkingMode] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<{ dataUrl: string; mimeType: string } | null>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [tokenCount, setTokenCount] = useState(0);
    const [authError, setAuthError] = useState<string | null>(null);
    const [actionMode, setActionMode] = useState<ActionMode>('analysis');
    const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [isPinnedPanelOpen, setIsPinnedPanelOpen] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    
    const isNewCase = !caseId;

    useEffect(() => {
        const loadData = async () => {
            if (!caseId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setIsNotFound(false);
            
            try {
                const storedApiSource = await dbService.getSetting<ApiSource>('apiSource');
                if (storedApiSource) setApiSource(storedApiSource);

                const storedRegion = await dbService.getSetting<LegalRegion>('legalRegion');
                if (storedRegion) setRegion(storedRegion);

                const storedCustomModels = await dbService.getSetting<OpenRouterModel[]>('openRouterModels');
                const availableModels = storedCustomModels && storedCustomModels.length > 0 ? storedCustomModels : DEFAULT_OPENROUTER_MODELS;
                setOpenRouterModels(availableModels);

                if (storedApiSource === 'openrouter') {
                    const storedApiKey = await dbService.getSetting<string>('openRouterApiKey');
                    const storedModel = await dbService.getSetting<string>('openRouterModel');
                    if (storedModel && availableModels.some(m => m.id === storedModel)) {
                        setOpenRouterModel(storedModel.replace(/:free$/, ''));
                    } else {
                        setOpenRouterModel(availableModels[0].id);
                    }

                    if (storedApiKey && storedApiKey.trim().length > 0) {
                        setOpenRouterApiKey(storedApiKey.trim());
                        setIsApiKeyReady(true);
                    } else {
                        setIsApiKeyReady(false);
                    }
                } else {
                    const storedGeminiKey = await dbService.getSetting<string>('geminiApiKey');
                    const hasStoredKey = !!storedGeminiKey && storedGeminiKey.trim().length > 0;
                    const hasEnvKey = !!process.env.API_KEY && process.env.API_KEY.trim().length > 0;
                    let hasAiStudioKey = false;
                    try { if (window.aistudio) hasAiStudioKey = await window.aistudio.hasSelectedApiKey(); } catch {}
                    setIsApiKeyReady(hasStoredKey || hasEnvKey || hasAiStudioKey);
                }

                try {
                    const loadedCase = await dbService.getCase(caseId);
                    if (loadedCase) {
                        setCaseData(loadedCase);
                        setChatHistory(loadedCase.chatHistory || []);
                        setPinnedMessages(loadedCase.pinnedMessages || []);
                        if (storedApiSource !== 'openrouter') {
                            countTokensForGemini(loadedCase.chatHistory).then(setTokenCount);
                        }
                    } else {
                        setIsNotFound(true);
                    }
                } catch (dbError) {
                    setIsNotFound(true);
                }
            } catch (error) {
                console.error("Failed to load initial data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [caseId]);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [chatHistory]);

    useEffect(() => {
        if (isNewCase) {
            const checkKeys = async () => {
                const storedApiSource = await dbService.getSetting<ApiSource>('apiSource') || 'gemini';
                if (storedApiSource === 'gemini') {
                    const storedGeminiKey = await dbService.getSetting<string>('geminiApiKey');
                    const hasEnvKey = !!process.env.API_KEY;
                    let hasAiStudioKey = false;
                    try { if (window.aistudio) hasAiStudioKey = await window.aistudio.hasSelectedApiKey(); } catch {}
                    setIsApiKeyReady(!!storedGeminiKey || hasEnvKey || hasAiStudioKey);
                } else {
                    const storedOpenRouterKey = await dbService.getSetting<string>('openRouterApiKey');
                    setIsApiKeyReady(!!storedOpenRouterKey);
                }
            }
            checkKeys();
        }
    }, [isNewCase]);

    const handleSelectApiKey = async () => {
        if (apiSource === 'gemini' && window.aistudio) {
            try {
                await window.aistudio.openSelectKey();
                const hasKey = await window.aistudio.hasSelectedApiKey();
                if (hasKey) setIsApiKeyReady(true);
            } catch (error) { console.error(error); }
        } else {
            navigate('/settings');
        }
    };

    const handlePinMessage = async (messageToPin: ChatMessage) => {
        const isPinned = pinnedMessages.some(p => p.id === messageToPin.id);
        if (isPinned) return;
        const newPinnedMessages = [...pinnedMessages, messageToPin];
        setPinnedMessages(newPinnedMessages);
        if (caseData) {
            const updatedCase = { ...caseData, pinnedMessages: newPinnedMessages };
            await dbService.updateCase(updatedCase);
            setCaseData(updatedCase);
        }
    };

    const handleUnpinMessage = async (messageIdToUnpin: string) => {
        const newPinnedMessages = pinnedMessages.filter(p => p.id !== messageIdToUnpin);
        setPinnedMessages(newPinnedMessages);
        if (caseData) {
            const updatedCase = { ...caseData, pinnedMessages: newPinnedMessages };
            await dbService.updateCase(updatedCase);
            setCaseData(updatedCase);
        }
    };

    // New Function to handle case type conversion (Redirect)
    const handleConvertCaseType = async (newType: string) => {
        if (!caseData) return;
        
        // Normalize type (fix potential AI hallucination 'civil' -> 'chat')
        const normalizedType: CaseType = newType === 'civil' ? 'chat' : (newType as CaseType);

        setIsLoading(true);
        try {
            // Filter out the "Redirect/Jurisdiction Alert" message from history
            // ensuring the new view starts clean with the user's last question
            const cleanedHistory = caseData.chatHistory.filter(msg => {
                // Remove message if it contains the redirect JSON structure
                const isRedirectMsg = /```json\s*\{[\s\S]*?"redirect"[\s\S]*?\}\s*```/.test(msg.content);
                return !isRedirectMsg;
            });

            const updatedCase: Case = {
                ...caseData,
                caseType: normalizedType,
                chatHistory: cleanedHistory // Save the cleaned history
            };
            await dbService.updateCase(updatedCase);
            setCaseData(updatedCase); // Update local state immediately
            
            // Navigate to the correct route based on the new type
            const routePrefix = normalizedType === 'sharia' ? '/sharia' : '/case';
            
            // Force navigation with hard reload logic to ensure hooks reset properly
            // We use replace to swap the history entry
            navigate(`${routePrefix}/${caseData.id}`, { replace: true });
            // Reload window to ensure fresh context (agents, toolbar, system prompts)
            window.location.reload();
        } catch (error) {
            console.error("Failed to convert case type:", error);
            alert("حدث خطأ أثناء نقل القضية.");
            setIsLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (isSummaryLoading || isLoading || chatHistory.length === 0) return;
        setIsSummaryLoading(true);
        const tempSummaryMessage: ChatMessage = { id: uuidv4(), role: 'model', content: 'جاري إنشاء الملخص...', model: apiSource === 'gemini' ? 'gemini-2.5-flash' : openRouterModel };
        const currentChatHistory = [...chatHistory, tempSummaryMessage];
        setChatHistory(currentChatHistory);

        try {
            if (apiSource !== 'gemini') throw new Error("خاصية التلخيص متاحة حاليًا لـ Google Gemini فقط.");
            const historyToSummarize = chatHistory.filter(m => m.id !== tempSummaryMessage.id);
            const summaryText = await summarizeChatHistory(historyToSummarize);
            const finalSummaryContent = `**ملخص المحادثة:**\n\n${summaryText}`;
            const finalHistory = currentChatHistory.map(msg => msg.id === tempSummaryMessage.id ? { ...msg, content: finalSummaryContent } : msg);
            setChatHistory(finalHistory);
            if (caseData) {
                const updatedCase = { ...caseData, chatHistory: finalHistory, summary: summaryText.substring(0, 150) };
                await dbService.updateCase(updatedCase);
                setCaseData(updatedCase);
            }
        } catch (error: any) {
            setChatHistory(prev => prev.map(msg => msg.id === tempSummaryMessage.id ? { ...msg, content: `خطأ: ${error.message}`, isError: true } : msg));
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploadedImage(null);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setUploadedImage({ dataUrl: e.target?.result as string, mimeType: file.type });
            reader.readAsDataURL(file);
            setIsProcessingFile(true);
            setProcessingMessage('جاري تهيئة محرك استخلاص النصوص...');
            Tesseract.recognize(file, 'ara', { logger: m => { if (m.status === 'recognizing text') setProcessingMessage(`جاري استخلاص النص... ${Math.round(m.progress * 100)}%`); } })
            .then(async ({ data: { text } }) => {
                if (!text.trim()) return;
                setProcessingMessage('جاري تدقيق النص...');
                const correctedText = await proofreadTextWithGemini(text);
                setUserInput(prev => prev.trim() + (prev.trim() ? '\n\n' : '') + `--- نص مستخلص من صورة: ${file.name} ---\n` + correctedText.trim());
            }).finally(() => { setIsProcessingFile(false); setProcessingMessage(''); });
        } else if (file.type === 'application/pdf') {
            setIsProcessingFile(true);
            setProcessingMessage('جاري معالجة PDF...');
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target!.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        setProcessingMessage(`جاري معالجة الصفحة ${i} من ${pdf.numPages}...`);
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n\n';
                    }
                    setUserInput(prev => prev.trim() + (prev.trim() ? '\n\n' : '') + `--- محتوى PDF: ${file.name} ---\n` + fullText.trim());
                } finally { setIsProcessingFile(false); setProcessingMessage(''); }
            };
            reader.readAsArrayBuffer(file);
        }
        event.target.value = '';
    };

    const processStream = useCallback(async (
        stream: AsyncGenerator<{ text: string; model: string; groundingMetadata?: GroundingMetadata }>,
        tempModelMessageId: string
    ) => {
        let fullResponse = '';
        let responseModel = '';
        let groundingMetadata: GroundingMetadata | undefined;
        let wasAborted = false;
        try {
            for await (const chunk of stream) {
                if (chunk.text) fullResponse += chunk.text;
                responseModel = chunk.model;
                if (chunk.groundingMetadata) groundingMetadata = chunk.groundingMetadata;
                setChatHistory(prev => prev.map(msg => msg.id === tempModelMessageId ? { ...msg, content: fullResponse, model: responseModel, groundingMetadata } : msg));
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') throw e;
            else wasAborted = true;
        }
        if (wasAborted) {
            fullResponse += '\n\n**(تم إيقاف الإنشاء)**';
            setChatHistory(prev => prev.map(msg => msg.id === tempModelMessageId ? { ...msg, content: fullResponse, model: responseModel, groundingMetadata } : msg));
        }
        return { fullResponse, responseModel, groundingMetadata };
    }, []);

    const handleSendMessage = async (prompt?: string) => {
        setAuthError(null);
        const messageContent = (prompt || userInput).trim();
        if (isLoading || isProcessingFile || (!messageContent && !uploadedImage)) return;

        setIsLoading(true);
        const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content: messageContent, images: uploadedImage ? [uploadedImage] : undefined };
        setUserInput('');
        setUploadedImage(null);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        const tempModelMessage: ChatMessage = { role: 'model', content: '', id: uuidv4() };
        const newHistory = [...chatHistory, userMessage, tempModelMessage];
        setChatHistory(newHistory);
        abortControllerRef.current = new AbortController();

        // Determine current Case Type:
        // If caseData exists, use its type. If not (new case), use the initialCaseType passed to the hook.
        const currentCaseType = caseData?.caseType || initialCaseType;

        const targetCaseId = caseId || uuidv4();
        let currentCaseData = caseData;

        try {
            const initialTitle = messageContent.substring(0, 50) || 'قضية جديدة';
            if (isNewCase) {
                const newCase: Case = {
                    id: targetCaseId,
                    title: initialTitle,
                    summary: messageContent.substring(0, 150),
                    chatHistory: [userMessage], // Save only user message first to prevent loss
                    createdAt: Date.now(),
                    status: 'جديدة',
                    caseType: currentCaseType // Ensure correct type is saved
                };
                await dbService.addCase(newCase);
                currentCaseData = newCase;
                setCaseData(newCase);
            } else if (caseData) {
                const updatedCase = { ...caseData, chatHistory: [...chatHistory, userMessage] };
                await dbService.updateCase(updatedCase);
                currentCaseData = updatedCase;
                setCaseData(updatedCase);
            }
        } catch (e) { console.error("Save error", e); setIsLoading(false); return; }

        let finalResponseText = '';
        let finalModelName = '';
        let finalMetadata: GroundingMetadata | undefined;
        let finalIsError = false;

        try {
            let stream;
            const historyToSend = [...chatHistory, userMessage];
            // PASS currentCaseType to the stream functions
            if (apiSource === 'openrouter') {
                stream = streamChatResponseFromOpenRouter(openRouterApiKey, historyToSend, openRouterModel, actionMode, region, currentCaseType, abortControllerRef.current.signal);
            } else {
                stream = streamChatResponseFromGemini(historyToSend, thinkingMode, actionMode, region, currentCaseType, abortControllerRef.current.signal);
            }

            const { fullResponse, responseModel, groundingMetadata } = await processStream(stream, tempModelMessage.id);
            finalResponseText = fullResponse;
            finalModelName = responseModel;
            finalMetadata = groundingMetadata;
            
            if (apiSource === 'gemini') countTokensForGemini([...historyToSend, { ...tempModelMessage, content: fullResponse }]).then(setTokenCount);

        } catch (error: any) {
            console.error("API Error", error);
            const errorMessage = (error.status === 401 || error.toString().includes("API key")) ? `مفتاح API غير صالح.` : `حدث خطأ: ${error.message}`;
            if (error.status === 401) setAuthError(errorMessage);
            finalResponseText = errorMessage;
            finalIsError = true;
            setChatHistory(prev => prev.map(msg => msg.id === tempModelMessage.id ? { ...msg, content: errorMessage, isError: true } : msg));
        } finally {
            try {
                if (currentCaseData) {
                    const finalHistory = newHistory.map(msg => msg.id === tempModelMessage.id ? { ...msg, content: finalResponseText, model: finalModelName, groundingMetadata: finalMetadata, isError: finalIsError } : msg);
                    const updatedCase = { ...currentCaseData, chatHistory: finalHistory, summary: finalIsError ? currentCaseData.summary : finalResponseText.substring(0, 150) + '...' };
                    await dbService.updateCase(updatedCase);
                    setCaseData(updatedCase);
                    if (isNewCase) {
                        const routePrefix = currentCaseType === 'sharia' ? '/sharia' : '/case';
                        navigate(`${routePrefix}/${targetCaseId}`, { replace: true });
                    }
                }
            } catch (e) { console.error("Final save error", e); }
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleStopGenerating = () => abortControllerRef.current?.abort();

    return {
        caseData, chatHistory, userInput, setUserInput, isLoading, isNotFound, isApiKeyReady,
        apiSource, thinkingMode, setThinkingMode, uploadedImage, setUploadedImage,
        isProcessingFile, processingMessage, tokenCount, authError,
        actionMode, setActionMode, pinnedMessages, isSummaryLoading,
        isPinnedPanelOpen, setIsPinnedPanelOpen, chatContainerRef, fileInputRef, textareaRef,
        handleSendMessage, handleStopGenerating, handleSummarize, handleSelectApiKey,
        handleFileChange, handlePinMessage, handleUnpinMessage, handleConvertCaseType
    };
};
