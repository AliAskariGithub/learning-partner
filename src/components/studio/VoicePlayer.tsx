'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Minimize2,
  Maximize2,
  X,
  FastForward,
  Headphones,
  Sparkles,
} from 'lucide-react';

export interface VoiceTurn {
  speaker: string;
  text: string;
}

export interface VoicePlayerProps {
  title: string;
  script?: VoiceTurn[] | null;
  audioKeys?: string[] | null;
  durationSeconds?: number | null;
  voiceConfig?: any;
  onClose?: () => void;
  isMiniPlayer?: boolean;
  onToggleMini?: () => void;
}

export function VoicePlayer({
  title,
  script = [],
  audioKeys = [],
  durationSeconds = 60,
  voiceConfig,
  onClose,
  isMiniPlayer = false,
  onToggleMini,
}: VoicePlayerProps) {
  const { toast } = useToast();
  const safeScript = script || [];
  const safeAudioKeys = audioKeys || [];
  const isWebSpeech = voiceConfig?.provider === 'web_speech' || safeAudioKeys.length === 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);

  // Audio element for server-synthesized MP3 audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech API utterance ref
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Calculate estimated total seconds
  const totalSeconds = durationSeconds || Math.max(30, safeScript.length * 6);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  // ----------------------------------------------------
  // Web Speech API Playback Engine (Free Fallback)
  // ----------------------------------------------------
  const playWebSpeechTurn = (index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (index >= safeScript.length) {
      setIsPlaying(false);
      setCurrentTurnIndex(0);
      setCurrentTime(0);
      return;
    }

    const turn = safeScript[index];
    const utterance = new SpeechSynthesisUtterance(turn.text);
    utterance.rate = playbackSpeed;

    // Try to find matching gender voice
    const voices = window.speechSynthesis.getVoices();
    const isAlex = turn.speaker.toLowerCase().includes('alex') || turn.speaker.toLowerCase().includes('host 1');
    if (voices.length > 0) {
      if (isAlex && voices[0]) utterance.voice = voices[0];
      else if (!isAlex && voices.length > 1) utterance.voice = voices[1];
    }

    utterance.onend = () => {
      if (index + 1 < safeScript.length) {
        setCurrentTurnIndex(index + 1);
        playWebSpeechTurn(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentTurnIndex(0);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  // ----------------------------------------------------
  // Server-Synthesized Audio Segment Playback Engine
  // ----------------------------------------------------
  const playAudioKeyTurn = (index: number) => {
    if (!audioRef.current || index >= safeAudioKeys.length) {
      setIsPlaying(false);
      return;
    }

    const key = safeAudioKeys[index];
    const audioUrl = `/api/storage/${key}`;
    audioRef.current.src = audioUrl;
    audioRef.current.playbackRate = playbackSpeed;
    audioRef.current.muted = isMuted;

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.warn('Audio play interrupted:', err);
        setIsPlaying(false);
      });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (isWebSpeech) {
        window.speechSynthesis.pause();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (isWebSpeech) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPlaying(true);
        } else {
          playWebSpeechTurn(currentTurnIndex);
        }
      } else {
        if (audioRef.current?.src) {
          audioRef.current.play();
          setIsPlaying(true);
        } else {
          playAudioKeyTurn(currentTurnIndex);
        }
      }
    }
  };

  const handleSkipSeconds = (deltaSeconds: number) => {
    if (isWebSpeech) {
      // In web speech, jump turn
      const deltaTurns = deltaSeconds > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(safeScript.length - 1, currentTurnIndex + deltaTurns));
      setCurrentTurnIndex(nextIndex);
      if (isPlaying) playWebSpeechTurn(nextIndex);
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + deltaSeconds);
    }
  };

  const handleSeekTurn = (turnIndex: number) => {
    setCurrentTurnIndex(turnIndex);
    if (isWebSpeech) {
      if (isPlaying) playWebSpeechTurn(turnIndex);
    } else {
      playAudioKeyTurn(turnIndex);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);

    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleDownload = () => {
    if (isWebSpeech) {
      // Download text transcript
      const text = safeScript.map((t) => `${t.speaker}: ${t.text}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded Transcript', description: 'Web Speech transcript saved.', variant: 'brand' });
    } else if (safeAudioKeys.length > 0) {
      // Download first segment or link
      const key = safeAudioKeys[0];
      const a = document.createElement('a');
      a.href = `/api/storage/${key}`;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: 'Download Started', description: 'Audio segment downloading.', variant: 'brand' });
    }
  };

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync turn timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => Math.min(totalSeconds, prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, totalSeconds]);

  // Handle server audio turn completion
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (currentTurnIndex + 1 < safeAudioKeys.length) {
        const next = currentTurnIndex + 1;
        setCurrentTurnIndex(next);
        playAudioKeyTurn(next);
      } else {
        setIsPlaying(false);
        setCurrentTurnIndex(0);
      }
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [currentTurnIndex, safeAudioKeys]);

  // Mini-player view (floating at bottom of notebook workspace)
  if (isMiniPlayer) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 md:w-96 rounded-2xl bg-[#1f1f1f] border border-[#383838] shadow-2xl p-3.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
        <audio ref={audioRef} className="hidden" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <p className="font-display font-semibold text-xs text-[#f4f4f2] truncate">
                {title}
              </p>
              <p className="text-[10px] text-[#9a9a94] font-mono">
                {formatTime(currentTime)} / {formatTime(totalSeconds)} · {isWebSpeech ? 'Basic Voice' : 'Studio TTS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onToggleMini && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMini}
                className="h-6 w-6 p-0 text-[#9a9a94] hover:text-[#f4f4f2]"
                title="Expand Player"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-[#9a9a94] hover:text-[#f4f4f2]"
                title="Close Player"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-[#2b2b2b] rounded-full overflow-hidden mb-2.5">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${Math.min(100, (currentTime / totalSeconds) * 100)}%` }}
          />
        </div>

        {/* Quick Controls */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSpeedChange}
            className="text-[10px] font-mono font-bold text-[#9a9a94] hover:text-[#f4f4f2] px-1.5 py-0.5 rounded bg-[#262626] border border-[#303030]"
          >
            {playbackSpeed}x
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSkipSeconds(-15)}
              className="text-[#9a9a94] hover:text-[#f4f4f2] p-1"
              title="Rewind 15 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handlePlayPause}
              className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-400 transition-colors shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleSkipSeconds(15)}
              className="text-[#9a9a94] hover:text-[#f4f4f2] p-1"
              title="Fast forward 15 seconds"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="text-[#9a9a94] hover:text-[#f4f4f2] p-1"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // Full Screen / Dialog View with Interactive Live Transcript
  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
      <audio ref={audioRef} className="hidden" />

      {/* Top Header */}
      <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Headphones className="w-4 h-4 text-brand-400" />
          <h2 className="font-display font-bold text-sm text-[#f4f4f2] truncate max-w-sm sm:max-w-md">
            {title}
          </h2>
          <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            {isWebSpeech ? 'Basic Voice' : 'Studio Multi-Speaker'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-xs h-8 px-2.5 text-[#9a9a94] hover:text-[#f4f4f2]"
            title="Download Audio or Script"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download
          </Button>
          {onToggleMini && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMini}
              className="text-xs h-8 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Minimize to Mini Player"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Audio Player Controller Card */}
      <div className="p-6 border-b border-[#303030] bg-[#212121]/80 backdrop-blur-sm shrink-0">
        <div className="max-w-xl mx-auto flex flex-col items-center">
          {/* Waveform / Visualizer Bar */}
          <div className="flex items-center justify-center gap-1.5 h-10 mb-4 w-full">
            {Array.from({ length: 28 }).map((_, i) => {
              const active = isPlaying && i % 3 === (currentTime % 3);
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    active ? 'bg-brand-400 h-8' : 'bg-[#383838] h-3'
                  }`}
                />
              );
            })}
          </div>

          {/* Seek Bar */}
          <div className="w-full flex items-center gap-3 text-xs font-mono text-[#9a9a94] mb-4">
            <span>{formatTime(currentTime)}</span>
            <div
              className="flex-1 h-2 bg-[#2d2d2d] rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = clickX / rect.width;
                const targetTurn = Math.floor(pct * safeScript.length);
                handleSeekTurn(targetTurn);
              }}
            >
              <div
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${Math.min(100, (currentTime / totalSeconds) * 100)}%` }}
              />
            </div>
            <span>{formatTime(totalSeconds)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleSpeedChange}
              className="text-xs font-mono font-bold text-[#9a9a94] hover:text-[#f4f4f2] px-2.5 py-1 rounded-xl bg-[#282828] border border-[#383838]"
              title="Playback Speed"
            >
              {playbackSpeed}x
            </button>

            <button
              type="button"
              onClick={() => handleSkipSeconds(-15)}
              className="text-[#9a9a94] hover:text-[#f4f4f2] p-2 rounded-xl hover:bg-[#282828]"
              title="Rewind 15 seconds"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handlePlayPause}
              className="w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-xl shadow-brand-500/20"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => handleSkipSeconds(15)}
              className="text-[#9a9a94] hover:text-[#f4f4f2] p-2 rounded-xl hover:bg-[#282828]"
              title="Skip 15 seconds forward"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="text-[#9a9a94] hover:text-[#f4f4f2] p-2 rounded-xl hover:bg-[#282828]"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Live Interactive Transcript */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-2xl mx-auto w-full space-y-4">
        <p className="text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
          Live Interactive Transcript (Click line to jump)
        </p>

        {safeScript.map((turn, tIdx) => {
          const isActive = tIdx === currentTurnIndex;
          const isAlex = turn.speaker.toLowerCase().includes('alex') || turn.speaker.toLowerCase().includes('host 1');

          return (
            <div
              key={tIdx}
              onClick={() => handleSeekTurn(tIdx)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-950/30 border-brand-500/50 shadow-md ring-1 ring-brand-500/30'
                  : 'bg-[#212121] border-[#2f2f2f] hover:border-[#404040]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-display font-bold ${
                  isAlex ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {turn.speaker}
                </span>
                {isActive && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
                    Playing Now
                  </span>
                )}
              </div>
              <p className={`text-sm font-sans leading-relaxed ${
                isActive ? 'text-[#f4f4f2] font-medium' : 'text-[#a4a49e]'
              }`}>
                {turn.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

