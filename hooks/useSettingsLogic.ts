
import React, { useState, useEffect, useRef } from 'react';
import { ApiSource, Case, OpenRouterModel, LegalRegion } from '../types';
import * as dbService from '../services/dbService';
import { DEFAULT_OPENROUTER_MODELS } from '../constants';

export const useSettingsLogic = () => {
    const [apiSource, setApiSource] = useState<ApiSource>('gemini');
    const [region, setRegion] = useState<LegalRegion>('westbank'); // Default to West Bank
    
    // Gemini states
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [geminiInputValue, setGeminiInputValue] = useState('');
    const [geminiSaved, setGeminiSaved] = useState(false);
    
    // OpenRouter states
    const [openRouterApiKey, setOpenRouterApiKey] = useState('');
    const [openRouterModelId, setOpenRouterModelId] = useState<string>(DEFAULT_OPENROUTER_MODELS[0].id);
    const [openRouterInputValue, setOpenRouterInputValue] = useState<string>('');
    const [openRouterSaved, setOpenRouterSaved] = useState<boolean>(false);
    const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(DEFAULT_OPENROUTER_MODELS);
    const [newModelId, setNewModelId] = useState('');
    const [newModelSupportsImages, setNewModelSupportsImages] = useState(false);
    
    // Data stats
    const [casesCount, setCasesCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadSettings = async () => {
            const storedApiSource = await dbService.getSetting<ApiSource>('apiSource');
            if (storedApiSource) setApiSource(storedApiSource);

            const storedRegion = await dbService.getSetting<LegalRegion>('legalRegion');
            if (storedRegion) setRegion(storedRegion);

            const storedGeminiKey = await dbService.getSetting<string>('geminiApiKey');
            if (storedGeminiKey) {
                setGeminiApiKey(storedGeminiKey);
                setGeminiInputValue(storedGeminiKey);
            }
            
            const storedOpenRouterKey = await dbService.getSetting<string>('openRouterApiKey');
            const storedModelId = await dbService.getSetting<string>('openRouterModel');
            const storedCustomModels = await dbService.getSetting<OpenRouterModel[]>('openRouterModels');
            
            const availableModels = storedCustomModels && storedCustomModels.length > 0 ? storedCustomModels : DEFAULT_OPENROUTER_MODELS;
            setOpenRouterModels(availableModels);

            if (storedModelId && availableModels.some(m => m.id === storedModelId)) {
                setOpenRouterModelId(storedModelId);
            } else {
                setOpenRouterModelId(availableModels[0]?.id || '');
            }

            if (storedOpenRouterKey) {
                setOpenRouterApiKey(storedOpenRouterKey);
                setOpenRouterInputValue(storedOpenRouterKey);
            }

            const allCases = await dbService.getAllCases();
            setCasesCount(allCases.length);
        };
        loadSettings();
    }, []);

    const handleRegionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRegion = e.target.value as LegalRegion;
        await dbService.setSetting({ key: 'legalRegion', value: newRegion });
        setRegion(newRegion);
    };

    const handleSaveGeminiKey = async () => {
        // Sanitize input: remove quotes and extra whitespace
        const cleanKey = geminiInputValue.replace(/["']/g, '').trim();
        await dbService.setSetting({ key: 'geminiApiKey', value: cleanKey });
        setGeminiApiKey(cleanKey);
        setGeminiInputValue(cleanKey); // Update input to show cleaned value
        setGeminiSaved(true);
        setTimeout(() => setGeminiSaved(false), 3000);
    };

    const handleSaveOpenRouterKey = async () => {
        const cleanKey = openRouterInputValue.replace(/["']/g, '').trim();
        await dbService.setSetting({ key: 'openRouterApiKey', value: cleanKey });
        setOpenRouterApiKey(cleanKey);
        setOpenRouterInputValue(cleanKey); // Update input to show cleaned value
        setOpenRouterSaved(true);
        setTimeout(() => setOpenRouterSaved(false), 3000);
    };

    const handleApiSourceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSource = e.target.value as ApiSource;
        await dbService.setSetting({ key: 'apiSource', value: newSource });
        setApiSource(newSource);
    };

    const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        setOpenRouterModelId(newModel);
        await dbService.setSetting({ key: 'openRouterModel', value: newModel });
    };

    const handleAddModel = async () => {
        const trimmedId = newModelId.trim();
        if (!trimmedId) return alert("يرجى إدخال معرف النموذج.");
        if (openRouterModels.some(m => m.id === trimmedId)) return alert("هذا النموذج موجود بالفعل.");

        const newModel: OpenRouterModel = {
            id: trimmedId,
            name: trimmedId,
            supportsImages: newModelSupportsImages,
        };

        const updatedModels = [...openRouterModels, newModel];
        setOpenRouterModels(updatedModels);
        await dbService.setSetting({ key: 'openRouterModels', value: updatedModels });
        setNewModelId('');
        setNewModelSupportsImages(false);
    };

    const handleDeleteModel = async (idToDelete: string) => {
        if (!window.confirm(`هل أنت متأكد من حذف النموذج: ${idToDelete}؟`)) return;

        const updatedModels = openRouterModels.filter(m => m.id !== idToDelete);
        setOpenRouterModels(updatedModels);
        await dbService.setSetting({ key: 'openRouterModels', value: updatedModels });

        if (openRouterModelId === idToDelete) {
            const newSelectedModel = updatedModels.length > 0 ? updatedModels[0].id : '';
            setOpenRouterModelId(newSelectedModel);
            await dbService.setSetting({ key: 'openRouterModel', value: newSelectedModel });
        }
    };

    const handleClearCases = async () => {
        if (window.confirm("هل أنت متأكد من حذف جميع القضايا؟")) {
            await dbService.clearCases();
            setCasesCount(0);
            alert("تم حذف جميع القضايا بنجاح.");
        }
    };

    const handleExport = async () => {
        const allCases = await dbService.getAllCases();
        const dataStr = JSON.stringify(allCases, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        link.download = `pal-law-cases-backup-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable.");
                const importedCases = JSON.parse(text) as Case[];

                if (Array.isArray(importedCases) && importedCases.every(c => c.id && c.title && c.chatHistory)) {
                    if (window.confirm(`هل أنت متأكد من استيراد ${importedCases.length} قضية؟ سيتم استبدال جميع القضايا الحالية.`)) {
                        await dbService.clearCases();
                        for (const caseItem of importedCases) await dbService.addCase(caseItem);
                        setCasesCount(importedCases.length);
                        alert("تم استيراد القضايا بنجاح!");
                    }
                } else {
                    throw new Error("ملف JSON غير صالح.");
                }
            } catch (error) {
                alert(`فشل استيراد الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return {
        apiSource, handleApiSourceChange,
        region, handleRegionChange,
        geminiApiKey, geminiInputValue, setGeminiInputValue, handleSaveGeminiKey, geminiSaved,
        openRouterApiKey, openRouterInputValue, setOpenRouterInputValue, handleSaveOpenRouterKey, openRouterSaved,
        openRouterModels, openRouterModelId, handleModelChange,
        newModelId, setNewModelId, newModelSupportsImages, setNewModelSupportsImages, handleAddModel, handleDeleteModel,
        casesCount, handleClearCases, handleExport, handleImportClick, handleFileChange, fileInputRef
    };
};
