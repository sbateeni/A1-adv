
import React from 'react';
import { CaseStatus } from '../../types';
import { STATUS_OPTIONS } from '../../constants';

interface CasesFilterBarProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    sortBy: string;
    setSortBy: (val: any) => void;
    statusFilter: CaseStatus | 'all';
    setStatusFilter: (val: any) => void;
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    clearFilters: () => void;
}

const CasesFilterBar: React.FC<CasesFilterBarProps> = ({
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    sortBy, setSortBy,
    statusFilter, setStatusFilter,
    startDate, setStartDate,
    endDate, setEndDate,
    clearFilters
}) => {
    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-b border-gray-700 pb-4 gap-4">
                <h1 className="text-3xl font-bold text-gray-100">القضايا المحفوظة</h1>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-auto flex-grow">
                        <input 
                            type="text" 
                            placeholder="ابحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-56 p-2 ps-10 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div className="flex items-center bg-gray-700 rounded-lg p-1 flex-shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-1 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-1 rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="sort-by" className="text-sm font-medium text-gray-300">ترتيب حسب:</label>
                    <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-gray-700 border border-gray-600 rounded-md p-1.5 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500">
                        <option value="date-desc">التاريخ (الأحدث أولاً)</option>
                        <option value="date-asc">التاريخ (الأقدم أولاً)</option>
                        <option value="title-asc">العنوان (أ-ي)</option>
                        <option value="title-desc">العنوان (ي-أ)</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-300">الحالة:</label>
                    <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-gray-700 border border-gray-600 rounded-md p-1.5 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500">
                        <option value="all">الكل</option>
                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-300">التاريخ:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
                    <span className="text-gray-400">-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <button onClick={clearFilters} className="text-sm text-blue-400 hover:underline ms-auto">مسح الفلاتر</button>
            </div>
        </>
    );
};

export default CasesFilterBar;
