
import React from 'react';
import { AnalysisProvider, AnalysisType, OpenRouterModel } from '../../types';

interface AnalysisConfigProps {
    analysisProvider: AnalysisProvider;
    setAnalysisProvider: (provider: AnalysisProvider) => void;
    openRouterModels: OpenRouterModel[];
    openRouterModelForOcr: string;
    setOpenRouterModelForOcr: (model: string) => void;
    analysisType: AnalysisType;
    setAnalysisType: (type: AnalysisType) => void;
    prompt: string;
    setPrompt: (prompt: string) => void;
    isLocked: boolean;
}

const AnalysisConfig: React.FC<AnalysisConfigProps> = ({
    analysisProvider,
    setAnalysisProvider,
    openRouterModels,
    openRouterModelForOcr,
    setOpenRouterModelForOcr,
    analysisType,
    setAnalysisType,
    prompt,
    setPrompt,
    isLocked
}) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">2. اختر نوع التحليل</h2>
            
            <div className="mb-4">
                <h3 className="text-md font-semibold text-gray-300 mb-2">مزود الخدمة</h3>
                <div className="flex items-center space-x-2 space-x-reverse bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setAnalysisProvider('gemini')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${analysisProvider === 'gemini' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                        Google Gemini
                    </button>
                    <button onClick={() => setAnalysisProvider('openrouter')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${analysisProvider === 'openrouter' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                        OpenRouter
                    </button>
                </div>
            </div>

            {analysisProvider === 'openrouter' && (
                <div className="mb-4">
                    <label htmlFor="or-model-ocr" className="block text-sm font-medium text-gray-300 mb-2">اختر نموذج OpenRouter (يدعم الصور):</label>
                    <select 
                        id="or-model-ocr" 
                        value={openRouterModelForOcr} 
                        onChange={(e) => setOpenRouterModelForOcr(e.target.value)}
                        disabled={isLocked}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
                    >
                        {openRouterModels.filter(m => m.supportsImages).map(model => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="pt-4 border-t border-gray-700">
                <h3 className="text-md font-semibold text-gray-300 mb-2">نوع التحليل</h3>
                <div className="flex items-center space-x-2 space-x-reverse bg-gray-700 rounded-lg p-1 mb-4">
                    <button onClick={() => setAnalysisType('ai')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${analysisType === 'ai' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                        تحليل بالذكاء الاصطناعي
                    </button>
                    <button onClick={() => setAnalysisType('ocr')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${analysisType === 'ocr' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                        استخلاص النص وتصنيفه (OCR)
                    </button>
                </div>
                {analysisType === 'ai' && (
                    <div>
                        <label htmlFor="prompt-text" className="block text-sm font-medium text-gray-300 mb-2">أدخل الطلب (موحد لجميع الملفات):</label>
                        <textarea id="prompt-text" value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLocked} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50" rows={3} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisConfig;
