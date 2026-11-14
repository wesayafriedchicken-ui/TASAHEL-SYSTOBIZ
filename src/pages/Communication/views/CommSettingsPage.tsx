import React, { useState } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Bell, 
  Moon, 
  Shield, 
  HardDrive, 
  Sparkles,
  Check,
  Play
} from 'lucide-react';
import { useComm } from '../context/CommContext';
import { PresenceStatus } from '../types';
import { audioChimes } from '../utils/audioNotification';

const STATUSES: { key: PresenceStatus; label: string; dot: string; desc: string }[] = [
  { key: 'online', label: 'Online', dot: 'bg-emerald-500', desc: 'Active and available to chat' },
  { key: 'busy', label: 'Busy / In Meeting', dot: 'bg-rose-500', desc: 'Mutes non-urgent audio notifications' },
  { key: 'away', label: 'Away', dot: 'bg-amber-400', desc: 'Stepped away or inactive' },
  { key: 'offline', label: 'Appear Offline', dot: 'bg-slate-400', desc: 'Invisible to colleagues while maintaining access' },
];

export const CommSettingsPage: React.FC = () => {
  const { 
    myStatus, 
    setMyStatus, 
    myCustomStatus, 
    setMyCustomStatus,
    settings,
    updateSettings 
  } = useComm();

  const [customStatusInput, setCustomStatusInput] = useState(myCustomStatus);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveStatus = async () => {
    await setMyCustomStatus(customStatusInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestChime = () => {
    audioChimes.playMessageChime();
  };

  const handleTestMention = () => {
    audioChimes.playMentionPing();
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Communication Preferences</h2>
            <p className="text-[11px] text-slate-500">Configure presence, sound alerts, and notification behavior</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-6">
        {/* Section 1: Presence & Profile Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Presence & Availability</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose how your status is displayed to your team across channels and direct messages
            </p>
          </div>

          {/* Status radio list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {STATUSES.map((st) => (
              <div
                key={st.key}
                onClick={() => setMyStatus(st.key)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  myStatus === st.key
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${st.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">{st.label}</p>
                    {myStatus === st.key && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Status Message */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Status Message
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customStatusInput}
                onChange={(e) => setCustomStatusInput(e.target.value)}
                placeholder="e.g. Focus Time, In Client Presentation, Working Remotely"
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                onClick={handleSaveStatus}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Save
              </button>
            </div>
            {savedSuccess && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> Status updated!
              </p>
            )}
          </div>
        </div>

        {/* Section 2: Audio Chimes & Sound Effects */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Audio Alerts & Chimes</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant Web Audio synthesizers (0ms latency, zero egress cost)
            </p>
          </div>

          <div className="space-y-3">
            {/* Enable Sound Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  {settings.sound_enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Sound Effects</p>
                  <p className="text-[11px] text-slate-500">Play pleasant chimes for messages and mentions</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sound_enabled}
                  onChange={(e) => updateSettings({ sound_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Do Not Disturb Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Do Not Disturb (DND)</p>
                  <p className="text-[11px] text-slate-500">Silence all incoming notification popups and sounds</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dnd_enabled}
                  onChange={(e) => updateSettings({ dnd_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Test Audio Chimes Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestChime}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test Message Chime</span>
              </button>
              <button
                type="button"
                onClick={handleTestMention}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test @Mention Ping</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Performance & Egress Safeguards */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Optimization & Storage Safeguards</h3>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Client-Side Image Compression:</strong> Images attached to messages are downscaled and re-encoded to WebP/JPEG under 150KB, slashing Supabase storage costs by over 80%.
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Ultra-low Bitrate Voice Notes:</strong> Speech audio is recorded at 24kbps Opus, maintaining vocal clarity while remaining lightweight.
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">30-Message Paginated Egress:</strong> Conversations fetch strictly the 30 latest messages on load with Infinite Scroll on demand to preserve realtime quotas.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
