
import React from 'react';
import { ApiSource, OpenRouterModel } from '../../types';

interface ServiceConfigProps {
    apiSource: ApiSource;
    handleApiSourceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    geminiInputValue: string;
    setGeminiInputValue: (val: string) => void;
    handleSaveGeminiKey: () => void;
    geminiSaved: boolean;
    openRouterInputValue: string;
    setOpenRouterInputValue: (val: string) => void;
    handleSaveOpenRouterKey: () => void;
    openRouterSaved: boolean;
    openRouterModelId: string;
    handleModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    openRouterModels: OpenRouterModel[];
    newModelId: string;
    setNewModelId: (val: string) => void;
    newModelSupportsImages: boolean;
    setNewModelSupportsImages: (val: boolean) => void;
    handleAddModel: () => void;
    handleDeleteModel: (id: string) => void;
}

const ServiceConfig: React.FC<ServiceConfigProps> = ({
    apiSource, handleApiSourceChange,
    geminiInputValue, setGeminiInputValue, handleSaveGeminiKey, geminiSaved,
    openRouterInputValue, setOpenRouterInputValue, handleSaveOpenRouterKey, openRouterSaved,
    openRouterModelId, handleModelChange, openRouterModels,
    newModelId, setNewModelId, newModelSupportsImages, setNewModelSupportsImages, handleAddModel, handleDeleteModel
}) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">إعدادات مزود الخدمة</h2>
            <div className="mb-8">
                <label htmlFor="api-source" className="block text-lg font-medium text-gray-200 mb-2">مزود خدمة الذكاء الاصطناعي</label>
                <select id="api-source" value={apiSource} onChange={handleApiSourceChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                </select>
            </div>

            {apiSource === 'gemini' && (
                <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">إعدادات Google Gemini</h3>
                    <p className="text-sm text-gray-400 mb-3">يمكنك إما استخدام نافذة Google AI Studio المنبثقة (إذا كانت متاحة) أو إدخال مفتاح API الخاص بك يدويًا هنا.</p>
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-2">
                            <label htmlFor="gemini-api-key" className="block text-lg font-medium text-gray-200">Google Gemini API Key</label>
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-900/50 hover:text-blue-200 transition-colors flex items-center shadow-sm"
                            >
                                <span className="me-1">🔑</span>
                                <span>احصل على المفتاح من هنا</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ms-1 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>
                        <input type="password" id="gemini-api-key" value={geminiInputValue} onChange={(e) => setGeminiInputValue(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="أدخل مفتاح Gemini API هنا..." />
                    </div>
                    <div className="flex items-center justify-end">
                        {geminiSaved && <span className="text-green-400 me-4 transition-opacity duration-300">تم حفظ المفتاح!</span>}
                        <button onClick={handleSaveGeminiKey} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-500 transition-colors">حفظ مفتاح Gemini</button>
                    </div>
                </div>
            )}

            {apiSource === 'openrouter' && (
                <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">إعدادات OpenRouter</h3>
                    <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                             <label htmlFor="openrouter-api-key" className="block text-lg font-medium text-gray-200">OpenRouter API Key</label>
                             <a 
                                href="https://openrouter.ai/keys" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-xs font-medium bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 rounded hover:bg-indigo-900/50 hover:text-indigo-200 transition-colors flex items-center shadow-sm"
                            >
                                <span className="me-1">🔑</span>
                                <span>احصل على المفتاح</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ms-1 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>
                        <input type="password" id="openrouter-api-key" value={openRouterInputValue} onChange={(e) => setOpenRouterInputValue(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="sk-or-..." />
                    </div>
                    <div className="flex items-center justify-end mb-6">
                        {openRouterSaved && <span className="text-green-400 me-4 transition-opacity duration-300">تم حفظ المفتاح!</span>}
                        <button onClick={handleSaveOpenRouterKey} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-500 transition-colors">حفظ مفتاح OpenRouter</button>
                    </div>
                    <div className="mt-8 border-t border-gray-700 pt-6">
                        <label htmlFor="openrouter-model" className="block text-lg font-medium text-gray-200 mb-2">نموذج OpenRouter</label>
                        <select id="openrouter-model" value={openRouterModelId} onChange={handleModelChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            {openRouterModels.map(model => (
                                <option key={model.id} value={model.id}>{model.name} {model.supportsImages ? '(يدعم الصور)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-8 border-t border-gray-700 pt-6">
                        <h4 className="text-lg font-medium text-gray-200 mb-2">إدارة نماذج OpenRouter</h4>
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                            <h5 className="font-semibold text-gray-300 mb-3">إضافة نموذج جديد</h5>
                            <div className="flex flex-col sm:flex-row gap-2 items-start mb-4">
                                <input type="text" value={newModelId} onChange={(e) => setNewModelId(e.target.value)} className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:ring-blue-500 focus:outline-none" placeholder="مثال: google/gemini-flash-1.5" />
                                <button onClick={handleAddModel} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex-shrink-0">إضافة</button>
                            </div>
                            <div className="flex items-center mb-4">
                                <input type="checkbox" id="supports-images" checked={newModelSupportsImages} onChange={(e) => setNewModelSupportsImages(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700" />
                                <label htmlFor="supports-images" className="ms-2 block text-sm text-gray-300">هذا النموذج يدعم الصور</label>
                            </div>
                            <h5 className="font-semibold text-gray-300 mb-2 border-t border-gray-700 pt-4">قائمة النماذج الحالية</h5>
                            <div className="max-h-60 overflow-y-auto space-y-2 pe-2">
                                {openRouterModels.map(model => (
                                    <div key={model.id} className="flex justify-between items-center p-2 bg-gray-700 rounded-md">
                                        <span className="text-sm text-gray-200 font-mono truncate me-2">{model.id} {model.supportsImages && '🖼️'}</span>
                                        <button onClick={() => handleDeleteModel(model.id)} className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-full flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceConfig;
