
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CaseCategory {
    title: string;
    description: string;
    color: string;
    icon: React.ReactNode;
    items: CaseTypeItem[];
}

interface CaseTypeItem {
    label: string;
    description: string;
    targetRoute: string;
}

const CaseTypesPage: React.FC = () => {
    const navigate = useNavigate();

    const categories: CaseCategory[] = [
        {
            title: "القضايا الجزائية (الجنائية)",
            description: "تتعامل مع الجرائم التي تشكل اعتداءً على المجتمع والنظام العام، وتتطلب تدخلاً من النيابة العامة.",
            color: "from-red-500 to-red-700",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
            items: [
                { label: "الجرائم الشخصية", description: "مثل جرائم القتل، الإيذاء، والاعتداءات الجسدية.", targetRoute: "/civil" },
                { label: "الجرائم المالية", description: "تشمل السرقة، الاحتيال، الاختلاس، وخيانة الأمانة.", targetRoute: "/civil" },
                { label: "الجرائم القانونية/التنظيمية", description: "مخالفات السير، مخالفات البناء، والجرائم المخلة بالآداب العامة.", targetRoute: "/civil" },
                { label: "جرائم الملكية", description: "الاعتداء على الممتلكات الخاصة، الحرق العمد، والإتلاف.", targetRoute: "/civil" },
                { label: "الجرائم غير المكتملة", description: "الشروع في الجريمة، التحريض، والاتفاق الجنائي.", targetRoute: "/civil" },
                { label: "الجنايات الكبرى", description: "المخدرات، التزوير، الرشوة، والجرائم الإلكترونية.", targetRoute: "/civil" },
            ]
        },
        {
            title: "القضايا المدنية والحقوقية",
            description: "تتعامل مع النزاعات بين الأفراد والمؤسسات لحماية الحقوق الخاصة والتعويض عن الأضرار.",
            color: "from-blue-500 to-blue-700",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
            items: [
                { label: "منازعات العقود", description: "الخلافات الناشئة عن عدم تنفيذ العقود، فسخ العقد، أو تفسير بنوده.", targetRoute: "/civil" },
                { label: "دعاوى الأضرار (Torts)", description: "التعويض عن حوادث الطرق، الإصابات الشخصية، والإهمال الطبي.", targetRoute: "/civil" },
                { label: "نزاعات الملكية", description: "الخلافات العقارية، إزالة الشيوع، الأراضي، والملكية الفكرية.", targetRoute: "/civil" },
                { label: "قضايا الأسرة والأحوال الشخصية", description: "الزواج، الطلاق، النفقة، الحضانة، والوصاية.", targetRoute: "/sharia" },
                { label: "منازعات العمل", description: "الحقوق العمالية، الفصل التعسفي، مكافأة نهاية الخدمة.", targetRoute: "/civil" },
                { label: "استرداد الديون", description: "المطالبات المالية، الشيكات المرجعة، والكمبيالات.", targetRoute: "/civil" },
                { label: "الدعاوى الجماعية", description: "عندما يرفع مجموعة من الأشخاص دعوى موحدة ضد جهة واحدة.", targetRoute: "/civil" },
                { label: "القضايا الإدارية/البلدية", description: "الطعن في القرارات الإدارية والنزاعات مع البلديات.", targetRoute: "/civil" },
                { label: "قضايا الإرث والوصايا", description: "توزيع التركة، حصر الإرث، وتنفيذ الوصايا.", targetRoute: "/inheritance" },
            ]
        }
    ];

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in">
            <h1 className="text-3xl font-bold mb-8 text-gray-100 border-b border-gray-700 pb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500 me-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                دليل أنواع القضايا والاختصاص
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {categories.map((cat, idx) => (
                    <div key={idx} className="flex flex-col h-full">
                        {/* Header Card */}
                        <div className={`rounded-t-2xl p-6 bg-gradient-to-r ${cat.color} shadow-lg relative overflow-hidden`}>
                            <div className="absolute top-0 left-0 p-4 opacity-10 transform -translate-y-2 -translate-x-2 scale-150">
                                {cat.icon}
                            </div>
                            <div className="relative z-10 flex items-start">
                                <div className="p-3 bg-white/20 rounded-xl me-4 backdrop-blur-sm shadow-inner">
                                    {cat.icon}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{cat.title}</h2>
                                    <p className="text-white/90 text-sm leading-relaxed">{cat.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="bg-gray-800 rounded-b-2xl shadow-xl border border-t-0 border-gray-700 p-4 flex-grow">
                            <div className="grid gap-3">
                                {cat.items.map((item, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => navigate(item.targetRoute)}
                                        className="group p-4 rounded-xl bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 hover:border-gray-500 transition-all duration-300 cursor-pointer flex items-center justify-between"
                                    >
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white mb-1 transition-colors">
                                                {item.label}
                                            </h3>
                                            <p className="text-xs text-gray-400 group-hover:text-gray-300 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                        <div className="bg-gray-900/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-10 p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
                <h3 className="text-xl font-bold text-gray-200 mb-2">لست متأكداً من تصنيف قضيتك؟</h3>
                <p className="text-gray-400 mb-6">يمكنك البدء مع المستشار العام، وسيقوم الذكاء الاصطناعي بتوجيهك إلى القسم الصحيح تلقائياً.</p>
                <button onClick={() => navigate('/civil')} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors">
                    استشر المستشار العام الآن
                </button>
            </div>
        </div>
    );
};

export default CaseTypesPage;
