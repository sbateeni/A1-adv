
import React from 'react';
import { SelectedImage, AnalysisResult, AnalysisType } from '../../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ResultsGalleryProps {
    selectedImages: SelectedImage[];
    analysisResults: Record<string, AnalysisResult>;
    removeImage: (id: string) => void;
    analysisType: AnalysisType;
    tagInputs: Record<string, string>;
    handleTagInputChange: (id: string, value: string) => void;
    handleAddTag: (id: string) => void;
    handleRemoveTag: (id: string, tag: string) => void;
}

const ResultsGallery: React.FC<ResultsGalleryProps> = ({
    selectedImages,
    analysisResults,
    removeImage,
    analysisType,
    tagInputs,
    handleTagInputChange,
    handleAddTag,
    handleRemoveTag
}) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">📤 المخرجات</h2>
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                {selectedImages.length === 0 && <p className="text-gray-500 text-center pt-10">لم يتم رفع أي ملفات بعد.</p>}
                {selectedImages.map(image => (
                    <div key={image.id} className="bg-gray-900 rounded-md p-4">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-sm font-medium text-gray-400 truncate flex-grow me-2">{image.file.name}</p>
                            <button onClick={() => removeImage(image.id)} className="p-1 text-gray-500 hover:text-red-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <img src={image.dataUrl} alt={image.file.name} className="max-h-48 rounded-lg mx-auto shadow-md mb-4 border border-gray-700" />
                        <div className="bg-gray-800 rounded p-3 min-h-[80px]">
                            {analysisResults[image.id]?.isLoading && (
                                <div className="flex flex-col items-center justify-center text-center text-gray-400">
                                     <svg className="animate-spin h-6 w-6 mb-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                     <p className="text-sm">{analysisResults[image.id]?.status || 'جاري المعالجة...'}</p>
                                </div>
                            )}
                            {analysisResults[image.id]?.error && <p className="text-red-400 text-sm">{analysisResults[image.id]?.error}</p>}
                            {analysisResults[image.id]?.result && (
                                <>
                                    <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(analysisResults[image.id]!.result!) as string) }}></div>
                                    
                                    {analysisType === 'ocr' && (
                                        <div className="mt-4 border-t border-gray-700 pt-3">
                                            <h4 className="text-xs font-semibold text-gray-400 mb-2">التصنيفات</h4>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {analysisResults[image.id]?.tags?.map(tag => (
                                                    <span key={tag} className="bg-teal-500/20 text-teal-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                                                        {tag}
                                                        <button onClick={() => handleRemoveTag(image.id, tag)} className="ms-1.5 text-teal-400 hover:text-white">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-x-2">
                                                <input
                                                    type="text"
                                                    value={tagInputs[image.id] || ''}
                                                    onChange={(e) => handleTagInputChange(image.id, e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(image.id); } }}
                                                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md p-1.5 text-sm text-gray-200 focus:ring-blue-500 focus:outline-none"
                                                    placeholder="أضف تصنيف..."
                                                />
                                                <button onClick={() => handleAddTag(image.id)} className="px-3 py-1.5 bg-gray-600 text-gray-200 text-sm rounded-md hover:bg-gray-500">إضافة</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {!analysisResults[image.id] && <p className="text-gray-600 text-center text-sm">في انتظار التحليل</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResultsGallery;
