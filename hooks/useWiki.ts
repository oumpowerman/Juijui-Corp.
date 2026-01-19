
import { useState, useEffect } from 'react';
import { WikiArticle } from '../types';
import { useToast } from '../context/ToastContext';

// Default Data for demo purposes
const DEFAULT_WIKI: WikiArticle[] = [
    {
        id: '1',
        title: 'ยินดีต้อนรับสู่ทีม Juijui! 🎉 (Onboarding 101)',
        category: 'ONBOARDING',
        targetRoles: ['ALL'],
        content: `สวัสดีน้องๆ ฝึกงานและพนักงานใหม่ทุกคน!\n\nยินดีต้อนรับสู่ครอบครัวของเรา ที่นี่เราทำงานกันแบบ "Professional แต่เป็นกันเอง" สิ่งสำคัญที่สุดคือ:\n\n1. ความรับผิดชอบ: ส่งงานตรงเวลา ถ้าไม่ทันให้รีบบอก\n2. ความคิดสร้างสรรค์: เสนอไอเดียได้เต็มที่ ไม่ต้องกลัวผิด\n3. การสื่อสาร: สงสัยให้ถาม อย่าเก็บไว้คนเดียว\n\nขอให้สนุกกับการทำงานนะ!`,
        lastUpdated: new Date(),
        isPinned: true
    },
    {
        id: '2',
        title: 'Workflow การทำงานคอนเทนต์ 🎬',
        category: 'RULES',
        targetRoles: ['ALL'],
        content: `ขั้นตอนการผลิตงานของเราเป็นแบบนี้:\n\n1. Idea & Script: เสนอไอเดียในระบบ Planner (สถานะ Idea) -> เขียนบท (Script)\n2. Pre-Prod: เตรียมของ จัดพร็อพ (ใช้เมนู Checklist)\n3. Production: ออกกองถ่ายทำ\n4. Post-Prod: ตัดต่อ (Edit Clip)\n5. Quality Gate: ส่งตรวจงานผ่านระบบ (กดปุ่ม "ส่งตรวจ")\n6. Revision: แก้ไขตาม Feedback\n7. Approve & Post: หัวหน้าอนุมัติ -> โพสต์จริง\n8. Done: เปลี่ยนสถานะเป็น Done`,
        lastUpdated: new Date(),
        isPinned: true
    },
    {
        id: '3',
        title: 'รหัส Wifi และ Server ส่วนกลาง 🔑',
        category: 'GENERAL',
        targetRoles: ['ALL'],
        content: `Wifi Guest: Juijui_Guest (Pass: 12345678)\nWifi Team: Juijui_Team (Pass: TeamJuijui2024)\n\nNAS Server: 192.168.1.100\nUser: content_team\nPass: content_1234`,
        lastUpdated: new Date(),
        isPinned: false
    },
    {
        id: '4',
        title: 'มาตรฐานการตัดต่อ (Editing Style Guide) ✂️',
        category: 'TOOLS',
        targetRoles: ['EDITOR'],
        content: `สำหรับ Editor ทุกคน:\n- Font หลัก: Kanit (Bold) สีขาว ขอบดำ\n- Sound Effect: ใช้จากโฟลเดอร์ Server/SFX_2024 เท่านั้น\n- เพลง: ต้องใช้เพลงถูกลิขสิทธิ์จาก Artlist\n- Export: H.264, Bitrate 15-20 Mbps`,
        lastUpdated: new Date(),
        isPinned: false
    },
    {
        id: '5',
        title: 'การเบิกงบอุปกรณ์ประกอบฉาก (Props) 💰',
        category: 'RULES',
        targetRoles: ['CREATIVE', 'PRODUCTION'],
        content: `1. เขียนใบเบิกส่งเข้ากลุ่ม Line 'Accounting' ล่วงหน้า 3 วัน\n2. แนบลิงก์ของที่จะซื้อ หรือรูปภาพ\n3. หลังซื้อเสร็จ ต้องถ่ายรูปใบเสร็จ/สลิปโอนเงิน เก็บลงในโฟลเดอร์งานนั้นๆ ใน Server`,
        lastUpdated: new Date(),
        isPinned: false
    }
];

export const useWiki = () => {
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const { showToast } = useToast();

    // In a real app, this would fetch from Supabase
    // For now, we simulate fetching and local storage
    useEffect(() => {
        const saved = localStorage.getItem('juijui_wiki_data');
        if (saved) {
            setArticles(JSON.parse(saved).map((a: any) => ({
                ...a,
                lastUpdated: new Date(a.lastUpdated)
            })));
        } else {
            setArticles(DEFAULT_WIKI);
        }
    }, []);

    const saveToLocal = (data: WikiArticle[]) => {
        localStorage.setItem('juijui_wiki_data', JSON.stringify(data));
        setArticles(data);
    };

    const addArticle = (article: Omit<WikiArticle, 'id' | 'lastUpdated'>) => {
        const newArticle: WikiArticle = {
            id: crypto.randomUUID(),
            ...article,
            lastUpdated: new Date()
        };
        const newData = [newArticle, ...articles];
        saveToLocal(newData);
        showToast('สร้างคู่มือใหม่เรียบร้อย', 'success');
    };

    const updateArticle = (id: string, updates: Partial<WikiArticle>) => {
        const newData = articles.map(a => 
            a.id === id ? { ...a, ...updates, lastUpdated: new Date() } : a
        );
        saveToLocal(newData);
        showToast('อัปเดตคู่มือเรียบร้อย', 'success');
    };

    const deleteArticle = (id: string) => {
        const newData = articles.filter(a => a.id !== id);
        saveToLocal(newData);
        showToast('ลบคู่มือแล้ว', 'info');
    };

    return {
        articles,
        addArticle,
        updateArticle,
        deleteArticle
    };
};
