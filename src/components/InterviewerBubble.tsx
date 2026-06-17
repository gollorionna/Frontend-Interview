/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Award, ShieldAlert, BookOpen } from "lucide-react";
import { Interviewer } from "../types";

interface InterviewerBubbleProps {
  interviewer: Interviewer;
  text: string;
  isWriting?: boolean;
}

export default function InterviewerBubble({
  interviewer,
  text,
  isWriting = false,
}: InterviewerBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
  }, []);

  // Stop vocalizing if text changes
  useEffect(() => {
    if (synth) {
      synth.cancel();
      setIsPlaying(false);
    }
  }, [text, synth]);

  const speakText = () => {
    if (!synth) return;

    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      return;
    }

    const cleanText = text.replace(/[*#_`\-]/g, " "); // Strip markdown characters
    const utt = new SpeechSynthesisUtterance(cleanText);
    
    // Attempt to find a suitable voice
    const voices = synth.getVoices();
    const candidateVoice = voices.find(
      (v) =>
        v.lang.startsWith("en-") &&
        (interviewer.id === "elena" ? v.name.includes("Female") || v.name.includes("Google US English") : v.name.includes("Male") || v.name.includes("Natural"))
    );
    
    if (candidateVoice) {
      utt.voice = candidateVoice;
    }

    utt.pitch = interviewer.id === "elena" ? 1.05 : 0.95;
    utt.rate = 1.0;

    utt.onend = () => {
      setIsPlaying(false);
    };

    utt.onerror = () => {
      setIsPlaying(false);
    };

    setUtterance(utt);
    setIsPlaying(true);
    synth.speak(utt);
  };

  // Generate unique visual SVG avatar based on trainer
  const getAvatarSvg = () => {
    if (interviewer.id === "sergey") {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-2xl bg-zinc-800 p-1 border-2 border-cyan-500 shadow-md">
          {/* Hair / Beard */}
          <ellipse cx="50" cy="52" rx="38" ry="32" fill="#2d3748" />
          <polygon points="20,55 30,85 70,85 80,55" fill="#2d3748" />
          {/* Face */}
          <circle cx="50" cy="48" r="30" fill="#e2e8f0" />
          {/* Glasses */}
          <rect x="28" y="42" width="18" height="12" rx="3" fill="none" stroke="#101113" strokeWidth="4" />
          <rect x="54" y="42" width="18" height="12" rx="3" fill="none" stroke="#101113" strokeWidth="4" />
          <line x1="46" y1="48" x2="54" y2="48" stroke="#101113" strokeWidth="4" />
          {/* Eyes */}
          <circle cx="37" cy="48" r="3" fill="#101113" />
          <circle cx="63" cy="48" r="3" fill="#101113" />
          {/* Eyebrows */}
          <path d="M 30,35 Q 37,32 44,36" stroke="#2d3748" strokeWidth="3" fill="none" />
          <path d="M 56,36 Q 63,32 70,35" stroke="#2d3748" strokeWidth="3" fill="none" />
          {/* Beard detail */}
          <path d="M 32,68 Q 50,82 68,68" stroke="#1a202c" strokeWidth="4" fill="none" />
          {/* Mouth */}
          <path d="M 45,60 Q 50,64 55,60" stroke="#101113" strokeWidth="2.5" fill="none" />
          {/* Collar */}
          <polygon points="35,80 50,92 65,80" fill="#0284c7" />
        </svg>
      );
    } else if (interviewer.id === "elena") {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-2xl bg-zinc-800 p-1 border-2 border-purple-500 shadow-md">
          {/* Hair */}
          <ellipse cx="50" cy="44" rx="36" ry="34" fill="#a21caf" />
          <path d="M 16,50 H 84 V 85 h -68 Z" fill="#a21caf" />
          {/* Face */}
          <circle cx="50" cy="48" r="28" fill="#fed7aa" />
          {/* Bangs */}
          <path d="M 22,40 Q 50,30 78,40" fill="#701a75" />
          {/* Eyes */}
          <circle cx="38" cy="46" r="3.5" fill="#065f46" />
          <circle cx="62" cy="46" r="3.5" fill="#065f46" />
          {/* Glasses */}
          <ellipse cx="38" cy="46" rx="14" ry="10" fill="none" stroke="#701a75" strokeWidth="2.5" />
          <ellipse cx="62" cy="46" rx="14" ry="10" fill="none" stroke="#701a75" strokeWidth="2.5" />
          <line x1="52" y1="46" x2="48" y2="46" stroke="#701a75" strokeWidth="3" />
          {/* Smile */}
          <path d="M 44,62 Q 50,68 56,62" stroke="#e11d48" strokeWidth="3" fill="none" />
          {/* Blushes */}
          <ellipse cx="30" cy="56" rx="4" ry="2" fill="#fecdd3" />
          <ellipse cx="70" cy="56" rx="4" ry="2" fill="#fecdd3" />
          {/* Collar */}
          <polygon points="30,80 50,95 70,80" fill="#4f46e5" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 rounded-2xl bg-zinc-800 p-1 border-2 border-emerald-500 shadow-md">
          {/* Hair */}
          <path d="M 20,40 Q 50,15 80,40" fill="#dd6b20" />
          <circle cx="50" cy="44" r="33" fill="#b7791f" />
          {/* Face */}
          <circle cx="50" cy="50" r="28" fill="#ffeb3b" fillOpacity="0.8" />
          {/* Headphone belt */}
          <path d="M 22,40 A 30,30 0 0 1 78,40" fill="none" stroke="#2d3748" strokeWidth="6" />
          {/* Mic Headset cups */}
          <rect x="14" y="36" width="10" height="24" rx="4" fill="#1a202c" />
          <rect x="76" y="36" width="10" height="24" rx="4" fill="#1a202c" />
          {/* Mic boom */}
          <path d="M 76,54 Q 70,68 58,68" fill="none" stroke="#2d3748" strokeWidth="2.5" />
          <circle cx="58" cy="68" r="3" fill="#e53e3e" />
          {/* Eyes */}
          <circle cx="38" cy="48" r="3" fill="#1a202c" />
          <circle cx="62" cy="48" r="3" fill="#1a202c" />
          {/* Smile */}
          <path d="M 42,60 Q 50,66 58,60" fill="none" stroke="#2d3748" strokeWidth="3" />
          {/* Torso */}
          <path d="M 25,82 L 35,98 H 65 L 75,82 Z" fill="#059669" />
        </svg>
      );
    }
  };

  return (
    <div id="interviewer-bubble-component" className="flex items-start gap-4">
      {/* Headshot / Speaker */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        {getAvatarSvg()}
        <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#18181b] border border-zinc-800 text-zinc-400">
          Senior-AI
        </span>
      </div>

      {/* Speech Chat Card */}
      <div className="flex-grow bg-[#111114] border border-[#27272a] rounded-2xl p-5 shadow-lg relative">
        <div className="absolute top-5 -left-2.5 w-5 h-5 bg-[#111114] border-[#27272a] border-l border-b transform rotate-45 pointer-events-none rounded-sm"></div>

        <div className="flex justify-between items-start mb-2 border-b border-[#27272a] pb-2 relative z-10">
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <span>{interviewer.name}</span>
            </h4>
            <p className="text-[11px] text-zinc-400">{interviewer.title}</p>
          </div>

          <div className="flex items-center gap-2">
            {synth && (
              <button
                id="voice-synthesis-speaker-btn"
                onClick={speakText}
                className={`p-1.5 rounded-lg border transition-all ${
                  isPlaying
                    ? "bg-cyan-950/40 text-cyan-400 border-cyan-800 animate-pulse"
                    : "bg-[#18181b] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-[#27272a]"
                }`}
                title={isPlaying ? "Mute Coach" : "Read aloud"}
              >
                {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        <div className="relative z-10 text-sm text-zinc-300 leading-relaxed font-sans min-h-[40px]">
          {isWriting ? (
            <div className="flex items-center gap-1.5 py-2">
              <span className="text-zinc-400 font-mono text-xs select-none">Reviewing current response...</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-line">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
