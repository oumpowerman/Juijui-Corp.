
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
    "หัวใจคู่ (Big Heart) 🫶",
    "ชี้ที่นาฬิกา (Check Time) ⌚"
];

export const getRandomPose = () => POSES[Math.floor(Math.random() * POSES.length)];
