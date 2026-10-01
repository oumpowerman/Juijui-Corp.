import React, { useState, useMemo } from 'react';
import { 
  Instagram, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Building2, 
  Users, 
  ArrowRight, 
  ShieldCheck,
  ShieldAlert,
  Info,
  Radio,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIgConnectionStatus, ChannelIgStatusItem, ChannelIgStatusType } from '../../../../../../hooks/useIgConnectionStatus';
import { Channel } from '../../../../../../types';

interface IgConnectionOverviewTabProps {
  channels: Channel[];
  onNavigateToPlatformsTab?: () => void;
  onEditChannel?: (channel: Channel) => void;
}

export const IgConnectionOverviewTab: React.FC<IgConnectionOverviewTabProps> = ({
  channels: propChannels,
  onNavigateToPlatformsTab,
  onEditChannel
}) => {
  const { channels, summary, loading, timestamp, refresh } = useIgConnectionStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ChannelIgStatusType>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered channels list
  const filteredChannels = useMemo(() => {
    return channels.filter(item => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.channelName.toLowerCase().includes(query);
        const matchesUsername = item.igUsername.toLowerCase().includes(query);
        const matchesGroup = item.groupName?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesUsername && !matchesGroup) {
          return false;
        }
      }

      // 2. Status Tab Filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [channels, searchQuery, statusFilter]);

  const formattedTime = useMemo(() => {
    if (!timestamp) return null;
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return null;
    }
  }, [timestamp]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-pink-300">
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram Status Visibility Center</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>ตรวจสอบสถานะความพร้อม Instagram & Meta Graph</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ภาพรวมทุกช่องและแบรนด์ในระบบ ดูได้ทันทีว่าช่องไหนเชื่อมต่อ Meta Graph สำเร็จ (ดึงข้อมูล/ผู้ติดตามอัตโนมัติได้) หรือช่องไหนที่ยังไม่ได้ผูก Token
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={loading}
              onClick={() => refresh(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer backdrop-blur-sm shadow-xs disabled:opacity-50"
              title="ตรวจเช็คสถานะการเชื่อมต่อ Meta API สดใหม่ทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-pink-400' : 'text-slate-300'}`} />
              <span>{loading ? 'กำลังตรวจสอบ...' : 'ตรวจเช็คสถานะสดใหม่'}</span>
            </button>

            {onNavigateToPlatformsTab && (
              <button
                type="button"
                onClick={onNavigateToPlatformsTab}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>จัดการ Meta Token</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {formattedTime && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>ตรวจสอบล่าสุด: {formattedTime} น.</span>
            <span>พบทั้งหมด {summary.discoveredAccountsCount} บัญชีใน {summary.activeTokensCount} Token</span>
          </div>
        )}
      </div>

      {/* 2. 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Channels */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            statusFilter === 'ALL'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">ช่องทั้งหมดในระบบ</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{summary.totalChannels}</span>
            <span className="text-xs text-slate-400 font-semibold">ช่อง</span>
          </div>
        </div>

        {/* Connected 🟢 */}
        <div 
          onClick={() => setStatusFilter('CONNECTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            statusFilter === 'CONNECTED'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>เชื่อมต่อ Meta สำเร็จ</span>
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{summary.connectedCount}</span>
            <span className="text-xs text-emerald-600/80 font-semibold">
              ({summary.totalChannels > 0 ? Math.round((summary.connectedCount / summary.totalChannels) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Not Found in Token ⚠️ */}
        <div 
          onClick={() => setStatusFilter('NOT_FOUND_IN_TOKEN')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            statusFilter === 'NOT_FOUND_IN_TOKEN'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>มีลิงก์แต่ยังไม่พบใน Token</span>
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{summary.notFoundCount}</span>
            <span className="text-xs text-amber-600/80 font-semibold">ช่อง</span>
          </div>
        </div>

        {/* No IG Link ❌ */}
        <div 
          onClick={() => setStatusFilter('NO_IG_LINK')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            statusFilter === 'NO_IG_LINK'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>ยังไม่มีลิงก์ IG</span>
            </span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-600">{summary.noLinkCount}</span>
            <span className="text-xs text-slate-400 font-semibold">ช่อง</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            ทั้งหมด ({summary.totalChannels})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CONNECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'CONNECTED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>เชื่อมต่อแล้ว ({summary.connectedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('NOT_FOUND_IN_TOKEN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'NOT_FOUND_IN_TOKEN'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>ยังไม่พบใน Token ({summary.notFoundCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('NO_IG_LINK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'NO_IG_LINK'
                ? 'bg-slate-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>ไม่มีลิงก์ ({summary.noLinkCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อช่อง, แบรนด์ หรือ @username..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      {/* 4. Channels Table List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ช่อง / รายการ</th>
                <th className="py-3.5 px-4">บัญชี Instagram ในระบบ</th>
                <th className="py-3.5 px-4">สถานะ Meta Graph</th>
                <th className="py-3.5 px-4 text-right">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Instagram className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-slate-600">ไม่พบรายการช่องตามเงื่อนไขที่เลือก</p>
                      <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะด้านบน</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredChannels.map((item) => {
                  const targetChannel = propChannels.find(c => c.id === item.channelId);

                  return (
                    <tr 
                      key={item.channelId}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Column 1: Channel Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden bg-white shrink-0 flex items-center justify-center">
                            {item.logoUrl ? (
                              <img src={item.logoUrl} alt={item.channelName} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center font-bold text-xs text-white ${item.color?.split(' ')[0] || 'bg-indigo-600'}`}>
                                {item.channelName.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 truncate">{item.channelName}</span>
                              {item.groupName && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                                  {item.groupName}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {item.channelId.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Instagram URL / Handle */}
                      <td className="py-3.5 px-4">
                        {item.igUrl ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-pink-200/70 text-pink-900 font-bold">
                              <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                              <span>@{item.igUsername || 'unknown'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[220px]">
                              <span className="truncate">{item.igUrl}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 italic">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ยังไม่มีลิงก์ IG ในระบบ</span>
                          </span>
                        )}
                      </td>

                      {/* Column 3: Status Badge */}
                      <td className="py-3.5 px-4">
                        {item.status === 'CONNECTED' ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>เชื่อมต่อ Meta สำเร็จ 🟢</span>
                            </div>
                            <p className="text-[11px] text-emerald-700 leading-tight">
                              {item.message}
                            </p>
                          </div>
                        ) : item.status === 'NOT_FOUND_IN_TOKEN' ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>มีลิงก์แต่ยังไม่พบใน Token ⚠️</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              ไม่พบบัญชีนี้ใน Token Pool (อาจเป็นบัญชีส่วนตัว หรือยังไม่ได้เพิ่มสิทธิ์ Page)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>ยังไม่มีลิงก์ IG ❌</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight">
                              ระบุ URL บัญชี IG ในหน้าตั้งค่าช่องเพื่อเริ่มตรวจสอบ
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Column 4: Quick Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {item.igUrl && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(item.igUrl, item.channelId, e)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
                                title="คัดลอกลิงก์ Instagram"
                              >
                                {copiedId === item.channelId ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>

                              <a
                                href={item.igUrl.startsWith('http') ? item.igUrl : `https://${item.igUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-all cursor-pointer active:scale-95"
                                title="เปิดดูหน้า Instagram ในแท็บใหม่"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </>
                          )}

                          {onEditChannel && targetChannel && (
                            <button
                              type="button"
                              onClick={() => onEditChannel(targetChannel)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-all cursor-pointer active:scale-95 ml-1"
                              title="เปิดหน้าต่างแก้ไขข้อมูลช่อง"
                            >
                              แก้ไขช่อง
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Advisory Card for Meta Graph Requirements */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-800">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>เงื่อนไขสำคัญในการเชื่อมต่อ Instagram ผ่าน Meta Graph API:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-amber-800/90 pl-1 leading-relaxed">
          <li>บัญชี Instagram ต้องเปลี่ยนเป็นประเภท <strong>Business Account</strong> หรือ <strong>Creator Account</strong> (ไม่สามารถใช้บัญชีส่วนบุคคล Personal ได้)</li>
          <li>บัญชี Instagram ต้องผูกเข้ากับ <strong>Facebook Page</strong> ที่ Meta Access Token ของคุณถือสิทธิ์ผู้ดูแลระบบ (Admin)</li>
          <li>หากเพิ่มเพจหรือบัญชี IG ใหม่ใน Meta for Developers แนะนำให้กดปุ่ม <strong>"ตรวจเช็คสถานะสดใหม่"</strong> ด้านบนเพื่อให้ระบบรีเฟรชรายชื่อบัญชีอัตโนมัติ</li>
        </ul>
      </div>
    </div>
  );
};
