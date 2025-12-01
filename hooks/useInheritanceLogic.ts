
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams } from 'react-router-dom';
import { Case, InheritanceInput, InheritanceResult, HeirResult, ApiSource } from '../types';
import * as dbService from '../services/dbService';
import { extractInheritanceFromCase } from '../pages/geminiService';
import { extractInheritanceFromCaseWithOpenRouter } from '../services/openRouterService';
import { calculateInheritance } from '../services/inheritanceEngine';

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

    // --- Islamic Math Engine (Powered by inheritanceEngine.ts) ---
    const calculateIslamic = (inp: InheritanceInput): InheritanceResult => {
        // 1. Map Input to Engine Input
        const engineInput = {
            husband: inp.husband,
            wife: inp.wife,
            son: inp.son,
            daughter: inp.daughter,
            father: inp.father,
            mother: inp.mother,
            fullBrother: inp.brotherFull,
            fullSister: inp.sisterFull,
            // Add others if/when supported in UI
        };

        // 2. Run Calculation
        const engineResult = calculateInheritance(engineInput, inp.estateValue);

        // 3. Map Engine Results to UI Results (Expanding names)
        const uiHeirs: HeirResult[] = [];

        engineResult.results.forEach(res => {
            // Determine names string based on heir type
            let namesStr = '';
            if (res.heir === 'الزوج') namesStr = inp.husbandName;
            else if (res.heir === 'الزوجة') namesStr = inp.wifeName;
            else if (res.heir === 'الابن') namesStr = inp.sonNames;
            else if (res.heir === 'البنت') namesStr = inp.daughterNames;
            else if (res.heir === 'الأب') namesStr = inp.fatherName;
            else if (res.heir === 'الأم') namesStr = inp.motherName;
            // For brothers/sisters, we might need to add name fields to UI later, 
            // for now they are generic or we can add them if they exist in input types

            if (res.count > 1) {
                // Expand
                const individuals = distributeHeirs(res.count, res.heir, namesStr);
                const amountPerPerson = res.amount / res.count;
                const percentPerPerson = res.sharePercentage / res.count;

                individuals.forEach(ind => {
                    uiHeirs.push({
                        type: res.heir,
                        name: ind.name,
                        count: 1,
                        shareFraction: res.shareFraction, // Keep the fraction description
                        sharePercentage: percentPerPerson,
                        amount: amountPerPerson
                    });
                });
            } else {
                // Single
                uiHeirs.push({
                    type: res.heir,
                    name: namesStr || res.heir,
                    count: 1,
                    shareFraction: res.shareFraction,
                    sharePercentage: res.sharePercentage,
                    amount: res.amount
                });
            }
        });

        // 4. Construct Context/Notes
        let notes = inp.context.notes || "";
        engineResult.results.forEach(r => {
            if (r.notes) {
                notes += `\n- ${r.heir}: ${r.notes}`;
            }
        });

        if (engineResult.isAwl) notes += "\n⚠️ تنبيه: المسألة عالت (زادت السهام عن الفريضة)، فدخل النقص على الجميع بنسبة حصصهم.";
        if (engineResult.isRadd) notes += "\nℹ️ تنبيه: المسألة فيها رد (زادت الفريضة عن السهام)، فرد الباقي على ذوي الفروض.";

        return {
            totalValue: inp.estateValue,
            heirs: uiHeirs,
            isAwl: engineResult.isAwl,
            context: {
                ...inp.context,
                notes: notes
            }
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
                const percent = (amountPerParent / estate) * 100;
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
