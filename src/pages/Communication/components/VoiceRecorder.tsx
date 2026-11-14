import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Pause, Play, AlertCircle } from 'lucide-react';
import { formatDuration } from '../utils/mediaCompressor';

interface VoiceRecorderProps {
  onAudioReady: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onAudioReady, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Start recording on mount
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startRecording = async () => {
      try {
        setAudioError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 24000,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });

        // Check supported audio format for browser compatibility
        const candidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg;codecs=opus',
          'audio/ogg'
        ];
        let mimeType = candidates.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || '';

        const options = mimeType ? { mimeType, audioBitsPerSecond: 24000 } : undefined;
        const mediaRecorder = new MediaRecorder(stream, options);

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.start(250); // Slice every 250ms
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        startTimeRef.current = Date.now();

        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.error('Microphone access denied:', err);
        setAudioError('Microphone permission denied or unavailable.');
      }
    };

    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleStopAndSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (timerRef.current) clearInterval(timerRef.current);

    if (recorder.state === 'recording' || recorder.state === 'paused') {
      try {
        recorder.requestData();
      } catch (e) {}
    }

    recorder.onstop = async () => {
      let finalBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });

      // Verify and sanitize EBML header if duplicate leading byte was recorded
      if (finalBlob.size > 4) {
        try {
          const headBuf = await finalBlob.slice(0, 5).arrayBuffer();
          const headBytes = new Uint8Array(headBuf);
          if (headBytes[0] === 0x1a && headBytes[1] === 0x1a && headBytes[2] === 0x45 && headBytes[3] === 0xdf && headBytes[4] === 0xa3) {
            finalBlob = finalBlob.slice(1, finalBlob.size, finalBlob.type);
          }
        } catch (e) {
          console.warn('Voice note header check error:', e);
        }
      }

      if (finalBlob.size > 0) {
        onAudioReady(finalBlob, Math.max(duration, 1));
      } else {
        onCancel();
      }
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const handleDiscard = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    onCancel();
  };

  if (audioError) {
    return (
      <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs w-full">
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
        <span className="flex-1">{audioError}</span>
        <button
          onClick={onCancel}
          className="px-2 py-1 bg-white border border-rose-200 rounded text-rose-600 font-medium hover:bg-rose-100"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-full bg-slate-100 border border-slate-300 px-3 py-2 rounded-xl animate-fadeIn">
      {/* Pulse recording indicator */}
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`} />
        <span className="text-xs font-mono font-bold text-slate-700 w-10">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Simulated Waveform animation bars */}
      <div className="flex-1 flex items-center gap-1 h-6 overflow-hidden px-2">
        {[4, 8, 14, 6, 18, 12, 22, 10, 16, 7, 20, 14, 9, 16, 12, 19, 8, 14, 6, 10].map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-150 ${
              isPaused ? 'bg-slate-300' : 'bg-rose-500'
            }`}
            style={{
              height: isPaused ? '4px' : `${Math.max(4, Math.sin(duration * 2 + i) * h + 8)}px`,
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Discard / Delete */}
        <button
          type="button"
          onClick={handleDiscard}
          title="Discard voice note"
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Pause / Resume */}
        <button
          type="button"
          onClick={handlePauseResume}
          title={isPaused ? "Resume recording" : "Pause recording"}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Send voice note */}
        <button
          type="button"
          onClick={handleStopAndSend}
          disabled={duration < 1}
          title="Send voice note"
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
