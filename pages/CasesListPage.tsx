
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCasesListLogic } from '../hooks/useCasesListLogic';
import CasesFilterBar from '../components/cases/CasesFilterBar';
import CaseGridItem from '../components/cases/CaseGridItem';
import CaseListItem from '../components/cases/CaseListItem';

const CasesListPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        cases,
        isLoading,
        searchTerm, setSearchTerm,
        viewMode, setViewMode,
        sortBy, setSortBy,
        statusFilter, setStatusFilter,
        startDate, setStartDate,
        endDate, setEndDate,
        editingCaseId,
        newTitle, setNewTitle,
        openStatusMenu, setOpenStatusMenu,
        titleInputRef,
        statusMenuRef,
        displayedCases,
        deleteCase,
        handleEditClick,
        handleSaveTitle,
        handleStatusChange,
        handleTitleKeyDown,
        clearFilters
    } = useCasesListLogic();

    const handleCaseNavigation = (id: string) => {
        const caseItem = cases.find(c => c.id === id);
        if (caseItem?.caseType === 'inheritance') {
            navigate(`/inheritance?caseId=${id}`);
        } else if (caseItem?.caseType === 'sharia') {
            navigate(`/sharia/${id}`);
        } else {
            navigate(`/case/${id}`);
        }
    };

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
            <CasesFilterBar 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                viewMode={viewMode} setViewMode={setViewMode}
                sortBy={sortBy} setSortBy={setSortBy}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
                clearFilters={clearFilters}
            />

            {displayedCases.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-400 text-lg">
                        {searchTerm || statusFilter !== 'all' || startDate || endDate 
                            ? 'لا توجد قضايا تطابق معايير البحث.' 
                            : 'لم يتم حفظ أي قضايا بعد.'}
                    </p>
                    {(!searchTerm && statusFilter === 'all' && !startDate && !endDate) && (
                        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            ابدأ قضية جديدة
                        </button>
                    )}
                </div>
            ) : (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedCases.map(caseItem => (
                            <CaseGridItem 
                                key={caseItem.id}
                                caseItem={caseItem}
                                editingCaseId={editingCaseId}
                                newTitle={newTitle}
                                setNewTitle={setNewTitle}
                                handleEditClick={handleEditClick}
                                handleSaveTitle={handleSaveTitle}
                                handleTitleKeyDown={handleTitleKeyDown}
                                titleInputRef={titleInputRef}
                                openStatusMenu={openStatusMenu}
                                setOpenStatusMenu={setOpenStatusMenu}
                                handleStatusChange={handleStatusChange}
                                deleteCase={deleteCase}
                                onNavigate={handleCaseNavigation}
                                statusMenuRef={statusMenuRef}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3 bg-gray-800 rounded-lg p-2">
                        {displayedCases.map(caseItem => (
                            <CaseListItem 
                                key={caseItem.id}
                                caseItem={caseItem}
                                handleStatusChange={handleStatusChange}
                                deleteCase={deleteCase}
                                onNavigate={handleCaseNavigation}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default CasesListPage;
