import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

export interface AiMatchRequestItem {
    rowIndex: number;
    title: string;
    caption: string;
    date: string; // YYYY-MM-DD
    time?: string;
    platforms?: string[];
}

export interface AiMatchCandidateTask {
    id: string;
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD
    scheduledTime?: string;
    channelId?: string;
    status?: string;
}

/**
 * POST /api/metricool/ai-match
 * Uses Gemini ('gemini-3.8-flash') to semantically match imported Metricool CSV rows
 * against existing CalendarView content tasks — handling Thai vowel/tone omissions,
 * typos, shortened hooks, or slightly modified social media titles.
 */
router.post('/api/metricool/ai-match', async (req, res) => {
    const { rows, candidates } = req.body as {
        rows: AiMatchRequestItem[];
        candidates: AiMatchCandidateTask[];
    };

    if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'ไม่มีรายการจากไฟล์ CSV ที่ต้องใช้ AI ตรวจสอบ'
        });
    }

    if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.json({
            success: true,
            matches: []
        });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
            success: false,
            error: 'ระบบยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Settings > Secrets'
        });
    }

    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build'
                }
            }
        });

        const systemInstruction = `
คุณคือผู้ช่วย AI อัจฉริยะสำหรับระบบบริหารตารางคอนเทนต์ (Content Calendar & Metricool CSV Matcher)
หน้าที่ของคุณคือการจับคู่ "รายการโพสต์จากไฟล์ CSV ของ Metricool" (rows) เข้ากับ "การ์ดคอนเทนต์ที่มีอยู่ในระบบ" (candidates)

หลักเกณฑ์การพิจารณาจับคู่ (สำคัญมาก):
1. **การพิมพ์ตกหล่นสระหรือวรรณยุกต์ภาษาไทย**: หากชื่อคลิปใน CSV กับในการ์ดงานเป็นเรื่องเดียวกัน แต่พิมพ์ตกสระ (เช่น เ, แ, โ, ใ, ไ, ะ, า, ิ, ี, ึ, ื, ุ, ู, ำ, ั) หรือวรรณยุกต์ (่, ้, ๊, ๋, ์) หรือสะกดคำพ้องเสียง ให้ถือว่าเป็นคอนเทนต์ตัวเดียวกัน
2. **การตัดคำหรือปรับคำโปรย (Hook)**: บ่อยครั้งทีมผลิตตั้งชื่อการ์ดงานสั้นๆ (เช่น "EP.12 รีวิวคาเฟ่ลับอารีย์") แต่ตอนตั้งเวลาใน Metricool เขียนแคปชันยาวขึ้น (เช่น "พามาลองคาเฟ่ลับย่านอารีย์ บรรยากาศดีมาก! #รีวิวคาเฟ่") หากใจความสำคัญและวันที่ใกล้เคียงกัน ให้จับคู่เข้าด้วยกัน
3. **การเปรียบเทียบวันที่ (Date Proximity)**: รายการที่อยู่วันเดียวกัน (date ตรงกัน) หรือห่างกันไม่เกิน 1-3 วัน มีโอกาสสูงมากที่จะเป็นการ์ดเดียวกันที่เลื่อนวันโพสต์เล็กน้อย
4. **ความมั่นใจ (confidence)**: ให้คะแนน 0 ถึง 100
   - 85-100: มั่นใจสูงมากว่าเป็นคลิปเดียวกัน (แม้สระตกหล่นหรือปรับคำเล็กน้อย)
   - 65-84: น่าจะเป็นคลิปเดียวกัน (เนื้อหา/หัวข้อเดียวกันในกรอบเวลาใกล้กัน)
   - ต่ำกว่า 65: ไม่ควรจับคู่ (ให้ matchedTaskId เป็น null เพื่อสร้างการ์ดใหม่)

ส่งผลลัพธ์กลับเป็น JSON Object ตามโครงสร้างนี้เท่านั้น:
{
  "matches": [
    {
      "rowIndex": number,
      "matchedTaskId": string | null,
      "confidence": number,
      "reason": string
    }
  ]
}
ตอบเฉพาะ JSON เท่านั้น ห้ามใส่ Markdown code block หรือข้อความอื่นนอกเหนือจาก JSON
`;

        const promptPayload = {
            csvRowsToMatch: rows.map(r => ({
                rowIndex: r.rowIndex,
                title: r.title,
                captionSnippet: (r.caption || '').slice(0, 220),
                date: r.date,
                time: r.time || ''
            })),
            existingCalendarTasks: candidates.map(c => ({
                id: c.id,
                title: c.title,
                descriptionSnippet: (c.description || '').slice(0, 180),
                date: c.date,
                scheduledTime: c.scheduledTime || ''
            }))
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `กรุณาวิเคราะห์และจับคู่รายการ CSV กับการ์ดคอนเทนต์ต่อไปนี้:\n${JSON.stringify(promptPayload, null, 2)}`,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.1
            }
        });

        const rawText = response.text || '{"matches":[]}';
        const cleanedJson = rawText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        return res.json({
            success: true,
            matches: Array.isArray(parsed?.matches) ? parsed.matches : []
        });
    } catch (error: any) {
        console.error('[Metricool AI Match Error]:', error);
        return res.status(500).json({
            success: false,
            error: error?.message || 'เกิดข้อผิดพลาดในการใช้ AI จับคู่รายการคอนเทนต์'
        });
    }
});

export default router;
