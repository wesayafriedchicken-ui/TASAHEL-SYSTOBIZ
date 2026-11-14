import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDuration } from '../utils/mediaCompressor';

interface VoiceNotePlayerProps {
  src: string;
  duration?: number;
  isSender?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ src, duration = 0, isSender = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [totalDuration, setTotalDuration] = useState<number>(duration);
  const [effectiveSrc, setEffectiveSrc] = useState<string>(src);
  const [hasError, setHasError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Initialize or update source
  useEffect(() => {
    setEffectiveSrc(src);
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    if (duration > 0) {
      setTotalDuration(duration);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src, duration]);

  // Attempt recovery by fetching the audio blob directly and checking header
  const recoverAudioBlob = useCallback(async () => {
    setIsRecovering(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      let uint8 = new Uint8Array(arrayBuffer);

      // Check for EBML header: 0x1A 0x45 0xDF 0xA3
      // If there is an extraneous 0x1A at index 0 (0x1A 0x1A 0x45 0xDF 0xA3), strip it
      if (uint8.length > 4) {
        if (uint8[0] === 0x1a && uint8[1] === 0x1a && uint8[2] === 0x45 && uint8[3] === 0xdf && uint8[4] === 0xa3) {
          uint8 = uint8.subarray(1);
        }
      }

      const mime = src.endsWith('.ogg') ? 'audio/ogg' : 'audio/webm';
      const cleanBlob = new Blob([uint8], { type: mime });
      const newUrl = URL.createObjectURL(cleanBlob);

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = newUrl;
      setEffectiveSrc(newUrl);
      setHasError(false);

      if (audioRef.current) {
        audioRef.current.src = newUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('Voice note blob recovery failed:', err);
      setHasError(true);
      setIsPlaying(false);
    } finally {
      setIsRecovering(false);
    }
  }, [src]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      // Ensure audio volume is 100% and unmuted
      audioRef.current.volume = 1.0;
      audioRef.current.muted = false;
      await audioRef.current.play();
      setIsPlaying(true);
      setHasError(false);
    } catch (err: any) {
      console.warn('Audio play() failed, trying recovery fallback:', err);
      // Try blob recovery if direct play fails
      await recoverAudioBlob();
    }
  };

  const handleRateChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || totalDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = pos * totalDuration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleAudioError = () => {
    if (!blobUrlRef.current) {
      // If direct URL failed, automatically try blob recovery once
      recoverAudioBlob();
    } else {
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const progressPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // 24 static bar heights to form a realistic voice waveform
  const waveformHeights = [
    6, 12, 20, 14, 26, 18, 28, 22, 14, 24, 30, 16,
    22, 28, 18, 12, 24, 20, 14, 22, 16, 10, 14, 8
  ];

  return (
    <div className="flex flex-col gap-1 max-w-[290px] sm:max-w-[320px] select-none">
      {/* Hidden Native Audio Element bound to DOM */}
      <audio
        ref={audioRef}
        src={effectiveSrc}
        preload="metadata"
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration !== Infinity) {
            setTotalDuration(Math.round(audioRef.current.duration));
          }
        }}
        onError={handleAudioError}
      />

      <div
        className={`flex items-center gap-2.5 p-2 rounded-xl transition-all shadow-2xs ${
          isSender ? 'bg-indigo-700/30 text-white' : 'bg-slate-100 text-slate-800'
        }`}
      >
        {/* Play/Pause round button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={isRecovering}
          title={isPlaying ? "Pause voice note" : "Play voice note"}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
            isSender
              ? 'bg-white text-indigo-700 hover:bg-slate-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isRecovering ? (
            <RefreshCw className="w-4 h-4 animate-spin text-current" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform Scrubber */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div
            onClick={handleSeek}
            className="flex items-center gap-[2px] h-7 cursor-pointer py-1 group"
            title="Click to seek"
          >
            {waveformHeights.map((h, idx) => {
              const barPct = (idx / waveformHeights.length) * 100;
              const isFilled = barPct <= progressPct;
              return (
                <div
                  key={idx}
                  className="flex-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${h}px`,
                    backgroundColor: isFilled
                      ? isSender
                        ? '#FFFFFF'
                        : '#4F46E5'
                      : isSender
                      ? 'rgba(255, 255, 255, 0.35)'
                      : '#CBD5E1',
                  }}
                />
              );
            })}
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[10px] font-mono leading-none opacity-80 mt-0.5">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(totalDuration)}</span>
          </div>
        </div>

        {/* Playback speed toggle */}
        <button
          type="button"
          onClick={handleRateChange}
          title="Change playback speed"
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 transition-colors ${
            isSender
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }`}
        >
          {playbackRate}x
        </button>

        {/* Open in new tab / External link */}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          download="voice_note.webm"
          title="Open or download audio file in new browser tab"
          className={`p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors ${
            isSender ? 'hover:text-white' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {hasError && (
        <div className="flex items-center justify-between gap-1 text-[11px] text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Cannot play in current browser.</span>
          </div>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:text-rose-800"
          >
            Open in new tab
          </a>
        </div>
      )}
    </div>
  );
};
