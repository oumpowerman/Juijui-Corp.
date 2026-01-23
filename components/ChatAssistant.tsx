import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Trash2, Plus, Terminal, Sparkles, HelpCircle, Zap, Smile, Search } from 'lucide-react';
import { Task, Channel, Platform, Status, Priority } from '../types';
import { useToast } from '../context/ToastContext';

interface ChatAssistantProps {
  tasks: Task[];
  channels: Channel[];
  onAddChannel: (channel: Channel) => void;
  onDeleteChannel: (id: string) => void;
  onAddTask: (task: Task) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Future-proofing: Define a structure for command parsers
interface CommandParser {
    id: string;
    regex: RegExp;
    handler: (match: RegExpMatchArray) => string;
    description?: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  tasks, 
  channels, 
  onAddChannel, 
  onDeleteChannel,
  onAddTask
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  
  // Context state for future multi-turn conversation logic
  const [context, setContext] = useState<{ lastIntent?: string, lastEntity?: any }>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'สวัสดีครับ! ผมคือ Juijui Bot 🤖 ผู้ช่วยอัจฉริยะ\nลองสั่งงานได้เลย หรือกดปุ่ม ❓ เพื่อดูคู่มือครับ',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      text,
      sender,
      timestamp: new Date()
    }]);
  };

  // --- Scalable NLP Logic Engine ---
  const processCommand = (command: string): string => {
    
    // Define all available commands and their logic here
    const parsers: CommandParser[] = [
        {
            id: 'ADD_CHANNEL',
            regex: /(เพิ่มช่อง|add channel|สร้างช่อง)\s*(.+)?/i,
            handler: (match) => {
                const rawArgs = match[2] || '';
                // Logic to extract platform and name with fuzzy matching
                const platforms: {key: Platform, keywords: string[]}[] = [
                    { key: 'YOUTUBE', keywords: ['youtube', 'ยูทูป'] },
                    { key: 'TIKTOK', keywords: ['tiktok', 'ติ๊กตอก'] },
                    { key: 'FACEBOOK', keywords: ['facebook', 'เฟส'] },
                    { key: 'INSTAGRAM', keywords: ['instagram', 'ไอจี'] },
                ];
                
                let platform: Platform = 'OTHER';
                let name = rawArgs;

                for (const p of platforms) {
                    if (p.keywords.some(k => rawArgs.toLowerCase().includes(k))) {
                        platform = p.key;
                        // Clean up name by removing keywords
                        const pattern = new RegExp(p.keywords.join('|'), 'gi');
                        name = name.replace(pattern, '').replace(/ชื่อ|name/gi, '').trim();
                        break;
                    }
                }

                if (!name) return 'ขอชื่อช่องด้วยครับ (เช่น "เพิ่มช่อง Youtube ชื่อ MyChannel")';

                onAddChannel({
                    id: crypto.randomUUID(),
                    name: name,
                    platforms: [platform],
                    color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
                });
                return `จัดให้ครับ! เพิ่มช่อง "${name}" (${platform}) เรียบร้อย ✅`;
            }
        },
        {
            id: 'DELETE_CHANNEL',
            regex: /(ลบช่อง|delete channel|ลบ channel)\s*(.+)/i,
            handler: (match) => {
                const name = match[2].trim();
                const channel = channels.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
                if (channel) {
                    onDeleteChannel(channel.id);
                    return `ลบช่อง "${channel.name}" ออกจากระบบแล้วครับ 🗑️`;
                }
                return `หาช่องที่ชื่อคล้ายๆ "${name}" ไม่เจอเลยครับ ลองเช็คชื่ออีกทีนะ`;
            }
        },
        {
            id: 'ADD_TASK',
            regex: /(เพิ่มงาน|add task|สั่งงาน|create task|จดงาน)\s*(.+)?/i,
            handler: (match) => {
                const title = match[2]?.trim();
                if (!title) return 'รบกวนบอกชื่องานด้วยครับ (เช่น "สั่งงาน ถ่ายคลิปแมว")';
                
                onAddTask({
                    id: crypto.randomUUID(),
                    type: 'TASK',
                    title: title,
                    description: 'Created via Juijui AI Assistant',
                    startDate: new Date(),
                    endDate: new Date(),
                    status: 'TODO',
                    priority: 'MEDIUM',
                    tags: ['AI-Generated'],
                    assigneeIds: []
                } as Task);
                return `สร้างงาน "${title}" ให้แล้วครับ 📝 อย่าลืมไปใส่รายละเอียดเพิ่มเติมนะ`;
            }
        },
        {
            id: 'SEARCH_TASK',
            regex: /(ค้นหา|search|หา|find)\s*(.+)/i,
            handler: (match) => {
                const keyword = match[2].trim();
                const found = tasks.filter(t => t.title.toLowerCase().includes(keyword.toLowerCase()));
                
                if (found.length === 0) return `ไม่เจอคำว่า "${keyword}" ในรายการงานเลยครับ 😅`;
                
                const list = found.slice(0, 3).map(t => `- ${t.title} (${t.status})`).join('\n');
                return `เจอ ${found.length} งานครับ:\n${list}${found.length > 3 ? '\n...และอื่นๆ' : ''}`;
            }
        },
        {
            id: 'SUMMARY',
            regex: /(สรุป|summary|status|สถานะ|ภาพรวม|กี่งาน)/i,
            handler: () => {
                 const stats = {
                     todo: tasks.filter(t => t.status === 'TODO').length,
                     doing: tasks.filter(t => t.status === 'DOING').length,
                     done: tasks.filter(t => t.status === 'DONE').length,
                     blocked: tasks.filter(t => t.status === 'BLOCKED').length
                 };
                 return `📊 สรุปงานตอนนี้:\n- ดองไว้ (Todo): ${stats.todo}\n- ทำอยู่ (Doing): ${stats.doing}\n- ติดขัด (Blocked): ${stats.blocked}\n- เสร็จแล้ว (Done): ${stats.done}\n\nสู้ๆ นะครับทีมงาน! ✌️`;
            }
        },
        {
            id: 'HELP',
            regex: /(help|ช่วยด้วย|ทำอะไรได้|วิธีใช้|คู่มือ)/i,
            handler: () => 'ผมช่วยจัดการ Table ได้ตามนี้ครับ:\n\n1. จัดการช่อง: "เพิ่มช่อง [Platform] ชื่อ [Name]", "ลบช่อง [Name]"\n2. จัดการงาน: "เพิ่มงาน [ชื่องาน]", "ค้นหา [คำค้น]"\n3. ดูภาพรวม: "สรุปงาน"'
        },
        {
            id: 'CHIT_CHAT_JOKE',
            regex: /(ตลก|ขำ|joke|มุก)/i,
            handler: () => 'ปลาอะไรขี้เกียจ? ... ปลาวาฬ (วานให้ทำนู่นทำนี่ตลอด) 😂'
        },
        {
            id: 'CHIT_CHAT_MOTIVATE',
            regex: /(ท้อ|เหนื่อย|กำลังใจ|สู้)/i,
            handler: () => 'พักหน่อยแล้วค่อยลุยต่อนะครับ! งานดีต้องใช้พลังกายพลังใจ 🔋 ผมเป็นกำลังใจให้!'
        }
    ];

    // Execution Logic
    for (const parser of parsers) {
        const match = command.match(parser.regex);
        if (match) {
            setContext({ lastIntent: parser.id }); // Save context for future expansions
            return parser.handler(match);
        }
    }

    // Fallback
    return 'ขอโทษครับ ผมยังไม่เข้าใจคำสั่งนี้ ลองพิมพ์ "Help" หรือ "ทำอะไรได้บ้าง" ดูนะครับ 😅';
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    // User Message
    addMessage(input, 'user');
    const userCmd = input;
    setInput('');

    // Simulate Thinking Delay for realism
    setTimeout(() => {
        const response = processCommand(userCmd);
        addMessage(response, 'bot');
    }, 600);
  };

  const handleQuickAction = (cmd: string) => {
      setInput(cmd);
      // Optional: Auto submit or just fill
  };

  return (
    <>
      {/* Floating Button with explicit High Z-Index */}
      <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-[100] flex items-center gap-3">
          <div className={`hidden md:block bg-white px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold text-gray-600 transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
              AI Assistant
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
          >
            {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
          </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-40 lg:bottom-24 right-4 lg:right-6 w-[350px] md:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Juijui Assistant</h3>
                    <p className="text-[10px] text-indigo-100 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span> Online (Ready to Help)
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={() => handleQuickAction('Help')} 
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors" 
                    title="คู่มือการใช้"
                >
                    <HelpCircle className="w-5 h-5 text-white/90" />
                </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                    className={`
                        max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm
                        ${msg.sender === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'
                        }
                    `}
                >
                    {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 pb-2 bg-gray-50 flex gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => handleQuickAction('สรุปงาน')} className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap shadow-sm transition-colors">
                  <Zap className="w-3 h-3 mr-1 text-yellow-500" /> สรุปงาน
              </button>
              <button onClick={() => handleQuickAction('เพิ่มงาน ')} className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap shadow-sm transition-colors">
                  <Plus className="w-3 h-3 mr-1 text-green-500" /> เพิ่มงาน
              </button>
              <button onClick={() => handleQuickAction('ค้นหา ')} className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap shadow-sm transition-colors">
                  <Search className="w-3 h-3 mr-1 text-blue-500" /> ค้นหา
              </button>
              <button onClick={() => handleQuickAction('ขอกำลังใจ')} className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap shadow-sm transition-colors">
                  <Smile className="w-3 h-3 mr-1 text-pink-500" /> กำลังใจ
              </button>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="พิมพ์คำสั่ง..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white border focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                autoFocus
            />
            <button 
                type="submit"
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!input.trim()}
            >
                <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;