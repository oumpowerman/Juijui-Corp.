
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Script } from '../../types';
import { MessageCircle, FileText, Loader2, Share2, Info, Moon, Sun } from 'lucide-react';

interface PublicScriptViewerProps {
    token: string;
}

const PublicScriptViewer: React.FC<PublicScriptViewerProps> = ({ token }) => {
    const [script, setScript] = useState<Script | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState(16);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const fetchScript = async () => {
            try {
                // Fetch using the public token
                const { data, error } = await supabase
                    .from('scripts')
                    .select('*')
                    .eq('share_token', token)
                    .eq('is_public', true)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Script not found');

                // Map basic fields (Author info might be missing if join not allowed for anon)
                const mappedScript: Script = {
                    id: data.id,
                    title: data.title,
                    content: data.content,
                    status: data.status,
                    version: data.version,
                    authorId: data.author_id,
                    createdAt: new Date(data.created_at),
                    updatedAt: new Date(data.updated_at),
                    estimatedDuration: data.estimated_duration,
                    scriptType: data.script_type,
                    characters: data.characters || [],
                    tags: data.tags || [],
                    isPublic: data.is_public,
                    shareToken: data.share_token,
                    // Minimal required fields
                    isInShootQueue: false
                };
                
                setScript(mappedScript);
            } catch (err: any) {
                console.error("Error fetching script:", err);
                setError('ไม่พบบทความ หรือลิงก์ถูกปิดใช้งานแล้ว');
            } finally {
                setLoading(false);
            }
        };

        fetchScript();
    }, [token]);

    // --- Chat Bubble Logic (Reused) ---
    const chatBubbles = useMemo(() => {
        if (!script?.content) return [];
        const cleanContent = script.content
            .replace(/<\/p>/gi, '\n') 
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '') 
            .replace(/&nbsp;/g, ' '); 

        const lines = cleanContent.split('\n');
        
        const bubbles: { speaker: string, text: string }[] = [];
        let currentSpeaker = '';
        let currentText = '';

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const match = trimmedLine.match(/^(.+?):\s*(.*)/);
            if (match) {
                if (currentSpeaker && currentText) {
                    bubbles.push({ speaker: currentSpeaker, text: currentText.trim() });
                }
                currentSpeaker = match[1].trim();
                currentText = match[2];
            } else {
                if (currentSpeaker) {
                    currentText += '\n' + trimmedLine;
                } else {
                    bubbles.push({ speaker: 'NARRATOR', text: trimmedLine });
                }
            }
        });
        if (currentSpeaker && currentText) {
            bubbles.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        return bubbles;
    }, [script]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-gray-400 text-sm font-medium">กำลังโหลดบท...</p>
            </div>
        );
    }

    if (error || !script) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Info className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h1>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    // Avatar Color Generation
    const getAvatarColor = (index: number) => {
        const colors = [
            'bg-gradient-to-br from-indigo-500 to-purple-600',
            'bg-gradient-to-br from-pink-500 to-orange-400',
            'bg-gradient-to-br from-emerald-500 to-teal-600',
            'bg-gradient-to-br from-blue-500 to-cyan-500',
            'bg-gradient-to-br from-amber-500 to-yellow-500'
        ];
        return colors[index % colors.length];
    };

    const bgColor = isDarkMode ? 'bg-gray-900' : 'bg-[#eef2f6]';
    const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-800';
    const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
    
    return (
        <div className={`min-h-screen flex flex-col ${bgColor} font-sans transition-colors duration-300`}>
            
            {/* Header */}
            <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-md border-b sticky top-0 z-50 flex justify-between items-center shadow-sm`}>
                <div className="flex-1 min-w-0">
                    <h1 className={`text-lg font-black truncate ${textColor}`}>{script.title}</h1>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {script.scriptType === 'DIALOGUE' ? 'บทสนทนา (Dialogue)' : 'บทพูด (Monologue)'} • {chatBubbles.length} bubbles
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsDarkMode(!isDarkMode)} 
                        className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <div className={`flex items-center rounded-lg px-2 py-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <button onClick={() => setFontSize(prev => Math.max(12, prev - 2))} className={`px-2 font-bold ${textColor}`}>A-</button>
                        <span className={`text-xs ${textColor} mx-1`}>{fontSize}</span>
                        <button onClick={() => setFontSize(prev => Math.min(32, prev + 2))} className={`px-2 font-bold ${textColor}`}>A+</button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`flex-1 p-4 max-w-2xl mx-auto w-full ${script.scriptType === 'DIALOGUE' ? '' : 'flex flex-col'}`}>
                
                {script.scriptType === 'DIALOGUE' ? (
                    <div className="space-y-6 pb-20">
                        {chatBubbles.map((bubble, idx) => {
                            const isNarrator = bubble.speaker === 'NARRATOR';
                            const charIndex = script.characters?.findIndex(c => c.trim() === bubble.speaker.trim()) ?? -1;
                            // Basic logic: Even index -> Left, Odd index -> Right (If character list exists)
                            // Or default if not found
                            const isRight = charIndex !== -1 && charIndex % 2 !== 0;

                            if (isNarrator) {
                                return (
                                    <div key={idx} className="flex justify-center my-6 opacity-80">
                                        <span className={`text-xs font-bold italic px-4 py-1.5 rounded-full border shadow-sm ${isDarkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-white/60 text-gray-500 border-gray-200'}`}>
                                            {bubble.text}
                                        </span>
                                    </div>
                                )
                            }

                            return (
                                <div key={idx} className={`flex gap-3 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(charIndex === -1 ? 0 : charIndex)} flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-white shrink-0`}>
                                        {bubble.speaker.charAt(0)}
                                    </div>

                                    <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                        <span className={`text-[10px] font-bold mb-1 px-1 uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{bubble.speaker}</span>
                                        <div 
                                            className={`px-4 py-3 shadow-sm whitespace-pre-wrap leading-relaxed ${isRight 
                                                ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' 
                                                : `${cardBg} ${textColor} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-2xl rounded-tl-none`}`}
                                            style={{ fontSize: `${fontSize}px` }}
                                        >
                                            {bubble.text}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Monologue / Standard Text
                    <div className={`p-6 rounded-3xl shadow-sm border ${cardBg} ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} pb-20`}>
                        <div 
                            className={`prose max-w-none ${isDarkMode ? 'prose-invert' : 'prose-slate'}`}
                            style={{ fontSize: `${fontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: script.content }}
                        />
                    </div>
                )}
            </div>

            {/* Footer Credit */}
            <div className={`p-4 text-center text-xs ${isDarkMode ? 'text-gray-600 bg-gray-900' : 'text-gray-400 bg-[#eef2f6]'} fixed bottom-0 w-full backdrop-blur-sm z-40`}>
                Powered by <span className="font-bold">Juijui Planner</span>
            </div>
        </div>
    );
};

export default PublicScriptViewer;
