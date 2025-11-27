
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Case, CaseStatus } from '../types';
import * as dbService from '../services/dbService';
import { STATUS_MAP } from '../constants';

export const useCasesListLogic = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters & Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');

    // Editing State
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
    
    const titleInputRef = useRef<HTMLInputElement>(null);
    const statusMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const allCases = await dbService.getAllCases();
                // Sanitize data: Ensure valid status and title to prevent UI crashes
                const sanitizedCases = allCases.map(c => ({
                    ...c,
                    title: c.title || 'قضية بدون عنوان',
                    // Check if status exists in our map, otherwise default to 'جديدة'
                    status: (c.status && STATUS_MAP[c.status]) ? c.status : 'جديدة'
                }));
                setCases(sanitizedCases);
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

    // Close status menu when clicking outside
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
                case 'date-asc': return a.createdAt - b.createdAt;
                case 'title-asc': return a.title.localeCompare(b.title, 'ar');
                case 'title-desc': return b.title.localeCompare(a.title, 'ar');
                case 'date-desc': default: return b.createdAt - a.createdAt;
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
            setCases(prevCases => prevCases.map(c => (c.id === caseId ? updatedCase : c)));
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, caseId: string) => {
        if (e.key === 'Enter') handleSaveTitle(caseId);
        else if (e.key === 'Escape') setEditingCaseId(null);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSortBy('date-desc');
        setStartDate('');
        setEndDate('');
        setStatusFilter('all');
    };

    return {
        cases,
        isLoading,
        searchTerm, setSearchTerm,
        viewMode, setViewMode,
        sortBy, setSortBy,
        startDate, setStartDate,
        endDate, setEndDate,
        statusFilter, setStatusFilter,
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
    };
};
