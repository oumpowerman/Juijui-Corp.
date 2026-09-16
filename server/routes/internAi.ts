import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

/**
 * Server-side endpoint: Extracts structured intern candidate information from images, text, or both
 * Uses Gemini 3.5 Flash (with fallback) with Multimodal input and structured JSON output
 */
router.post('/api/intern/ai-extract', async (req, res) => {
    const { image, text, baseYear = new Date().getFullYear() } = req.body;

    if (!image && (!text || !text.trim())) {
        return res.status(400).json({
            success: false,
            error: 'กรุณาส่งรูปภาพหรือข้อความเพื่อทำการสกัดข้อมูล'
        });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
            success: false,
            error: 'ระบบยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Settings > Secrets'
        });
    }

    try {
        const aiInstance = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build'
                }
            }
        });

        const systemInstruction = `
คุณคือผู้ช่วย AI อัจฉริยะ (HR & Intern Extraction Assistant) ที่เชี่ยวชาญการอ่านเอกสารสมัครงาน แชทแนะนำตัว และภาพถ่าย/สกรีนช็อต เรซูเม่ ใบสมัคร หรือแชท LINE ของนักศึกษาฝึกงานในประเทศไทย

หน้าที่ของคุณ:
1. วิเคราะห์รูปภาพ (OCR ภาษาไทยและภาษาอังกฤษ) และ/หรือ ข้อความแชทที่ได้รับ
2. สกัดข้อมูลผู้สมัครฝึกงานและแปลงให้อยู่ในรูปแบบ JSON Schema ที่กำหนดอย่างเคร่งครัด
3. กฎการแปลงข้อมูลเฉพาะ:
   - **fullName**: ชื่อ-นามสกุลจริง (หากมีคำนำหน้า เช่น นาย/นางสาว ให้ระบุด้วย)
   - **nickname**: ชื่อเล่น (ถ้ามี)
   - **gender**: เพศ ต้องเป็นค่าใดค่าหนึ่งในนี้เท่านั้น: "MALE", "FEMALE", "OTHER" (คำนวณจาก นาย, นางสาว, รูปถ่าย หรือข้อความ)
   - **position**: ตำแหน่งที่สมัคร ให้แปลงเป็นตัวพิมพ์ใหญ่ภาษาอังกฤษที่เป็นมาตรฐาน (เช่น VIDEO EDITOR, CREATIVE, GRAPHIC DESIGNER, PRODUCTION ASSISTANT, SOCIAL MEDIA ADMIN, CONTENT CREATOR เป็นต้น)
   - **university**: ชื่อสถาบันหรือมหาวิทยาลัย (เช่น จุฬาลงกรณ์มหาวิทยาลัย, มหาวิทยาลัยกรุงเทพ, มหาวิทยาลัยธรรมศาสตร์)
   - **faculty**: คณะวิชา หรือสาขาวิชา (เช่น นิเทศศาสตร์, วารสารศาสตร์, มัณฑนศิลป์)
   - **academicYear**: ชั้นปีการศึกษา (เช่น ปี 3, ปี 4)
   - **startDate**: วันเริ่มฝึกงาน ในรูปแบบ YYYY-MM-DD
   - **endDate**: วันสิ้นสุดการฝึกงาน ในรูปแบบ YYYY-MM-DD
     * หากระบุปีเป็น พ.ศ. (เช่น 2569) ให้แปลงเป็น ค.ศ. (เช่น 2026 โดยลบ 543)
     * หากระบุเฉพาะวันและเดือน (เช่น 1 มิ.ย. - 31 ส.ค. หรือ 23/03 - 05/06) ให้ใช้ปีฐาน ค.ศ. ${baseYear}
     * หากไม่ระบุช่วงเวลาชัดเจน ให้ใช้ปี ค.ศ. ${baseYear}
   - **phoneNumber**: เบอร์โทรศัพท์ของผู้สมัคร (เช่น 0812345678)
   - **email**: อีเมลของผู้สมัคร
   - **portfolioUrl**: ลิงก์แฟ้มสะสมผลงาน (Portfolio, Behance, Google Drive, Notion, YouTube, Canva, เว็บไซต์ส่วนตัว)
   - **status**: สถานะผู้สมัคร เริ่มต้นเป็น "APPLIED" (หรือถ้ามีผลระบุชัดเจน เช่น ผ่าน ให้ใช้ "ACCEPTED")
   - **notes**: บันทึกย่อ จุดเด่น ทักษะพิเศษ อุปกรณ์ที่มี หรือข้อสังเกตสำคัญ
   - **source**: ช่องทางที่ส่งข้อมูลมา เช่น "LINE Chat", "Resume Screenshot", "Facebook"

โครงสร้าง JSON ที่ต้องส่งกลับ (JSON Object):
{
  "candidates": [
    {
      "fullName": string,
      "nickname": string,
      "gender": "MALE" | "FEMALE" | "OTHER",
      "position": string,
      "university": string,
      "faculty": string,
      "academicYear": string,
      "startDate": string (YYYY-MM-DD),
      "endDate": string (YYYY-MM-DD),
      "phoneNumber": string,
      "email": string,
      "portfolioUrl": string,
      "status": "APPLIED" | "INTERVIEW_SCHEDULED" | "INTERVIEWED" | "ACCEPTED" | "REJECTED" | "ARCHIVED",
      "notes": string,
      "source": string
    }
  ]
}

หากในภาพหรือข้อความมีผู้สมัครเพียงคนเดียว ให้อยู่ในอาเรย์ candidates ที่มี 1 รายการ
ตอบกลับเฉพาะโค้ด JSON เท่านั้น ไม่ต้องใส่ข้อความเกริ่นนำหรือ Markdown อื่นๆ
`;

        const contents: any[] = [];

        // Add text prompt
        let promptText = 'กรุณาสกัดข้อมูลผู้สมัครฝึกงานจากข้อมูลที่แนบมานี้:\n';
        if (text && text.trim()) {
            promptText += `\n[ข้อความ/แชทที่ได้รับ]:\n${text.trim()}\n`;
        }
        contents.push(promptText);

        // Add image part if present
        if (image && typeof image === 'string') {
            const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                contents.push({
                    inlineData: {
                        mimeType: matches[1],
                        data: matches[2]
                    }
                });
            } else {
                // Raw base64 string
                contents.push({
                    inlineData: {
                        mimeType: 'image/png',
                        data: image
                    }
                });
            }
        }

        // Try gemini-3.5-flash first, fallback to gemini-3.8-flash if needed
        let responseJsonStr = '';
        try {
            const result = await aiInstance.models.generateContent({
                model: 'gemini-3.5-flash',
                contents,
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json'
                }
            });
            responseJsonStr = result.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '';
        } catch (modelErr: any) {
            console.warn('gemini-3.5-flash attempt failed, trying gemini-3.8-flash fallback:', modelErr.message);
            const fallbackResult = await aiInstance.models.generateContent({
                model: 'gemini-3.8-flash',
                contents,
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json'
                }
            });
            responseJsonStr = fallbackResult.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '';
        }

        if (!responseJsonStr) {
            throw new Error('ไม่ได้รับการตอบกลับจาก AI Model');
        }

        const parsedData = JSON.parse(responseJsonStr);
        const candidates = parsedData.candidates || (Array.isArray(parsedData) ? parsedData : [parsedData]);

        if (!candidates || candidates.length === 0) {
            return res.status(422).json({
                success: false,
                error: 'AI ไม่พบข้อมูลผู้สมัครฝึกงานที่ชัดเจนในภาพหรือข้อความนี้'
            });
        }

        const primaryCandidate = candidates[0];

        return res.json({
            success: true,
            candidate: primaryCandidate,
            candidates: candidates
        });

    } catch (err: any) {
        console.error('Error in /api/intern/ai-extract:', err);
        return res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการประมวลผล AI: ' + (err.message || 'Unknown error')
        });
    }
});

export default router;
