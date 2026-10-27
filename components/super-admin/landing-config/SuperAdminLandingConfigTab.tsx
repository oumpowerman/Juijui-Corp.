import React, { useState, useEffect } from 'react';
import {
  getPlatformLandingConfig,
  updatePlatformLandingConfig,
  PlatformPricingPlan,
  FeatureVideoConfig,
  HeroVideoConfig,
  CustomModulePricingConfig,
  CustomModuleItemConfig,
  ModuleGroupId,
  DEFAULT_PLATFORM_PRICING_PLANS,
  DEFAULT_FEATURE_VIDEOS,
  DEFAULT_HERO_VIDEO,
  DEFAULT_CUSTOM_MODULE_CONFIG,
} from '../../../services/landingConfigService';
import { PricingPlanEditorCard } from './PricingPlanEditorCard';
import { VideoShowcaseEditorCard } from './VideoShowcaseEditorCard';
import { useUserSession } from '../../../context/UserSessionContext';
import { parseVideoUrl } from '../../../lib/videoUrlParser';
import {
  Layers,
  Video,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Play,
  Eye,
  Sliders,
  Users,
  Lock,
} from 'lucide-react';

const FEATURE_METADATA = [
  { id: 'feature-1', title: 'Dashboard ภาพรวมสตูดิโอ', category: 'Executive & Studio Operations' },
  { id: 'feature-2', title: 'Calendar & Content Plan', category: 'Planning & Multi-Platform Calendar' },
  { id: 'feature-3', title: 'Team & Quality Gate', category: 'Workflow, QC & Gamification' },
  { id: 'feature-4', title: 'Content Script & Idea Hub', category: 'Scriptwriting, Teleprompter & Reference Hub' },
  { id: 'feature-5', title: 'Shoot Queue & Duty Roster', category: 'Logistics, Packing Checklist & Shift Roster' },
  { id: 'feature-6', title: 'Multi-Brand Workspace', category: 'Corporate Multi-Tenant & Multi-Brand Network' },
];

const GROUP_LABELS: Record<ModuleGroupId, string> = {
  WORKSPACE: 'หมวด 1: WORKSPACE (พื้นที่ทำงาน & วางแผนหลัก)',
  PRODUCTION: 'หมวด 2: PRODUCTION (กองถ่าย เขียนบท & คลังคลิป)',
  OFFICE: 'หมวด 3: OFFICE & HR (บริหารทีม เวร & เกมมิฟิเคชัน)',
  ADMIN: 'หมวด 4: ADMIN & QC (ตรวจคุณภาพงาน & ตั้งค่าระบบ)',
};

export const SuperAdminLandingConfigTab: React.FC = () => {
  const { currentUserProfile } = useUserSession();

  const [activeSubTab, setActiveSubTab] = useState<'PRICING' | 'CUSTOM_MODULES' | 'VIDEOS'>('PRICING');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [pricingPlans, setPricingPlans] = useState<PlatformPricingPlan[]>(DEFAULT_PLATFORM_PRICING_PLANS);
  const [featureVideos, setFeatureVideos] = useState<Record<string, FeatureVideoConfig>>(DEFAULT_FEATURE_VIDEOS);
  const [heroVideo, setHeroVideo] = useState<HeroVideoConfig>(DEFAULT_HERO_VIDEO);
  const [customModuleConfig, setCustomModuleConfig] = useState<CustomModulePricingConfig>(
    DEFAULT_CUSTOM_MODULE_CONFIG
  );
  const [showHeroPreview, setShowHeroPreview] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await getPlatformLandingConfig();
      setPricingPlans(config.pricing_plans);
      setFeatureVideos(config.feature_videos);
      setHeroVideo(config.hero_video);
      setCustomModuleConfig(config.custom_module_config || DEFAULT_CUSTOM_MODULE_CONFIG);
    } catch (err) {
      console.error('Failed to load landing config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await updatePlatformLandingConfig(
        {
          pricing_plans: pricingPlans,
          feature_videos: featureVideos,
          hero_video: heroVideo,
          custom_module_config: customModuleConfig,
        },
        currentUserProfile?.id
      );

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'บันทึกการตั้งค่าหน้า Landing Page, Pricing และราคาแยกโมดูล À La Carte เรียบร้อยแล้ว ข้อมูลหน้าบ้านจะอัปเดตทันที',
        });
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setPricingPlans(DEFAULT_PLATFORM_PRICING_PLANS);
    setFeatureVideos(DEFAULT_FEATURE_VIDEOS);
    setHeroVideo(DEFAULT_HERO_VIDEO);
    setCustomModuleConfig(DEFAULT_CUSTOM_MODULE_CONFIG);
    setStatusMessage({
      type: 'success',
      text: 'คืนค่ามาตรฐานเริ่มต้น (Default Fallback) สำเร็จ กรุณากดปุ่ม "บันทึกการเปลี่ยนแปลง" เพื่อยืนยันลงฐานข้อมูล',
    });
  };

  const updateSinglePlan = (index: number, updated: PlatformPricingPlan) => {
    const next = [...pricingPlans];
    next[index] = updated;
    setPricingPlans(next);
  };

  const updateSingleVideo = (featureId: string, updated: FeatureVideoConfig) => {
    setFeatureVideos((prev) => ({
      ...prev,
      [featureId]: updated,
    }));
  };

  const updateModuleItem = (moduleKey: string, patch: Partial<CustomModuleItemConfig>) => {
    setCustomModuleConfig((prev) => ({
      ...prev,
      modules: prev.modules.map((m) => (m.key === moduleKey ? { ...m, ...patch } : m)),
    }));
  };

  const parsedHero = parseVideoUrl(heroVideo.url);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-500">กำลังโหลดการตั้งค่าแพลตฟอร์ม...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Platform Master Data
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Public Real-time Dynamic Sync</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            จัดการราคาแพ็กเกจ SaaS, สูตรผสมโมดูล À La Carte & คลังวิดีโอตัวอย่าง
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            ปรับแต่งราคาแพ็กเกจหลัก 4 แผน, ราคาแยกตามโมดูล Sidebar ทั้ง 26 เมนู (พร้อม Default Fallback อัตโนมัติ) และลิงก์วิดีโอสาธิตในหน้า Landing Page ได้แบบ Real-time
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่า Default Fallback</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>ดูหน้าเว็บจริง</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
          </button>
        </div>
      </div>

      {/* Alert Status Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Segmented Sub-Nav Controls */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('PRICING')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'PRICING'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>แผนราคาแพ็กเกจหลัก (4 Tiers)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('CUSTOM_MODULES')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CUSTOM_MODULES'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>ตั้งราคาแยกโมดูล À La Carte (26 เมนู)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('VIDEOS')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'VIDEOS'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>คลังวิดีโอสาธิต (Hero & 6 Features)</span>
        </button>
      </div>

      {/* TAB 1: PRICING PLANS */}
      {activeSubTab === 'PRICING' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {pricingPlans.map((plan, idx) => (
              <PricingPlanEditorCard
                key={plan.tier}
                plan={plan}
                onChange={(updated) => updateSinglePlan(idx, updated)}
              />
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>คำแนะนำ:</strong> เมื่อทำการปรับราคาต่อเดือนหรือต่อปี ระบบฝั่งลูกค้าจะแสดงราคาใหม่ทันที และเมื่อผู้ใช้กดสมัครสมาชิกหรือสร้างใบแจ้งหนี้ ระบบจะส่งต่อยอดเงินนี้ไปยังเกตเวย์ Stripe / PromptPay QR โดยอัตโนมัติ
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM MODULE PRICING (À LA CARTE RECIPE BUILDER CONFIG) */}
      {activeSubTab === 'CUSTOM_MODULES' && (
        <div className="space-y-6">
          {/* Base Core & Seat Pricing Parameters Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    1. โครงสร้างราคาพื้นฐาน & โควตาสมาชิก (Base Core & Seat Parameters)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ค่าเริ่มต้นเป็น Default Fallback (Base ฿490 / ฟรี 5 คน / คนละ +฿50 / รายปีลด 2 เดือน) สามารถแก้ไขตัวเลขด้านล่างและกดบันทึกได้ทันที
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ราคา Base Core พื้นฐาน (บาท/เดือน)
                </label>
                <input
                  type="number"
                  min={0}
                  value={customModuleConfig.baseMonthlyPrice}
                  onChange={(e) =>
                    setCustomModuleConfig((prev) => ({
                      ...prev,
                      baseMonthlyPrice: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  ค่าเริ่มต้น Fallback: 490 บาท
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  จำนวนสมาชิกฟรีใน Base Core (คน)
                </label>
                <input
                  type="number"
                  min={1}
                  value={customModuleConfig.includedBaseSeats}
                  onChange={(e) =>
                    setCustomModuleConfig((prev) => ({
                      ...prev,
                      includedBaseSeats: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  ค่าเริ่มต้น Fallback: 5 คนแรก
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ราคาสมาชิกส่วนเพิ่ม (บาท/คน/เดือน)
                </label>
                <input
                  type="number"
                  min={0}
                  value={customModuleConfig.extraSeatMonthlyPrice}
                  onChange={(e) =>
                    setCustomModuleConfig((prev) => ({
                      ...prev,
                      extraSeatMonthlyPrice: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  ค่าเริ่มต้น Fallback: 50 บาท/คน
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ส่วนลดเมื่อชำระรายปี (แถมฟรี X เดือน)
                </label>
                <input
                  type="number"
                  min={0}
                  max={11}
                  value={customModuleConfig.yearlyDiscountMonths}
                  onChange={(e) =>
                    setCustomModuleConfig((prev) => ({
                      ...prev,
                      yearlyDiscountMonths: Math.min(11, Math.max(0, Number(e.target.value) || 0)),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="block text-[11px] text-slate-400 mt-1">
                  ค่าเริ่มต้น Fallback: แถมฟรี 2 เดือน (คิดราคา 10 เดือน)
                </span>
              </div>
            </div>
          </div>

          {/* Per-Module Price & Description Table by Group */}
          <div className="space-y-5">
            {(['WORKSPACE', 'PRODUCTION', 'OFFICE', 'ADMIN'] as ModuleGroupId[]).map((groupId) => {
              const groupMods = customModuleConfig.modules.filter((m) => m.group === groupId);

              return (
                <div
                  key={groupId}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900">{GROUP_LABELS[groupId]}</h4>
                    <span className="text-xs font-semibold text-slate-400">
                      {groupMods.length} โมดูล
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupMods.map((mod) => (
                      <div
                        key={mod.key}
                        className={`p-4 rounded-xl border space-y-3 ${
                          mod.isCore
                            ? 'bg-emerald-50/40 border-emerald-200/80'
                            : 'bg-slate-50/70 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-200/80 text-slate-700">
                              {mod.key}
                            </span>
                            <input
                              type="text"
                              value={mod.label}
                              onChange={(e) => updateModuleItem(mod.key, { label: e.target.value })}
                              className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={Boolean(mod.isCore)}
                              onChange={(e) =>
                                updateModuleItem(mod.key, {
                                  isCore: e.target.checked,
                                  monthlyPrice: e.target.checked ? 0 : mod.monthlyPrice || 190,
                                })
                              }
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <Lock className="w-3 h-3 text-emerald-600" />
                            <span>ฟรีใน Base Core</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              ราคา/เดือน (฿)
                            </label>
                            <input
                              type="number"
                              min={0}
                              disabled={Boolean(mod.isCore)}
                              value={mod.isCore ? 0 : mod.monthlyPrice}
                              onChange={(e) =>
                                updateModuleItem(mod.key, {
                                  monthlyPrice: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs font-bold font-mono text-indigo-700 bg-white border border-slate-200 rounded-lg disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              คำอธิบายสั้นในการ์ดเลือกสูตร
                            </label>
                            <input
                              type="text"
                              value={mod.description}
                              onChange={(e) =>
                                updateModuleItem(mod.key, { description: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SHOWCASE VIDEOS */}
      {activeSubTab === 'VIDEOS' && (
        <div className="space-y-6">
          {/* Hero Video Main Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">วิดีโอหลักหน้าแรก (Hero Showcase Video)</h3>
                  <p className="text-xs text-slate-500">คลิปหลักที่แสดงในส่วนหัวของหน้า Landing Page เมื่อกดปุ่ม Play</p>
                </div>
              </div>

              {heroVideo.url && (
                <button
                  type="button"
                  onClick={() => setShowHeroPreview((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showHeroPreview ? 'ซ่อนพรีวิว' : 'ทดสอบพรีวิวสด'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={heroVideo.url}
                  onChange={(e) => setHeroVideo({ ...heroVideo, url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... หรือ https://drive.google.com/file/d/.../view"
                  className="w-full px-3 py-2 text-xs font-mono text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <select
                  value={heroVideo.type || 'youtube'}
                  onChange={(e) => setHeroVideo({ ...heroVideo, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="youtube">YouTube Embed</option>
                  <option value="drive">Google Drive Video</option>
                  <option value="direct">Direct File Stream (.mp4)</option>
                  <option value="auto">Auto Detect</option>
                </select>
              </div>
            </div>

            {showHeroPreview && parsedHero.embedUrl && (
              <div className="mt-4 p-2 bg-slate-900 rounded-xl overflow-hidden max-w-xl">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={parsedHero.embedUrl}
                    title="Hero Video Preview"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6 Features Video Grid */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">วิดีโอสาธิตฟีเจอร์ทั้ง 6 รายการ (Feature Showcase Cards)</h3>
                <p className="text-xs text-slate-500">สามารถวางลิงก์ YouTube ปกติ หรือลิงก์ Google Drive ได้ทันที ระบบจะแปลงเป็น Embed ให้อัตโนมัติ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURE_METADATA.map((meta) => {
                const currentVideo = featureVideos[meta.id] || {
                  videoUrl: '',
                  durationLabel: '02:00',
                  description: '',
                };

                return (
                  <VideoShowcaseEditorCard
                    key={meta.id}
                    id={meta.id}
                    title={meta.title}
                    categoryLabel={meta.category}
                    config={currentVideo}
                    onChange={(updated) => updateSingleVideo(meta.id, updated)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
