import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const summarizeMeeting = async (content: string) => {
    if (!content || content.trim().length < 10) {
        throw new Error("เนื้อหาการประชุมสั้นเกินไปที่จะสรุปครับ");
    }

    const prompt = `
        คุณคือผู้ช่วยสรุปการประชุมมืออาชีพ 
        หน้าที่ของคุณคือสรุปเนื้อหาการประชุมที่ได้รับให้เป็น "มติที่ประชุม" (Key Decisions) 
        โดยสรุปเป็นข้อๆ ที่กระชับ เข้าใจง่าย และนำไปใช้งานต่อได้ทันที
        
        เนื้อหาการประชุม:
        ${content}
        
        กรุณาสรุปในรูปแบบรายการ (Bullet points) เท่านั้น และใช้ภาษาที่เป็นทางการแต่เป็นกันเอง
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });

        return response.text || "ไม่สามารถสรุปได้ในขณะนี้";
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
};
