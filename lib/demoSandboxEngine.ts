import { ALL_SIDEBAR_MODULE_KEYS } from './multiTenantMigrationSql';

export const DEMO_SANDBOX_ORG_ID = '00000000-0000-0000-0000-00000000de00';
export const DEMO_SANDBOX_COMPANY_ID = '00000000-0000-0000-0000-00000000dc01';
export const DEMO_DEFAULT_QUOTA_SECONDS = 600; // 10 minutes

export type DemoRolePerspective = 'ADMIN' | 'MEMBER';

export interface DemoTrialSessionRecord {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    auth_provider: string;
    elapsed_seconds: number;
    quota_seconds: number;
    session_count: number;
    is_blocked: boolean;
    last_active_at: string;
    created_at: string;
}

interface DemoRuntimeState {
    isActive: boolean;
    role: DemoRolePerspective;
    userId: string;
    userEmail: string;
    userName: string;
}

const runtimeState: DemoRuntimeState = {
    isActive: false,
    role: 'ADMIN',
    userId: 'demo-user-001',
    userEmail: 'demo@juijui-sandbox.com',
    userName: 'ผู้ทดลองระบบ (Sandbox)'
};

export const isDemoSandboxActive = (): boolean => runtimeState.isActive;
export const getDemoSandboxRole = (): DemoRolePerspective => runtimeState.role;
export const getDemoRuntimeUser = () => ({ ...runtimeState });

export const configureDemoSandboxRuntime = (patch: Partial<DemoRuntimeState>) => {
    Object.assign(runtimeState, patch);
    if (runtimeState.isActive) {
        syncCurrentUserIntoRamStore();
    }
};

// --- IN-MEMORY EPHEMERAL DATABASE (Resets on Browser Refresh!) ---
type RamDatabase = Record<string, any[]>;

declare global {
    interface Window {
        __JUIJUI_DEMO_RAM_DB__?: RamDatabase;
    }
}

const createInitialSeedDatabase = (): RamDatabase => {
    const now = new Date();
    const todayIso = now.toISOString();
    const todayDateStr = todayIso.slice(0, 10);
    const tomorrowIso = new Date(now.getTime() + 86400000).toISOString();
    const twoDaysIso = new Date(now.getTime() + 2 * 86400000).toISOString();
    const threeDaysIso = new Date(now.getTime() + 3 * 86400000).toISOString();
    const yesterdayIso = new Date(now.getTime() - 86400000).toISOString();

    const activeUserId = runtimeState.userId || 'demo-user-001';

    const companies = [
        {
            id: DEMO_SANDBOX_COMPANY_ID,
            org_id: DEMO_SANDBOX_ORG_ID,
            name: 'Juijui Creative Studio (บริษัทจำลอง)',
            short_name: 'JUIJUI-DEMO',
            color: 'indigo',
            description: 'สตูดิโอผลิตคอนเทนต์และเอเจนซี่โฆษณาครบวงจร (ข้อมูลสำหรับทดลองเล่น)',
            member_count: 5,
            created_at: todayIso
        }
    ];

    const organizations = [
        {
            id: DEMO_SANDBOX_ORG_ID,
            name: 'Juijui Creative Sandbox (โหมดทดลองเล่น)',
            slug: 'juijui-demo-sandbox',
            description: 'พื้นที่จำลองระบบจริง ข้อมูลทั้งหมดจะรีเซ็ตเมื่อกดรีเฟรชหน้าเว็บ',
            color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            invite_code: 'DEMO-10MIN',
            invite_enabled: true,
            owner_id: activeUserId,
            plan_tier: 'ENTERPRISE',
            subscription_status: 'ACTIVE',
            expires_at: new Date(now.getTime() + 30 * 86400000).toISOString(),
            grace_period_days: 7,
            max_members: 100,
            allowed_modules: [...ALL_SIDEBAR_MODULE_KEYS],
            owner_claim_token: 'CLAIM-DEMO01-SANDBOX',
            billing_email: runtimeState.userEmail,
            is_active: true,
            created_at: todayIso,
            updated_at: todayIso
        }
    ];

    const profiles = [
        {
            id: activeUserId,
            org_id: DEMO_SANDBOX_ORG_ID,
            current_org_id: DEMO_SANDBOX_ORG_ID,
            company_id: DEMO_SANDBOX_COMPANY_ID,
            companies: companies[0],
            email: runtimeState.userEmail,
            full_name: `${runtimeState.userName} (คุณ)`,
            first_name: runtimeState.userName,
            last_name: 'Sandbox',
            nickname: 'คุณ (Demo)',
            username: 'demo_explorer',
            role: runtimeState.role,
            position: runtimeState.role === 'ADMIN' ? 'Executive Producer / Admin' : 'Content Creator / Editor',
            avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=juijui-demo-main',
            phone_number: '081-999-8888',
            bio: 'กำลังทดลองใช้งานระบบ Juijui Content Creator ERP ในโหมด Sandbox',
            feeling: 'พร้อมลุยงานคอนเทนต์!',
            is_approved: true,
            is_active: true,
            status: 'ACTIVE',
            xp: 2850,
            level: 6,
            available_points: 450,
            hp: 95,
            max_hp: 100,
            death_count: 0,
            work_status: 'ONLINE',
            work_days: [1, 2, 3, 4, 5],
            base_salary: 45000,
            employment_type: 'FULL_TIME',
            emoji: '🚀',
            accepted_terms_version: 99,
            accepted_terms_at: todayIso,
            created_at: todayIso
        },
        {
            id: 'demo-teammate-002',
            org_id: DEMO_SANDBOX_ORG_ID,
            current_org_id: DEMO_SANDBOX_ORG_ID,
            company_id: DEMO_SANDBOX_COMPANY_ID,
            companies: companies[0],
            email: 'nene.creative@juijui-demo.local',
            full_name: 'เนเน่ (Creative Director)',
            first_name: 'เนเน่',
            last_name: 'ครีเอทีฟ',
            nickname: 'เนเน่',
            username: 'nene_cd',
            role: 'ADMIN',
            position: 'Creative',
            avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=nene',
            phone_number: '089-111-2222',
            bio: 'ดูแลภาพรวมสคริปต์และแคมเปญลูกค้า',
            feeling: 'ปั่นไอเดียไฟลุก 🔥',
            is_approved: true,
            is_active: true,
            status: 'ACTIVE',
            xp: 4200,
            level: 8,
            available_points: 820,
            hp: 100,
            max_hp: 100,
            work_status: 'ONLINE',
            work_days: [1, 2, 3, 4, 5],
            base_salary: 55000,
            employment_type: 'FULL_TIME',
            emoji: '✨',
            accepted_terms_version: 99,
            created_at: todayIso
        },
        {
            id: 'demo-teammate-003',
            org_id: DEMO_SANDBOX_ORG_ID,
            current_org_id: DEMO_SANDBOX_ORG_ID,
            company_id: DEMO_SANDBOX_COMPANY_ID,
            companies: companies[0],
            email: 'taro.editor@juijui-demo.local',
            full_name: 'ทาโร่ (Senior Video Editor)',
            first_name: 'ทาโร่',
            last_name: 'ตัดต่อไว',
            nickname: 'ทาโร่',
            username: 'taro_edit',
            role: 'MEMBER',
            position: 'Editor',
            avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=taro',
            phone_number: '089-333-4444',
            bio: 'ตัดต่อไว ใส่ซาวด์เอฟเฟกต์แน่น',
            feeling: 'เรนเดอร์งาน 4K อยู่ครับ',
            is_approved: true,
            is_active: true,
            status: 'ACTIVE',
            xp: 3100,
            level: 7,
            available_points: 510,
            hp: 88,
            max_hp: 100,
            work_status: 'BUSY',
            work_days: [1, 2, 3, 4, 5],
            base_salary: 38000,
            employment_type: 'FULL_TIME',
            emoji: '🎬',
            accepted_terms_version: 99,
            created_at: todayIso
        },
        {
            id: 'demo-teammate-004',
            org_id: DEMO_SANDBOX_ORG_ID,
            current_org_id: DEMO_SANDBOX_ORG_ID,
            company_id: DEMO_SANDBOX_COMPANY_ID,
            companies: companies[0],
            email: 'ploi.graphic@juijui-demo.local',
            full_name: 'พลอย (Motion & Graphic)',
            first_name: 'พลอย',
            last_name: 'กราฟิก',
            nickname: 'พลอย',
            username: 'ploi_design',
            role: 'MEMBER',
            position: 'Graphic',
            avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ploi',
            phone_number: '089-555-6666',
            bio: 'ออกแบบปกคลิป YouTube และ Key Visual',
            feeling: 'ทำปกคลิปเสร็จไป 3 งาน 🎨',
            is_approved: true,
            is_active: true,
            status: 'ACTIVE',
            xp: 2400,
            level: 5,
            available_points: 340,
            hp: 92,
            max_hp: 100,
            work_status: 'ONLINE',
            work_days: [1, 2, 3, 4, 5],
            base_salary: 35000,
            employment_type: 'FULL_TIME',
            emoji: '🎨',
            accepted_terms_version: 99,
            created_at: todayIso
        }
    ];

    const organization_members = profiles.map((p, idx) => ({
        id: `demo-org-member-${idx + 1}`,
        org_id: DEMO_SANDBOX_ORG_ID,
        user_id: p.id,
        role: idx === 0 ? (runtimeState.role === 'ADMIN' ? 'OWNER' : 'MEMBER') : (p.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'),
        status: 'ACTIVE',
        joined_at: todayIso,
        created_at: todayIso
    }));

    const channels = [
        {
            id: 'demo-ch-youtube',
            org_id: DEMO_SANDBOX_ORG_ID,
            name: 'Juijui Official YouTube',
            description: 'ช่องหลักสำหรับรายการวาไรตี้และรีวิวเทคโนโลยี',
            color: 'bg-rose-500 text-white',
            platforms: ['YOUTUBE'],
            logo_url: '',
            created_at: todayIso
        },
        {
            id: 'demo-ch-tiktok',
            org_id: DEMO_SANDBOX_ORG_ID,
            name: 'Juijui Shorts & TikTok',
            description: 'คลิปสั้นแนวตั้งไวรัลและเทรนด์รายวัน',
            color: 'bg-indigo-600 text-white',
            platforms: ['TIKTOK', 'REELS'],
            logo_url: '',
            created_at: todayIso
        },
        {
            id: 'demo-ch-facebook',
            org_id: DEMO_SANDBOX_ORG_ID,
            name: 'Juijui Agency Page',
            description: 'อัลบั้มภาพอินโฟกราฟิกและบทความการตลาด',
            color: 'bg-sky-600 text-white',
            platforms: ['FACEBOOK', 'INSTAGRAM'],
            logo_url: '',
            created_at: todayIso
        }
    ];

    const master_options = [
        { id: 'mo-pos-1', org_id: DEMO_SANDBOX_ORG_ID, type: 'POSITION', key: 'CREATIVE', label: 'Creative', color: 'bg-purple-100 text-purple-700', sort_order: 1, is_active: true },
        { id: 'mo-pos-2', org_id: DEMO_SANDBOX_ORG_ID, type: 'POSITION', key: 'EDITOR', label: 'Editor', color: 'bg-indigo-100 text-indigo-700', sort_order: 2, is_active: true },
        { id: 'mo-pos-3', org_id: DEMO_SANDBOX_ORG_ID, type: 'POSITION', key: 'GRAPHIC', label: 'Graphic', color: 'bg-pink-100 text-pink-700', sort_order: 3, is_active: true },
        { id: 'mo-st-1', org_id: DEMO_SANDBOX_ORG_ID, type: 'STATUS', key: 'IDEA', label: 'ดราฟต์ไอเดีย (Idea)', color: 'bg-slate-100 text-slate-700', sort_order: 1, is_active: true, progress_value: 10 },
        { id: 'mo-st-2', org_id: DEMO_SANDBOX_ORG_ID, type: 'STATUS', key: 'SCRIPT', label: 'เขียนสคริปต์ (Script)', color: 'bg-amber-100 text-amber-700', sort_order: 2, is_active: true, progress_value: 30 },
        { id: 'mo-st-3', org_id: DEMO_SANDBOX_ORG_ID, type: 'STATUS', key: 'SHOOTING', label: 'ออกกองถ่ายทำ (Shooting)', color: 'bg-sky-100 text-sky-700', sort_order: 3, is_active: true, progress_value: 50 },
        { id: 'mo-st-4', org_id: DEMO_SANDBOX_ORG_ID, type: 'STATUS', key: 'EDITING', label: 'กำลังตัดต่อ (Editing)', color: 'bg-indigo-100 text-indigo-700', sort_order: 4, is_active: true, progress_value: 75 },
        { id: 'mo-st-5', org_id: DEMO_SANDBOX_ORG_ID, type: 'STATUS', key: 'PUBLISHED', label: 'เผยแพร่แล้ว (Published)', color: 'bg-emerald-100 text-emerald-700', sort_order: 5, is_active: true, progress_value: 100 },
        { id: 'mo-ts-1', org_id: DEMO_SANDBOX_ORG_ID, type: 'TASK_STATUS', key: 'TODO', label: 'รอดำเนินการ (To Do)', color: 'bg-slate-100 text-slate-700', sort_order: 1, is_active: true, progress_value: 0 },
        { id: 'mo-ts-2', org_id: DEMO_SANDBOX_ORG_ID, type: 'TASK_STATUS', key: 'IN_PROGRESS', label: 'กำลังทำ (In Progress)', color: 'bg-indigo-100 text-indigo-700', sort_order: 2, is_active: true, progress_value: 50 },
        { id: 'mo-ts-3', org_id: DEMO_SANDBOX_ORG_ID, type: 'TASK_STATUS', key: 'WAITING', label: 'รอตรวจ (Review)', color: 'bg-amber-100 text-amber-700', sort_order: 3, is_active: true, progress_value: 80 },
        { id: 'mo-ts-4', org_id: DEMO_SANDBOX_ORG_ID, type: 'TASK_STATUS', key: 'DONE', label: 'เสร็จสิ้น (Done)', color: 'bg-emerald-100 text-emerald-700', sort_order: 4, is_active: true, progress_value: 100 },
        { id: 'mo-fmt-1', org_id: DEMO_SANDBOX_ORG_ID, type: 'FORMAT', key: 'SHORT_VIDEO', label: 'Short Video (Reels/TikTok)', color: 'bg-rose-100 text-rose-700', sort_order: 1, is_active: true },
        { id: 'mo-fmt-2', org_id: DEMO_SANDBOX_ORG_ID, type: 'FORMAT', key: 'LONG_VIDEO', label: 'YouTube Long-form', color: 'bg-indigo-100 text-indigo-700', sort_order: 2, is_active: true },
        { id: 'mo-fmt-3', org_id: DEMO_SANDBOX_ORG_ID, type: 'FORMAT', key: 'ALBUM', label: 'Photo Album / Carousel', color: 'bg-emerald-100 text-emerald-700', sort_order: 3, is_active: true },
        { id: 'mo-pil-1', org_id: DEMO_SANDBOX_ORG_ID, type: 'PILLAR', key: 'EDUCATION', label: 'สาระความรู้ (Edutainment)', color: 'bg-sky-100 text-sky-700', sort_order: 1, is_active: true },
        { id: 'mo-pil-2', org_id: DEMO_SANDBOX_ORG_ID, type: 'PILLAR', key: 'SPONSOR', label: 'แคมเปญลูกค้า (Sponsored)', color: 'bg-amber-100 text-amber-700', sort_order: 2, is_active: true },
        { id: 'mo-pil-3', org_id: DEMO_SANDBOX_ORG_ID, type: 'PILLAR', key: 'VIRAL', label: 'ไวรัลตามเทรนด์ (Trend)', color: 'bg-purple-100 text-purple-700', sort_order: 3, is_active: true }
    ];

    const contents = [
        {
            id: 'demo-content-101',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'EP.12 พาทัวร์ออฟฟิศครีเอเตอร์ยุคใหม่ ใช้ระบบ ERP จัดการคิวกองถ่าย 100%',
            description: 'คอนเทนต์โชว์เบื้องหลังการทำงานของทีมโปรดักชัน ตั้งแต่คิดไอเดีย เขียนบท จนถึงวันออกกองถ่ายทำจริง (ลองคลิกแก้ไขหรือลากเปลี่ยนสถานะได้เลย!)',
            type: 'CONTENT',
            status: 'EDITING',
            priority: 'HIGH',
            start_date: yesterdayIso,
            end_date: tomorrowIso,
            channel_id: 'demo-ch-youtube',
            content_format: 'LONG_VIDEO',
            content_Formats: ['LONG_VIDEO'],
            pillar: 'EDUCATION',
            category: 'Behind The Scenes',
            assignee_ids: [activeUserId, 'demo-teammate-003'],
            idea_owner_ids: ['demo-teammate-002'],
            editor_ids: ['demo-teammate-003'],
            shoot_date: todayIso,
            shoot_location: 'Studio A (สุขุมวิท 39)',
            is_unscheduled: false,
            estimated_hours: 6,
            created_at: yesterdayIso
        },
        {
            id: 'demo-content-102',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: '5 เทคนิคปั้นช่อง TikTok ให้ทะลุแสนวิวภายใน 30 วัน (แคมเปญ Sponsor)',
            description: 'คลิปสั้น 90 วินาที สรุปเทคนิค Hook 3 วินาทีแรกให้คนหยุดดู พร้อม Tie-in สินค้าลูกค้าอย่างเป็นธรรมชาติ',
            type: 'CONTENT',
            status: 'SHOOTING',
            priority: 'URGENT',
            start_date: todayIso,
            end_date: twoDaysIso,
            channel_id: 'demo-ch-tiktok',
            content_format: 'SHORT_VIDEO',
            content_Formats: ['SHORT_VIDEO'],
            pillar: 'SPONSOR',
            category: 'Marketing Tips',
            assignee_ids: [activeUserId, 'demo-teammate-002'],
            idea_owner_ids: [activeUserId],
            editor_ids: ['demo-teammate-003'],
            shoot_date: tomorrowIso,
            shoot_location: 'Cafe Craft Ari',
            is_unscheduled: false,
            estimated_hours: 3,
            created_at: todayIso
        },
        {
            id: 'demo-content-103',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'Infographic สรุปอัลกอริทึมโซเชียลมีเดียครึ่งปีหลัง (10 ภาพ)',
            description: 'อัลบั้มภาพสรุปเข้าใจง่ายสำหรับเพจ Facebook และ IG Carousel',
            type: 'CONTENT',
            status: 'PUBLISHED',
            priority: 'MEDIUM',
            start_date: yesterdayIso,
            end_date: todayIso,
            channel_id: 'demo-ch-facebook',
            content_format: 'ALBUM',
            content_Formats: ['ALBUM'],
            pillar: 'EDUCATION',
            category: 'Infographic',
            assignee_ids: ['demo-teammate-004'],
            idea_owner_ids: ['demo-teammate-002'],
            editor_ids: ['demo-teammate-004'],
            is_unscheduled: false,
            estimated_hours: 4,
            created_at: yesterdayIso
        },
        {
            id: 'demo-content-104',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: '[Stock Idea] รีวิวอุปกรณ์จัดไฟสตูดิโองบประหยัดสำหรับมือใหม่',
            description: 'ไอเดียสำรองในคลัง Stock รอหยิบลงตารางปฏิทินเดือนหน้า',
            type: 'CONTENT',
            status: 'IDEA',
            priority: 'LOW',
            start_date: threeDaysIso,
            end_date: threeDaysIso,
            channel_id: 'demo-ch-youtube',
            content_format: 'SHORT_VIDEO',
            content_Formats: ['SHORT_VIDEO'],
            pillar: 'VIRAL',
            category: 'Gadget Review',
            assignee_ids: [activeUserId],
            idea_owner_ids: [activeUserId],
            editor_ids: [],
            is_unscheduled: true,
            estimated_hours: 2,
            created_at: todayIso
        }
    ];

    const tasks = [
        {
            id: 'demo-task-201',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'ตรวจดราฟต์สคริปต์และอนุมัติ Storyboard แคมเปญลูกค้าประจำเดือน',
            description: 'คุณสามารถลองกดเปลี่ยนสถานะเป็น DONE หรือเพิ่มงานใหม่ในโหมด Sandbox ได้ทันที ข้อมูลจะไม่กระทบฐานข้อมูลจริง',
            type: 'TASK',
            status: 'IN_PROGRESS',
            priority: 'URGENT',
            start_date: todayIso,
            end_date: todayIso,
            assignee_ids: [activeUserId],
            assignee_type: 'INDIVIDUAL',
            target_position: 'Creative',
            estimated_hours: 2,
            created_at: todayIso
        },
        {
            id: 'demo-task-202',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'ออกแบบปกคลิป YouTube EP.12 (2 เวอร์ชันสำหรับทำ A/B Testing)',
            description: 'เน้นฟอนต์อ่านง่ายบนมือถือ สีสันสดใส ดึงดูดสายตา',
            type: 'TASK',
            status: 'TODO',
            priority: 'HIGH',
            start_date: todayIso,
            end_date: tomorrowIso,
            assignee_ids: ['demo-teammate-004', activeUserId],
            assignee_type: 'TEAM',
            target_position: 'Graphic',
            estimated_hours: 3,
            created_at: todayIso
        },
        {
            id: 'demo-task-203',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'เตรียมอุปกรณ์กล้อง Sony FX3 และไมค์ไร้สายสำหรับกองถ่ายพรุ่งนี้',
            description: 'ชาร์จแบตเตอรี่สำรองครบ 6 ก้อน และฟอร์แมตการ์ดความจำ',
            type: 'TASK',
            status: 'DONE',
            priority: 'MEDIUM',
            start_date: yesterdayIso,
            end_date: todayIso,
            assignee_ids: ['demo-teammate-003'],
            assignee_type: 'INDIVIDUAL',
            target_position: 'Editor',
            estimated_hours: 1,
            created_at: yesterdayIso
        }
    ];

    const shoot_queues = [
        {
            id: 'demo-shoot-301',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'กองถ่ายนอกสถานที่: Cafe Craft Ari (3 คลิป TikTok)',
            shoot_date: todayDateStr,
            start_time: '09:30',
            end_time: '15:00',
            location_name: 'Cafe Craft Ari ซอยอารีย์ 4',
            status: 'PLANNED',
            crew_ids: [activeUserId, 'demo-teammate-002', 'demo-teammate-003'],
            content_ids: ['demo-content-101', 'demo-content-102'],
            notes: 'นัดรวมพลที่ออฟฟิศ 08:30 น. เตรียมชุดไฟพกพาไปด้วย',
            created_at: todayIso
        }
    ];

    const wiki_articles = [
        {
            id: 'demo-wiki-401',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'คู่มือมาตรฐานการตั้งชื่อไฟล์ฟุตเทจและการส่งงานตัดต่อ (SOP)',
            category: 'PRODUCTION',
            content: '<h3>มาตรฐานการส่งมอบไฟล์งานในสตูดิโอ</h3><p>1. ตั้งชื่อโฟลเดอร์ตามรูปแบบ <code>YYYYMMDD_ชื่อโปรเจกต์</code></p><p>2. แยกโฟลเดอร์ A-Roll, B-Roll, Audio และ Graphic อย่างชัดเจน</p><p>3. แนบลิงก์ Google Drive ลงในการ์ดงานของระบบ Juijui ทุกครั้งเพื่อแจ้งเตือนทีมตรวจงานอัตโนมัติ</p>',
            author_id: 'demo-teammate-002',
            is_pinned: true,
            updated_at: todayIso,
            created_at: yesterdayIso
        },
        {
            id: 'demo-wiki-402',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'สวัสดิการพนักงาน การเบิกงบออกกองถ่าย และวันลาประจำปี',
            category: 'HR_POLICY',
            content: '<h3>ระเบียบการเบิกงบกองถ่ายทำ</h3><p>สามารถส่งคำขอเบิกงบผ่านโมดูล Finance พร้อมแนบใบเสร็จได้ทันทีหลังจบกองถ่ายภายใน 3 วันทำการ</p>',
            author_id: activeUserId,
            is_pinned: false,
            updated_at: todayIso,
            created_at: yesterdayIso
        }
    ];

    const attendance_logs = [
        {
            id: 'demo-att-501',
            org_id: DEMO_SANDBOX_ORG_ID,
            user_id: activeUserId,
            date: todayDateStr,
            check_in_time: new Date(now.getTime() - 2 * 3600000).toISOString(),
            check_out_time: null,
            work_type: 'OFFICE',
            status: 'ON_TIME',
            note: 'เข้างานโหมดทดลองระบบ Sandbox',
            created_at: todayIso
        },
        {
            id: 'demo-att-502',
            org_id: DEMO_SANDBOX_ORG_ID,
            user_id: 'demo-teammate-002',
            date: todayDateStr,
            check_in_time: new Date(now.getTime() - 3 * 3600000).toISOString(),
            check_out_time: null,
            work_type: 'OFFICE',
            status: 'ON_TIME',
            note: 'เตรียมบรีฟงานเช้า',
            created_at: todayIso
        }
    ];

    const quests = [
        {
            id: 'demo-quest-601',
            org_id: DEMO_SANDBOX_ORG_ID,
            title: 'ภารกิจประจำสัปดาห์: ปล่อยคลิปไวรัลครบ 5 คลิปตรงเวลา',
            description: 'เมื่อทีมส่งงานทันกำหนดครบ 5 ชิ้น รับโบนัส 500 XP และ 150 Coins ทันที!',
            target_value: 5,
            current_value: 3,
            reward_xp: 500,
            reward_points: 150,
            quest_type: 'AUTO',
            is_completed: false,
            start_date: yesterdayIso,
            end_date: threeDaysIso,
            created_at: yesterdayIso
        }
    ];

    return {
        organizations,
        organization_members,
        companies,
        profiles,
        channels,
        master_options,
        contents,
        tasks,
        shoot_queues,
        wiki_articles,
        attendance_logs,
        leave_requests: [],
        ot_requests: [],
        checklist_presets: [],
        checklist_items: [],
        company_goals: [],
        meetings: [],
        finance_transactions: [],
        quests,
        notifications: [],
        workbox_items: [],
        scripts: [],
        subscription_invoices: []
    };
};

export const getDemoRamStore = (): RamDatabase => {
    if (typeof window === 'undefined') {
        return createInitialSeedDatabase();
    }
    if (!window.__JUIJUI_DEMO_RAM_DB__) {
        window.__JUIJUI_DEMO_RAM_DB__ = createInitialSeedDatabase();
    }
    return window.__JUIJUI_DEMO_RAM_DB__;
};

export const resetDemoSandboxRamData = (): RamDatabase => {
    const fresh = createInitialSeedDatabase();
    if (typeof window !== 'undefined') {
        window.__JUIJUI_DEMO_RAM_DB__ = fresh;
    }
    return fresh;
};

export const syncCurrentUserIntoRamStore = () => {
    const store = getDemoRamStore();
    if (!store.profiles) return;
    const activeUserId = runtimeState.userId || 'demo-user-001';
    const existingIdx = store.profiles.findIndex(p => p.id === activeUserId);
    const updatedProfile = {
        ...(existingIdx >= 0 ? store.profiles[existingIdx] : store.profiles[0]),
        id: activeUserId,
        email: runtimeState.userEmail,
        full_name: `${runtimeState.userName} (คุณ)`,
        first_name: runtimeState.userName,
        role: runtimeState.role,
        position: runtimeState.role === 'ADMIN' ? 'Executive Producer / Admin' : 'Content Creator / Editor',
        is_approved: true,
        is_active: true,
        current_org_id: DEMO_SANDBOX_ORG_ID,
        org_id: DEMO_SANDBOX_ORG_ID
    };

    if (existingIdx >= 0) {
        store.profiles[existingIdx] = updatedProfile;
    } else {
        store.profiles[0] = updatedProfile;
    }

    if (store.organization_members && store.organization_members.length > 0) {
        store.organization_members[0] = {
            ...store.organization_members[0],
            user_id: activeUserId,
            role: runtimeState.role === 'ADMIN' ? 'OWNER' : 'MEMBER',
            status: 'ACTIVE'
        };
    }
};

// --- IN-MEMORY POSTGREST-COMPATIBLE FLUENT QUERY BUILDER ---
type FilterFn = (row: any) => boolean;

class InMemoryQueryBuilder {
    private table: string;
    private operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'UPSERT' | 'DELETE' = 'SELECT';
    private payload: any = null;
    private filters: FilterFn[] = [];
    private orderByField: string | null = null;
    private orderAsc: boolean = true;
    private limitCount: number | null = null;
    private rangeBounds: [number, number] | null = null;
    private expectSingle: boolean = false;
    private expectMaybeSingle: boolean = false;
    private countMode: string | null = null;
    private headOnly: boolean = false;

    constructor(table: string) {
        this.table = table;
    }

    select(_columns = '*', options?: { count?: string; head?: boolean }) {
        if (options?.count) this.countMode = options.count;
        if (options?.head) this.headOnly = true;
        return this;
    }

    insert(values: any, _options?: any) {
        this.operation = 'INSERT';
        this.payload = values;
        return this;
    }

    update(values: any, _options?: any) {
        this.operation = 'UPDATE';
        this.payload = values;
        return this;
    }

    upsert(values: any, _options?: any) {
        this.operation = 'UPSERT';
        this.payload = values;
        return this;
    }

    delete(_options?: any) {
        this.operation = 'DELETE';
        return this;
    }

    eq(column: string, value: any) {
        if (column === 'org_id') {
            // In Demo Sandbox, all rows belong to the sandbox org
            return this;
        }
        this.filters.push((row) => row?.[column] === value);
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push((row) => row?.[column] !== value);
        return this;
    }

    in(column: string, values: any[]) {
        if (!Array.isArray(values)) return this;
        this.filters.push((row) => values.includes(row?.[column]));
        return this;
    }

    contains(column: string, value: any) {
        this.filters.push((row) => {
            const colVal = row?.[column];
            if (Array.isArray(colVal) && Array.isArray(value)) {
                return value.every((v) => colVal.includes(v));
            }
            return true;
        });
        return this;
    }

    overlaps(column: string, value: any[]) {
        this.filters.push((row) => {
            const colVal = row?.[column];
            if (Array.isArray(colVal) && Array.isArray(value)) {
                return value.some((v) => colVal.includes(v));
            }
            return true;
        });
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push((row) => {
            if (row?.[column] == null) return true;
            return String(row[column]) >= String(value);
        });
        return this;
    }

    gt(column: string, value: any) {
        this.filters.push((row) => {
            if (row?.[column] == null) return true;
            return String(row[column]) > String(value);
        });
        return this;
    }

    lte(column: string, value: any) {
        this.filters.push((row) => {
            if (row?.[column] == null) return true;
            return String(row[column]) <= String(value);
        });
        return this;
    }

    lt(column: string, value: any) {
        this.filters.push((row) => {
            if (row?.[column] == null) return true;
            return String(row[column]) < String(value);
        });
        return this;
    }

    ilike(column: string, pattern: string) {
        const clean = String(pattern || '').replace(/%/g, '').toLowerCase();
        this.filters.push((row) =>
            String(row?.[column] || '').toLowerCase().includes(clean)
        );
        return this;
    }

    like(column: string, pattern: string) {
        return this.ilike(column, pattern);
    }

    is(column: string, value: any) {
        this.filters.push((row) => row?.[column] === value);
        return this;
    }

    not(column: string, operator: string, value: any) {
        if (operator === 'is') {
            this.filters.push((row) => row?.[column] !== value);
        } else if (operator === 'in' && Array.isArray(value)) {
            this.filters.push((row) => !value.includes(row?.[column]));
        }
        return this;
    }

    or(_orExpression: string) {
        return this;
    }

    filter(_column: string, _operator: string, _value: any) {
        return this;
    }

    match(query: Record<string, any>) {
        Object.entries(query || {}).forEach(([k, v]) => this.eq(k, v));
        return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
        this.orderByField = column;
        this.orderAsc = options?.ascending !== false;
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    range(from: number, to: number) {
        this.rangeBounds = [from, to];
        return this;
    }

    single() {
        this.expectSingle = true;
        return this;
    }

    maybeSingle() {
        this.expectMaybeSingle = true;
        return this;
    }

    csv() {
        return this;
    }

    private execute() {
        const store = getDemoRamStore();
        if (!store[this.table]) {
            store[this.table] = [];
        }
        const tableRows = store[this.table];

        const matchesFilters = (row: any) => this.filters.every((fn) => fn(row));

        let resultRows: any[] = [];

        if (this.operation === 'INSERT') {
            const items = Array.isArray(this.payload) ? this.payload : [this.payload];
            const inserted = items.map((item) => {
                const newRow = {
                    id: item?.id || `demo-${this.table}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    org_id: DEMO_SANDBOX_ORG_ID,
                    created_at: new Date().toISOString(),
                    ...item
                };
                tableRows.unshift(newRow);
                return newRow;
            });
            resultRows = inserted;
        } else if (this.operation === 'UPDATE') {
            const updated: any[] = [];
            for (let i = 0; i < tableRows.length; i++) {
                if (matchesFilters(tableRows[i])) {
                    tableRows[i] = {
                        ...tableRows[i],
                        ...this.payload,
                        updated_at: new Date().toISOString()
                    };
                    updated.push(tableRows[i]);
                }
            }
            resultRows = updated;
        } else if (this.operation === 'UPSERT') {
            const items = Array.isArray(this.payload) ? this.payload : [this.payload];
            const upserted = items.map((item) => {
                const idx = item?.id ? tableRows.findIndex((r) => r.id === item.id) : -1;
                if (idx >= 0) {
                    tableRows[idx] = {
                        ...tableRows[idx],
                        ...item,
                        updated_at: new Date().toISOString()
                    };
                    return tableRows[idx];
                } else {
                    const newRow = {
                        id: item?.id || `demo-${this.table}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        org_id: DEMO_SANDBOX_ORG_ID,
                        created_at: new Date().toISOString(),
                        ...item
                    };
                    tableRows.unshift(newRow);
                    return newRow;
                }
            });
            resultRows = upserted;
        } else if (this.operation === 'DELETE') {
            const remaining: any[] = [];
            const deleted: any[] = [];
            for (const row of tableRows) {
                if (matchesFilters(row)) {
                    deleted.push(row);
                } else {
                    remaining.push(row);
                }
            }
            store[this.table] = remaining;
            resultRows = deleted;
        } else {
            // SELECT
            resultRows = tableRows.filter(matchesFilters);
            if (this.orderByField) {
                const field = this.orderByField;
                const asc = this.orderAsc;
                resultRows = [...resultRows].sort((a, b) => {
                    const va = a?.[field];
                    const vb = b?.[field];
                    if (va === vb) return 0;
                    if (va == null) return 1;
                    if (vb == null) return -1;
                    return (va > vb ? 1 : -1) * (asc ? 1 : -1);
                });
            }
        }

        const totalCount = resultRows.length;

        if (this.rangeBounds) {
            const [from, to] = this.rangeBounds;
            resultRows = resultRows.slice(from, to + 1);
        } else if (this.limitCount !== null) {
            resultRows = resultRows.slice(0, this.limitCount);
        }

        let finalData: any = resultRows;
        if (this.headOnly) {
            finalData = null;
        } else if (this.expectSingle || this.expectMaybeSingle) {
            finalData = resultRows.length > 0 ? resultRows[0] : null;
        }

        return {
            data: finalData,
            error: null,
            count: this.countMode ? totalCount : null,
            status: 200,
            statusText: 'OK (Demo Sandbox Ephemeral Store)'
        };
    }

    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
    }
}

// Tables that MUST always hit the real Supabase backend even while Demo Mode is active
const REAL_DB_PASSTHROUGH_TABLES = new Set([
    'demo_trial_sessions'
]);

export const createDemoAwareSupabaseClient = <T extends Record<string, any>>(rawClient: T): T => {
    return new Proxy(rawClient, {
        get(target, prop, receiver) {
            if (prop === 'from') {
                return (tableName: string) => {
                    if (isDemoSandboxActive() && !REAL_DB_PASSTHROUGH_TABLES.has(tableName)) {
                        return new InMemoryQueryBuilder(tableName);
                    }
                    return target.from(tableName);
                };
            }
            if (prop === 'rpc') {
                return (fnName: string, args?: any) => {
                    if (isDemoSandboxActive()) {
                        return Promise.resolve({ data: true, error: null });
                    }
                    return target.rpc(fnName, args);
                };
            }
            const value: any = Reflect.get(target, prop, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        }
    });
};
