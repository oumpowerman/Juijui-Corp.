import React, { useState, useEffect, useMemo } from 'react';
import { MasterOption } from '../../../../types';
import { 
  Lightbulb, 
  Sparkles, 
  Power, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Info, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  Edit2,
  Check
} from 'lucide-react';
import { 
  DEFAULT_MENTOR_TIPS, 
  DEFAULT_MENTOR_TIPS_GLOBAL_SETTINGS, 
  MentorTipModuleId, 
  MentorTipModuleConfig, 
  MentorTipsGlobalSettings 
} from '../../../../config/mentorTips';
import { useToast } from '../../../../context/ToastContext';

interface MentorTipsMasterViewProps {
  masterOptions: MasterOption[];
  onUpdate: (option: MasterOption) => Promise<boolean>;
  onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
}

const MentorTipsMasterView: React.FC<MentorTipsMasterViewProps> = ({ masterOptions, onUpdate, onAdd }) => {
  const { showToast } = useToast();

  const existingConfigOption = useMemo(() => {
    return masterOptions.find(o => o.type === 'MENTOR_TIP_CONFIG' && o.key === 'SETTINGS');
  }, [masterOptions]);

  const [settings, setSettings] = useState<MentorTipsGlobalSettings>(() => {
    if (existingConfigOption?.description) {
      try {
        const parsed = JSON.parse(existingConfigOption.description) as MentorTipsGlobalSettings;
        return {
          isGloballyEnabled: parsed.isGloballyEnabled ?? true,
          moduleSettings: {
            ...DEFAULT_MENTOR_TIPS_GLOBAL_SETTINGS.moduleSettings,
            ...parsed.moduleSettings
          }
        };
      } catch (e) {
        console.error('Failed to parse mentor tips settings', e);
      }
    }
    return DEFAULT_MENTOR_TIPS_GLOBAL_SETTINGS;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [newTipInputs, setNewTipInputs] = useState<Record<string, string>>({});

  // Sync if existingConfigOption changes externally
  useEffect(() => {
    if (existingConfigOption?.description) {
      try {
        const parsed = JSON.parse(existingConfigOption.description) as MentorTipsGlobalSettings;
        setSettings({
          isGloballyEnabled: parsed.isGloballyEnabled ?? true,
          moduleSettings: {
            ...DEFAULT_MENTOR_TIPS_GLOBAL_SETTINGS.moduleSettings,
            ...parsed.moduleSettings
          }
        });
      } catch (e) {
        console.error('Failed to parse mentor tips settings', e);
      }
    }
  }, [existingConfigOption]);

  const toggleGlobal = () => {
    setSettings(prev => ({
      ...prev,
      isGloballyEnabled: !prev.isGloballyEnabled
    }));
  };

  const toggleModule = (id: MentorTipModuleId) => {
    setSettings(prev => {
      const currentModule = prev.moduleSettings[id] || { isEnabled: true };
      return {
        ...prev,
        moduleSettings: {
          ...prev.moduleSettings,
          [id]: {
            ...currentModule,
            isEnabled: !currentModule.isEnabled
          }
        }
      };
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddTip = (id: MentorTipModuleId) => {
    const text = (newTipInputs[id] || '').trim();
    if (!text) return;

    setSettings(prev => {
      const currentModule = prev.moduleSettings[id] || { isEnabled: true };
      const currentMessages = currentModule.customMessages 
        ? [...currentModule.customMessages]
        : [...DEFAULT_MENTOR_TIPS[id].defaultMessages];

      return {
        ...prev,
        moduleSettings: {
          ...prev.moduleSettings,
          [id]: {
            ...currentModule,
            customMessages: [...currentMessages, text]
          }
        }
      };
    });

    setNewTipInputs(prev => ({ ...prev, [id]: '' }));
  };

  const handleDeleteTip = (id: MentorTipModuleId, index: number) => {
    setSettings(prev => {
      const currentModule = prev.moduleSettings[id] || { isEnabled: true };
      const currentMessages = currentModule.customMessages 
        ? [...currentModule.customMessages]
        : [...DEFAULT_MENTOR_TIPS[id].defaultMessages];

      currentMessages.splice(index, 1);

      return {
        ...prev,
        moduleSettings: {
          ...prev.moduleSettings,
          [id]: {
            ...currentModule,
            customMessages: currentMessages
          }
        }
      };
    });
  };

  const handleEditTip = (id: MentorTipModuleId, index: number, newText: string) => {
    setSettings(prev => {
      const currentModule = prev.moduleSettings[id] || { isEnabled: true };
      const currentMessages = currentModule.customMessages 
        ? [...currentModule.customMessages]
        : [...DEFAULT_MENTOR_TIPS[id].defaultMessages];

      currentMessages[index] = newText;

      return {
        ...prev,
        moduleSettings: {
          ...prev.moduleSettings,
          [id]: {
            ...currentModule,
            customMessages: currentMessages
          }
        }
      };
    });
  };

  const handleResetModule = (id: MentorTipModuleId) => {
    setSettings(prev => {
      const currentModule = prev.moduleSettings[id] || { isEnabled: true };
      return {
        ...prev,
        moduleSettings: {
          ...prev.moduleSettings,
          [id]: {
            isEnabled: currentModule.isEnabled,
            customMessages: undefined // Clears custom to use default
          }
        }
      };
    });
    showToast(`คืนค่าเริ่มต้นสำหรับ "${DEFAULT_MENTOR_TIPS[id].name}" แล้ว`, 'info');
  };

  const handleResetAllToDefaults = () => {
    if (window.confirm('คุณต้องการรีเซ็ตคำแนะนำและเปิดการแสดงผลทุกหน้ากลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      setSettings(DEFAULT_MENTOR_TIPS_GLOBAL_SETTINGS);
      showToast('คืนค่าเริ่มต้นทุกหน้าเรียบร้อยแล้ว อย่าลืมกดบันทึกนะ ✨', 'info');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payloadString = JSON.stringify(settings);
      let success = false;

      if (existingConfigOption) {
        success = await onUpdate({
          ...existingConfigOption,
          label: settings.isGloballyEnabled ? 'เปิดใช้งาน Mentor Tips ทั่วระบบ' : 'ปิดใช้งาน Mentor Tips ทั่วระบบ',
          description: payloadString,
          isActive: settings.isGloballyEnabled
        });
      } else {
        success = await onAdd({
          type: 'MENTOR_TIP_CONFIG',
          key: 'SETTINGS',
          label: settings.isGloballyEnabled ? 'เปิดใช้งาน Mentor Tips ทั่วระบบ' : 'ปิดใช้งาน Mentor Tips ทั่วระบบ',
          description: payloadString,
          color: '#f59e0b',
          sortOrder: 1,
          isActive: settings.isGloballyEnabled
        });
      }

      if (success) {
        showToast('บันทึกการตั้งค่า Mentor Tips เรียบร้อยแล้ว! ✨', 'success');
      } else {
        showToast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error');
      }
    } catch (error: any) {
      console.error('Error saving mentor tips settings:', error);
      showToast('เกิดข้อผิดพลาด: ' + (error?.message || 'ไม่สามารถบันทึกได้'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const moduleList = Object.values(DEFAULT_MENTOR_TIPS);

  // Variant color mapping for badges
  const variantBadgeStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Global Switch Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
                <Lightbulb className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                System Guidance & Knowledge Base
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              จัดการคำแนะนำระบบ (Mentor Tips)
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              ควบคุมการแสดงแถบข้อคิด/เทคนิคการทำงาน (Mentor Tips) ในแต่ละหน้าจอของแอปพลิเคชัน คุณสามารถเปิด-ปิดทั้งระบบ สลับเปิดเฉพาะบางหน้า หรือแก้ไขข้อความคำแนะนำให้ตรงกับวัฒนธรรมองค์กรได้ทันที
            </p>
          </div>

          {/* Action buttons & Global Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Global Master Switch */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex items-center justify-between gap-4">
              <div className="text-left">
                <div className="text-xs text-slate-400 font-bold uppercase">สถานะทั้งระบบ</div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${settings.isGloballyEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {settings.isGloballyEnabled ? 'เปิดใช้งานทั้งหมด' : 'ปิดใช้งานทั้งระบบ'}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleGlobal}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  settings.isGloballyEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                title={settings.isGloballyEnabled ? 'คลิกเพื่อปิดทั้งระบบ' : 'คลิกเพื่อเปิด'}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.isGloballyEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-2xl shadow-lg shadow-orange-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Notice if disabled */}
      {!settings.isGloballyEnabled && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm font-medium animate-in fade-in">
          <EyeOff className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>สถานะปัจจุบัน: ปิดการแสดงผล Mentor Tips ทั่วทั้งระบบ</strong> — แถบคำแนะนำทั้งหมดในทุกหน้าจอจะถูกซ่อนไว้ชั่วคราว
          </span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-gray-800">
            รายการหน้าจอในระบบ ({moduleList.length} หน้า)
          </h3>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetAllToDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้นทุกหน้า</span>
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {moduleList.map((mod) => {
          const modSettings = settings.moduleSettings[mod.id] || { isEnabled: true };
          const isModEnabled = modSettings.isEnabled && settings.isGloballyEnabled;
          const isExpanded = !!expandedModules[mod.id];
          const messages = modSettings.customMessages || mod.defaultMessages;
          const isCustomized = !!modSettings.customMessages;

          return (
            <div
              key={mod.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                modSettings.isEnabled ? 'border-gray-200 hover:border-indigo-200' : 'border-slate-200 bg-slate-50/60 opacity-80'
              }`}
            >
              {/* Header row */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  {/* Module Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden mt-0.5 sm:mt-0 ${
                      modSettings.isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                    title={modSettings.isEnabled ? 'คลิกเพื่อปิดหน้านี้' : 'คลิกเพื่อเปิดหน้านี้'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        modSettings.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-gray-900">
                        {mod.name}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${variantBadgeStyles[mod.variant]}`}>
                        {mod.variant} theme
                      </span>
                      {isCustomized ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> แก้ไขแล้ว ({messages.length} ข้อความ)
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          ค่าเริ่มต้น ({messages.length} ข้อความ)
                        </span>
                      )}
                    </div>
                    {mod.description && (
                      <p className="text-xs text-gray-500">{mod.description}</p>
                    )}
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleExpand(mod.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isExpanded ? 'ซ่อนการแก้ไข' : 'ดู & แก้ไขข้อความ'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Tips Editor */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-1 sm:px-6 border-t border-gray-100 space-y-4 bg-slate-50/40 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> รายการคำแนะนำในหน้านี้ ({messages.length})
                    </span>
                    {isCustomized && (
                      <button
                        type="button"
                        onClick={() => handleResetModule(mod.id)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> คืนค่าเริ่มต้นของหน้านี้
                      </button>
                    )}
                  </div>

                  {/* Tip items list */}
                  <div className="space-y-2.5">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs flex items-start gap-3 group"
                      >
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0 mt-1">
                          #{index + 1}
                        </span>
                        <textarea
                          rows={2}
                          value={msg}
                          onChange={(e) => handleEditTip(mod.id, index, e.target.value)}
                          className="flex-1 text-xs text-slate-800 bg-transparent border-0 focus:ring-2 focus:ring-indigo-100 focus:bg-indigo-50/30 rounded-lg p-1 resize-none outline-none leading-relaxed"
                          placeholder="พิมพ์ข้อความคำแนะนำ..."
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteTip(mod.id, index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="ลบคำแนะนำนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {messages.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        ยังไม่มีข้อความคำแนะนำในหน้านี้
                      </div>
                    )}
                  </div>

                  {/* Add new tip input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newTipInputs[mod.id] || ''}
                      onChange={(e) => setNewTipInputs(prev => ({ ...prev, [mod.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTip(mod.id);
                        }
                      }}
                      placeholder="เพิ่มข้อความคำแนะนำใหม่สำหรับหน้านี้ แล้วกด Enter..."
                      className="flex-1 text-xs px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTip(mod.id)}
                      disabled={!(newTipInputs[mod.id] || '').trim()}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Save Bar on Mobile/Desktop */}
      <div className="sticky bottom-6 z-20 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-2xl shadow-xl shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าทั้งหมด ✨'}</span>
        </button>
      </div>

    </div>
  );
};

export default MentorTipsMasterView;
