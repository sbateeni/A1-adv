
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams } from 'react-router-dom';
import { Case, InheritanceInput, InheritanceResult, HeirResult, ApiSource } from '../types';
import * as dbService from '../services/dbService';
import { extractInheritanceFromCase } from '../pages/geminiService';
import { extractInheritanceFromCaseWithOpenRouter } from '../services/openRouterService';

const DEFAULT_INPUT: InheritanceInput = {
    religion: 'muslim',
    estateValue: 0,
    currency: 'JOD',
    husband: 0,
    wife: 0,
    son: 0,
    daughter: 0,
    father: 0,
    mother: 0,
    brotherFull: 0,
    sisterFull: 0,
    husbandName: '',
    wifeName: '',
    sonNames: '',
    daughterNames: '',
    fatherName: '',
    motherName: '',
    context: {
        notes: '',
        disputes: '',
        conclusion: ''
    }
};

export const useInheritanceLogic = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [inputs, setInputs] = useState<InheritanceInput>(DEFAULT_INPUT);
    const [results, setResults] = useState<InheritanceResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        dbService.getAllCases().then(setCases);
    }, []);

    // Auto-select case if URL param exists
    useEffect(() => {
        const urlCaseId = searchParams.get('caseId');
        if (urlCaseId) {
            setSelectedCaseId(urlCaseId);
        }
    }, [searchParams]);

    // Auto-load saved inheritance data when a case is selected
    useEffect(() => {
        if (!selectedCaseId) return;

        const selectedCase = cases.find(c => c.id === selectedCaseId);
        if (selectedCase && selectedCase.inheritanceData) {
            setInputs(selectedCase.inheritanceData.inputs);
            setResults(selectedCase.inheritanceData.results);
        }
    }, [selectedCaseId, cases]);

    const handleInputChange = (field: keyof InheritanceInput, value: any) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    const handleExtractFromCase = async () => {
        if (!selectedCaseId) return;
        
        const caseData = cases.find(c => c.id === selectedCaseId);
        if (!caseData) return;

        setIsExtracting(true);
        setError(null);

        try {
            // Construct full text from summary + history
            const fullText = `${caseData.summary}\n${caseData.chatHistory.map(m => m.content).join('\n')}`;
            
            const apiSource = await dbService.getSetting<ApiSource>('apiSource') || 'gemini';
            let extractedData: Partial<InheritanceInput>;

            if (apiSource === 'gemini') {
                extractedData = await extractInheritanceFromCase(fullText);
            } else {
                const apiKey = await dbService.getSetting<string>('openRouterApiKey');
                const model = await dbService.getSetting<string>('openRouterModel');
                if (!apiKey) throw new Error("مفتاح OpenRouter غير موجود");
                extractedData = await extractInheritanceFromCaseWithOpenRouter(apiKey, model || 'google/gemini-flash-1.5', fullText);
            }

            setInputs(prev => ({
                ...prev,
                ...extractedData,
                // Ensure defaults if missing
                estateValue: extractedData.estateValue || prev.estateValue,
                currency: extractedData.currency || prev.currency,
                // Keep context if extracted, else use default
                context: extractedData.context || prev.context
            }));
        } catch (err) {
            console.error(err);
            setError("فشل في استخلاص البيانات تلقائياً. يرجى الإدخال اليدوي.");
        } finally {
            setIsExtracting(false);
        }
    };

    // Helper to distribute names like "Ahmed, Ali" into an array ["Ahmed", "Ali"]
    const distributeHeirs = (count: number, typeLabel: string, namesStr?: string): { name: string }[] => {
        if (count <= 0) return [];
        
        const extractedNames = namesStr 
            ? namesStr.split(/,|،| و /).map(n => n.trim()).filter(n => n) 
            : [];

        return Array.from({ length: count }).map((_, index) => ({
            name: extractedNames[index] || `${typeLabel} ${index + 1}`
        }));
    };

    // --- Islamic Math Engine ---
    const calculateIslamic = (inp: InheritanceInput): InheritanceResult => {
        const heirs: HeirResult[] = [];
        let totalShares = 24; // Base denominator
        let usedShares = 0;
        const estate = inp.estateValue;

        // 1. Spouses
        if (inp.husband > 0) {
            const share = (inp.son > 0 || inp.daughter > 0) ? 6 : 12;
            heirs.push({
                type: 'الزوج', 
                name: inp.husbandName || 'الزوج',
                count: 1,
                shareFraction: (share === 6 ? '1/4' : '1/2'),
                sharePercentage: (share/24)*100,
                amount: 0 
            });
            usedShares += share;
        } else if (inp.wife > 0) {
            const share = (inp.son > 0 || inp.daughter > 0) ? 3 : 6;
            const individuals = distributeHeirs(inp.wife, 'الزوجة', inp.wifeName);
            // Wives share the fraction collectively
            const sharePerWife = share / inp.wife;
            
            individuals.forEach(ind => {
                heirs.push({
                    type: 'الزوجة',
                    name: ind.name,
                    count: 1,
                    shareFraction: (share === 3 ? '1/8' : '1/4') + (inp.wife > 1 ? ' (مشترك)' : ''),
                    sharePercentage: (sharePerWife/24)*100,
                    amount: 0
                });
            });
            usedShares += share;
        }

        // 2. Parents
        if (inp.father > 0) {
            if (inp.son > 0 || inp.daughter > 0) {
                heirs.push({ 
                    type: 'الأب', 
                    name: inp.fatherName || 'الأب',
                    count: 1, 
                    shareFraction: '1/6', 
                    sharePercentage: (4/24)*100, 
                    amount: 0 
                });
                usedShares += 4;
            }
        }
        if (inp.mother > 0) {
            const siblingsCount = inp.brotherFull + inp.sisterFull;
            const hasKids = inp.son > 0 || inp.daughter > 0;
            const share = (hasKids || siblingsCount > 1) ? 4 : 8;
            heirs.push({
                type: 'الأم', 
                name: inp.motherName || 'الأم',
                count: 1,
                shareFraction: (share === 4 ? '1/6' : '1/3'),
                sharePercentage: (share/24)*100,
                amount: 0
            });
            usedShares += share;
        }

        // 3. Residue (Children & Father if no kids)
        const remainingShares = Math.max(0, totalShares - usedShares);
        
        if (inp.father > 0 && inp.son === 0 && inp.daughter === 0) {
             heirs.push({ 
                 type: 'الأب (عصبة)', 
                 name: inp.fatherName || 'الأب',
                 count: 1, 
                 shareFraction: 'الباقي', 
                 sharePercentage: (remainingShares/24)*100, 
                 amount: 0 
            });
        }
        else if (inp.son > 0 || inp.daughter > 0) {
            const totalUnits = (inp.son * 2) + inp.daughter;
            const unitValue = remainingShares / totalUnits; 
            
            // Unroll Sons
            const sons = distributeHeirs(inp.son, 'الابن', inp.sonNames);
            sons.forEach(s => {
                heirs.push({ 
                    type: 'الابن', 
                    name: s.name,
                    count: 1, 
                    shareFraction: `للذكر مثل حظ الأنثيين`, 
                    sharePercentage: ((unitValue * 2) / 24) * 100, 
                    amount: 0 
                });
            });

            // Unroll Daughters
            const daughters = distributeHeirs(inp.daughter, 'البنت', inp.daughterNames);
            daughters.forEach(d => {
                 heirs.push({ 
                    type: 'البنت', 
                    name: d.name,
                    count: 1, 
                    shareFraction: `للذكر مثل حظ الأنثيين`, 
                    sharePercentage: (unitValue / 24) * 100, 
                    amount: 0 
                });
            });
        }
        else if (inp.father === 0 && inp.son === 0) {
             if (inp.brotherFull > 0 || inp.sisterFull > 0) {
                 // Kalala logic simplified: distribute remainder evenly/2:1 for siblings
                 // Assume 2:1 for full siblings
                 const totalUnits = (inp.brotherFull * 2) + inp.sisterFull;
                 const unitValue = remainingShares / totalUnits;

                 const brothers = distributeHeirs(inp.brotherFull, 'أخ شقيق');
                 brothers.forEach(b => {
                     heirs.push({
                         type: 'أخ شقيق',
                         name: b.name,
                         count: 1,
                         shareFraction: 'عصبة',
                         sharePercentage: ((unitValue * 2) / 24) * 100, 
                         amount: 0
                     });
                 });

                 const sisters = distributeHeirs(inp.sisterFull, 'أخت شقيقة');
                 sisters.forEach(s => {
                     heirs.push({
                         type: 'أخت شقيقة',
                         name: s.name,
                         count: 1,
                         shareFraction: 'عصبة',
                         sharePercentage: (unitValue / 24) * 100, 
                         amount: 0
                     });
                 });
             }
        }

        let totalCalcPercent = 0;
        heirs.forEach(h => {
            h.amount = (h.sharePercentage / 100) * estate;
            totalCalcPercent += h.sharePercentage;
        });

        return {
            totalValue: estate,
            heirs: heirs,
            isAwl: totalCalcPercent > 100,
            context: inp.context
        };
    };

    // --- Christian Math Engine (Equal Distribution for First Degree) ---
    const calculateChristian = (inp: InheritanceInput): InheritanceResult => {
         const heirs: HeirResult[] = [];
         const estate = inp.estateValue;
         let remainder = estate;

         // Spouse gets 1/4
         if (inp.husband > 0) {
             const amount = estate * 0.25;
             heirs.push({ type: 'الزوج', name: inp.husbandName || 'الزوج', count: 1, shareFraction: '1/4', sharePercentage: 25, amount });
             remainder -= amount;
         } else if (inp.wife > 0) {
             const amount = estate * 0.25;
             heirs.push({ type: 'الزوجة', name: inp.wifeName || 'الزوجة', count: 1, shareFraction: '1/4', sharePercentage: 25, amount });
             remainder -= amount;
         }

         // Children split remainder equally (Male = Female)
         const childrenCount = inp.son + inp.daughter;
         if (childrenCount > 0) {
             const amountPerChild = remainder / childrenCount;
             const percentPerChild = (amountPerChild / estate) * 100;
             
             const sons = distributeHeirs(inp.son, 'الابن', inp.sonNames);
             sons.forEach(s => {
                heirs.push({ type: 'الابن', name: s.name, count: 1, shareFraction: 'بالتساوي', sharePercentage: percentPerChild, amount: amountPerChild });
             });

             const daughters = distributeHeirs(inp.daughter, 'البنت', inp.daughterNames);
             daughters.forEach(d => {
                heirs.push({ type: 'البنت', name: d.name, count: 1, shareFraction: 'بالتساوي', sharePercentage: percentPerChild, amount: amountPerChild });
             });

         } else {
             // No children -> Parents
             const parentsCount = inp.father + inp.mother;
             if (parentsCount > 0) {
                  const amountPerParent = remainder / parentsCount;
                  const percent = (amountPerParent/estate)*100;
                  if (inp.father > 0) heirs.push({ type: 'الأب', name: inp.fatherName || 'الأب', count: 1, shareFraction: 'بالتساوي', sharePercentage: percent, amount: amountPerParent });
                  if (inp.mother > 0) heirs.push({ type: 'الأم', name: inp.motherName || 'الأم', count: 1, shareFraction: 'بالتساوي', sharePercentage: percent, amount: amountPerParent });
             }
         }

         return {
             totalValue: estate,
             heirs,
             context: inp.context
         };
    };

    const calculate = () => {
        try {
            setError(null);
            if (inputs.religion === 'muslim') {
                setResults(calculateIslamic(inputs));
            } else {
                setResults(calculateChristian(inputs));
            }
        } catch (e) {
            setError("حدث خطأ في الحساب.");
        }
    };

    const saveInheritanceCase = async (title?: string) => {
        if (!results) {
            setError("لا توجد نتائج لحفظها.");
            return;
        }
        setIsSaving(true);
        try {
            if (selectedCaseId && selectedCaseId !== '__NEW__') {
                // Update Existing Case
                const caseToUpdate = cases.find(c => c.id === selectedCaseId);
                if (caseToUpdate) {
                    const updatedCase: Case = {
                        ...caseToUpdate,
                        inheritanceData: { inputs, results },
                        // If it was a pure inheritance placeholder, switch type if needed, but usually keep as is
                    };
                    await dbService.updateCase(updatedCase);
                    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
                    alert("تم تحديث بيانات الميراث للقضية بنجاح.");
                }
            } else {
                // Create New Inheritance Case
                if (!title) throw new Error("عنوان القضية مطلوب.");
                const newCase: Case = {
                    id: uuidv4(),
                    title: title,
                    summary: `ملف ميراث: إجمالي التركة ${results.totalValue} ${inputs.currency}. عدد الورثة: ${results.heirs.length}.`,
                    chatHistory: [],
                    createdAt: Date.now(),
                    status: 'جديدة',
                    caseType: 'inheritance',
                    inheritanceData: { inputs, results }
                };
                await dbService.addCase(newCase);
                setCases(prev => [newCase, ...prev]);
                setSelectedCaseId(newCase.id);
                alert("تم حفظ ملف المواريث الجديد بنجاح.");
            }
        } catch (err) {
            console.error(err);
            setError("فشل في حفظ البيانات.");
        } finally {
            setIsSaving(false);
        }
    };

    return {
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
    };
};
