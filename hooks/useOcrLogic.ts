
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import * as dbService from '../services/dbService';
import { analyzeImageWithGemini, proofreadTextWithGemini } from '../pages/geminiService';
import { analyzeImageWithOpenRouter, proofreadTextWithOpenRouter } from '../services/openRouterService';
import { DEFAULT_OPENROUTER_MODELS } from '../constants';
import { Case, ChatMessage, OpenRouterModel, SelectedImage, AnalysisResult, AnalysisType, AnalysisProvider, AnalysisProcessState } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure the worker for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@5.4.394/build/pdf.worker.js';

export const useOcrLogic = () => {
    const navigate = useNavigate();
    
    // State
    const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
    const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});
    
    // API Provider State
    const [analysisProvider, setAnalysisProvider] = useState<AnalysisProvider>('gemini');
    const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(DEFAULT_OPENROUTER_MODELS);
    const [openRouterModelForOcr, setOpenRouterModelForOcr] = useState<string>('');
    const [isGeminiApiKeyReady, setIsGeminiApiKeyReady] = useState<boolean | null>(null);
    const [isOpenRouterApiKeyReady, setIsOpenRouterApiKeyReady] = useState<boolean | null>(null);

    const [prompt, setPrompt] = useState<string>('ما الذي تراه في هذه الصورة؟ اشرح بالتفصيل.');
    const [analysisType, setAnalysisType] = useState<AnalysisType>('ai');
    const [cases, setCases] = useState<Case[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState<Record<string, { name: string; progress: number }>>({});
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const [pdfProcessingMessage, setPdfProcessingMessage] = useState('');
    const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
    
    // Queue Management
    const [analysisState, setAnalysisState] = useState<AnalysisProcessState>('idle');
    const [imagesToAnalyzeQueue, setImagesToAnalyzeQueue] = useState<SelectedImage[]>([]);
    const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
    const [totalToAnalyze, setTotalToAnalyze] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Load Initial Data
    useEffect(() => {
        const loadInitialData = async () => {
            const storedApiSource = await dbService.getSetting<AnalysisProvider>('apiSource');
            if (storedApiSource) {
                setAnalysisProvider(storedApiSource);
            }
            
            // Gemini Key Check
            const storedGeminiKey = await dbService.getSetting<string>('geminiApiKey');
            const hasAiStudioKey = window.aistudio?.hasSelectedApiKey ? await window.aistudio.hasSelectedApiKey() : false;
            setIsGeminiApiKeyReady(!!storedGeminiKey || hasAiStudioKey);

            // OpenRouter Key Check
            const storedOpenRouterKey = await dbService.getSetting<string>('openRouterApiKey');
            setIsOpenRouterApiKeyReady(!!storedOpenRouterKey);
            
            // OpenRouter Models
            const storedCustomModels = await dbService.getSetting<OpenRouterModel[]>('openRouterModels');
            const availableModels = storedCustomModels && storedCustomModels.length > 0 ? storedCustomModels : DEFAULT_OPENROUTER_MODELS;
            setOpenRouterModels(availableModels);

            const imageModels = availableModels.filter(m => m.supportsImages);
            setOpenRouterModelForOcr(imageModels.length > 0 ? imageModels[0].id : '');

            // Cases
            const loadedCases = await dbService.getAllCases();
            setCases(loadedCases.sort((a, b) => b.createdAt - a.createdAt));
        };
        loadInitialData();
    }, []);

    // 2. File Handling
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
    
        for (const file of files) {
            const tempId = uuidv4();
            setLoadingFiles(prev => ({ ...prev, [tempId]: { name: file.name, progress: 0 } }));
    
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = (e.loaded / e.total) * 100;
                        setLoadingFiles(prev => prev[tempId] ? { ...prev, [tempId]: { ...prev[tempId], progress } } : prev);
                    }
                };
                reader.onload = (e) => {
                    const newImage = { id: uuidv4(), file, dataUrl: e.target?.result as string };
                    setSelectedImages(prev => [...prev, newImage]);
                    setLoadingFiles(prev => {
                        const newState = { ...prev };
                        delete newState[tempId];
                        return newState;
                    });
                };
                reader.onerror = () => {
                     console.error("Error reading file:", file.name);
                     setLoadingFiles(prev => {
                        const newState = { ...prev };
                        delete newState[tempId];
                        return newState;
                    });
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                const reader = new FileReader();
                reader.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = (e.loaded / e.total) * 100;
                        setLoadingFiles(prev => prev[tempId] ? { ...prev, [tempId]: { ...prev[tempId], progress } } : prev);
                    }
                };
                reader.onload = async (e) => {
                     setLoadingFiles(prev => {
                        const newState = { ...prev };
                        delete newState[tempId];
                        return newState;
                    });
                    
                    setIsProcessingPdf(true);
                    try {
                        const typedarray = new Uint8Array(e.target!.result as ArrayBuffer);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        
                        const newImages: SelectedImage[] = [];
                        for (let i = 1; i <= pdf.numPages; i++) {
                            setPdfProcessingMessage(`جاري تحويل الصفحة ${i} من ${pdf.numPages}...`);
                            const page = await pdf.getPage(i);
                            const viewport = page.getViewport({ scale: 2.0 });
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;
    
                            if (context) {
                                await page.render({ canvas, canvasContext: context, viewport: viewport }).promise;
                                const dataUrl = canvas.toDataURL('image/png');
                                const pageFile = {
                                    name: `${file.name} (صفحة ${i})`,
                                    type: 'image/png'
                                } as File;
                                newImages.push({ id: uuidv4(), file: pageFile, dataUrl });
                            }
                        }
                        setSelectedImages(prev => [...prev, ...newImages]);
                    } catch (pdfError) {
                        console.error("Error processing PDF:", pdfError);
                        alert(`فشل في معالجة ملف PDF: ${pdfError instanceof Error ? pdfError.message : 'خطأ غير معروف'}`);
                    } finally {
                       setIsProcessingPdf(false);
                       setPdfProcessingMessage('');
                    }
                };
                 reader.onerror = () => {
                     console.error("Error reading PDF file:", file.name);
                     setLoadingFiles(prev => {
                        const newState = { ...prev };
                        delete newState[tempId];
                        return newState;
                    });
                };
                reader.readAsArrayBuffer(file);
            } else {
                alert('نوع الملف غير مدعوم. يرجى تحميل صورة أو ملف PDF.');
                setLoadingFiles(prev => {
                    const newState = { ...prev };
                    delete newState[tempId];
                    return newState;
                });
            }
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const removeImage = (idToRemove: string) => {
        setSelectedImages(prev => prev.filter(img => img.id !== idToRemove));
        setAnalysisResults(prev => {
            const newResults = { ...prev };
            delete newResults[idToRemove];
            return newResults;
        });
    };

    // 3. Analysis Queue Logic
    useEffect(() => {
        if (analysisState !== 'running' || imagesToAnalyzeQueue.length === 0) {
            if (analysisState === 'running' && imagesToAnalyzeQueue.length === 0 && totalToAnalyze > 0) {
                setAnalysisState('done');
                setTimeout(() => {
                    setAnalysisState('idle');
                    setCurrentAnalysisIndex(0);
                    setTotalToAnalyze(0);
                }, 1500);
            }
            return;
        }
    
        let isCancelled = false;
    
        const processImage = async (image: SelectedImage) => {
            setAnalysisResults(prev => ({
                ...prev,
                [image.id]: { isLoading: true, status: 'في الانتظار...', result: null, error: null }
            }));
    
            try {
                let result: string;
                if (analysisType === 'ai') {
                     const finalPrompt = `${prompt}\n\nملاحظة هامة: يجب أن تكون إجابتك باللغة العربية فقط، دون أي رموز أو لغات أخرى.`;
                     if (analysisProvider === 'gemini') {
                        setAnalysisResults(prev => ({ ...prev, [image.id]: { ...prev[image.id]!, status: 'جاري التحليل عبر Gemini...' } }));
                        result = await analyzeImageWithGemini(image.dataUrl, image.file.type, finalPrompt);
                     } else {
                        setAnalysisResults(prev => ({ ...prev, [image.id]: { ...prev[image.id]!, status: `جاري التحليل عبر ${openRouterModelForOcr}...` } }));
                        const apiKey = await dbService.getSetting<string>('openRouterApiKey');
                        if (!apiKey) throw new Error("مفتاح OpenRouter API غير موجود.");
                        result = await analyzeImageWithOpenRouter(apiKey, image.dataUrl, openRouterModelForOcr, finalPrompt);
                     }
                } else { // OCR
                    setAnalysisResults(prev => ({ ...prev, [image.id]: { ...prev[image.id]!, status: 'جاري تهيئة محرك OCR...' } }));
                    const tesseractResult = await Tesseract.recognize(image.dataUrl, 'ara', { 
                        logger: m => {
                            if (!isCancelled && m.status === 'recognizing text') {
                                setAnalysisResults(prev => ({ ...prev, [image.id]: { ...prev[image.id]!, status: `جاري استخلاص النص... ${Math.round(m.progress * 100)}%` } }));
                            }
                        } 
                    });
                    
                    const ocrText = tesseractResult.data.text;
                    if (!ocrText.trim()) {
                        result = "لم يتمكن محرك OCR من استخلاص أي نص من هذه الصورة.";
                    } else {
                        if (analysisProvider === 'gemini') {
                             setAnalysisResults(prev => ({ ...prev, [image.id]: { ...prev[image.id]!, status: 'جاري التدقيق اللغوي عبر Gemini...' } }));
                             result = await proofreadTextWithGemini(ocrText);
                        } else {
                            setAnalysisResults(prev => ({ ...prev, [image.id]: { ...prev[image.id]!, status: 'جاري التدقيق اللغوي عبر OpenRouter...' } }));
                            const apiKey = await dbService.getSetting<string>('openRouterApiKey');
                             if (!apiKey) throw new Error("مفتاح OpenRouter API غير موجود.");
                            result = await proofreadTextWithOpenRouter(apiKey, ocrText, openRouterModelForOcr);
                        }
                    }
                }
                if (!isCancelled) {
                    setAnalysisResults(prev => ({
                        ...prev,
                        [image.id]: { isLoading: false, status: null, result, error: null, tags: [] }
                    }));
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error("Analysis Error:", err);
                    let displayError: string;
                    if (err instanceof Error) {
                        const errorMessage = err.toString();
                        if (errorMessage.includes("API key") || errorMessage.includes("authentication") || errorMessage.includes("was not found")) {
                             displayError = `مفتاح API لـ ${analysisProvider} غير صالح أو غير متوفر. الرجاء إعادة المحاولة بعد تحديد مفتاح صالح.`;
                             if (analysisProvider === 'gemini') setIsGeminiApiKeyReady(false);
                             else setIsOpenRouterApiKeyReady(false);
                        } else {
                            displayError = `حدث خطأ أثناء التحليل: ${err.message}`;
                        }
                    } else {
                        displayError = `حدث خطأ غير معروف: ${String(err)}`;
                    }
                    setAnalysisResults(prev => ({
                        ...prev,
                        [image.id]: { isLoading: false, status: null, result: null, error: displayError }
                    }));
                }
            } finally {
                if (!isCancelled) {
                    setCurrentAnalysisIndex(prev => prev + 1);
                    setImagesToAnalyzeQueue(prev => prev.slice(1));
                }
            }
        };
    
        processImage(imagesToAnalyzeQueue[0]);
    
        return () => {
            isCancelled = true;
        };
    }, [analysisState, imagesToAnalyzeQueue, analysisProvider, analysisType, openRouterModelForOcr, prompt]);

    // 4. Action Handlers
    const handleStartAnalysis = () => {
        const imagesToProcess = selectedImages.filter(img => !analysisResults[img.id]?.result && !analysisResults[img.id]?.isLoading);
        if (imagesToProcess.length === 0) return;

        setImagesToAnalyzeQueue(imagesToProcess);
        setTotalToAnalyze(imagesToProcess.length);
        setCurrentAnalysisIndex(0);
        setAnalysisState('running');
    };

    const handlePauseAnalysis = () => setAnalysisState('paused');
    const handleResumeAnalysis = () => setAnalysisState('running');

    const handleCancelAnalysis = () => {
        setAnalysisState('idle');
        setImagesToAnalyzeQueue([]);
        setCurrentAnalysisIndex(0);
        setTotalToAnalyze(0);
        Object.keys(analysisResults).forEach(key => {
            if (analysisResults[key].isLoading) {
                 setAnalysisResults(prev => ({...prev, [key]: {...prev[key], isLoading: false, status: 'تم الإلغاء' }}));
            }
        });
    };
    
    // 5. Tagging Handlers
    const handleTagInputChange = (imageId: string, value: string) => {
        setTagInputs(prev => ({ ...prev, [imageId]: value }));
    };

    const handleAddTag = (imageId: string) => {
        const newTag = tagInputs[imageId]?.trim();
        if (!newTag) return;

        setAnalysisResults(prev => {
            const currentResult = prev[imageId];
            if (!currentResult) return prev;
            
            const existingTags = currentResult.tags || [];
            if (existingTags.includes(newTag)) {
                setTagInputs(p => ({ ...p, [imageId]: '' }));
                return prev;
            }

            return {
                ...prev,
                [imageId]: { ...currentResult, tags: [...existingTags, newTag] }
            };
        });
        setTagInputs(prev => ({ ...prev, [imageId]: '' }));
    };

    const handleRemoveTag = (imageId: string, tagToRemove: string) => {
        setAnalysisResults(prev => {
            const currentResult = prev[imageId];
            if (!currentResult || !currentResult.tags) return prev;

            return {
                ...prev,
                [imageId]: { ...currentResult, tags: currentResult.tags.filter(t => t !== tagToRemove) }
            };
        });
    };

    // 6. Send To Case Logic
    const handleSendToCase = async () => {
        if (!selectedCaseId) {
            alert("الرجاء اختيار قضية أو إنشاء واحدة جديدة.");
            return;
        }

        const successfulAnalyses = (Object.entries(analysisResults) as [string, AnalysisResult][])
            .filter(([, res]) => res.result)
            .map(([id, res]) => ({
                id,
                result: res.result!,
                tags: res.tags,
                image: selectedImages.find(img => img.id === id)!
            }));

        if (successfulAnalyses.length === 0) {
            alert("لا توجد نتائج تحليل ناجحة لإرسالها.");
            return;
        }
    
        setIsSending(true);
        try {
            const analysisSummary = successfulAnalyses
                .map((analysis, index) => {
                    const header = analysisType === 'ai'
                        ? `--- تحليل المستند ${index + 1} (${analysis.image.file.name}) ---`
                        : `--- نص مستخلص (OCR) من المستند ${index + 1} (${analysis.image.file.name}) ---`;

                    let tagsHeader = '';
                    if (analysis.tags && analysis.tags.length > 0) {
                       tagsHeader = `\n**التصنيفات:** ${analysis.tags.join(', ')}\n`;
                    }

                    return `${header}${tagsHeader}\n${analysis.result}`;
                })
                .join('\n\n');
            
            const messageContent = analysisType === 'ai'
                ? `تم تحليل المستندات التالية باستخدام الذكاء الاصطناعي وإضافتها إلى القضية:\n\n${analysisSummary}`
                : `تم استخلاص النص وتصنيفه من المستندات التالية وإضافته إلى القضية:\n\n${analysisSummary}`;
    
            const analysisMessage: ChatMessage = {
                id: uuidv4(),
                role: 'user',
                content: messageContent,
            };
    
            if (selectedCaseId === '__NEW__') {
                const firstAnalysis = successfulAnalyses[0];
                const newCaseTitle = `تحليل مستندات بتاريخ ${new Date().toLocaleString('ar-EG')}`;
                const summary = firstAnalysis.result.substring(0, 150) + (firstAnalysis.result.length > 150 ? '...' : '');
    
                const newCase: Case = {
                    id: uuidv4(),
                    title: newCaseTitle,
                    summary: summary,
                    chatHistory: [analysisMessage],
                    createdAt: Date.now(),
                    status: 'جديدة',
                };
    
                await dbService.addCase(newCase);
                alert("تم إنشاء القضية الجديدة وإرسال النتائج بنجاح!");
                navigate(`/case/${newCase.id}`);
    
            } else {
                const caseToUpdate = await dbService.getCase(selectedCaseId);
                if (!caseToUpdate) throw new Error("لم يتم العثور على القضية المحددة.");
                
                caseToUpdate.chatHistory.push(analysisMessage);
                await dbService.updateCase(caseToUpdate);
    
                alert("تم إرسال النتائج بنجاح إلى القضية!");
                navigate(`/case/${selectedCaseId}`);
            }
    
        } catch (error) {
            console.error("Failed to send to case:", error);
            alert(`فشل إرسال النتائج: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleSelectApiKey = async () => {
        if (window.aistudio?.openSelectKey) {
            try {
                await window.aistudio.openSelectKey();
                setIsGeminiApiKeyReady(true);
            } catch (error) {
                console.error("Error opening Gemini API key selector:", error);
            }
        }
    };

    return {
        selectedImages,
        analysisResults,
        analysisProvider,
        setAnalysisProvider,
        openRouterModels,
        openRouterModelForOcr,
        setOpenRouterModelForOcr,
        isGeminiApiKeyReady,
        isOpenRouterApiKeyReady,
        prompt,
        setPrompt,
        analysisType,
        setAnalysisType,
        cases,
        selectedCaseId,
        setSelectedCaseId,
        isSending,
        loadingFiles,
        isProcessingPdf,
        pdfProcessingMessage,
        tagInputs,
        analysisState,
        imagesToAnalyzeQueue,
        currentAnalysisIndex,
        totalToAnalyze,
        fileInputRef,
        handleFileChange,
        removeImage,
        handleStartAnalysis,
        handlePauseAnalysis,
        handleResumeAnalysis,
        handleCancelAnalysis,
        handleTagInputChange,
        handleAddTag,
        handleRemoveTag,
        handleSendToCase,
        handleSelectApiKey
    };
};
