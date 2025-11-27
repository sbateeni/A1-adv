
import React from 'react';
import { ActionMode } from '../types';

interface LegalToolbarProps {
    currentMode: ActionMode;
    onModeChange: (mode: ActionMode) => void;
    disabled?: boolean;
}

export const ACTION_MODES: { id: ActionMode; label: string; icon: React.ReactNode; color: string; description: string }[] = [
    {
        id: 'analysis',
        label: 'تحليل شامل',
        description: 'شرح الموقف القانوني والمواد المنطبقة',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>,
        color: 'bg-blue-600 hover:bg-blue-500',
    },
    {
        id: 'interrogator',
        label: 'المستجوب',
        description: 'طرح أسئلة ذكية لاستكمال وقائع القضية الناقصة',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
        color: 'bg-indigo-600 hover:bg-indigo-500',
    },
    {
        id: 'research',
        label: 'المحقق',
        description: 'البحث في المصادر الرسمية (المقتفي، ديوان الفتوى) ومطابقة النصوص',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>,
        color: 'bg-purple-600 hover:bg-purple-500',
    },
    {
        id: 'verifier',
        label: 'المدقق التشريعي',
        description: 'التأكد من سريان القانون وعدم إلغائه بقرار بقانون',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
        color: 'bg-cyan-600 hover:bg-cyan-500',
    },
    {
        id: 'loopholes',
        label: 'كشف الثغرات',
        description: 'محامي الخصم: البحث عن الأخطاء والدفوع الشكلية',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" /></svg>,
        color: 'bg-rose-600 hover:bg-rose-500',
    },
    {
        id: 'drafting',
        label: 'صياغة قانونية',
        description: 'كتابة لوائح دعوى وعقود رسمية',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>,
        color: 'bg-emerald-600 hover:bg-emerald-500',
    },
    {
        id: 'strategy',
        label: 'خطة الفوز',
        description: 'تكتيكات عملية، تفاوض، وماذا تفعل',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>,
        color: 'bg-amber-600 hover:bg-amber-500',
    }
];

const LegalToolbar: React.FC<LegalToolbarProps> = ({ currentMode, onModeChange, disabled }) => {
    return (
        <div className="mb-3 bg-gray-700/30 p-2 rounded-xl overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max">
                {ACTION_MODES.map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        disabled={disabled}
                        title={mode.description}
                        className={`flex items-center space-x-1.5 space-x-reverse px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            currentMode === mode.id 
                                ? mode.color + ' text-white shadow-lg scale-105 ring-2 ring-white/20' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className={currentMode === mode.id ? 'animate-pulse' : ''}>{mode.icon}</span>
                        <span className="whitespace-nowrap">{mode.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LegalToolbar;
