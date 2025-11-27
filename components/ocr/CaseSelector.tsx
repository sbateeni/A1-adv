
import React from 'react';
import { Case } from '../../types';

interface CaseSelectorProps {
    cases: Case[];
    selectedCaseId: string;
    setSelectedCaseId: (id: string) => void;
    handleSendToCase: () => void;
    canSend: boolean;
    isSending: boolean;
    disabled: boolean;
}

const CaseSelector: React.FC<CaseSelectorProps> = ({
    cases,
    selectedCaseId,
    setSelectedCaseId,
    handleSendToCase,
    canSend,
    isSending,
    disabled
}) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mt-6 border-t-4 border-green-500">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">4. إرسال إلى قضية</h2>
            <p className="text-sm text-gray-400 mb-3">اختر قضية من القائمة أو أنشئ واحدة جديدة لإضافة الملفات ونتائج تحليلها إليها.</p>
            <select 
                value={selectedCaseId} 
                onChange={(e) => setSelectedCaseId(e.target.value)} 
                disabled={disabled} 
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4 disabled:opacity-50"
            >
                <option value="" disabled>-- اختر قضية أو أنشئ واحدة --</option>
                <option value="__NEW__">➕ إنشاء قضية جديدة</option>
                {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button 
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors" 
                onClick={handleSendToCase} 
                disabled={!canSend || isSending || disabled}
            >
                {isSending ? "جاري الحفظ..." : selectedCaseId === '__NEW__' ? "إنشاء قضية جديدة وإرسال النتائج" : "إرسال النتائج إلى القضية المختارة"}
            </button>
        </div>
    );
};

export default CaseSelector;
