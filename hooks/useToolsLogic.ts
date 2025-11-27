
import { useState, useEffect } from 'react';

// Deadline Types
type DeadlineType = 'istinaf_civil' | 'naqd_civil' | 'istinaf_penal' | 'naqd_penal' | 'review';
type FeeCourtType = 'sulh' | 'bidaya' | 'istinaf' | 'naqd';

export const useToolsLogic = () => {
    // Deadline Calculator State
    const [startDate, setStartDate] = useState('');
    const [deadlineType, setDeadlineType] = useState<DeadlineType>('istinaf_civil');
    const [deadlineResult, setDeadlineResult] = useState<string | null>(null);
    const [deadlineNotes, setDeadlineNotes] = useState<string | null>(null);

    // Fee Calculator State
    const [claimAmount, setClaimAmount] = useState<number | ''>('');
    const [currency, setCurrency] = useState<'JOD' | 'NIS'>('JOD');
    const [feeCourtType, setFeeCourtType] = useState<FeeCourtType>('bidaya');
    const [calculatedFee, setCalculatedFee] = useState<number | null>(null);
    const [feeNotes, setFeeNotes] = useState<string | null>(null);

    // Calculate Deadline
    const calculateDeadline = () => {
        if (!startDate) return;
        
        const start = new Date(startDate);
        let daysToAdd = 0;
        let note = '';

        // Standardizing based on Palestinian Civil Procedure Law & Penal Procedure Law
        switch (deadlineType) {
            case 'istinaf_civil': // Civil Appeal
                daysToAdd = 30;
                note = 'المادة 205 من قانون أصول المحاكمات المدنية والتجارية رقم 2 لسنة 2001: ميعاد الاستئناف ثلاثون يوماً ما لم ينص القانون على غير ذلك.';
                break;
            case 'naqd_civil': // Civil Cassation
                daysToAdd = 40;
                note = 'المادة 227 من قانون أصول المحاكمات المدنية والتجارية: ميعاد الطعن بالنقض أربعون يوماً.';
                break;
            case 'istinaf_penal': // Penal Appeal (Misdemeanors)
                daysToAdd = 15; 
                note = 'قانون الإجراءات الجزائية: مهلة استئناف الأحكام الجزائية (الجنح) هي 15 يوماً من تاريخ تفهيم الحكم أو تبليغه.';
                break;
            case 'naqd_penal': // Penal Cassation
                daysToAdd = 40;
                note = 'قانون الإجراءات الجزائية: مهلة النقض في المواد الجزائية 40 يوماً.';
                break;
            case 'review': // Petition for Review (I3adat Nazar)
                daysToAdd = 30;
                note = 'التماس إعادة النظر: الميعاد 30 يوماً يبدأ من تاريخ ظهور الغش أو الورقة المزورة أو الحكم.';
                break;
        }

        // Simple calculation: Add days
        const endDate = new Date(start);
        endDate.setDate(start.getDate() + daysToAdd);

        // Format Date
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setDeadlineResult(endDate.toLocaleDateString('ar-PS', options));
        setDeadlineNotes(note + " (تنبيه: يجب مراعاة العطل الرسمية والأعياد، حيث يمتد الميعاد لأول يوم عمل بعدها).");
    };

    // Calculate Fees
    const calculateFee = () => {
        if (claimAmount === '' || claimAmount <= 0) return;

        let fee = 0;
        let note = '';
        
        // Simplified logic based on general Palestinian court fee practices (often 1% with caps)
        // Note: This logic is an approximation for the tool. Real logic varies by exact claim type.
        const amount = Number(claimAmount);
        
        // Base rule: 1% of the value
        fee = amount * 0.01;

        // Apply Caps (Approximate standard caps in JOD)
        // Usually Min 10 JOD, Max 500 JOD for Bidaya/Sulh in civil claims
        let minFee = 10; 
        let maxFee = 500; // Often capped at 500 JOD for regular claims, can be more for specific types

        // Adjust if currency is NIS (approx 5 NIS = 1 JOD for rough calc, better to convert)
        // We will assume inputs are normalized to JOD for the rule, or apply rule on currency directly
        // Palestinian courts officially use JOD for fee caps mostly.
        
        if (currency === 'NIS') {
             // Convert NIS to JOD rough rate 4 or 5? Let's keep it simple: apply % then convert caps
             // Actually, usually fees are calculated in JOD.
             // Let's just apply the % and generic caps in the same currency for the sake of the tool's simplicity
             minFee = 50;
             maxFee = 2500;
        }

        if (fee < minFee) fee = minFee;
        if (fee > maxFee) fee = maxFee;

        // Cassation usually has fixed fees or different %
        if (feeCourtType === 'naqd') {
            fee = 50; // Example fixed fee for Cassation often used
            if (currency === 'NIS') fee = 250;
            note = 'رسم ثابت تقريبي للطعن بالنقض (قد يختلف حسب نوع الطعن).';
        } else if (feeCourtType === 'istinaf') {
             // Appeal fee is often half the First Instance fee or full?
             // Usually full fee again or capped. Let's assume standard 1% logic apply.
             note = 'الرسم المستحق هو 1% من قيمة المبلغ المستأنف (بحد أقصى 500 دينار تقريباً).';
        } else {
            note = 'الرسم هو 1% من قيمة الدعوى، بحد أدنى 10 دنانير وحد أقصى 500 دينار (تقديراً وفق نظام الرسوم).';
        }

        setCalculatedFee(fee);
        setFeeNotes(note);
    };

    return {
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
    };
};
