# Project Developer Guide & Architecture Standards

## Master Data Tab Architecture (Single Source of Truth)

Whenever adding a new Master Data tab, follow these 3 simple steps:

1. **Add the Type Key**: Add the new tab string literal in `hooks/useMasterDataView.ts` (`export type MasterTab = ...`).
2. **Register in `MASTER_META`**: In `components/admin/master/MasterTabNavigation.tsx`, add the metadata entry in `MASTER_META`:
   ```typescript
   MY_NEW_TAB: {
       label: 'My New Tab',
       icon: MyIcon,
       desc: 'คำอธิบายสำหรับแท็บนี้',
       group: 'WORKFLOW' | 'CONTENT' | 'RESOURCES' | 'SYSTEM'
   }
   ```
   *Note: Both the side navigation bar (`MasterTabNavigation.tsx`) and the modal configuration dialog (`MasterDataTabConfigModal.tsx`) automatically derive their groups and tab lists directly from `MASTER_META` via `getMasterTabGroups()`.*
3. **Render View Component**: Add the conditional view render block in `components/MasterDataManager.tsx` (`activeTab === 'MY_NEW_TAB' ? <MyNewTabView /> : ...`).

---

## Mentor Tips Architecture

All module mentor tips are centralized in `config/mentorTips.ts`.

- To add or modify default messages, update `DEFAULT_MENTOR_TIPS` in `config/mentorTips.ts`.
- In any module/page view, render `<MentorTip moduleId="MODULE_ID" />`.
- Mentor tips can be globally toggled or individually toggled and edited by Admins in the **Master Data > System Config > Mentor Tips** panel.

---

## Framer Motion & Coordinated Layout Standards ("Zero-Jitter" Rulebook)

When building coordinated expand/collapse UI components across sibling or parent-child elements (e.g. header actions, collapsible toolbars, tag rails, drawer stacks):

### 1. No Direct `gap` Animation (Avoid "normal" to "0" warnings)
- In CSS Flexbox, browser default `gap` is `"normal"`, which cannot interpolate to numeric values in Framer Motion.
- **Rule**: Never animate `gap` in `animate={{ gap: ... }}`. Set `gap-0` in Tailwind class and animate `marginLeft` or `marginRight` on the child element directly.

### 2. The "Phantom Gap Jump" on Element Exit
- If a flex container has `gap-*` (e.g., `gap-3.5`) and a child element exits via `AnimatePresence`:
  - Even when child `width: 0`, the flex gap remains active (e.g., width = `44px + 14px = 58px`).
  - The instant `AnimatePresence` unmounts the child from the DOM, the gap instantly vanishes (`58px -> 44px`), causing a 1-frame jarring layout snap.
- **Rule**: Use `gap-0` on the flex container and animate `marginLeft: 14` -> `0` (or `marginRight`) inside the child's `initial`, `animate`, and `exit` props so both width and spacing hit zero simultaneously.

### 3. Native Flexbox (`flex-1`) vs FLIP `layout`
- When a sibling flex child uses `flex-1 min-w-0`, the native CSS engine already computes width smoothly in real time as adjacent elements expand/shrink.
- Adding `layout` to `flex-1` forces Framer Motion to apply `transform: scaleX(...)` which fights native layout and distorts inner `overflow-x-auto` scroll tracks, snapping at `restDelta`.
- **Rule**: Keep `layout` on rigid/sliding items (dividers, badges, icons). Do NOT put `layout` on `flex-1 min-w-0` scroll containers; let them expand via native Flexbox.

### 4. Debounce & Timer Synchronization
- When coordinating enter/leave states between multiple components, always use a single, shared timeout duration (e.g., unified `150ms`). Never mix staggered timers (e.g., 180ms vs 200ms) which trigger 2-stage visual stutters.

### 5. Unified Physics Curve (No Duration vs Spring Mismatch)
- Never mix fixed duration ease curves (`duration: 0.22, ease: ...`) on child properties with physics springs (`type: 'spring', stiffness: 320, damping: 30`) on parent layout.
- The ease curve terminates abruptly while the spring oscillates subpixels, creating a tail-end hitch.
- **Rule**: All coordinating siblings and expanding children must share the identical `springTransition` object.

### 6. Numeric Dimensions Over Class Swapping
- Do not swap padding or width classes abruptly (e.g. `${isExpanded ? 'w-11 px-0' : 'px-6'}`) while children are animating.
- **Rule**: Animate `width`, `paddingLeft`, `paddingRight`, and `borderRadius` as explicit numeric values in `animate={{ ... }}`.

### 7. Strict Typing for Framer Motion `Variants` & Cubic-Bezier Easing
- **The Issue**: When declaring custom animation variants without explicit typing, TypeScript infers cubic-bezier arrays (e.g., `ease: [0.16, 1, 0.3, 1]`) as loose `number[]`. Framer Motion's `Variant` / `Transition` type strictly requires a 4-number tuple `[number, number, number, number]` or an `Easing` string union, triggering severe TypeScript mismatch errors on `<motion.div variants={...}>`.
- **Rules**:
  1. Always import and annotate `type Variants` from `'framer-motion'`:
     ```typescript
     import { motion, AnimatePresence, type Variants } from 'framer-motion';
     ```
  2. Always explicitly type the variants object:
     ```typescript
     const weekVariants: Variants = { ... };
     ```
  3. When using numeric cubic-bezier curves, ALWAYS mark them with `as const`:
     ```typescript
     transition: {
         duration: 0.25,
         ease: [0.16, 1, 0.3, 1] as const, // CRITICAL: tuple literal, prevents number[] mismatch
     }
     ```
  4. Or use standard built-in easing tokens directly (e.g., `ease: "easeInOut"`, `ease: "easeOut"`).

---

## Responsive Modal & Dialog Design Standards (Mobile, Tablet, Desktop)

When creating or refactoring any Modal, Dialog, or Drawer in the system, adhere to these responsive UX/UI rules:

### 1. Three-Tier Viewport Strategy
- **Mobile (`< 640px`)**:
  - Fill viewport width (`w-full`), positioned at the bottom (Bottom Sheet pattern: `items-end sm:items-center`) with `rounded-t-[2rem] sm:rounded-3xl`.
  - Action buttons must be stacked full-width: `flex flex-col-reverse sm:flex-row gap-2` with `w-full sm:w-auto`.
  - Safe-area bottom inset: `pb-[max(1rem,env(safe-area-inset-bottom))]`.
- **Tablet (`640px - 1024px`)**:
  - Centered dialog with responsive widths (`max-w-lg md:max-w-xl`), safe margins (`p-6`), max-height cap (`max-h-[85vh]`).
- **Desktop (`> 1024px`)**:
  - Centered dialog with contextual width caps:
    - Confirmation / Alert: `max-w-md`
    - Forms / Settings / Single-column workflows: `max-w-xl` or `max-w-2xl`
    - Data Grids / Multi-column / Previews: `max-w-4xl` or `max-w-5xl`

### 2. The 3-Layer Flexbox Layout (Zero Cut-Off Guarantee)
Never allow modals to overflow off-screen or trap action buttons below the fold. Every modal dialog must follow the **3-layer flex column contract**:
```tsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
  <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden">
    {/* 1. Rigid Header */}
    <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
      <h3 className="font-bold text-gray-900 dark:text-white">Title</h3>
      <button className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center">✕</button>
    </div>

    {/* 2. Scrollable Body */}
    <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
      {/* Content here */}
    </div>

    {/* 3. Rigid Sticky Footer */}
    <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
      <button className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border rounded-xl">ยกเลิก</button>
      <button className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-md">บันทึก</button>
    </div>
  </div>
</div>
```

### 3. Touch Target & Keyboard Ergonomics
- **Touch-Friendly Buttons**: Minimum click target size for close and navigation icons is `40x40px` (or `p-2.5`).
- **Overscroll Isolation**: Use `overscroll-contain` on the body container to prevent pull-to-refresh or background body scroll bouncing while scrolling within modal contents.
- **Backdrop & Escape**: Always support backdrop click dismissal and `Escape` keyboard shortcuts (unless modal holds dirty/unsaved critical form data).

---

## Enterprise Multi-Tenant SaaS Architecture Standards (CRITICAL)

ระบบนี้ใช้สถาปัตยกรรม **Multi-Tenant SaaS (Shared Database, Shared Schema)** ที่แยกข้อมูลแต่ละองค์กรด้วย `org_id` และบังคับใช้ **Row-Level Security (RLS)** ระดับ PostgreSQL อย่างเคร่งครัด นักพัฒนาทุกคน (และ AI) ต้องปฏิบัติตามกฎเหล็ก 6 ข้อนี้ทุกครั้งที่เพิ่มหรือแก้ไขฟีเจอร์:

### 1. กฎการสร้างตารางใหม่ในฐานข้อมูล (New Database Tables)
ทุกตารางที่สร้างใหม่ในอนาคต (ยกเว้นตารางระดับ Global จริงๆ) **ต้องมีคอลัมน์ `org_id` เสมอ** พร้อมตั้งค่า Default ให้ดึงจากฟังก์ชัน `public.get_active_org_id()` อัตโนมัติ และเปิด RLS ทันที:
```sql
CREATE TABLE public.my_new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL DEFAULT public.get_active_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE,
    -- คอลัมน์อื่นๆ ...
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_my_new_table_org_id ON public.my_new_table(org_id);
ALTER TABLE public.my_new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select_my_new_table" ON public.my_new_table
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY "tenant_isolation_modify_my_new_table" ON public.my_new_table
    FOR ALL TO authenticated
    USING (org_id = public.get_active_org_id())
    WITH CHECK (org_id = public.get_active_org_id());
```
*ทำไมต้องใช้ `DEFAULT public.get_active_org_id()`?* เพื่อให้โค้ดฝั่ง Frontend ที่สั่ง `.insert({...})` โดยไม่ได้ส่ง `org_id` มาด้วย ยังคงทำงานได้ปกติโดยที่ PostgreSQL เติม `org_id` ของ Workspace ปัจจุบันให้อัตโนมัติ

### 2. ห้ามเข้าใจผิดระหว่าง `org_id` (Tenant) กับ `brand_id` / `company_id` (Sub-brand)
- **`org_id`**: คือ **องค์กร/ลูกค้า SaaS (Top-level Tenant Isolation)** ข้อมูลข้าม `org_id` ห้ามมองเห็นกันเด็ดขาด
- **`brand_id` / `company_id`**: คือ **บริษัทย่อยหรือแบรนด์ภายใต้ `org_id` เดียวกัน**
- **ข้อควรระวัง**: ห้ามยุบรวมหรือใช้ `brand_id` แทน `org_id` เด็ดขาด

### 3. กฎการเขียน Backend API (`server/routes/*`)
เนื่องจากฝั่ง Server (`supabaseAdmin`) ใช้ **`SERVICE_ROLE_KEY`** ซึ่งจะ **ทะลุ (Bypass) RLS ทั้งหมดของ Supabase!**
- **กฎเหล็ก**: ห้าม Query ตารางใดๆ ใน `server/routes/*` โดยไม่กรอง `.eq('org_id', orgId)` เด็ดขาด
- **วิธีปฏิบัติ**: ต้องเรียกใช้ Helper `resolveTenantContext(req)` จาก `server/utils/tenantContext.ts` เสมอ:
  ```typescript
  const { userId, orgId } = await resolveTenantContext(req);
  if (!orgId) return res.status(403).json({ error: 'Active organization context required' });

  const { data } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('org_id', orgId); // CRITICAL: ต้องมีเสมอเมื่อใช้ supabaseAdmin!
  ```

### 4. กฎการทำ Realtime Subscription & Storage
- **Realtime Channel**: ห้ามตั้งชื่อ Channel แบบ Global ตายตัว (เช่น `supabase.channel('chat')`) เพราะ Event จะชนกันข้ามองค์กร ให้ใช้ Helper `getOrgChannelName('base-name')` จาก `lib/tenantStorage.ts` เสมอ (จะได้รูปแบบ `org:{orgId}:base-name`)
- **Supabase Storage**: ทุกไฟล์ที่อัปโหลดขึ้น Storage Bucket ต้องผ่าน Helper `getOrgStoragePath(fileName)` จาก `lib/tenantStorage.ts` เสมอ เพื่อให้ไฟล์ถูกจัดเก็บในโฟลเดอร์แยกตามองค์กร (`orgs/{orgId}/...`)
- **Workspace Switch Listener**: Hook ใดที่ดึงข้อมูลค้างไว้ใน State เมื่อเปิดแอป ต้องดักฟัง Event `window.addEventListener('org-workspace-switched', ...)` เพื่อล้าง State เก่าและดึงข้อมูลของ Workspace ใหม่ทันที

### 5. กฎการเพิ่ม Master Data (`master_options`)
- ค่าตั้งต้นใน `master_options` จะถูกแยกตาม `org_id` เสมอ
- หากมีการเพิ่มหมวดหมู่ Master Data ใหม่ที่ทุกองค์กรที่สมัครใหม่ต้องมีเป็นค่าเริ่มต้น ต้องไปเพิ่มรายการในฟังก์ชัน SQL `public.seed_organization_master_options(target_org_id UUID)` ด้วยเสมอ เพื่อให้องค์กรใหม่ได้ข้อมูลตั้งต้นครบถ้วน

### 6. กฎด้าน Build & Memory (Vite Bundle Guard)
- ห้าม Import โมดูลฝั่ง Server (`express`, `pg`, `firebase-admin`, `server/*`) เข้าไปในไฟล์ฝั่ง Frontend (`components/*`, `hooks/*`, `context/*`) เด็ดขาด เพราะจะทำให้ Vite พยายาม Bundle โมดูล Node.js จนเกิดปัญหา Memory พุ่งและ Build Timeout

### 7. กฎด้าน Commercial SaaS Licensing, Module Entitlements & Billing Webhook (Phase 5)
- **Super Admin vs Organization Admin**:
  - `isSuperAdmin` (`profiles.is_super_admin = true`) คือเจ้าของแพลตฟอร์ม SaaS มีสิทธิ์สร้างองค์กรลูกค้าใหม่ (`provisionCustomerOrganization`), กำหนดแพ็กเกจ (`STARTER`, `PRO`, `ENTERPRISE`, `LIFETIME`), เปิด-ปิด Module รายบริษัท (`allowed_modules`) และอนุมัติบิลต่ออายุ
  - ผู้ใช้ทั่วไปไม่สามารถกดสร้างองค์กรใหม่เองได้ (ซ่อนแท็บ `+ สร้างองค์กร` หากไม่ใช่ Super Admin)
- **Two-Tier Sidebar Module Filtering**:
  - การแสดงผลเมนูใน `Sidebar.tsx`, `MobileNavigation.tsx` และ `SidebarControlCenterModal.tsx` ต้องผ่านการกรอง 2 ชั้นเสมอ:
    1. **ชั้นที่ 1 (Super Admin License)**: ตรวจสอบผ่าน `isModuleAllowed(view)` จาก `useOrganization()` (`currentOrg.allowedModules`)
    2. **ชั้นที่ 2 (Org Admin Preference)**: ตรวจสอบผ่าน `SIDEBAR_CONFIG` ใน `master_options` ขององค์กรนั้นๆ
- **Owner Onboarding Claim Flow**:
  - เมื่อ Super Admin สร้างองค์กรลูกค้าใหม่ ระบบจะสร้าง `owner_claim_token` (`/?claim_org=CLAIM-XXXX-XXXX`) เพื่อให้เจ้าของบริษัทลูกค้ากดรับสิทธิ์ `OWNER` คนแรกขององค์กร หรือผูกกับ `owner_id` โดยตรงได้
- **Subscription Gate & Payment Webhook (`/api/billing/webhook`)**:
  - `SubscriptionGateOverlay.tsx` จะแสดงแถบแจ้งเตือนเมื่อองค์กรเข้าสู่ช่วงผ่อนผัน (`GRACE_PERIOD`) และล็อกหน้าจอเมื่อสถานะเป็น `SUSPENDED` หรือ `EXPIRED` โดยยังอนุญาตให้กดส่งคำขอชำระเงินเพื่อต่ออายุได้
  - การเชื่อมต่อ Payment Gateway (Stripe / Omise) ให้ยิงเข้า `POST /api/billing/webhook` พร้อมแนบ Header `x-webhook-secret` เพื่อต่ออายุ `expires_at` และบันทึกบิลลงตาราง `subscription_invoices` อัตโนมัติ

