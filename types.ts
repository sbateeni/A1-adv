
// FIX: Define shared types for the application.
export type Role = 'user' | 'model';

export interface GroundingMetadata {
  groundingChunks: {
    web?: {
      uri: string;
      title: string;
    };
  }[];
  groundingSupports?: {
    segment: {
      startIndex: number;
      endIndex: number;
    };
    groundingChunkIndices: number[];
    confidenceScores: number[];
  }[];
  webSearchQueries?: string[];
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  images?: { dataUrl: string; mimeType: string }[];
  model?: string; // Add model property to store which model generated the response
  // FIX: Add isError property to handle chat error messages.
  isError?: boolean;
  // Add grounding metadata for search sources
  groundingMetadata?: GroundingMetadata;
}

export type CaseStatus = 'جديدة' | 'قيد النظر' | 'مؤجلة' | 'مغلقة' | 'استئناف' | 'أخرى';
export type CaseType = 'chat' | 'inheritance' | 'sharia';

export interface Case {
  id: string;
  title: string;
  summary: string;
  chatHistory: ChatMessage[];
  createdAt: number;
  status: CaseStatus;
  pinnedMessages?: ChatMessage[];
  caseType?: CaseType; // Distinguish between standard chat cases and inheritance files
  inheritanceData?: {
      inputs: InheritanceInput;
      results: InheritanceResult;
  };
}

export type ApiSource = 'gemini' | 'openrouter';

// Define the legal jurisdiction regions
export type LegalRegion = 'westbank' | 'gaza';

export interface OpenRouterModel {
  id: string;
  name: string;
  supportsImages: boolean;
}

// Define the allowed Legal Action Modes
// Added Sharia modes: sharia_advisor, reconciliation, custody, alimony
export type ActionMode = 
    | 'analysis' | 'loopholes' | 'drafting' | 'strategy' | 'research' | 'interrogator' | 'verifier'
    | 'sharia_advisor' | 'reconciliation' | 'custody' | 'alimony';

// --- OCR & Analysis Types ---

export type AnalysisType = 'ai' | 'ocr';
export type AnalysisProvider = 'gemini' | 'openrouter';
export type AnalysisProcessState = 'idle' | 'running' | 'paused' | 'done';

export interface SelectedImage {
    id: string;
    file: File;
    dataUrl: string;
}

export interface AnalysisResult {
    isLoading: boolean;
    status: string | null;
    result: string | null;
    error: string | null;
    tags?: string[];
}

// --- Voice Dictation Types ---
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

// --- Inheritance Types ---
export type Religion = 'muslim' | 'christian';

export interface InheritanceContext {
    notes: string; // Critical notes (debts, disputes)
    disputes: string; // Specific disputed assets
    conclusion: string; // Final summary
}

export interface InheritanceInput {
    religion: Religion;
    estateValue: number;
    currency: string;
    
    // Heirs Counts
    husband: number; 
    wife: number; 
    son: number;
    daughter: number;
    father: number; 
    mother: number; 
    brotherFull: number; 
    sisterFull: number;

    // Heir Names (Optional strings extracted from text)
    husbandName?: string;
    wifeName?: string;
    sonNames?: string;
    daughterNames?: string;
    fatherName?: string;
    motherName?: string;

    // Contextual Analysis
    context?: InheritanceContext;
}

export interface HeirResult {
    type: string; // 'الزوجة', 'الابن', etc.
    name?: string; // Extracted name (e.g., "Ahmed")
    count: number; // Should be 1 for unrolled rows
    shareFraction: string; // "1/8"
    sharePercentage: number; // 12.5
    amount: number; // Cash value
    notes?: string; // "لوجود الفرع الوارث"
}

export interface InheritanceResult {
    totalValue: number;
    heirs: HeirResult[];
    remainder?: number; // If any (Radd)
    isAwl?: boolean; // If shares > 1
    context?: InheritanceContext; // Passed through from input
}
