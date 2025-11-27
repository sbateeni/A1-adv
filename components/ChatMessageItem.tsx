import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked to open links in a new tab for security and better UX
const renderer = new marked.Renderer();
const linkRenderer = renderer.link;
// FIX: Cast to 'any' to handle type definition changes in marked v12+ (args vs object)
renderer.link = function (this: any, ...args: any[]) {
    const html = linkRenderer.apply(this, args as any);
    // Use rel="noopener noreferrer" for security
    return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
} as any;
marked.setOptions({ renderer });

interface ChatMessageItemProps {
    content: string;
    isModel: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ content, isModel }) => {
    // User messages are rendered simply
    if (!isModel) {
        return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(content, { breaks: true }) as string) }}></div>;
    }

    // Model messages need complex parsing for thought blocks and tool codes
    const { toolCode, thought, finalContent } = useMemo(() => {
        let c = content || '';
        let tc: string | null = null;
        let th: string | null = null;

        // 1. Extract tool_code if present at the start
        // Pattern: starts with tool_code, captures until 'thought' or Arabic chars or end of string
        const toolCodeRegex = /^tool_code\s*\n([\s\S]*?)(?=\n(thought|[\u0600-\u06FF]|$))/;
        const tcMatch = c.match(toolCodeRegex);
        if (tcMatch) {
             tc = tcMatch[1].trim();
             c = c.replace(tcMatch[0], '').trim();
        }

        // 2. Extract thought if present (after tool_code removal)
        // Pattern: starts with thought, captures until it hits an Arabic character on a new line (heuristically the start of the answer)
        // or a double newline followed by non-whitespace.
        const thoughtRegex = /^thought\s*\n([\s\S]*?)(?=\n[\u0600-\u06FF]|$)/;
        const thMatch = c.match(thoughtRegex);
        if (thMatch) {
            th = thMatch[1].trim();
            c = c.replace(thMatch[0], '').trim();
        } else if (c.startsWith('thought')) {
             // Fallback for streaming where the end might not be clear yet
             // If we are strictly in 'thought' block (entire content is thought)
             th = c.replace(/^thought\s*\n/, '').trim();
             c = ''; // Hide content until real answer appears or stream finishes
        }
        
        return { toolCode: tc, thought: th, finalContent: c };
    }, [content]);

    return (
        <div className="flex flex-col gap-y-2 w-full">
            {/* Hidden Debug Info - Tool Code */}
            {toolCode && (
                <details className="group bg-black/40 rounded-md border border-gray-800 overflow-hidden">
                    <summary className="px-3 py-1.5 text-xs font-mono text-gray-600 cursor-pointer hover:bg-gray-900/50 hover:text-gray-400 transition-colors flex items-center select-none">
                        <svg className="w-3 h-3 me-2 transition-transform group-open:rotate-90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        Debug: Tool Code Execution
                    </summary>
                    <div className="p-3 bg-black/90 text-green-500 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap" dir="ltr">
                        {toolCode}
                    </div>
                </details>
            )}
            
            {/* Legal Reasoning - Thought Process */}
            {thought && (
                <details className="group bg-indigo-950/30 rounded-lg border border-indigo-500/20 overflow-hidden mb-3 shadow-sm">
                    <summary className="px-4 py-2 text-xs font-bold text-indigo-300 cursor-pointer hover:bg-indigo-900/40 transition-all flex items-center select-none border-b border-transparent group-open:border-indigo-500/20">
                        <svg className="w-4 h-4 me-2 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        <span className="flex-grow tracking-wide">عملية التفكير والتحليل القانوني (أنقر للعرض)</span>
                        <svg className="w-3 h-3 transition-transform group-open:rotate-90 text-indigo-400/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </summary>
                    {/* Render thought content with markdown parsing for better structure */}
                    <div className="p-4 text-indigo-100/90 text-sm leading-relaxed bg-indigo-900/10">
                         <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(thought) as string) }}></div>
                    </div>
                </details>
            )}

            {/* Final Answer */}
            {finalContent && (
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(finalContent, { breaks: true }) as string) }}></div>
            )}
            
            {!finalContent && !toolCode && !thought && (
                <div className="flex items-center space-x-2 space-x-reverse text-gray-400 text-sm animate-pulse">
                     <span>جاري التحليل...</span>
                </div>
            )}
        </div>
    );
};

export default ChatMessageItem;
