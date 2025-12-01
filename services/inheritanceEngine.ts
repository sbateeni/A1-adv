/**
 * Islamic Inheritance Engine (Sharia Calculator)
 * 
 * This engine implements the fixed rules of Islamic Inheritance (Mirath)
 * based on the agreed upon rules in the Palestinian Personal Status laws
 * (derived from Jordanian Personal Status Law and Ottoman Family Rights Law).
 * 
 * Core Features:
 * - Fard (Fixed Shares): 1/2, 1/4, 1/8, 2/3, 1/3, 1/6
 * - Ta'sib (Residuary): Male agnates (Asaba)
 * - Hajb (Blocking): Exclusion of distant heirs by closer ones
 * - 'Awl (Proportional Reduction): When shares exceed 1
 * - Radd (Re-distribution): When shares are less than 1
 */

export type HeirsInput = {
    husband?: number; // 0 or 1
    wife?: number;    // 0 to 4
    son?: number;
    daughter?: number;
    father?: number;
    mother?: number;
    paternalGrandfather?: number;
    paternalGrandmother?: number;
    maternalGrandmother?: number;
    paternalGrandson?: number;
    fullBrother?: number;
    fullSister?: number;
    paternalBrother?: number;
    paternalSister?: number;
    maternalBrother?: number;
    maternalSister?: number;
};

export type ShareResult = {
    heir: string;       // Arabic name of the heir category
    count: number;      // Number of heirs in this category
    shareFraction: string; // The fractional share (e.g., "1/8")
    sharePercentage: number; // The percentage (e.g., 12.5)
    amount: number;     // The calculated cash amount
    notes: string;      // Explanation of the rule applied
};

export type CalculationResult = {
    totalShares: number; // Sum of all shares (for 'Awl/Radd check)
    baseDenominator: number; // The LCM of denominators
    isAwl: boolean;
    isRadd: boolean;
    results: ShareResult[];
};

// Helper to simplify fractions
const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

export function calculateInheritance(heirs: HeirsInput, totalEstate: number): CalculationResult {
    let results: ShareResult[] = [];
    let remainingEstate = 1.0; // Working with 1.0 as full estate

    // ---------------------------------------------------------
    // 1. PRE-PROCESSING & VALIDATION
    // ---------------------------------------------------------
    const h = { ...heirs }; // Clone to avoid mutation

    // Normalize counts (undefined -> 0)
    for (const key in h) {
        if ((h as any)[key] === undefined) (h as any)[key] = 0;
    }

    // ---------------------------------------------------------
    // 2. BLOCKING (HAJB) LOGIC - Who blocks whom?
    // ---------------------------------------------------------
    const hasMaleDescendant = (h.son || 0) > 0 || (h.paternalGrandson || 0) > 0; // Simplified for now
    const hasFemaleDescendant = (h.daughter || 0) > 0 || (h.son || 0) > 0; // Son implies female descendant logic often triggers too
    const hasDescendant = (h.son || 0) > 0 || (h.daughter || 0) > 0;
    const hasFather = (h.father || 0) > 0;
    const hasMaleAscendant = hasFather || (h.paternalGrandfather || 0) > 0;

    // Grandparents blocked by parents
    if (hasFather) h.paternalGrandfather = 0;
    if ((h.mother || 0) > 0) h.maternalGrandmother = 0;
    if (hasFather) h.paternalGrandmother = 0; // Father blocks his own mother

    // Siblings blocked by Father or Male Descendant
    const siblingsBlocked = hasFather || (h.son || 0) > 0; // Son blocks all siblings
    if (siblingsBlocked) {
        h.fullBrother = 0;
        h.fullSister = 0;
        h.paternalBrother = 0;
        h.paternalSister = 0;
        h.maternalBrother = 0;
        h.maternalSister = 0;
    }

    // Paternal siblings blocked by Full Brothers
    if ((h.fullBrother || 0) > 0) {
        h.paternalBrother = 0;
        h.paternalSister = 0;
    }

    // Maternal siblings blocked by ANY descendant or Male Ascendant
    if (hasDescendant || hasMaleAscendant) {
        h.maternalBrother = 0;
        h.maternalSister = 0;
    }

    // ---------------------------------------------------------
    // 3. ASSIGN FIXED SHARES (ASHAB AL-FURUUD)
    // ---------------------------------------------------------

    // --- SPOUSES ---
    if ((h.husband || 0) > 0) {
        const share = hasDescendant ? 0.25 : 0.5; // 1/4 or 1/2
        results.push({
            heir: "الزوج",
            count: 1,
            shareFraction: hasDescendant ? "1/4" : "1/2",
            sharePercentage: share * 100,
            amount: 0, // Calculated later
            notes: hasDescendant ? "لوجود الفرع الوارث" : "لعدم وجود الفرع الوارث"
        });
        remainingEstate -= share;
    }

    if ((h.wife || 0) > 0) {
        const share = hasDescendant ? 0.125 : 0.25; // 1/8 or 1/4
        results.push({
            heir: "الزوجة",
            count: h.wife!,
            shareFraction: hasDescendant ? "1/8" : "1/4",
            sharePercentage: share * 100,
            amount: 0,
            notes: hasDescendant ? "لوجود الفرع الوارث" : "لعدم وجود الفرع الوارث"
        });
        remainingEstate -= share;
    }

    // --- PARENTS ---
    if ((h.father || 0) > 0) {
        // Father gets 1/6 if there is a male descendant
        // Father gets 1/6 + Residue if there is only female descendant
        // Father gets Residue (Ta'sib) if no descendant
        let share = 0;
        let note = "";
        let frac = "";

        if ((h.son || 0) > 0) {
            share = 1 / 6;
            frac = "1/6";
            note = "فرضاً لوجود الفرع الوارث المذكر";
        } else if ((h.daughter || 0) > 0) {
            share = 1 / 6; // Will get residue later
            frac = "1/6 + الباقي";
            note = "فرضاً (1/6) + تعصيباً لوجود الفرع الوارث المؤنث فقط";
        } else {
            share = 0; // Will take all residue
            frac = "عصبة";
            note = "تعصيباً لعدم وجود الفرع الوارث";
        }

        if (share > 0) {
            results.push({
                heir: "الأب",
                count: 1,
                shareFraction: frac,
                sharePercentage: share * 100,
                amount: 0,
                notes: note
            });
            remainingEstate -= share;
        }
    }

    if ((h.mother || 0) > 0) {
        // Mother gets 1/6 if descendant OR multiple siblings exist
        const multipleSiblings = ((h.fullBrother || 0) + (h.fullSister || 0) +
            (h.paternalBrother || 0) + (h.paternalSister || 0) +
            (h.maternalBrother || 0) + (h.maternalSister || 0)) > 1;

        const share = (hasDescendant || multipleSiblings) ? 1 / 6 : 1 / 3;
        results.push({
            heir: "الأم",
            count: 1,
            shareFraction: (hasDescendant || multipleSiblings) ? "1/6" : "1/3",
            sharePercentage: share * 100,
            amount: 0,
            notes: (hasDescendant || multipleSiblings) ? "لوجود الفرع الوارث أو عدد من الإخوة" : "لعدم وجود الفرع الوارث أو عدد من الإخوة"
        });
        remainingEstate -= share;
    }

    // --- DAUGHTERS (If no Son) ---
    if ((h.daughter || 0) > 0 && (h.son || 0) === 0) {
        const share = h.daughter === 1 ? 0.5 : 2 / 3;
        results.push({
            heir: "البنت",
            count: h.daughter!,
            shareFraction: h.daughter === 1 ? "1/2" : "2/3",
            sharePercentage: share * 100,
            amount: 0,
            notes: h.daughter === 1 ? "لإنفرادها وعدم وجود المعصب" : "لتعددهن وعدم وجود المعصب"
        });
        remainingEstate -= share;
    }

    // --- SISTERS (Full) ---
    // Only if not blocked and no daughters (simplified for standard cases)
    // Complex logic: Sisters with Daughters become Asaba ma'a al-ghayr. 
    // For MVP, we handle standard Fard.
    if (!siblingsBlocked && (h.fullSister || 0) > 0 && (h.fullBrother || 0) === 0 && (h.daughter || 0) === 0) {
        const share = h.fullSister === 1 ? 0.5 : 2 / 3;
        results.push({
            heir: "الأخت الشقيقة",
            count: h.fullSister!,
            shareFraction: h.fullSister === 1 ? "1/2" : "2/3",
            sharePercentage: share * 100,
            amount: 0,
            notes: h.fullSister === 1 ? "لإنفرادها" : "لتعددهن"
        });
        remainingEstate -= share;
    }

    // ---------------------------------------------------------
    // 4. RESIDUARY (TA'SIB) - The "Asaba"
    // ---------------------------------------------------------
    // Order of Asaba: Son > Father > Brother > Uncle

    let asabaShare = remainingEstate > 0 ? remainingEstate : 0;
    let asabaFound = false;

    // 1. Sons & Daughters (Asaba bil-ghayr)
    if ((h.son || 0) > 0) {
        const sonCount = h.son!;
        const daughterCount = h.daughter || 0;
        const totalParts = (sonCount * 2) + daughterCount;

        // Add Son Result
        results.push({
            heir: "الابن",
            count: sonCount,
            shareFraction: `تعصيباً (${sonCount * 2} سهم)`,
            sharePercentage: (asabaShare * (sonCount * 2) / totalParts) * 100,
            amount: 0,
            notes: "عصبة بالغير (للذكر مثل حظ الأنثيين)"
        });

        // Add Daughter Result (if they were not given Fard above)
        if (daughterCount > 0) {
            results.push({
                heir: "البنت",
                count: daughterCount,
                shareFraction: `تعصيباً (${daughterCount} سهم)`,
                sharePercentage: (asabaShare * daughterCount / totalParts) * 100,
                amount: 0,
                notes: "عصبة بالغير مع الابن"
            });
        }
        asabaFound = true;
    }
    // 2. Father (Asaba nafsi) - if residue remains and no son
    else if ((h.father || 0) > 0 && asabaShare > 0) {
        // Check if we already added Father as Fard (1/6). If so, we update him.
        const fatherEntry = results.find(r => r.heir === "الأب");
        if (fatherEntry) {
            fatherEntry.sharePercentage += asabaShare * 100;
            fatherEntry.notes += " + الباقي تعصيباً";
        } else {
            results.push({
                heir: "الأب",
                count: 1,
                shareFraction: "الباقي",
                sharePercentage: asabaShare * 100,
                amount: 0,
                notes: "تعصيباً بالنفس"
            });
        }
        asabaFound = true;
    }
    // 3. Full Brothers & Sisters
    else if (!siblingsBlocked && (h.fullBrother || 0) > 0) {
        const broCount = h.fullBrother!;
        const sisCount = h.fullSister || 0;
        const totalParts = (broCount * 2) + sisCount;

        results.push({
            heir: "الأخ الشقيق",
            count: broCount,
            shareFraction: "الباقي",
            sharePercentage: (asabaShare * (broCount * 2) / totalParts) * 100,
            amount: 0,
            notes: "عصبة بالنفس/بالغير"
        });

        if (sisCount > 0) {
            results.push({
                heir: "الأخت الشقيقة",
                count: sisCount,
                shareFraction: "الباقي",
                sharePercentage: (asabaShare * sisCount / totalParts) * 100,
                amount: 0,
                notes: "عصبة بالغير مع الأخ الشقيق"
            });
        }
        asabaFound = true;
    }

    // ---------------------------------------------------------
    // 5. 'AWL (Increase in Denominator) & RADD (Return)
    // ---------------------------------------------------------

    // Calculate total allocated percentage
    let totalAllocated = results.reduce((sum, r) => sum + r.sharePercentage, 0);
    let isAwl = false;
    let isRadd = false;

    // Tolerance for float precision
    if (totalAllocated > 100.01) {
        // 'AWL CASE: Total shares > 100%
        // We need to normalize everyone down
        isAwl = true;
        const factor = 100 / totalAllocated;
        results.forEach(r => {
            r.sharePercentage *= factor;
            r.notes += " (عول)";
        });
    } else if (totalAllocated < 99.99 && !asabaFound) {
        // RADD CASE: Total shares < 100% AND No Asaba to take residue
        // We return residue to Fard heirs (except Husband/Wife usually, but simplified here to proportional)
        // Note: In strict Sharia, Spouses do not participate in Radd unless no other heirs exist.
        // For MVP, we will implement the "Return to all Fard heirs except spouses" rule.

        isRadd = true;
        const spouseTypes = ["الزوج", "الزوجة"];
        const nonSpouseResults = results.filter(r => !spouseTypes.includes(r.heir));

        if (nonSpouseResults.length > 0) {
            const nonSpouseTotal = nonSpouseResults.reduce((sum, r) => sum + r.sharePercentage, 0);
            const residue = 100 - totalAllocated;

            nonSpouseResults.forEach(r => {
                const ratio = r.sharePercentage / nonSpouseTotal;
                r.sharePercentage += residue * ratio;
                r.notes += " (رد)";
            });
        } else {
            // Only spouses exist? They take it all in modern practice/some madhhabs or it goes to treasury.
            // We'll give it to them for simplicity in this tool.
            results.forEach(r => {
                r.sharePercentage = 100;
                r.notes += " (رداً لعدم وجود وارث آخر)";
            });
        }
    }

    // ---------------------------------------------------------
    // 6. FINALIZE AMOUNTS
    // ---------------------------------------------------------
    results.forEach(r => {
        r.amount = (r.sharePercentage / 100) * totalEstate;
        // Format fraction string nicely if possible, else keep as is
    });

    return {
        totalShares: results.reduce((s, r) => s + r.sharePercentage, 0),
        baseDenominator: 24, // Simplified, usually calculated via LCM
        isAwl,
        isRadd,
        results
    };
}
