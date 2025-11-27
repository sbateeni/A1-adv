
import React, { RefObject } from 'react';

interface FileUploadAreaProps {
    fileInputRef: RefObject<HTMLInputElement | null>;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    isAnalyzing: boolean;
    loadingFiles: Record<string, { name: string; progress: number }>;
    isProcessingPdf: boolean;
    pdfProcessingMessage: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
    fileInputRef,
    handleFileChange,
    isUploading,
    isAnalyzing,
    loadingFiles,
    isProcessingPdf,
    pdfProcessingMessage
}) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">1. رفع الملفات</h2>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isAnalyzing} className="w-full h-full text-gray-400 disabled:cursor-wait">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <p className="mt-2 text-lg">انقر لرفع صورة أو PDF</p>
                    <p className="text-sm">يمكنك تحديد عدة ملفات</p>
                </button>
            </div>
            {Object.keys(loadingFiles).length > 0 && (
                <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-medium text-gray-300">جاري الرفع...</h3>
                    {(Object.entries(loadingFiles) as [string, { name: string, progress: number }][]).map(([id, { name, progress }]) => (
                        <div key={id}>
                            <div className="flex justify-between text-xs text-gray-400">
                                <span className="truncate max-w-[70%]">{name}</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {isProcessingPdf && (
                <div className="mt-4 flex items-center text-sm text-yellow-400">
                    <svg className="animate-spin h-4 w-4 me-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>{pdfProcessingMessage}</span>
                </div>
            )}
        </div>
    );
};

export default FileUploadArea;
