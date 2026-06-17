/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Keyboard, Edit3, CheckCircle } from "lucide-react";

interface SpeechInputProps {
  onTranscriptComplete: (text: string) => void;
  disabled: boolean;
  expectedKeywords?: string[];
  placeholder?: string;
  initialValue?: string;
}

export default function SpeechInput({
  onTranscriptComplete,
  disabled,
  expectedKeywords = [],
  placeholder = "Click the microphone and start speaking...",
  initialValue = "",
}: SpeechInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialValue);
  const [isManualInput, setIsManualInput] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const isListeningRef = useRef(false);
  const transcriptRef = useRef(initialValue);
  const lastActiveTranscriptRef = useRef(initialValue);
  const recognitionRef = useRef<any>(null);

  // Sync refs with state values
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Sync initial values when question resets
  useEffect(() => {
    setTranscript(initialValue);
    lastActiveTranscriptRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setIsManualInput(true);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      rec.onresult = (event: any) => {
        let currentSessionText = "";

        // Rebuild full text parsed during the CURRENT recognition session (from 0 onwards)
        // to prevent partial results or intermediate offsets from dropping earlier parts of the session's stream
        for (let i = 0; i < event.results.length; ++i) {
          const part = event.results[i][0].transcript || "";
          currentSessionText += part;
        }

        if (currentSessionText.trim()) {
          const prefix = lastActiveTranscriptRef.current ? lastActiveTranscriptRef.current.trim() : "";
          const separator = prefix ? " " : "";
          const newVal = prefix + separator + currentSessionText.trim();
          setTranscript(newVal);
          transcriptRef.current = newVal;
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === "not-allowed") {
          alert("Microphone permission was denied. Please allow microphone access or type your answer instead.");
          setIsManualInput(true);
        }
        // If it's a transient abort error, the onend handler will revive it if isListeningRef.current remains true
      };

      rec.onend = () => {
        // Automatically restart speech recognition session if the state is supposed to be active (bypasses browser pause limits)
        if (isListeningRef.current) {
          console.log("Speech recognition stopped automatically (silence / browser limit). Restarting session...");
          // Commit current text state as prefix for the next batch session
          lastActiveTranscriptRef.current = transcriptRef.current;
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error("Failed to automatically restart recognition session:", e);
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (disabled) return;

    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    } else {
      // Keep existing transcript, so we append the voice seamlessly to whatever edited/existing text is already there
      lastActiveTranscriptRef.current = transcriptRef.current;
      setIsListening(true);
      isListeningRef.current = true;
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
    transcriptRef.current = e.target.value;
    lastActiveTranscriptRef.current = e.target.value;
  };

  const handleClear = () => {
    setTranscript("");
    transcriptRef.current = "";
    lastActiveTranscriptRef.current = "";
    if (isListening) {
      setIsListening(false);
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    }
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;
    onTranscriptComplete(transcript);
  };

  return (
    <div id="speech-input-container" className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-lg">
      <div className="flex justify-between items-center mb-4 border-b border-[#27272a] pb-3">
        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          {isManualInput ? (
            <>
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>Keyboard Answer Mode</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Voice Dictation Mode</span>
            </>
          )}
        </label>

        <div className="flex items-center gap-2">
          {speechSupported && (
            <button
              id="toggle-input-mode-btn"
              type="button"
              onClick={() => {
                if (isListening) {
                  setIsListening(false);
                  isListeningRef.current = false;
                  recognitionRef.current?.stop();
                }
                setIsManualInput(!isManualInput);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3 h-3" />
              {isManualInput ? "Use Voice" : "Type Answer Instead"}
            </button>
          )}
        </div>
      </div>

      {!isManualInput ? (
        <div className="flex flex-col items-center justify-center py-6">
          <button
            id="mic-pulse-btn"
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all relative ${
              isListening
                ? "bg-red-500/20 text-red-400 border-2 border-red-500 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                : "bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 border border-[#3f3f46]"
            } disabled:opacity-50`}
          >
            {isListening ? (
              <>
                <MicOff className="w-8 h-8 relative z-10" />
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-red-400/20 opacity-75"></span>
              </>
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          <span className="text-sm mt-3 font-semibold text-zinc-300">
            {isListening ? "Listening... Speak clearly" : "Tap Microphone to Speak"}
          </span>

          {isListening && (
            <div className="flex items-center gap-1 mt-4 h-6">
              {[0.6, 1.2, 0.4, 1.5, 0.8, 1.1, 0.5, 1.3, 0.7, 0.9].map((delay, index) => (
                <div
                  key={index}
                  className="w-1 bg-cyan-400 rounded-full h-full animate-bounce"
                  style={{
                    animationDuration: `${delay}s`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {transcript && (
            <div className="w-full mt-6">
              <div className="flex justify-between items-center mb-1 text-xs text-zinc-500">
                <span>Transcribed Voice Stream</span>
                <span>Feel free to edit text below before submitting</span>
              </div>
              <textarea
                id="voice-transcript-editor"
                value={transcript}
                onChange={handleManualChange}
                placeholder={placeholder}
                rows={3}
                className="w-full text-zinc-200 bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            id="text-answers-area"
            value={transcript}
            onChange={handleManualChange}
            placeholder="Type your structured answer here. Take your time..."
            disabled={disabled}
            rows={5}
            className="w-full text-zinc-100 bg-[#09090b] border border-[#27272a] rounded-lg p-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Suggested Keywords Hint removed to allow completely natural and independent speech flow */}

      <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#27272a]">
        {transcript && (
          <button
            id="clear-transcript-btn"
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Reset
          </button>
        )}
        <button
          id="submit-answer-btn"
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !transcript.trim()}
          className={`flex items-center gap-1.5 px-5 py-2 text-xs rounded-lg font-medium transition-all ${
            transcript.trim() && !disabled
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/10 cursor-pointer"
              : "bg-[#27272a] text-zinc-500 cursor-not-allowed"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Submit to Interviewer</span>
        </button>
      </div>
    </div>
  );
}
