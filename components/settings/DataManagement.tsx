
import React, { RefObject } from 'react';

interface DataManagementProps {
    casesCount: number;
    handleExport: () => void;
    handleImportClick: () => void;
    handleClearCases: () => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({
    casesCount,
    handleExport,
    handleImportClick,
    handleClearCases,
    fileInputRef,
    handleFileChange
}) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">إدارة البيانات</h2>
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center p-4 border border-gray-600 bg-gray-900/30 rounded-lg">
                    <div>
                        <h3 className="text-lg font-medium text-gray-200">تصدير/استيراد البيانات</h3>
                        <p className="text-sm text-gray-400 mt-1">حفظ جميع القضايا في ملف JSON أو استيرادها من ملف.</p>
                    </div>
                    <div className="flex gap-x-2 mt-4 md:mt-0 md:ms-6">
                        <button onClick={handleExport} disabled={casesCount === 0} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex-shrink-0">تصدير الكل</button>
                        <button onClick={handleImportClick} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex-shrink-0">استيراد</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center p-4 border border-red-500/30 bg-red-500/10 rounded-lg">
                    <div>
                        <h3 className="text-lg font-medium text-red-300">حذف جميع القضايا</h3>
                        <p className="text-sm text-red-400 mt-1">سيؤدي هذا الإجراء إلى حذف جميع القضايا والمحادثات المحفوظة نهائيًا.</p>
                    </div>
                    <button onClick={handleClearCases} disabled={casesCount === 0} className="mt-4 md:mt-0 md:ms-6 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex-shrink-0">حذف الكل</button>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
