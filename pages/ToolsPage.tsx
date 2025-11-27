
import React from 'react';
import { useToolsLogic } from '../hooks/useToolsLogic';

const ToolsPage: React.FC = () => {
    const {
        startDate, setStartDate,
        deadlineType, setDeadlineType,
        deadlineResult,
        deadlineNotes,
        calculateDeadline,
        
        claimAmount, setClaimAmount,
        currency, setCurrency,
        feeCourtType, setFeeCourtType,
        calculatedFee,
        feeNotes,
        calculateFee
    } = useToolsLogic();

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-100 border-b border-gray-700 pb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                الأدوات القانونية المساعدة
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Deadline Calculator */}
                <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                    <h2 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        حاسبة المواعيد القضائية
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">تاريخ الحكم / التبليغ</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">نوع الإجراء</label>
                            <select 
                                value={deadlineType}
                                onChange={(e) => setDeadlineType(e.target.value as any)}
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="istinaf_civil">استئناف حقوقي (مدني/تجاري)</option>
                                <option value="naqd_civil">طعن بالنقض (حقوقي)</option>
                                <option value="istinaf_penal">استئناف جزائي (جنح)</option>
                                <option value="naqd_penal">طعن بالنقض (جزائي)</option>
                                <option value="review">التماس إعادة النظر</option>
                            </select>
                        </div>
                        <button 
                            onClick={calculateDeadline}
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            احسب الموعد النهائي
                        </button>

                        {deadlineResult && (
                            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">الموعد النهائي لتقديم الطعن:</p>
                                <p className="text-2xl font-bold text-white">{deadlineResult}</p>
                                {deadlineNotes && (
                                    <p className="text-xs text-amber-400 mt-2 pt-2 border-t border-blue-500/20">{deadlineNotes}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Fees Calculator */}
                <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                    <h2 className="text-xl font-semibold text-emerald-300 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        حاسبة الرسوم القضائية (تقديري)
                    </h2>
                    <div className="space-y-4">
                         <div className="flex gap-4">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-300 mb-1">قيمة المطالبة</label>
                                <input 
                                    type="number" 
                                    value={claimAmount}
                                    onChange={(e) => setClaimAmount(Number(e.target.value))}
                                    placeholder="0.00"
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-medium text-gray-300 mb-1">العملة</label>
                                <select 
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as any)}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="JOD">دينار (JOD)</option>
                                    <option value="NIS">شيكل (NIS)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">المحكمة / الدرجة</label>
                            <select 
                                value={feeCourtType}
                                onChange={(e) => setFeeCourtType(e.target.value as any)}
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="sulh">محكمة الصلح</option>
                                <option value="bidaya">محكمة البداية</option>
                                <option value="istinaf">محكمة الاستئناف</option>
                                <option value="naqd">محكمة النقض</option>
                            </select>
                        </div>
                        <button 
                            onClick={calculateFee}
                            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            احسب الرسم المتوقع
                        </button>

                        {calculatedFee !== null && (
                            <div className="mt-4 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">الرسم التقريبي المستحق:</p>
                                <p className="text-2xl font-bold text-white">
                                    {calculatedFee.toLocaleString()} {currency}
                                </p>
                                {feeNotes && (
                                    <p className="text-xs text-amber-400 mt-2 pt-2 border-t border-emerald-500/20">{feeNotes}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolsPage;
