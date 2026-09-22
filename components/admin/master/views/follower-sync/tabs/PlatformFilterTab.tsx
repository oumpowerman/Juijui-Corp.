import React, { useState } from 'react';
import { 
    Layers, 
    Youtube, 
    Facebook, 
    Instagram, 
    Smartphone, 
    Key, 
    CheckCircle2, 
    XCircle, 
    ExternalLink, 
    ChevronDown, 
    ChevronUp, 
    Eye, 
    EyeOff, 
    Sparkles, 
    RefreshCw, 
    HelpCircle, 
    ShieldCheck,
    Building2,
    Users,
    Plus,
    Trash2,
    Layers3
} from 'lucide-react';
import { FollowerSyncConfig, FollowerSyncPlatformSettings, MetaApiConfig, MetaTokenItem } from '../types';

interface PlatformFilterTabProps {
    config: FollowerSyncConfig;
    onChange: (updater: (prev: FollowerSyncConfig) => FollowerSyncConfig) => void;
}

interface TestAccountResult {
    id: string;
    username: string;
    name?: string;
    followersCount: number;
    source: 'page_linked' | 'direct_id' | 'instagram_login';
    pageName?: string;
}

export const PlatformFilterTab: React.FC<PlatformFilterTabProps> = ({
    config,
    onChange
}) => {
    const [testingTokenId, setTestingTokenId] = useState<string | null>(null);
    const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
    const [tokenTestResults, setTokenTestResults] = useState<Record<string, {
        tested: boolean;
        success: boolean;
        message?: string;
        user?: { id: string; name: string };
        accounts?: TestAccountResult[];
    }>>({});
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const metaApi: MetaApiConfig = config.metaApi || {
        enabled: false,
        accessToken: '',
        businessAccountId: '',
    };

    const handleTogglePlatform = (platform: keyof FollowerSyncPlatformSettings) => {
        onChange(prev => ({
            ...prev,
            platforms: {
                ...prev.platforms,
                [platform]: !prev.platforms[platform],
            }
        }));
    };

    const handleMetaChange = (field: keyof MetaApiConfig, value: any) => {
        onChange(prev => ({
            ...prev,
            metaApi: {
                ...(prev.metaApi || { enabled: false, accessToken: '', businessAccountId: '' }),
                [field]: value
            }
        }));
    };

    // Extract active pool or migrate legacy single token
    const tokenPool: MetaTokenItem[] = React.useMemo(() => {
        if (metaApi.tokenPool && metaApi.tokenPool.length > 0) {
            return metaApi.tokenPool;
        }
        if (metaApi.accessToken?.trim()) {
            return [{
                id: 'default-primary',
                label: 'Token ส่วนกลางหลัก (Default)',
                accessToken: metaApi.accessToken,
                businessAccountId: metaApi.businessAccountId || '',
                enabled: true,
                createdAt: new Date().toISOString(),
            }];
        }
        return [];
    }, [metaApi.tokenPool, metaApi.accessToken, metaApi.businessAccountId]);

    const updateTokenPool = (newPool: MetaTokenItem[]) => {
        const firstActive = newPool.find(t => t.enabled && t.accessToken.trim()) || newPool[0];
        onChange(prev => ({
            ...prev,
            metaApi: {
                ...(prev.metaApi || { enabled: false, accessToken: '', businessAccountId: '' }),
                tokenPool: newPool,
                accessToken: firstActive?.accessToken || '',
                businessAccountId: firstActive?.businessAccountId || '',
            }
        }));
    };

    const handleAddTokenItem = () => {
        const newItem: MetaTokenItem = {
            id: crypto.randomUUID(),
            label: `Token ชุดที่ ${tokenPool.length + 1}`,
            accessToken: '',
            businessAccountId: '',
            enabled: true,
            createdAt: new Date().toISOString(),
        };
        updateTokenPool([...tokenPool, newItem]);
    };

    const handleUpdateTokenItem = (id: string, partial: Partial<MetaTokenItem>) => {
        const updated = tokenPool.map(item => item.id === id ? { ...item, ...partial } : item);
        updateTokenPool(updated);
        if ('accessToken' in partial || 'businessAccountId' in partial) {
            setTokenTestResults(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    const handleDeleteTokenItem = (id: string) => {
        const updated = tokenPool.filter(item => item.id !== id);
        updateTokenPool(updated);
        setTokenTestResults(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleTestTokenItem = async (item: MetaTokenItem) => {
        const token = (item.accessToken || '').trim();
        if (!token) {
            setTokenTestResults(prev => ({
                ...prev,
                [item.id]: {
                    tested: true,
                    success: false,
                    message: 'กรุณากรอก Meta Access Token ก่อนทดสอบครับ'
                }
            }));
            return;
        }

        setTestingTokenId(item.id);
        try {
            const res = await fetch('/api/follower-sync/test-meta-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken: token,
                    businessAccountId: item.businessAccountId?.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setTokenTestResults(prev => ({
                    ...prev,
                    [item.id]: {
                        tested: true,
                        success: true,
                        user: data.user,
                        accounts: data.accounts || [],
                    }
                }));
            } else {
                setTokenTestResults(prev => ({
                    ...prev,
                    [item.id]: {
                        tested: true,
                        success: false,
                        message: data.error || 'Token ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง Instagram API'
                    }
                }));
            }
        } catch (err: any) {
            setTokenTestResults(prev => ({
                ...prev,
                [item.id]: {
                    tested: true,
                    success: false,
                    message: err?.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อทดสอบ Token ได้'
                }
            }));
        } finally {
            setTestingTokenId(null);
        }
    };

    const enabledPlatformCount = Object.values(config.platforms).filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header Description */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            <span>แพลตฟอร์มเป้าหมาย (Platform Scope Filter)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            เปิดหรือปิดแพลตฟอร์มส่วนกลาง หากปิดระบบจะไม่ยิง Request ไปยังแพลตฟอร์มนั้นๆ ในทุกช่องรายการ
                        </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        เปิด {enabledPlatformCount} จาก 4 แพลตฟอร์ม
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* YouTube */}
                    <div 
                        onClick={() => handleTogglePlatform('YOUTUBE')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            config.platforms.YOUTUBE 
                                ? 'bg-rose-50/60 border-rose-400 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Youtube className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">YouTube</h4>
                                <p className="text-xs text-slate-500 mt-0.5">ดึงยอด Subscriber (ระบบ Multi-pattern แม่นยำ 100%)</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                                    ✓ ความแม่นยำสูง ดึงได้ทันที
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.platforms.YOUTUBE}
                            onChange={() => {}}
                            className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer mt-0.5"
                        />
                    </div>

                    {/* Facebook */}
                    <div 
                        onClick={() => handleTogglePlatform('FACEBOOK')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            config.platforms.FACEBOOK 
                                ? 'bg-blue-50/60 border-blue-400 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Facebook className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Facebook Page</h4>
                                <p className="text-xs text-slate-500 mt-0.5">สกัดยอดผู้ติดตาม & ยอดถูกใจ (รองรับภาษาไทย/อังกฤษ)</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md">
                                    ✓ Smart Regex Parser
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.platforms.FACEBOOK}
                            onChange={() => {}}
                            className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                        />
                    </div>

                    {/* Instagram */}
                    <div 
                        onClick={() => handleTogglePlatform('INSTAGRAM')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            config.platforms.INSTAGRAM 
                                ? 'bg-pink-50/60 border-pink-400 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Instagram className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900">Instagram Profile</h4>
                                    {metaApi.enabled && metaApi.accessToken ? (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                            Graph API ✓
                                        </span>
                                    ) : null}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">ดึงยอดผ่าน Meta Graph API (หรือ Open Graph)</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold text-pink-700 bg-pink-100/90 px-2 py-0.5 rounded-md">
                                    {metaApi.enabled && metaApi.accessToken 
                                        ? '✓ เชื่อมต่อ Meta API พร้อมใช้งาน' 
                                        : '⚙️ แนะนำใส่ Meta Token ด้านล่าง'}
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.platforms.INSTAGRAM}
                            onChange={() => {}}
                            className="w-5 h-5 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer mt-0.5"
                        />
                    </div>

                    {/* TikTok */}
                    <div 
                        onClick={() => handleTogglePlatform('TIKTOK')}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                            config.platforms.TIKTOK 
                                ? 'bg-slate-100 border-slate-600 shadow-xs' 
                                : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-90'
                        }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">TikTok</h4>
                                <p className="text-xs text-slate-500 mt-0.5">ดึงยอด Follower (TikTok มีระบบ Cloudflare ป้องกันบอท)</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                                    {config.platforms.TIKTOK ? '⚠️ เปิดอยู่ (อาจติด Anti-bot บางครั้ง)' : '✓ ปิดไว้เพื่อประหยัดเน็ต'}
                                </span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.platforms.TIKTOK}
                            onChange={() => {}}
                            className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-slate-800 cursor-pointer mt-0.5"
                        />
                    </div>
                </div>
            </div>

            {/* Meta Graph API Integration Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">Meta Graph API สำหรับ Instagram</h3>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                                    Official API
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                แก้ปัญหา Instagram บล็อก IP Server โดยดึงยอดผ่าน Official Meta API สำหรับช่องของตนเองหรือบริษัท
                            </p>
                        </div>
                    </div>

                    {/* Enable Meta API Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={metaApi.enabled}
                            onChange={(e) => handleMetaChange('enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-xs font-semibold text-slate-700">
                            {metaApi.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                    </label>
                </div>

                {/* Fallback Hierarchy Note */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                    <Layers3 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-indigo-950 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                            <span>ลำดับการทำงานของ Meta Token (Priority Hierarchy)</span>
                        </div>
                        <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                            <strong>1. Per-Channel Meta Setting:</strong> หากช่องใดกรอก Meta Token เฉพาะตัวในหน้าแก้ไขช่อง ระบบจะใช้ Token ประจำช่องนั้นก่อนเสมอ<br />
                            <strong>2. Multi-Token Pool (ด้านล่าง):</strong> หากช่องใดไม่ได้กรอก ระบบจะนำ Token ทั้งหมดใน Pool ที่เปิดใช้งาน ไปค้นหาบัญชี Instagram ที่ตรงกับ username ของช่องนั้นให้อัตโนมัติ (รองรับได้หลายแบรนด์ / หลาย Agency พร้อมกัน)
                        </p>
                    </div>
                </div>

                {/* Multi-Token Pool Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-bold text-slate-800">
                                ชุด Token ในระบบ (Multi-Token Pool)
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                                {tokenPool.length} ชุด
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddTokenItem}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-98 cursor-pointer w-fit"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ เพิ่ม Token ใหม่</span>
                        </button>
                    </div>

                    {/* Empty Pool State */}
                    {tokenPool.length === 0 ? (
                        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                                <Key className="w-6 h-6" />
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-slate-800">ยังไม่มี Token ใน Pool</h5>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    เพิ่ม Token ส่วนกลางหรือ Token ของแต่ละแบรนด์เพื่อให้ระบบดึงยอด Instagram อัตโนมัติ
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddTokenItem}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-98"
                            >
                                <Plus className="w-4 h-4" />
                                <span>เพิ่ม Token ชุดแรก</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tokenPool.map((tokenItem, index) => {
                                const isVisible = !!visibleTokens[tokenItem.id];
                                const isTestingItem = testingTokenId === tokenItem.id;
                                const itemTestResult = tokenTestResults[tokenItem.id];

                                return (
                                    <div 
                                        key={tokenItem.id} 
                                        className={`p-4 rounded-2xl border transition-all ${
                                            tokenItem.enabled 
                                                ? 'bg-slate-50/50 border-slate-200 shadow-xs' 
                                                : 'bg-slate-100/60 border-slate-200/80 opacity-70'
                                        }`}
                                    >
                                        {/* Token Item Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                                    #{index + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={tokenItem.label}
                                                    onChange={(e) => handleUpdateTokenItem(tokenItem.id, { label: e.target.value })}
                                                    placeholder="เช่น Token บริษัทแม่, Token แบรนด์ A, Token เอเจนซี่ B"
                                                    className="text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1.5 py-1 rounded transition-colors flex-1 max-w-md focus:outline-none"
                                                />
                                            </div>

                                            <div className="flex items-center gap-3 self-end sm:self-center">
                                                {/* Enable/Disable switch for this token */}
                                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={tokenItem.enabled}
                                                        onChange={(e) => handleUpdateTokenItem(tokenItem.id, { enabled: e.target.checked })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                                    <span className="ml-2 text-[11px] font-semibold text-slate-600">
                                                        {tokenItem.enabled ? 'เปิดใช้' : 'ปิด'}
                                                    </span>
                                                </label>

                                                {/* Delete button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTokenItem(tokenItem.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                                    title="ลบ Token ชุดนี้"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Token Item Body */}
                                        <div className="pt-3 space-y-3">
                                            {/* Meta Access Token */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                                        <Key className="w-3 h-3 text-indigo-600" />
                                                        <span>Meta Access Token</span>
                                                        <span className="text-rose-500">*</span>
                                                    </label>
                                                    <span className="text-[10px] text-slate-400">
                                                        User Token หรือ Page Token
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type={isVisible ? 'text' : 'password'}
                                                        value={tokenItem.accessToken}
                                                        onChange={(e) => handleUpdateTokenItem(tokenItem.id, { accessToken: e.target.value })}
                                                        placeholder="EAA..."
                                                        className="w-full text-xs font-mono px-3 py-2 pr-16 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                                                    />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setVisibleTokens(prev => ({ ...prev, [tokenItem.id]: !isVisible }))}
                                                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                                            title={isVisible ? 'ซ่อน' : 'แสดง'}
                                                        >
                                                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                        </button>
                                                        {tokenItem.accessToken && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateTokenItem(tokenItem.id, { accessToken: '' })}
                                                                className="text-[10px] text-slate-400 hover:text-rose-500 px-1"
                                                            >
                                                                ล้าง
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Business Account ID & Note Inputs */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                                                        <Building2 className="w-3 h-3 text-purple-600" />
                                                        <span>Instagram Business Account ID (ไม่บังคับ)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={tokenItem.businessAccountId || ''}
                                                        onChange={(e) => handleUpdateTokenItem(tokenItem.id, { businessAccountId: e.target.value })}
                                                        placeholder="เช่น 17841400... (เว้นว่างเพื่อหาอัตโนมัติ)"
                                                        className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                                                        บันทึกช่วยจำ (Note)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={tokenItem.note || ''}
                                                        onChange={(e) => handleUpdateTokenItem(tokenItem.id, { note: e.target.value })}
                                                        placeholder="เช่น เชื่อมโยงกับ Page บริษัท, หมดอายุ พ.ย. 2026"
                                                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            {/* Test Action for this Token */}
                                            <div className="pt-1 flex items-center justify-between gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTestTokenItem(tokenItem)}
                                                    disabled={isTestingItem || !tokenItem.accessToken.trim()}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {isTestingItem ? (
                                                        <>
                                                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                                            <span>กำลังทดสอบ...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                                            <span>ทดสอบ Token ชุดนี้</span>
                                                        </>
                                                    )}
                                                </button>

                                                {itemTestResult?.tested && (
                                                    <span className={`text-[11px] font-bold ${itemTestResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {itemTestResult.success ? '✓ เชื่อมต่อสำเร็จ' : '✕ ล้มเหลว'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Test Result Display for this item */}
                                            {itemTestResult?.tested && (
                                                <div className={`p-3 rounded-xl border text-xs transition-all ${
                                                    itemTestResult.success 
                                                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                                                        : 'bg-rose-50/80 border-rose-200 text-rose-900'
                                                }`}>
                                                    <div className="flex items-start gap-2">
                                                        {itemTestResult.success ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="space-y-1.5 flex-1">
                                                            <div className="font-bold text-[11px]">
                                                                {itemTestResult.success ? (
                                                                    <span>
                                                                        เชื่อมต่อสำเร็จ! บัญชี Meta: {itemTestResult.user?.name || 'Meta User'}
                                                                    </span>
                                                                ) : (
                                                                    <span>การทดสอบล้มเหลว: {itemTestResult.message}</span>
                                                                )}
                                                            </div>

                                                            {itemTestResult.success && itemTestResult.accounts && itemTestResult.accounts.length > 0 ? (
                                                                <div className="space-y-1.5 pt-1">
                                                                    <p className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                                                                        <Users className="w-3 h-3" />
                                                                        <span>พบบัญชี Instagram ({itemTestResult.accounts.length} บัญชี):</span>
                                                                    </p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                                        {itemTestResult.accounts.map((acc) => (
                                                                            <div key={acc.id} className="bg-white p-2 rounded-lg border border-emerald-100 flex items-center justify-between shadow-2xs">
                                                                                <div className="min-w-0 pr-2">
                                                                                    <div className="font-bold text-xs text-slate-800 truncate">@{acc.username}</div>
                                                                                    <div className="text-[9px] text-slate-400 truncate">
                                                                                        {acc.pageName ? `Page: ${acc.pageName}` : `ID: ${acc.id}`}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right shrink-0">
                                                                                    <span className="text-xs font-extrabold text-emerald-700">
                                                                                        {acc.followersCount.toLocaleString()}
                                                                                    </span>
                                                                                    <div className="text-[8px] text-slate-400">ผู้ติดตาม</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : itemTestResult.success ? (
                                                                <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                                                                    ℹ️ Token ถูกต้อง แต่ยังไม่พบบัญชี Instagram ที่ผูกกับ Facebook Page กรุณาตรวจสอบว่าได้ผูก Instagram Business กับ Page ใน Meta Business Suite แล้วหรือยัง
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Step-by-Step Meta for Developers Guide Accordion */}
                <div className="pt-2 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => setIsGuideOpen(!isGuideOpen)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-800">
                                วิธีขอ Meta Access Token สำหรับดึงยอด Instagram (คู่มือแบบเข้าใจง่าย)
                            </span>
                        </div>
                        {isGuideOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                    </button>

                    {isGuideOpen && (
                        <div className="mt-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs text-slate-600 space-y-4">
                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                                <div>
                                    <h5 className="font-bold text-slate-900">เปลี่ยนบัญชี Instagram เป็น Professional Account</h5>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        ในแอป Instagram: ไปที่ การตั้งค่า &gt; ประเภทบัญชีและเครื่องมือ &gt; เปลี่ยนเป็นบัญชีมืออาชีพ (Creator หรือ Business) แล้วผูกกับ Facebook Page ของคุณ
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-bold text-slate-900">เข้า Meta for Developers และสร้าง App</h5>
                                        <a 
                                            href="https://developers.facebook.com/apps" 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-indigo-600 hover:underline flex items-center gap-0.5 font-bold"
                                        >
                                            <span>เปิด developers.facebook.com</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        กด <strong>Create App</strong> &gt; เลือกประเภท <strong>Other</strong> หรือ <strong>Business</strong> &gt; เพิ่มผลิตภัณฑ์ <strong>Instagram Graph API</strong>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-bold text-slate-900">สร้าง Token ผ่าน Graph API Explorer</h5>
                                        <a 
                                            href="https://developers.facebook.com/tools/explorer" 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-indigo-600 hover:underline flex items-center gap-0.5 font-bold"
                                        >
                                            <span>เปิด Graph API Explorer</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        เลือก App ของคุณ &gt; ในช่อง User or Page ให้เลือก <strong>User Token</strong> หรือ <strong>Page Access Token</strong>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        เพิ่ม Permission: <code className="bg-white px-1.5 py-0.5 rounded border text-indigo-700 font-mono text-[10px]">instagram_basic</code>, <code className="bg-white px-1.5 py-0.5 rounded border text-indigo-700 font-mono text-[10px]">pages_show_list</code>, <code className="bg-white px-1.5 py-0.5 rounded border text-indigo-700 font-mono text-[10px]">pages_read_engagement</code>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        กดปุ่ม <strong>Generate Access Token</strong> แล้วคัดลอกรหัสขึ้นต้นด้วย <code className="font-mono text-slate-700">EAA...</code> มาใส่ในช่องด้านบน
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">4</span>
                                <div>
                                    <h5 className="font-bold text-slate-900">เคล็ดลับ: แปลงเป็น Long-Lived Token (อายุ 60 วัน หรือไม่มีวันหมดอายุ)</h5>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        นำ User Token ไปที่ <a href="https://developers.facebook.com/tools/accesstoken/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold">Access Token Tool</a> แล้วกด &quot;Debug&quot; &gt; กดปุ่ม &quot;Extend Access Token&quot; เพื่อขยายอายุเป็น 60 วัน หรือหากใช้ <strong>Page Access Token</strong> จะไม่มีวันหมดอายุ!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
