
import React from 'react';
import { AnalysisProcessState } from '../../types';

interface ControlActionsProps {
    analysisState: AnalysisProcessState;
    hasFilesToAnalyze: boolean;
    selectedImagesCount: number;
    imagesToDoCount: number;
    handleStart: () => void;
    handlePause: () => void;
    handleResume: () => void;
    handleCancel: () => void;
    isLocked: boolean;
    currentProgress: number;
    totalProgress: number;
}

const ControlActions: React.FC<ControlActionsProps> = ({
    analysisState,
    hasFilesToAnalyze,
    selectedImagesCount,
    imagesToDoCount,
    handleStart,
    handlePause,
    handleResume,
    handleCancel,
    isLocked,
    currentProgress,
    totalProgress
}) => {
    const isAnalyzing = analysisState === 'running' || analysisState === 'paused';

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">3. ابدأ التحليل</h2>
            <div className="space-y-2">
                {analysisState === 'idle' || analysisState === 'done' ? (
                    <button
                        className="w-full px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors text-lg"
                        onClick={handleStart}
                        disabled={!hasFilesToAnalyze || isLocked}
                    >
                        {analysisState === 'done' ? 'اكتمل التحليل' : `ابدأ تحليل (${imagesToDoCount}) ملفات`}
                    </button>
                ) : analysisState === 'running' ? (
                    <button
                        className="w-full px-8 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors text-lg flex items-center justify-center"
                        onClick={handlePause}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        إيقاف مؤقت
                    </button>
                ) : (
                    <div className="flex gap-x-2">
                        <button
                            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                            onClick={handleResume}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            استئناف التحليل
                        </button>
                        <button
                            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                            onClick={handleCancel}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            إلغاء
                        </button>
                    </div>
                )}
            </div>
            {isAnalyzing && totalProgress > 0 && (
                <div className="mt-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-300">
                            إجمالي التقدم ({currentProgress} / {totalProgress})
                        </span>
                        <span className="text-sm font-medium text-gray-300">
                            {Math.round((currentProgress / totalProgress) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(currentProgress / totalProgress) * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ControlActions;
