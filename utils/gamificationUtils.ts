/**
 * 🛠️ toValidUuid
 * หน้าที่: แปลง String ใดๆ ให้เป็น UUID format ที่คงที่ (Deterministic)
 * เพื่อใช้เป็น Idempotency Key ในฐานข้อมูลที่บังคับ Type เป็น UUID
 */
export const toValidUuid = (str: string | null): string | null => {
    if (!str) return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(str)) return str;

    // ถ้าไม่ใช่ UUID ให้สร้าง Deterministic UUID จาก String (ใช้ Hash อย่างง่าย)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    // ใช้ hex 12 หลักสุดท้ายเพื่อให้เป็นส่วนหนึ่งของ UUID
    const hex = Math.abs(hash).toString(16).padStart(12, '0');
    return `00000000-0000-0000-0000-${hex}`;
};
