
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Greeting } from '../types';
import { useToast } from '../context/ToastContext';

const FALLBACK_GREETINGS = [
    "ขอให้เป็นวันที่ดีนะ! 😊",
    "พร้อมลุยงานรึยัง? 🚀",
    "สู้ๆ กับงานวันนี้นะ ✌️",
    "อย่าลืมพักดื่มน้ำด้วยนะ 🥤",
    "วันนี้คุณดูดีจัง! ✨"
];

export const useGreetings = () => {
    const [greetings, setGreetings] = useState<Greeting[]>([]);
    // Initialize with a random fallback immediately to avoid layout shift
    const [randomGreeting, setRandomGreeting] = useState<string>(
        FALLBACK_GREETINGS[Math.floor(Math.random() * FALLBACK_GREETINGS.length)]
    );
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchGreetings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('random_greetings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                 // Silent fail on error, keep fallback
                 console.warn("Using fallback greetings due to:", error.message);
            }
            
            if (data && data.length > 0) {
                const mapped = data.map((g: any) => ({
                    id: g.id,
                    text: g.text,
                    category: g.category,
                    isActive: g.is_active
                }));
                setGreetings(mapped);
                
                // Pick random one from DB
                const activeOnes = mapped.filter(g => g.isActive);
                if (activeOnes.length > 0) {
                    const rand = activeOnes[Math.floor(Math.random() * activeOnes.length)];
                    setRandomGreeting(rand.text);
                }
            }
            // If data is empty, randomGreeting stays as the initial fallback
        } catch (err) {
            console.error('Fetch greetings failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    const addGreeting = async (text: string) => {
        try {
            const { error } = await supabase.from('random_greetings').insert({ text });
            if (error) throw error;
            showToast('เพิ่มคำอวยพรใหม่แล้ว ✨', 'success');
            fetchGreetings();
        } catch (err: any) {
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteGreeting = async (id: string) => {
        try {
            const { error } = await supabase.from('random_greetings').delete().eq('id', id);
            if (error) throw error;
            setGreetings(prev => prev.filter(g => g.id !== id));
            showToast('ลบคำอวยพรเรียบร้อย', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const toggleGreeting = async (id: string, currentStatus: boolean) => {
        try {
            await supabase.from('random_greetings').update({ is_active: !currentStatus }).eq('id', id);
            setGreetings(prev => prev.map(g => g.id === id ? { ...g, isActive: !currentStatus } : g));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGreetings();
    }, []);

    return {
        greetings,
        randomGreeting,
        isLoading,
        addGreeting,
        deleteGreeting,
        toggleGreeting,
        refreshGreetings: fetchGreetings
    };
};
