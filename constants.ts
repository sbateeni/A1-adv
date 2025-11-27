
import { CaseStatus } from './types';

export const SUGGESTED_PROMPTS = [
  // التحليل الأساسي
  "حلل الموقف القانوني لأطراف هذه القضية.",
  "ما هي المواد القانونية الفلسطينية التي تنطبق هنا؟",
  "حدد نقاط الخلاف القانونية الرئيسية في هذه القضية.",
  "ما هي المعلومات أو المستندات الإضافية التي قد تكون حاسمة لتقوية موقفي؟",
  
  // بناء الاستراتيجية
  "اقترح استراتيجية دفاع قانونية.",
  "هذه هي المعلومات التي يملكها خصمي: [اكتب هنا]. حلل نقاط ضعفها.",
  "قيم قوة الأدلة التي قدمتها. ما هي نقاط القوة والضعف فيها؟",
  "تخيل أنك محامي الخصم، ما هي الحجج الرئيسية التي ستركز عليها لمهاجمة قضيتي؟",

  // الإجراءات والتوقعات
  "ما هي الخطوات الإجرائية التالية في مسار هذه القضية وفقاً لأصول المحاكمات؟",
  "ما هي المخاطر القانونية المحتملة التي أواجهها؟ وما هي أسوأ وأفضل السيناريوهات المحتملة؟",
  "اقترح نقاطاً للتفاوض بهدف الوصول إلى تسوية ودية مع الخصم.",
  
  // محاكاة القاضي
  "تصرف الآن كقاضٍ. بالنظر إلى جميع الأدلة المقدمة، ما هو حكمك المحتمل؟",
];

export const DEFAULT_OPENROUTER_MODELS = [
  // Image-supporting models first, reordered for popularity
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (يدعم الصور)', supportsImages: true },
  { id: 'google/gemini-flash-1.5', name: 'Google: Gemini Flash 1.5 (يدعم الصور)', supportsImages: true },
  { id: 'anthropic/claude-3-haiku', name: 'Anthropic: Claude 3 Haiku (يدعم الصور)', supportsImages: true },
  { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'Meta: Llama 3.2 Vision (يدعم الصور)', supportsImages: true },
  { id: 'microsoft/phi-3-vision-128k-instruct', name: 'Microsoft: Phi-3 Vision (يدعم الصور)', supportsImages: true },
  { id: 'qwen/qwen2-vl-7b-instruct', name: 'Qwen: Qwen2 VL 7B (يدعم الصور)', supportsImages: true },
  // Text-only models
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Meta: Llama 3 8B Instruct', supportsImages: false },
  { id: 'qwen/qwen3-235b-a22b', name: 'Qwen: Qwen3 235B', supportsImages: false },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen: Qwen 2.5 72B Instruct', supportsImages: false },
  { id: 'qwen/qwen3-coder', name: 'Qwen: Qwen3 Coder', supportsImages: false },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Instruct', supportsImages: false },
  { id: 'nousresearch/nous-hermes-2-mistral-7b-dpo', name: 'Nous Hermes 2 Mistral 7B', supportsImages: false }
];

export const STATUS_OPTIONS: { value: CaseStatus; label: string; color: string }[] = [
  { value: 'جديدة', label: 'جديدة', color: 'bg-blue-500' },
  { value: 'قيد النظر', label: 'قيد النظر', color: 'bg-yellow-500' },
  { value: 'مؤجلة', label: 'مؤجلة', color: 'bg-gray-500' },
  { value: 'مغلقة', label: 'مغلقة', color: 'bg-green-500' },
  { value: 'استئناف', label: 'استئناف', color: 'bg-purple-500' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-indigo-500' },
];

export const STATUS_MAP: Record<CaseStatus, { label: string; color: string }> = 
    Object.fromEntries(STATUS_OPTIONS.map(opt => [opt.value, { label: opt.label, color: opt.color }])) as any;
