import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Case, CaseStatus } from '../types';
import * as dbService from '../services/dbService';

const STATUS_OPTIONS: { value: CaseStatus; label: string; color: string }[] = [
  { value: 'جديدة', label: 'جديدة', color: 'bg-blue-500' },
  { value: 'قيد النظر', label: 'قيد النظر', color: 'bg-yellow-500' },
  { value: 'مؤجلة', label: 'مؤجلة', color: 'bg-gray-500' },
  { value: 'مغلقة', label: 'مغلقة', color: 'bg-green-500' },
  { value: 'استئناف', label: 'استئناف', color: 'bg-purple-500' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-indigo-500' },
];

const STATUS_MAP: Record<CaseStatus, { label: string; color: string }> = 
    Object.fromEntries(STATUS_OPTIONS.map(opt => [opt.value, { label: opt.label, color: opt.color }])) as any;


const CasesListPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);

  
  const navigate = useNavigate();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchCases = async () => {
        try {
            const allCases = await dbService.getAllCases();
            setCases(allCases.map(c => ({...c, status: c.status || 'جديدة'})));
        } catch (error) {
            console.error("Failed to load cases:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    if (editingCaseId && titleInputRef.current) {
        titleInputRef.current.focus();
    }
  }, [editingCaseId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setOpenStatusMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayedCases = useMemo(() => {
    let processedCases = [...cases];

    if (searchTerm) {
      processedCases = processedCases.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
        processedCases = processedCases.filter(c => c.status === statusFilter);
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    if (start || end) {
        processedCases = processedCases.filter(c => {
            const caseDate = c.createdAt;
            if (start && end) return caseDate >= start.getTime() && caseDate <= end.getTime();
            if (start) return caseDate >= start.getTime();
            if (end) return caseDate <= end.getTime();
            return true;
        });
    }

    return processedCases.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return a.createdAt - b.createdAt;
        case 'title-asc':
          return a.title.localeCompare(b.title, 'ar');
        case 'title-desc':
          return b.title.localeCompare(a.title, 'ar');
        case 'date-desc':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [cases, searchTerm, sortBy, startDate, endDate, statusFilter]);

  const deleteCase = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه القضية؟ لا يمكن التراجع عن هذا الإجراء.")) {
        await dbService.deleteCase(id);
        setCases(prevCases => prevCases.filter(c => c.id !== id));
    }
  };
  
  const handleEditClick = (caseItem: Case) => {
    setEditingCaseId(caseItem.id);
    setNewTitle(caseItem.title);
  };

  const handleSaveTitle = async (caseId: string) => {
    const caseToUpdate = cases.find(c => c.id === caseId);
    if (newTitle.trim() && caseToUpdate) {
        const updatedCase = { ...caseToUpdate, title: newTitle.trim() };
        await dbService.updateCase(updatedCase);
        setCases(prevCases => 
            prevCases.map(c => c.id === caseId ? updatedCase : c)
        );
    }
    setEditingCaseId(null);
  };

  const handleStatusChange = async (caseId: string, newStatus: CaseStatus) => {
    const caseToUpdate = cases.find(c => c.id === caseId);
    if (caseToUpdate) {
      const updatedCase = { ...caseToUpdate, status: newStatus };
      await dbService.updateCase(updatedCase);
      setCases(prevCases =>
        prevCases.map(c => (c.id === caseId ? updatedCase : c))
      );
    }
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, caseId: string) => {
      if (e.key === 'Enter') {
          handleSaveTitle(caseId);
      } else if (e.key === 'Escape') {
          setEditingCaseId(null);
      }
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('date-desc');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
  };

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayedCases.map((caseItem) => (
        <div key={caseItem.id} className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between hover:shadow-blue-500/20 transition-shadow duration-300">
          <div>
            <div className="flex items-start justify-between mb-3">
                {editingCaseId === caseItem.id ? (
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(caseItem.id)}
                        onKeyDown={(e) => handleTitleKeyDown(e, caseItem.id)}
                        className="w-full bg-gray-600 text-gray-100 p-1 rounded text-xl font-semibold"
                    />
                ) : (
                    <h2 className="text-xl font-semibold text-gray-100 break-words w-full me-2">{caseItem.title}</h2>
                )}
                <button onClick={() => editingCaseId === caseItem.id ? handleSaveTitle(caseItem.id) : handleEditClick(caseItem)} className="p-1 text-gray-400 hover:text-white flex-shrink-0">
                    {editingCaseId === caseItem.id ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                    )}
                </button>
            </div>
             <div className="relative inline-block text-left mb-3">
                <button onClick={(e) => { e.stopPropagation(); setOpenStatusMenu(openStatusMenu === caseItem.id ? null : caseItem.id); }} className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center space-x-1.5 space-x-reverse ${STATUS_MAP[caseItem.status]?.color || 'bg-gray-500'} ${STATUS_MAP[caseItem.status]?.color.includes('yellow') ? 'text-gray-900' : 'text-white'}`}>
                    <span>{STATUS_MAP[caseItem.status]?.label}</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openStatusMenu === caseItem.id && (
                    <div ref={statusMenuRef} className="absolute top-full start-0 mt-2 w-36 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20">
                        {STATUS_OPTIONS.map(option => (
                            <button key={option.value} onClick={(e) => { e.stopPropagation(); handleStatusChange(caseItem.id, option.value); setOpenStatusMenu(null); }} className="block w-full text-right px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600">
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-md p-3 my-4">
                <p className="text-gray-300 text-sm break-words line-clamp-3 leading-relaxed">{caseItem.summary}</p>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              تاريخ الإنشاء: {new Date(caseItem.createdAt).toLocaleString('ar-EG')}
            </p>
          </div>
          <div className="flex justify-between items-center mt-2">
             <button
                onClick={() => navigate(`/case/${caseItem.id}`)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
                فتح
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); deleteCase(caseItem.id); }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors"
                aria-label="حذف القضية"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-3 bg-gray-800 rounded-lg p-2">
      {displayedCases.map((caseItem) => (
        <div key={caseItem.id} onClick={() => navigate(`/case/${caseItem.id}`)} className="rounded-md p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-700/60 cursor-pointer transition-colors duration-200">
            <div className="flex-grow mb-3 sm:mb-0 sm:me-4 w-full">
                <h2 className="text-lg font-semibold text-gray-100 line-clamp-1">{caseItem.title}</h2>
                <p className="text-sm text-gray-400 mt-1 line-clamp-1">{caseItem.summary}</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse w-full sm:w-auto justify-between sm:justify-end">
                <select
                    value={caseItem.status}
                    onChange={(e) => handleStatusChange(caseItem.id, e.target.value as CaseStatus)}
                    onClick={(e) => e.stopPropagation()}
                    className={`bg-gray-700 border-none rounded p-1 text-xs focus:ring-2 focus:ring-blue-500 ${STATUS_MAP[caseItem.status]?.color.includes('yellow') ? 'text-gray-900' : 'text-white'}`}
                    style={{ backgroundColor: STATUS_MAP[caseItem.status]?.color.startsWith('bg-') ? '' : STATUS_MAP[caseItem.status]?.color }}
                >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>

                 <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(caseItem.createdAt).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
                <button
                    onClick={(e) => { e.stopPropagation(); deleteCase(caseItem.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-900/50 rounded-full transition-colors"
                    aria-label="حذف القضية"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
        <div className="w-full flex-grow flex items-center justify-center p-8 text-lg">
            <svg className="animate-spin h-6 w-6 text-white me-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>جاري تحميل القضايا...</span>
        </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 border-b border-gray-700 pb-4 gap-4">
        <h1 className="text-3xl font-bold text-gray-100">القضايا المحفوظة</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-auto">
            <input 
              type="text" 
              placeholder="ابحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-56 p-2 ps-10 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <svg className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <div className="flex items-center bg-gray-700 rounded-lg p-1">
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
             <label className="text-sm font-medium text-gray-300">تاريخ الإنشاء:</label>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
             <span className="text-gray-400">-</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md p-1 text-sm text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <button onClick={clearFilters} className="text-sm text-blue-400 hover:underline ms-auto">مسح الفلاتر</button>
      </div>
      
      {cases.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">لم يتم حفظ أي قضايا بعد.</p>
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            ابدأ قضية جديدة
          </button>
        </div>
      ) : displayedCases.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">لا توجد قضايا تطابق معايير البحث أو التصفية.</p>
        </div>
      ) : (
        viewMode === 'grid' ? <GridView /> : <ListView />
      )}
    </div>
  );
};

export default CasesListPage;