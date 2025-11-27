
import React from 'react';
import { ChatMessage } from '../../types';

interface PinnedPanelProps {
    messages: ChatMessage[];
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onUnpin: (id: string) => void;
}

const PinnedPanel: React.FC<PinnedPanelProps> = ({ messages, isOpen, setIsOpen, onUnpin }) => {
    if (messages.length === 0) return null;

    return (
        <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-[61px] z-10 shadow-md">
            <div className="p-1">
                <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left text-xs font-semibold text-gray-300 hover:text-white p-2 bg-gray-700/30 hover:bg-gray-700/60 rounded transition-colors">
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" /></svg>
                        الرسائل المثبتة ({messages.length})
                    </span>
                    <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>
            {isOpen && (
                <div className="p-3 border-t border-gray-700/50 max-h-48 overflow-y-auto space-y-2 bg-gray-900/50">
                    {messages.map(msg => (
                        <div key={`pinned-${msg.id}`} className="bg-gray-800 p-2 rounded-lg text-xs text-gray-300 flex items-start group border border-gray-700 hover:border-gray-600 transition-colors">
                            <p className="prose prose-invert prose-sm max-w-none line-clamp-2 flex-grow">{msg.content}</p>
                            <button onClick={() => onUnpin(msg.id)} className="p-1 text-gray-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0 ms-2" aria-label="إلغاء تثبيت الرسالة">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PinnedPanel;
