
import { GoogleGenAI } from "@google/genai";
import { NexusPlatform, NexusFolder } from '../../types';

export const useNexusAI = (apiKey: string | undefined, aiEnabled: boolean) => {
    const enrichMetadata = async (url: string, platform: NexusPlatform, rawTitle: string, folders: NexusFolder[]) => {
        if (!apiKey || !aiEnabled) return null;

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `คุณคือ Nexus AI อัจฉริยะ หน้าที่ของคุณคือสกัดข้อมูลจาก URL นี้: ${url}
                แพลตฟอร์ม: ${platform}
                ชื่อที่ดึงมาได้เบื้องต้น: ${rawTitle || 'ไม่ทราบ'}
                โฟลเดอร์ที่มีอยู่: ${folders.map(f => f.name).join(', ')}
                
                คำสั่งพิเศษ:
                - ทุกอย่างต้องตอบเป็น "ภาษาไทย" (Thai Language)
                - หากมีชื่อที่ดึงมาได้ (Base Title) ให้ใช้ชื่อนั้นเป็นหลัก แต่สามารถขัดเกลาให้สละสลวยขึ้นได้
                - สรุปเนื้อหา (Description) ให้กระชับ น่าสนใจ และเป็นภาษาไทย
                - คิด Hashtags ภาษาไทยที่เกี่ยวข้อง 3-5 คำ (เช่น #ความรู้, #บันเทิง, #งานออกแบบ)
                - หากเป็น Google Drive/Sheet ให้พยายามเดาเนื้อหาจากชื่อไฟล์
                - แนะนำชื่อโฟลเดอร์ที่เหมาะสมที่สุดจาก "โฟลเดอร์ที่มีอยู่" หากไม่มีที่เหมาะสมให้ตอบ null
                
                ตอบกลับในรูปแบบ JSON เท่านั้น:
                {
                  "title": "ชื่อเรื่องภาษาไทย",
                  "description": "คำอธิบายภาษาไทยสั้นๆ",
                  "thumbnailUrl": "ลิงก์รูปภาพ (ถ้ามี)",
                  "tags": ["แท็ก1", "แท็ก2", "แท็ก3"],
                  "suggestedFolderName": "ชื่อโฟลเดอร์"
                }`,
                config: { responseMimeType: "application/json" }
            });

            return JSON.parse(response.text || '{}');
        } catch (err) {
            console.warn('AI Metadata enrichment failed:', err);
            return null;
        }
    };

    return { enrichMetadata };
};
