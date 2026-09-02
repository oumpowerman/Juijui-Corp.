
// Haversine formula to calculate distance (in meters)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Promisified browser geolocation helper
 */
export const getCurrentLocation = (timeoutMs: number = 10000): Promise<{ lat: number; lng: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("อุปกรณ์ของคุณไม่รองรับการดึงพิกัด Geolocation"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy || 10
                });
            },
            (err) => {
                reject(err);
            },
            {
                enableHighAccuracy: true,
                timeout: timeoutMs,
                maximumAge: 10000
            }
        );
    });
};

// Default Office Location (Example: Bangkok Center)
// TODO: Move this to Admin Config
export const OFFICE_COORDS = {
    lat: 13.7563,
    lng: 100.5018,
    radiusMeters: 500
};

export const POSES = [
    "ชู 2 นิ้ว (Peace) ✌️",
    "มินิฮาร์ท (Mini Heart) 🫰",
    "จับแก้ม (Touch Cheek) 😊",
    "วันทยหัตถ์ (Salute) 🫡",
    "กดไลก์ (Thumbs Up) 👍",
    "โอเค (OK Sign) 👌",
    "เท้าคาง (Thinker) 🤔",
    "หน้าตลก (Funny Face) 🤪",
    "หัวใจคู่ (Big Heart) ❤️‍🔥",
    "ชี้ที่นาฬิกา (Check Time) ⌚",
    "ยกมือสูง (Raise Hand) 🙋‍♂️",
    "โบกมือ (Wave) 👋",
    "ชูสองมือ (Double Hands Up) 🙌",
    "กอดอก (Crossed Arms) 🙆‍♂️",
    "ยิ้มกว้าง (Big Smile) 😄",
    "ทำหน้าตกใจ (Surprised Face) 😲",
    "ชูนิ้วโป้งและนิ้วชี้ (Finger Gun) 👉",
    "ทำหน้าหวาน (Sweet Face) 🥰",
    "ยิ้มตาหยี (Squinting Smile) 😆",
    "ทำหน้าครุ่นคิด (Pondering Face) 🤨",
    "ชูมือเป็นรูปหัวใจ (Heart Hands) 🤟",
    "เอานิ้วชี้แตะจมูก + ยิ้ม 👃👉😁",
    "ทำหน้าหัวเราะ (Laughing Face) 😂",
    "ทำหน้าร้องไห้ (Crying Face) 😢",
    "ชี้ที่อะไรสีแดงใกล้ตัว 🔴👉",
    "ชี้ของสีแดง ที่ไม่ใช่เสื้อผ้า 🚫👕🔴",
    "ชี้ของสีแดง ด้วยมือซ้ายเท่านั้น ✋⬅️🔴",
    "ชี้ของสีเขียวใกล้ตัว 🟢👉",
    "ชี้ของสีน้ำเงินใกล้ตัว 🔵👉",
    "ชี้ของสีน้ำเงิน พร้อมยิ้มเห็นฟัน 😁",
    "ชี้ของสีเหลืองใกล้ตัว 🟡👉",
    "ชี้ของสีดำใกล้ตัว ⚫👉",
    "ชี้ของสีขาวใกล้ตัว ⚪👉",
    "ชี้ของสีชมพูใกล้ตัว 💗👉",
    "ชี้ของสีม่วงใกล้ตัว 💜👉",
    "ชี้ของสีน้ำตาลใกล้ตัว 🤎👉",
    "เอานิ้วชี้แตะจมูก + ยิ้ม 👃👉😁",
    "ทำหน้าหัวเราะ (Laughing Face) 😂",

];

export const getRandomPose = () => POSES[Math.floor(Math.random() * POSES.length)];
