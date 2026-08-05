export const BRAND_CONFIG = {
  name: 'Kontent OS',
  companyName: 'Kontent OS Co., Ltd.',
  title: 'Kontent OS',
  tagline: 'เปลี่ยนความวุ่นวายหลังบ้านให้เป็นระบบระเบียบ',
  description: 'แพลตฟอร์มบริหารจัดการงานสร้างสรรค์ที่เน้น Workflow ของครีเอเตอร์โดยเฉพาะ',
  supportEmail: 'support@kontentos.ai',
  website: 'https://kontentos.ai',
  copyright: '© 2024 Kontent OS. All rights reserved.',
  madeBy: 'Made with ♥ by Content Creator for Creator',
  projectPlaceholder: 'เริ่มต้นวางแผนกลยุทธ์ของคุณด้วยเครื่องมือ Kontent OS โดยกดปุ่มสร้างโครงการใหม่ด้านบน',
  
  // โหมดหน้าแรกเมื่อไม่ได้เข้าสู่ระบบ
  // 1 = แสดงหน้า LandingPage (ค่าเริ่มต้น)
  // 2 = แสดงหน้า AuthPage ทันทีเพื่อความสะดวกรวดเร็ว
  initialRouteMode: 1,

  // โหมดการแสดงปุ่มเข้าสู่ระบบด้วย Google
  // 1 = แสดงปุ่มเข้าสู่ระบบด้วย Google
  // 2 = ไม่แสดง (ซ่อน/คอมเมนต์ไว้ชั่วคราว)
  showGoogleLoginMode: 2,
    
  // โหมดการแสดงผล WorkBox (กล่องเก็บงาน)
  // 1 = แสดง (ค่าเริ่มต้น)
  // 2 = ไม่แสดง (ซ่อน/ปิดการแสดงผล)
  showWorkboxMode: 2,

  // โหมดการแสดงผลผู้ช่วย JuiJui Bot (AI)
  // 1 = แสดง (ค่าเริ่มต้น)
  // 2 = ไม่แสดง (ซ่อน/ปิดการแสดงผล)
  showJuiJuiAiMode: 2,

  // โหมดการแสดงผลหลอดเลือด (HP Bar) และ Badge ใน LiveClock
  // 1 = แสดงหลอดเลือดแบบปกติ (เริ่มต้นหลอดเต็ม 100%) และแสดง Badge HP ปกติ (ติดลบแสดงไอคอนหัวกะโหลกกระดอนสีเข้มดูน่ากลัว)
  // 2 = แสดงหลอดเลือดแบบสะสมความเสียหาย (เริ่มต้นหลอด 0%) และแสดง Badge เป็นตัวเลขล้วน โดยแสดงค่าติดลบในธีมสีชมพูอ่อนเป็นมิตรไม่น่ากลัว
  hpDisplayMode: 2,

  // โหมดของระบบ Gamification และการตาย (Death System)
  // 1 = ทำงานเต็มรูปแบบ (คำนวณคะแนน หัก HP บล็อกหน้าจอเมื่อ HP <= 0 หรือเข้าสู่สถานะ DEATH)
  // 2 = ปิดระบบการลงโทษและการล็อกหน้าจอทั้งหมด (ข้าม Logic HP <= 0 และข้ามการจำกัดหน้าจอทุกรูปแบบ)
  gamificationMode: 2,

  // โหมดนับสาย (Late Calculation Mode)
  // 1 = โหมดปกติ (มี Buffer)
  // 2 = โหมดเข้มงวด (ไม่มี Buffer + อ้างอิงตาราง Multiple Shifts ทันที)
  lateCalculationMode: 2,

  // โหมดแสดงเกรด (Grade Display Mode)
  // 1 = แสดงผลปกติ (Show Grade Column)
  // 2 = ปิดการแสดงผลทั้งหมดของคอลัมน์ Grade (Hide Grade Column)
  showGradeMode: 2,

  // โหมดการแสดงผล HP Badge บนหน้าอัปโหลดโปรไฟล์ (Profile Avatar Uploader)
  // 1 = แสดง HP Badge (ค่าเริ่มต้น)
  // 2 = ไม่แสดง HP Badge (ซ่อน)
  showProfileHpBadgeMode: 2,

  // โหมดการแสดงผลแถบสถานะ AI (AI Status Badge) ที่ท้าย Sidebar
  // 1 = แสดง (ค่าเริ่มต้น)
  // 2 = ไม่แสดง (ซ่อน/ปิดการแสดงผล)
  showSidebarAiStatusMode: 2,

  // โหมดซ่อนแท็บลงเวลา (CHECK_IN) และประวัติ (HISTORY) สำหรับ ADMIN
  // 1 = แสดงตามปกติ (ค่าเริ่มต้น)
  // 2 = ซ่อนแท็บทั้งสองนี้ไม่ให้ ADMIN เห็น (ทำให้ ADMIN เห็นเฉพาะแท็บตรวจสอบทีม, คำขออนุมัติ, รายงาน)
  hideAdminCheckInAndHistoryMode: 2,

  // โหมดซ่อนผู้ใช้ที่เป็น ADMIN ออกจากตารางรายงานลงเวลาทำงานและสถิติ ขาด ลา มาสาย ของทีม
  // 1 = แสดง ADMIN ตามปกติ (ค่าเริ่มต้น)
  // 2 = ซ่อน ADMIN ออกจากตารางและตัวเลขสถิติภาพรวม (ทำให้ตารางแสดงเฉพาะระดับ MEMBER เท่านั้น)
  hideAdminFromAttendanceDashboardMode: 2,
  
  // โหมดแสดงรายการคำขออนุมัติเข้าร่วมทีมในหน้าตารางลงเวลาทำงาน (AdminWeeklyTimesheet)
  // 1 = ไม่แสดง (แสดงเฉพาะในหน้า TeamView ปกติ)
  // 2 = แสดง (เพิ่มกล่องรออนุมัติก่อนถึง TimesheetHeader)
  showPendingMembersInTimesheetMode: 2,

  // โหมดการทำงานการลงเวลาสำหรับคอมพิวเตอร์ (Computer / PC Lock Mode)
  // 1 = อนุญาตให้เข้างาน/ลงเวลาผ่านคอมพิวเตอร์ได้ (ปลดล็อก)
  // 2 = ล็อกการลงเวลาผ่านคอมพิวเตอร์ (ล็อกให้ลงผ่านมือถือ/แท็บเล็ตเท่านั้น)
  allowDesktopCheckInMode: 1,
};
