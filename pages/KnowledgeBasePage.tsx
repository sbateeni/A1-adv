
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllKnowledgeChunks, deleteKnowledgeChunk } from '../services/backendApi';

interface LawChunk {
    id?: string;
    content: string;
    metadata: {
        source_url: string;
        law_name: string;
        date_fetched: string;
        content_type?: 'full' | 'snippet';
    };
}

export const KnowledgeBasePage: React.FC = () => {
    const navigate = useNavigate();
    const [chunks, setChunks] = useState<LawChunk[]>([]);
    const [filteredChunks, setFilteredChunks] = useState<LawChunk[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChunk, setSelectedChunk] = useState<LawChunk | null>(null);

    useEffect(() => {
        loadChunks();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredChunks(chunks);
        } else {
            const filtered = chunks.filter(chunk =>
                chunk.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chunk.metadata.law_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredChunks(filtered);
        }
    }, [searchQuery, chunks]);

    const loadChunks = async () => {
        setIsLoading(true);
        const allChunks = await getAllKnowledgeChunks();
        setChunks(allChunks);
        setFilteredChunks(allChunks);
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
            const success = await deleteKnowledgeChunk(id);
            if (success) {
                await loadChunks();
                setSelectedChunk(null);
            }
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">📚 قاعدة المعرفة</h1>
                        <p className="text-gray-300">
                            {isLoading ? 'جاري التحميل...' : `${chunks.length} محتوى مخزن`}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        ← العودة للرئيسية
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 ابحث في قاعدة المعرفة..."
                        className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List */}
                    <div className="lg:col-span-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-h-[70vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">المحتويات ({filteredChunks.length})</h2>
                        {isLoading ? (
                            <p className="text-gray-400">جاري التحميل...</p>
                        ) : filteredChunks.length === 0 ? (
                            <p className="text-gray-400">لا توجد محتويات</p>
                        ) : (
                            <div className="space-y-3">
                                {filteredChunks.map((chunk) => (
                                    <div
                                        key={chunk.id}
                                        onClick={() => setSelectedChunk(chunk)}
                                        className={`p-4 rounded-lg cursor-pointer transition-all ${selectedChunk?.id === chunk.id
                                                ? 'bg-purple-600'
                                                : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm mb-1 truncate">
                                            {chunk.metadata.law_name}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {formatDate(chunk.metadata.date_fetched)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {chunk.metadata.content_type === 'full' ? '📄 محتوى كامل' : '📝 مقتطف'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail View */}
                    <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        {selectedChunk ? (
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold mb-2">{selectedChunk.metadata.law_name}</h2>
                                        <div className="flex gap-4 text-sm text-gray-400">
                                            <span>📅 {formatDate(selectedChunk.metadata.date_fetched)}</span>
                                            <span>🔗 <a href={selectedChunk.metadata.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">{new URL(selectedChunk.metadata.source_url).hostname}</a></span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(selectedChunk.id!)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                    >
                                        🗑️ حذف
                                    </button>
                                </div>
                                <div className="bg-black/20 rounded-lg p-6 max-h-[60vh] overflow-y-auto">
                                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {selectedChunk.content}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <div className="text-6xl mb-4">📚</div>
                                    <p>اختر محتوى لعرضه</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
