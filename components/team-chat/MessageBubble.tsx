
import React, { memo, useRef, useMemo, useState, useEffect } from 'react';
import { User, ChatMessage } from '../../types';
import { Bot, CheckSquare, User as UserIcon, FileText, ExternalLink, ImageOff, Globe, Loader2, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
    msg: ChatMessage;
    isMe: boolean;
    showAvatar: boolean;
    onImageLoad: () => void;
}

// --- SUB-COMPONENT: Universal Link Preview Card ---
const LinkPreviewCard: React.FC<{ url: string; onLoaded?: () => void }> = ({ url, onLoaded }) => {
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        // Using Microlink free API for demo purposes (CORS friendly)
        fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
            .then(res => res.json())
            .then(data => {
                if (isMounted) {
                    if (data.status === 'success') {
                        setMeta(data.data);
                        if (onLoaded) onLoaded();
                    } else {
                        setError(true);
                    }
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            });

        return () => { isMounted = false; };
    }, [url]);

    if (error) return null; // Fallback to text link if failed

    if (loading) {
        return (
            <div className="mt-2 w-full max-w-sm bg-gray-50 rounded-xl border border-gray-200 p-3 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    const { title, description, image, logo, publisher } = meta;
    const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo');

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 block w-full max-w-sm bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group/card no-underline text-left"
            onClick={(e) => e.stopPropagation()}
        >
            {image?.url && (
                <div className="h-32 w-full bg-gray-100 relative overflow-hidden">
                    <img src={image.url} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
                    {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/card:bg-black/10 transition-colors">
                            <PlayCircle className="w-10 h-10 text-white opacity-80" />
                        </div>
                    )}
                </div>
            )}
            <div className="p-3">
                <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1 group-hover/card:text-indigo-600 transition-colors">
                    {title || url}
                </h4>
                {description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{description}</p>}
                
                <div className="flex items-center gap-2 mt-2">
                    {logo?.url ? <img src={logo.url} className="w-4 h-4 rounded-full" /> : <Globe className="w-3 h-3 text-gray-400" />}
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{publisher || 'WEBSITE'}</span>
                </div>
            </div>
        </a>
    );
};

const MessageBubble: React.FC<MessageBubbleProps> = memo(({ msg, isMe, showAvatar, onImageLoad }) => {
    
    // Helper to check if string is an image URL (Standard Ext)
    const isImageUrl = useRef((url: string) => {
        return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || url.includes('googleusercontent.com');
    }).current;

    // --- 1. SMART DRIVE DETECTION ---
    const drivePreviewData = useMemo(() => {
        const driveRegex = /(?:https?:\/\/)?(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([-a-zA-Z0-9]+)/;
        const match = msg.content.match(driveRegex);
        
        if (match && match[1]) {
            return {
                id: match[1],
                url: `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
            };
        }
        return null;
    }, [msg.content]);

    // --- 2. GENERAL URL DETECTION ---
    // Detect first valid URL that is NOT an image and NOT a Drive link (since those are handled specifically)
    const genericUrl = useMemo(() => {
        if (drivePreviewData || isImageUrl(msg.content)) return null;
        
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = msg.content.match(urlRegex);
        return match ? match[0] : null;
    }, [msg.content, drivePreviewData]);

    const isStandardImage = msg.messageType === 'IMAGE' || isImageUrl(msg.content);
    const isFile = msg.messageType === 'FILE';
    const isDriveImage = !!drivePreviewData;

    // Helper: Convert text URL to clickable link
    const renderTextWithLinks = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                const href = part.startsWith('http') ? part : `https://${part}`;
                return (
                    <a
                        key={i}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline break-all transition-opacity hover:opacity-80 font-bold ${isMe ? 'text-indigo-100' : 'text-indigo-600'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // --- Bot Message Layout ---
    if (msg.isBot) {
        return (
            <div className="flex gap-3 mb-4 animate-in slide-in-from-left-2 duration-300">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col items-start max-w-[85%]">
                    <span className="text-[10px] text-gray-400 font-bold mb-1 ml-1">Juijui Bot (AI)</span>
                    <div className={`px-4 py-3 rounded-2xl rounded-tl-none text-sm shadow-sm ${msg.messageType === 'TASK_CREATED' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-white text-gray-700 border border-gray-100'}`}>
                        {msg.messageType === 'TASK_CREATED' && <CheckSquare className="w-4 h-4 inline-block mr-2 -mt-1" />}
                        {renderTextWithLinks(msg.content)}
                    </div>
                    <span className="text-[10px] text-gray-300 mt-1 ml-1">
                        {format(msg.createdAt, 'HH:mm')}
                    </span>
                </div>
            </div>
        );
    }

    // --- User Message Layout ---
    return (
        <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} ${showAvatar ? 'mt-4' : 'mt-1'} group`}>
            {/* Avatar Column */}
            <div className={`w-8 h-8 shrink-0 flex flex-col items-center ${!showAvatar ? 'invisible' : ''}`}>
                {msg.user ? (
                    <img src={msg.user.avatarUrl} className="w-8 h-8 rounded-full bg-gray-200 object-cover border border-gray-100" loading="lazy" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>
            
            {/* Bubble Column */}
            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] md:max-w-[65%]`}>
                {showAvatar && !isMe && (
                    <span className="text-[10px] text-gray-400 mb-1 ml-1 truncate max-w-[150px]">
                        {msg.user?.name || 'Unknown'} • {msg.user?.position}
                    </span>
                )}
                
                <div className={`
                    text-sm shadow-sm break-words relative overflow-hidden
                    ${isMe 
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none'
                    }
                    ${(isStandardImage || isFile) ? 'p-1' : 'px-4 py-2.5'}
                `}>
                    {isStandardImage ? (
                        <img 
                            src={msg.content} 
                            alt="Attachment" 
                            className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity min-w-[150px] min-h-[150px] bg-gray-100 object-cover" 
                            loading="lazy"
                            onClick={() => window.open(msg.content, '_blank')}
                            onLoad={onImageLoad} 
                        />
                    ) : isFile ? (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100" onClick={() => window.open(msg.content, '_blank')}>
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FileText className="w-5 h-5"/></div>
                            <div className="text-gray-700 underline truncate max-w-[200px]">Attachment</div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {/* 1. Text Content */}
                            <span>{renderTextWithLinks(msg.content)}</span>
                            
                            {/* 2. Smart Drive Preview */}
                            {isDriveImage && drivePreviewData && (
                                <div className="mt-2 rounded-xl overflow-hidden relative group/drive cursor-pointer border border-white/20" onClick={() => window.open(msg.content, '_blank')}>
                                    <img 
                                        src={drivePreviewData.url}
                                        alt="Drive Preview"
                                        className="w-full h-auto max-h-[300px] object-cover bg-gray-100 min-h-[150px]"
                                        referrerPolicy="no-referrer"
                                        loading="lazy"
                                        onLoad={onImageLoad}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.classList.add('hidden');
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/drive:bg-black/10 transition-colors flex items-center justify-center">
                                        <div className="bg-white/90 text-gray-800 text-[10px] font-bold px-2 py-1 rounded-full opacity-0 group-hover/drive:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                                            <ExternalLink className="w-3 h-3"/> View in Drive
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Universal Link Preview (YouTube, Facebook, etc.) */}
                            {genericUrl && (
                                <LinkPreviewCard url={genericUrl} onLoaded={onImageLoad} />
                            )}
                        </div>
                    )}
                </div>
                <span className={`text-[9px] text-gray-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {format(msg.createdAt, 'HH:mm')}
                </span>
            </div>
        </div>
    );
});

export default MessageBubble;
