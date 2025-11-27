
import React, { useState } from 'react';
import { useInheritanceLogic } from '../hooks/useInheritanceLogic';
import { InheritanceInput } from '../types';

const InheritancePage: React.FC = () => {
    const {
        cases,
        selectedCaseId, setSelectedCaseId,
        inputs, handleInputChange,
        handleExtractFromCase,
        isExtracting,
        calculate,
        results,
        error,
        saveInheritanceCase,
        isSaving
    } = useInheritanceLogic();

    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [newCaseName, setNewCaseName] = useState('');

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        if (!results) return;
        let text = `تقرير توزيع المواريث\n`;
        text += `التاريخ: ${new Date().toLocaleDateString('ar-EG')}\n`;
        text += `إجمالي التركة: ${results.totalValue} ${inputs.currency}\n\n`;
        text += `--- جدول التوزيع ---\n`;
        text += `الاسم | الصفة | الحصة | المبلغ\n`;
        results.heirs.forEach(h => {
            text += `${h.name || '-'} | ${h.type} | ${h.shareFraction} | ${h.amount.toFixed(2)}\n`;
        });
        if (results.context) {
            text += `\n--- ملاحظات وخلاصة ---\n`;
            if (results.context.notes) text += `ملاحظات: ${results.context.notes}\n`;
            if (results.context.disputes) text += `نزاعات: ${results.context.disputes}\n`;
            if (results.context.conclusion) text += `الخلاصة: ${results.context.conclusion}\n`;
        }

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inheritance-report-${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSaveClick = () => {
        if (!results) return;
        if (selectedCaseId) {
            // Update existing
            saveInheritanceCase();
        } else {
            // Prompt for new name
            setNewCaseName(`توزيع تركة - ${new Date().toLocaleDateString('ar-EG')}`);
            setIsNameModalOpen(true);
        }
    };

    const confirmSaveNew = () => {
        if (newCaseName.trim()) {
            saveInheritanceCase(newCaseName);
            setIsNameModalOpen(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 print-content relative">
            
            {/* Title - Visible in print but styled */}
            <h1 className="text-3xl font-bold mb-6 text-gray-100 border-b border-gray-700 pb-3 flex items-center justify-between">
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    حاسبة المواريث الذكية
                </div>
                <div className="flex gap-2 no-print">
                    <button onClick={handlePrint} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200">طباعة</button>
                    <button onClick={handleExport} disabled={!results} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white disabled:opacity-50">تصدير TXT</button>
                </div>
            </h1>

            {/* AI Extraction Section - Hidden in Print */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-emerald-500/30 no-print">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-emerald-300 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        الاستخلاص الذكي من القضايا
                    </h2>
                    <span className="text-xs bg-emerald-900/50 text-emerald-200 px-2 py-1 rounded border border-emerald-500/20">AI Powered</span>
                </div>
                <div className="flex gap-4 flex-col sm:flex-row">
                    <select 
                        value={selectedCaseId} 
                        onChange={(e) => setSelectedCaseId(e.target.value)}
                        className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                        <option value="">-- اختر قضية سابقة لملء البيانات (أو أنشئ جديداً) --</option>
                        {cases.map(c => <option key={c.id} value={c.id}>{c.title} {c.caseType === 'inheritance' ? '(ملف ميراث)' : ''}</option>)}
                    </select>
                    <button 
                        onClick={handleExtractFromCase} 
                        disabled={!selectedCaseId || isExtracting}
                        className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-600 transition-colors flex items-center justify-center sm:w-auto w-full"
                    >
                        {isExtracting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 me-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                جاري التحليل...
                            </>
                        ) : "استخلاص البيانات"}
                    </button>
                </div>
                {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Form - Hidden in Print */}
                <div className="lg:col-span-1 space-y-6 no-print">
                    <div className="bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-lg font-medium text-gray-200 mb-4 border-b border-gray-700 pb-2">بيانات التركة</h3>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm text-gray-400 mb-1">الديانة / النظام</label>
                                <div className="flex bg-gray-700 rounded p-1">
                                    <button onClick={() => handleInputChange('religion', 'muslim')} className={`flex-1 py-1 rounded text-sm ${inputs.religion === 'muslim' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>إسلامي</button>
                                    <button onClick={() => handleInputChange('religion', 'christian')} className={`flex-1 py-1 rounded text-sm ${inputs.religion === 'christian' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>مسيحي (مدني)</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">قيمة التركة (الصافي)</label>
                                <div className="flex">
                                    <input type="number" value={inputs.estateValue} onChange={(e) => handleInputChange('estateValue', Number(e.target.value))} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-s-lg text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                                    <select value={inputs.currency} onChange={(e) => handleInputChange('currency', e.target.value)} className="bg-gray-600 border border-gray-500 rounded-e-lg px-3 text-white outline-none">
                                        <option value="JOD">JOD</option>
                                        <option value="NIS">NIS</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-lg font-medium text-gray-200 mb-4 border-b border-gray-700 pb-2">الورثة (الأعداد)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'زوج', key: 'husband', max: 1 },
                                { label: 'زوجة', key: 'wife', max: 4 },
                                { label: 'ابن', key: 'son', max: 20 },
                                { label: 'بنت', key: 'daughter', max: 20 },
                                { label: 'أب', key: 'father', max: 1 },
                                { label: 'أم', key: 'mother', max: 1 },
                                { label: 'أخ شقيق', key: 'brotherFull', max: 10 },
                                { label: 'أخت شقيقة', key: 'sisterFull', max: 10 },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={field.max}
                                        value={inputs[field.key as keyof InheritanceInput] as number}
                                        onChange={(e) => handleInputChange(field.key as keyof InheritanceInput, Number(e.target.value))}
                                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={calculate} className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all">
                        احسب الميراث
                    </button>
                </div>

                {/* Results Section - Full width in print */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col print-analysis-box">
                        <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center justify-between">
                            <span>نتائج القسمة الشرعية/القانونية</span>
                            {results && <span className="text-sm font-normal text-gray-400 bg-gray-700 px-3 py-1 rounded-full print:text-black print:border print:bg-white">إجمالي التركة: {results.totalValue.toLocaleString()} {inputs.currency}</span>}
                        </h3>

                        {!results ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-gray-500 min-h-[300px] no-print">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                <p>أدخل البيانات واضغط "احسب" لعرض الجدول</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-gray-700 text-gray-300 print:bg-gray-200 print:text-black">
                                            <th className="p-3 rounded-tr-lg print:rounded-none border border-gray-600 print:border-black">اسم الوريث</th>
                                            <th className="p-3 border border-gray-600 print:border-black">الصفة الشرعية</th>
                                            <th className="p-3 border border-gray-600 print:border-black">الحصة (الفرض/السهم)</th>
                                            <th className="p-3 rounded-tl-lg print:rounded-none border border-gray-600 print:border-black">المبلغ ({inputs.currency})</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700 print:divide-black">
                                        {results.heirs.map((heir, idx) => (
                                            <tr key={idx} className="hover:bg-gray-700/30 transition-colors print:bg-white">
                                                <td className="p-3 text-white font-medium border border-gray-600 print:border-black print:text-black">
                                                    {heir.name || '-'}
                                                </td>
                                                <td className="p-3 font-medium text-blue-200 border border-gray-600 print:border-black print:text-black">
                                                    {heir.type}
                                                </td>
                                                <td className="p-3 text-amber-400 font-mono dir-ltr text-end border border-gray-600 print:border-black print:text-black">
                                                    {heir.shareFraction} 
                                                    <span className="text-gray-500 text-xs ms-2 print:text-gray-700">({heir.sharePercentage.toFixed(2)}%)</span>
                                                </td>
                                                <td className="p-3 font-bold text-emerald-400 border border-gray-600 print:border-black print:text-black">{heir.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-gray-600 print:border-black">
                                        <tr>
                                            <td colSpan={3} className="p-3 font-bold text-gray-200 print:text-black border border-gray-600 print:border-black">المجموع الموزع</td>
                                            <td className="p-3 font-bold text-emerald-400 print:text-black border border-gray-600 print:border-black">
                                                {results.heirs.reduce((acc, h) => acc + h.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Detailed Analysis Section */}
                    {results && results.context && (results.context.notes || results.context.disputes || results.context.conclusion) && (
                        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-amber-500 print-analysis-box">
                            <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center print:text-black">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 me-2 print:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                الملاحظات والخلاصة القانونية
                            </h3>
                            
                            <div className="space-y-6">
                                {results.context.notes && (
                                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 print:bg-white print:border-black">
                                        <h4 className="text-sm font-semibold text-red-300 mb-2 print:text-black print:font-bold">ملاحظات حرجة / ديون / وصايا</h4>
                                        <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed print:text-black">{results.context.notes}</p>
                                    </div>
                                )}
                                
                                {results.context.disputes && (
                                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 print:bg-white print:border-black">
                                        <h4 className="text-sm font-semibold text-amber-300 mb-2 print:text-black print:font-bold">أموال متنازع عليها / معلقة</h4>
                                        <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed print:text-black">{results.context.disputes}</p>
                                    </div>
                                )}

                                {results.context.conclusion && (
                                    <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-500/20 print:bg-white print:border-black">
                                        <h4 className="text-sm font-semibold text-emerald-300 mb-2 print:text-black print:font-bold">الخلاصة النهائية والتوصيات</h4>
                                        <p className="text-sm text-emerald-100 whitespace-pre-line leading-relaxed print:text-black">{results.context.conclusion}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Save Result Button - Hidden in Print */}
                    {results && (
                        <div className="flex justify-end no-print mt-4">
                            <button 
                                onClick={handleSaveClick} 
                                disabled={isSaving}
                                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg flex items-center transition-colors disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <span>جاري الحفظ...</span>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                        {selectedCaseId ? 'تحديث القضية الحالية' : 'حفظ كملف ميراث جديد'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Name Input Modal */}
            {isNameModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 no-print">
                    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-600">
                        <h3 className="text-xl font-bold text-white mb-4">تسمية ملف الميراث</h3>
                        <input 
                            type="text" 
                            value={newCaseName}
                            onChange={(e) => setNewCaseName(e.target.value)}
                            placeholder="أدخل اسم الملف..."
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 outline-none mb-6"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsNameModalOpen(false)} className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">إلغاء</button>
                            <button onClick={confirmSaveNew} disabled={!newCaseName.trim()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50">حفظ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InheritancePage;
