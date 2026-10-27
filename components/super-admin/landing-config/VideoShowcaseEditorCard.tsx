import React, { useState } from 'react';
import { FeatureVideoConfig } from '../../../services/landingConfigService';
import { parseVideoUrl, validateVideoUrl } from '../../../lib/videoUrlParser';
import { Play, Video, ExternalLink, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface VideoShowcaseEditorCardProps {
  id: string;
  title: string;
  categoryLabel: string;
  config: FeatureVideoConfig;
  onChange: (updated: FeatureVideoConfig) => void;
}

export const VideoShowcaseEditorCard: React.FC<VideoShowcaseEditorCardProps> = ({
  id,
  title,
  categoryLabel,
  config,
  onChange,
}) => {
  const [showLivePreview, setShowLivePreview] = useState(false);
  const parsed = parseVideoUrl(config.videoUrl);
  const validation = validateVideoUrl(config.videoUrl);

  const getProviderBadge = () => {
    switch (parsed.type) {
      case 'youtube':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">YouTube</span>;
      case 'gdrive':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Google Drive</span>;
      case 'direct':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Direct MP4</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Unknown</span>;
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                <span className="text-[10px] font-medium text-slate-400">({id})</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">{categoryLabel}</span>
            </div>
          </div>
          {getProviderBadge()}
        </div>

        {/* Video URL Input */}
        <div className="space-y-3 mb-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">ลิงก์วิดีโอ (YouTube หรือ Google Drive)</label>
              {config.videoUrl && (
                <button
                  type="button"
                  onClick={() => setShowLivePreview((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showLivePreview ? 'ซ่อนพรีวิว' : 'ทดสอบพรีวิวสด'}</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={config.videoUrl}
                onChange={(e) => onChange({ ...config, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... หรือ https://drive.google.com/..."
                className={`w-full pl-3 pr-8 py-2 text-xs font-mono text-slate-800 border rounded-xl focus:outline-none focus:ring-2 ${
                  validation.isValid
                    ? 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                    : 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                }`}
              />
              {config.videoUrl && (
                <a
                  href={config.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  title="เปิดลิงก์เดิมในแท็บใหม่"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <p className={`text-[11px] mt-1 flex items-center gap-1 ${validation.isValid ? 'text-slate-500' : 'text-rose-600 font-medium'}`}>
              {validation.isValid ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
              )}
              <span>{validation.message}</span>
            </p>
          </div>

          {/* Duration & Description */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ความยาว (เช่น 02:15)</label>
              <input
                type="text"
                value={config.durationLabel || ''}
                onChange={(e) => onChange({ ...config, durationLabel: e.target.value })}
                placeholder="02:00"
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">คำอธิบายวิดีโอประกอบ</label>
              <input
                type="text"
                value={config.description || ''}
                onChange={(e) => onChange({ ...config, description: e.target.value })}
                placeholder="คำอธิบายสรุปคลิปสั้น..."
                className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Live Miniature Preview Embed Frame */}
        {showLivePreview && parsed.embedUrl && (
          <div className="mt-3 p-2 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between pb-1.5 px-1 text-[10px] font-semibold text-slate-300">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3 text-indigo-400" />
                <span>Live Embed Preview ({parsed.providerLabel})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLivePreview(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕ ปิด
              </button>
            </div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={parsed.embedUrl}
                title={`Preview ${title}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
