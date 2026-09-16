import { InternCandidate } from '../types';

export interface InternAiExtractResponse {
    success: boolean;
    candidate?: Partial<InternCandidate>;
    candidates?: Partial<InternCandidate>[];
    error?: string;
}

export const extractInternWithAi = async (params: {
    image?: string | null;
    text?: string | null;
    baseYear?: number;
}): Promise<InternAiExtractResponse> => {
    const response = await fetch('/api/intern/ai-extract', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: params.image || undefined,
            text: params.text || undefined,
            baseYear: params.baseYear || new Date().getFullYear()
        })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI');
    }

    return data;
};
