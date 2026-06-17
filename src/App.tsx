/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Mic,
  MessageSquare,
  Sparkles,
  Trophy,
  Activity,
  ArrowRight,
  RefreshCw,
  Award,
  AlertCircle,
  TrendingUp,
  User,
  Cpu,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  CornerDownRight,
  Layers,
  GraduationCap
} from "lucide-react";
import { INTERVIEWERS, MOCK_QUESTIONS } from "./data";
import { Interviewer, Question, AnswerHistoryItem, WrapUpReport, EvaluationResult } from "./types";
import SpeechInput from "./components/SpeechInput";
import InterviewerBubble from "./components/InterviewerBubble";

export default function App() {
  // Candidate Configuration
  const [userName, setUserName] = useState<string>("Candidate");
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer>(INTERVIEWERS[0]);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  // Active Session State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [history, setHistory] = useState<AnswerHistoryItem[]>([]);
  const [loadingEvaluation, setLoadingEvaluation] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Wrap up summary state
  const [showWrapUp, setShowWrapUp] = useState<boolean>(false);
  const [loadingWrapUp, setLoadingWrapUp] = useState<boolean>(false);
  const [wrapUpReport, setWrapUpReport] = useState<WrapUpReport | null>(null);

  // Current answer state holder for voice / text
  const [currentAnswerDraft, setCurrentAnswerDraft] = useState<string>("");

  // Track if GEMINI_API_KEY environment variable is configured in backend
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasApiKey === "boolean") {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch((err) => console.error("Error loaded api configuration:", err));
  }, []);

  // Auto-fill some fields for the junior dev if requested
  const handleStartInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    setIsStarted(true);
    
    // Seed general initial structure for answers
    const initialHistory: AnswerHistoryItem[] = MOCK_QUESTIONS.map((q) => ({
      questionId: q.id,
      questionText: q.text,
      category: q.categoryLabel,
      userAnswer: "",
      loading: false,
    }));
    setHistory(initialHistory);
    setCurrentQuestionIdx(0);
    setErrorText(null);
    setShowWrapUp(false);
    setWrapUpReport(null);
  };

  const handleResetSession = () => {
    setIsStarted(false);
    setCurrentQuestionIdx(0);
    setHistory([]);
    setCurrentAnswerDraft("");
    setShowWrapUp(false);
    setWrapUpReport(null);
    setErrorText(null);
  };

  const currentQuestion = MOCK_QUESTIONS[currentQuestionIdx];

  // Submit Answer for AI Grading
  const handleSubmitAnswer = async (spokenText: string) => {
    if (!spokenText.trim() || loadingEvaluation) return;

    // Update local feedback history in-progress
    const updatedHistory = [...history];
    const itemIndex = currentQuestionIdx;
    
    updatedHistory[itemIndex] = {
      ...updatedHistory[itemIndex],
      userAnswer: spokenText,
      loading: true,
      error: undefined,
    };
    setHistory(updatedHistory);
    setLoadingEvaluation(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          interviewerName: selectedInterviewer.name,
          interviewerTitle: selectedInterviewer.title,
          questionText: currentQuestion.text,
          questionCategory: currentQuestion.categoryLabel,
          userAnswer: spokenText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluation network error (${response.status})`);
      }

      const results: EvaluationResult = await response.json();
      
      // Update with final evaluation data
      updatedHistory[itemIndex] = {
        ...updatedHistory[itemIndex],
        loading: false,
        evaluation: results,
      };
      setHistory(updatedHistory);
      setCurrentAnswerDraft(""); // clear out
    } catch (err: any) {
      console.error(err);
      updatedHistory[itemIndex] = {
        ...updatedHistory[itemIndex],
        loading: false,
        error: "Interviewer lost connection briefly. Please retry submitting.",
      };
      setHistory(updatedHistory);
      setErrorText("Failed to compile evaluation. Check network or retry.");
    } finally {
      setLoadingEvaluation(false);
    }
  };

  // Skip the current question or mark as I Don't Know
  const handleIDontKnow = () => {
    handleSubmitAnswer("I am not sure about this specific topic yet, but I'm eager to learn about it as a Junior developer.");
  };

  // Compile full overall feedback
  const handleTriggerWrapUp = async () => {
    setLoadingWrapUp(true);
    setShowWrapUp(true);
    setErrorText(null);

    // Format final transcript history to feed into GPT
    const transcriptPayload = history.map((item) => ({
      question: item.questionText,
      category: item.category,
      answer: item.userAnswer || "[Skipped / No Answer]",
      score: item.evaluation?.overallScore || 0,
      feedback: item.evaluation?.constructiveFeedback || "None"
    }));

    try {
      const resp = await fetch("/api/wrapup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          interviewerName: selectedInterviewer.name,
          interviewerTitle: selectedInterviewer.title,
          transcript: transcriptPayload,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Failed to compile summary. Status: ${resp.status}`);
      }

      const report: WrapUpReport = await resp.json();
      setWrapUpReport(report);
    } catch (err) {
      console.error(err);
      setErrorText("Could not generate overall roadmap report. You can review separate questions below.");
    } finally {
      setLoadingWrapUp(false);
    }
  };

  // Navigate to Next
  const handleNextQuestion = () => {
    if (currentQuestionIdx < MOCK_QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  };

  // Navigate to Previous
  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  // Calculate live average of score so far
  const evaluatedItems = history.filter((h) => h.evaluation);
  const liveAverageScore = evaluatedItems.length > 0 
    ? (evaluatedItems.reduce((sum, h) => sum + (h.evaluation?.overallScore || 0), 0) / evaluatedItems.length).toFixed(1)
    : "0.0";

  // Dynamic visual indicators based on evaluation
  const currentItem = history[currentQuestionIdx];
  const currentEvaluation = currentItem?.evaluation;

  return (
    <div id="app-viewport-container" className="w-full min-h-screen bg-[#0A0A0B] text-slate-200 font-sans flex flex-col relative select-none">
      
      {/* HEADER SECTION - Sophisticated Dark theme specified headers */}
      <header id="app-main-hdr" className="h-16 shrink-0 border-b border-white/5 px-6 md:px-8 flex items-center justify-between bg-[#0A0A0B] z-10">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-500/20">
            IW
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              Innowise Interview Coach
              <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded uppercase font-mono tracking-widest border border-indigo-700/30">Junior React</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Session ID: #INNO-2026-RX</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Mic & Web Audio: Ready</span>
          </div>
          {isStarted && (
            <>
              <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Active Partner</p>
                <p id="partner-interviewer-name" className="text-xs font-semibold text-indigo-400">{selectedInterviewer.name}</p>
              </div>
            </>
          )}
        </div>
      </header>

      {/* DEMO MODE / MISSING API KEY BANNER */}
      {!hasApiKey && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>
              <strong>Demo Play Mode Active</strong>: Real-time dynamic AI grading is simulated. Configure a <strong>GEMINI_API_KEY</strong> in your Secrets Manager to enable personalized, expert-grade Senior Interviewer feedback.
            </span>
          </div>
          <div className="hidden md:block text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-mono border border-amber-500/30 uppercase tracking-wider">
            Demo Sandbox
          </div>
        </div>
      )}

      {/* BEFORE START / WELCOME ONBOARD SCREEN */}
      {!isStarted ? (
        <main id="lobby-onboarding-panel" className="flex-1 overflow-y-auto flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-[#0D0D0F] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
              
              {/* Onboarding pitch */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                <div>
                  <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                    Innowise Career Accelerator
                  </span>
                  <h2 className="text-3xl md:text-4xl font-serif italic text-white mt-4 leading-tight">
                    Get Ready for Client Interviews.
                  </h2>
                </div>
                
                <p className="text-sm text-slate-400 leading-relaxed">
                  Welcome to the Innowise Mock Practice engine. Transitioning from a <strong>Junior developer</strong> to high-growth, active clients requires technical vocabulary, confident delivery, and clean React fundamentals.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2 text-xs text-slate-300">
                    <Trophy className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Focuses heavily on React hooks, performance, Virtual DOM details.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-300">
                    <Mic className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Real-time voice dictation with simulated interview evaluation.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-300">
                    <User className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Soft skill validation (About me, team challenges, previous designs).</span>
                  </div>
                </div>
              </div>

              {/* Preference selector */}
              <form onSubmit={handleStartInterview} className="lg:col-span-7 bg-[#141417] p-6 rounded-2xl border border-white/10 space-y-6">
                
                {/* Candidate Name */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    Developer Name
                  </label>
                  <input
                    id="candidate-name-input"
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Trainer Persona List */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">
                    Select Your Senior Interviewer
                  </label>
                  
                  <div className="space-y-3">
                    {INTERVIEWERS.map((interviewer) => (
                      <button
                        key={interviewer.id}
                        type="button"
                        onClick={() => setSelectedInterviewer(interviewer)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative ${
                          selectedInterviewer.id === interviewer.id
                            ? "bg-indigo-950/20 border-indigo-500/70 shadow-md transform translate-x-1"
                            : "bg-[#0A0A0B]/60 border-white/5 hover:border-white/15"
                        }`}
                      >
                        {/* Selector marker */}
                        {selectedInterviewer.id === interviewer.id && (
                          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-8 bg-indigo-500 rounded-r-full" />
                        )}

                        <div className="flex-shrink-0">
                          {interviewer.id === "sergey" ? (
                            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold font-mono text-sm">ST</div>
                          ) : interviewer.id === "elena" ? (
                            <div className="w-10 h-10 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 font-bold font-mono text-sm">EP</div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">AJ</div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{interviewer.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-[#212124] text-zinc-400 rounded-full font-mono">{interviewer.title.split(' at ')[0]}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {interviewer.bio}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  id="begin-coaching-btn"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <span>Begin Session with {selectedInterviewer.name.split(' ')[0]}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </main>
      ) : (
        /* CORE ACTIVE WORKSPACE SCREEN - Split pane arrangement matching "Sophisticated Dark" */
        <main id="coaching-workspace" className="flex-grow flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT COLUMN: Interviewer's Presence & Question Prompter */}
          <section id="ai-interviewer-pane" className="w-full lg:w-[460px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0D0D0F] flex flex-col p-6 md:p-8 xl:p-10 shrink-0 overflow-y-auto">
            
            <div className="flex-grow flex flex-col justify-between space-y-8">
              
              {/* Question label tracker */}
              <div className="flex justify-between items-center bg-[#09090b] border border-white/5 rounded-xl p-3.5">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Stage PROGRESSION</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-white">Question {currentQuestionIdx + 1} of {MOCK_QUESTIONS.length}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] text-indigo-400 font-mono tracking-tight">{currentQuestion.categoryLabel}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">VIBE SCORE</span>
                  <p id="live-average-score-badge" className="text-sm font-bold text-emerald-400 font-mono mt-1">{liveAverageScore} <span className="text-[9px] text-slate-500">AVG</span></p>
                </div>
              </div>

              {/* Current active question text in rich Serif type */}
              <div>
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 inline-block">
                  Current Question
                </span>
                <blockquote id="interview-question-display" className="text-xl md:text-2xl font-serif italic text-white leading-snug">
                  "{currentQuestion.text}"
                </blockquote>
                
                {/* Handy Tip Helper card */}
                <div className="mt-5 p-3.5 bg-[#141417] border border-white/5 rounded-xl flex gap-3">
                  <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Coach Interview Tip</span>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{currentQuestion.tips}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Animated Avatar / Audio Feedback */}
              <div className="flex items-center justify-center py-4">
                <div className="relative flex items-center justify-center h-48 w-48">
                  <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
                    loadingEvaluation 
                      ? "bg-red-500/10 border border-red-500/20" 
                      : currentEvaluation
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-indigo-600/5 border border-indigo-500/10"
                  }`}></div>
                  
                  <div className={`w-36 h-36 rounded-full border p-1.5 relative transition-all duration-300 ${
                    loadingEvaluation 
                      ? "border-red-500/30" 
                      : currentEvaluation
                      ? "border-emerald-500/30"
                      : "border-white/10"
                  }`}>
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-[#1A1A1C] to-[#0A0A0B] flex items-center justify-center overflow-hidden">
                      <div className="flex flex-col items-center justify-center">
                        {loadingEvaluation ? (
                          <RefreshCw className="w-8 h-8 text-red-400 animate-spin" />
                        ) : currentEvaluation ? (
                          <div className="text-center">
                            <span className="text-emerald-400 font-mono font-bold text-2xl">{currentEvaluation.overallScore}</span>
                            <span className="text-[9px] block text-slate-500">SCORE</span>
                          </div>
                        ) : (
                          <span className="text-indigo-400 font-serif text-3xl select-none">
                            {selectedInterviewer.name[0]}
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-500 mt-1 font-mono uppercase tracking-widest">{selectedInterviewer.id}</span>
                      </div>
                    </div>
                    {/* Ring designs */}
                    <div className={`absolute -inset-3 border rounded-full transition-all duration-700 ${loadingEvaluation ? "border-red-500/10 animate-pulse" : "border-indigo-500/10"}`}></div>
                    <div className={`absolute -inset-6 border rounded-full transition-all duration-700 ${loadingEvaluation ? "border-red-500/5" : "border-indigo-500/5"}`}></div>
                  </div>
                </div>
              </div>

              {/* Back to Selection button */}
              <button
                id="reset-back-btn"
                type="button"
                onClick={handleResetSession}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-2 justify-center transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change Coach / Reset Mock Session
              </button>

            </div>
          </section>

          {/* RIGHT COLUMN: Interactive Workings, Live Evaluations, Wrap Up Reports */}
          <section id="coaching-workspace-right-column" className="flex-1 bg-[#0A0A0B] flex flex-col min-w-0 overflow-y-auto p-6 md:p-8 xl:p-10">
            
            {/* WRAP-UP DISPLAY IF TRIGGERED */}
            {showWrapUp ? (
              <div id="wrapup-dashboard-panel" className="space-y-8 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/5 pb-5">
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase font-mono tracking-widest">Mock Interview Complete</span>
                    <h3 className="text-2xl font-serif italic text-white mt-1">Innowise Performance Review</h3>
                  </div>
                  <button
                    id="restart-mock-btn"
                    onClick={handleResetSession}
                    className="flex items-center gap-2 px-4 py-2 text-xs rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 transition-all font-mono"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    NEW PRACTICE INTERVIEW
                  </button>
                </div>

                {loadingWrapUp ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-[#141417] rounded-2xl border border-white/5 space-y-4">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-3 h-3 bg-indigo-505 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Assembling global interview transcript, evaluating skills, and structuring React roadmap...</p>
                    <span className="text-slate-500 text-xs font-mono">Generating senior-grade Innowise roadmap advice</span>
                  </div>
                ) : wrapUpReport ? (
                  <div className="space-y-8">
                    
                    {/* Header Verdict Panel */}
                    <div className="bg-gradient-to-r from-indigo-950/40 via-[#141417] to-[#141417] border border-indigo-900/30 rounded-2xl p-6 md:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        
                        <div className="md:col-span-8 space-y-3">
                          <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-mono tracking-wider">
                            OFFICIAL VERDICT
                          </span>
                          <h4 className="text-lg md:text-xl font-bold text-white leading-snug">
                            {wrapUpReport.interviewVerdict}
                          </h4>
                          <p className="text-sm text-slate-400">
                            Our team completed evaluating your responses for a <strong>Junior React Developer</strong> role. We evaluated state mechanics, performance optimizations, and conversational delivery.
                          </p>
                        </div>

                        <div className="md:col-span-4 bg-black/40 border border-white/5 rounded-2xl p-5 text-center space-y-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">OVERALL RATING</span>
                          <div className="text-3xl font-extrabold text-white font-mono flex items-center justify-center gap-1">
                            {wrapUpReport.averageScore}
                            <span className="text-sm text-slate-600 font-normal">/10</span>
                          </div>
                          <p className="text-[11px] font-mono text-indigo-400 tracking-tight">Vibe: {wrapUpReport.communicationRating}</p>
                        </div>

                      </div>
                    </div>

                    {/* Vibe Summary */}
                    <div className="bg-[#141417] border border-white/5 rounded-2xl p-6">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>Technical Performance Vibe</span>
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {wrapUpReport.technicalVibe}
                      </p>
                    </div>

                    {/* Strengths & Weaknesses Grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Key Strengths */}
                      <div className="bg-[#141417] border border-white/5 rounded-2xl p-6">
                        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-4">
                          <Award className="w-4.5 h-4.5" />
                          <span>Visible Capabilities</span>
                        </h4>
                        <ul className="space-y-2.5">
                          {wrapUpReport.keyStrengths.map((str, idx) => (
                            <li key={idx} className="flex gap-2.5 text-xs text-slate-300">
                              <span className="font-mono text-emerald-500 font-bold shrink-0">✓</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Gaps to study */}
                      <div className="bg-[#141417] border border-white/5 rounded-2xl p-6">
                        <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-4">
                          <AlertCircle className="w-4.5 h-4.5" />
                          <span>Identified Study Gaps</span>
                        </h4>
                        <ul className="space-y-2.5">
                          {wrapUpReport.highestPriorityGaps.map((gap, idx) => (
                            <li key={idx} className="flex gap-2.5 text-xs text-slate-300">
                              <span className="font-mono text-amber-500 font-bold shrink-0">!</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* Custom study Roadmap steps */}
                    <div className="border border-white/5 bg-[#141417] rounded-2xl p-6">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                        <GraduationCap className="w-5 h-5 text-indigo-400" />
                        <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-white">Your Tailored 3-Step Innowise Study Roadmap</h4>
                      </div>

                      <div className="space-y-6">
                        {wrapUpReport.customStudyRoadmap.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-lg bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">
                              0{idx + 1}
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-zinc-100">{step.topic}</h5>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.explanation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detailed Transcript Log toggle */}
                    <div className="bg-zinc-950/60 p-5 rounded-2xl border border-white/5">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4 pb-2 border-b border-white/5">Full Mock Interview Log Trace</h4>
                      <div className="space-y-4">
                        {history.map((h, i) => (
                          <div key={h.questionId} className="text-xs border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <p className="font-semibold text-indigo-400">Q{i + 1}: {h.questionText}</p>
                            <p className="text-slate-400 mt-1 italic">" {h.userAnswer || "[No response provided]" } "</p>
                            {h.evaluation && (
                              <div className="mt-1.5 text-[11px] text-emerald-400 flex items-center gap-2">
                                <span>Score: <strong className="font-mono">{h.evaluation.overallScore}</strong></span>
                                <span>•</span>
                                <span className="text-slate-500">{h.evaluation.technicalAccuracy}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center p-12 bg-[#141417] border border-white/5 rounded-2xl">
                    <p className="text-sm text-rose-400 uppercase tracking-widest">Failed to fetch Wrap Up details</p>
                    <p className="text-xs text-slate-400 mt-1">Please try submitting the transcript report once more.</p>
                    <button
                      onClick={handleTriggerWrapUp}
                      className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
                    >
                      Re-generate Review Log
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* THE LIVE GRADING FLOW */
              <div id="live-interview-workspace" className="space-y-8 flex-1 flex flex-col justify-between">
                
                {/* Stage title card */}
                <div className="flex items-start justify-between border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 block">Category Stage</span>
                    <h3 className="text-base md:text-lg font-medium text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>{currentQuestion.category === "soft" ? "01. Behavioral Experience & Soft Skills" : "02. Core React Technical Questions"}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-mono px-2 py-0.5 rounded-lg">
                      {currentQuestion.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* AI RESPONDER / EVALUATION VIEWER */}
                <div className="space-y-6">
                  {currentItem?.loading ? (
                    <InterviewerBubble
                      interviewer={selectedInterviewer}
                      text=""
                      isWriting={true}
                    />
                  ) : currentEvaluation ? (
                    <div className="space-y-6">
                      
                      {/* Coach custom bubble */}
                      <InterviewerBubble
                        interviewer={selectedInterviewer}
                        text={`Perfect, thank you for that response. I've logged my notes as a Senior Interviewer. Here is my active evaluation:\n\n${currentEvaluation.technicalAccuracy}`}
                      />

                      {/* Score Metrics for the current question */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        
                        {/* Highlights & Gaps column */}
                        <div className="md:col-span-8 space-y-4">
                          
                          {/* Feed / Detailed Feedback */}
                          <div className="bg-[#141417] border border-indigo-950 bg-indigo-950/5 rounded-2xl p-5">
                            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2.5 pb-2 border-b border-white/5 flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Feedback & Practice snippets</span>
                            </h4>
                            <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap markdown-body prose prose-invert overflow-x-auto">
                              {currentEvaluation.constructiveFeedback}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Strengths bullet box */}
                            <div className="bg-[#141417] border border-white/5 rounded-2xl p-4">
                              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono font-bold block mb-2">✓ Strengths Noted</span>
                              <ul className="space-y-1.5">
                                {currentEvaluation.strengths.map((s, idx) => (
                                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                                    <span className="text-emerald-500 shrink-0">•</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Key missed points */}
                            <div className="bg-[#141417] border border-white/5 rounded-2xl p-4">
                              <span className="text-[10px] text-amber-400 uppercase tracking-widest font-mono font-bold block mb-2">! Key Missed Concepts</span>
                              <ul className="space-y-1.5">
                                {currentEvaluation.missedTechPoints.map((m, idx) => (
                                  <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5">
                                    <span className="text-amber-500 shrink-0">•</span>
                                    <span>{m}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                        </div>

                        {/* Standalone Rating Card */}
                        <div className="md:col-span-4 bg-[#141417] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block mb-1">GRADED SCORE</span>
                            <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1">
                              {currentEvaluation.overallScore}
                              <span className="text-xs text-slate-600 font-normal">/10</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              Be sure to analyze missed elements on the left to bring your score above 8.0 potental.
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-white/5">
                            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono block mb-1.5">Senior-Grade Answer</span>
                            <p className="text-xs text-slate-300 leading-relaxed italic">
                              "{currentEvaluation.modelAnswer}"
                            </p>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    /* Initial prompt when candidate hasn't answered yet */
                    <div className="space-y-6">
                      <InterviewerBubble
                        interviewer={selectedInterviewer}
                        text={currentQuestionIdx === 0 ? selectedInterviewer.greetingText : `For our next question, let's step into another area. I want to test your understanding regarding "${currentQuestion.categoryLabel}". When ready, toggle the mic below and formulate your answer.`}
                      />

                      <div className="p-5 bg-[#141417] border border-white/5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                        
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-950/20 text-indigo-400 border border-indigo-800/40 rounded-xl">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xs font-mono uppercase text-slate-300 tracking-wider">Awaiting your response</h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              Take a brief second to organize your thoughts before starting. If you aren't sure how to explain this, you can click <strong>"I Don't Know / Skip"</strong> to view a beautiful mentor guide explanation.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {errorText && (
                    <div className="p-4 bg-red-950/20 border border-red-800/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                      <span>{errorText}</span>
                    </div>
                  )}
                </div>

                {/* THE AUDIO & KEYBOARD INTERACTION CONSOLE */}
                <div className="mt-8 space-y-4">
                  <SpeechInput
                    disabled={loadingEvaluation}
                    expectedKeywords={currentQuestion.expectedKeywords}
                    onTranscriptComplete={handleSubmitAnswer}
                    placeholder="Describe your solution. Take your time..."
                    initialValue={currentAnswerDraft}
                  />

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0D0D0F] border border-white/5 p-4 rounded-xl gap-4">
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIdx === 0}
                        className="px-3.5 py-2 rounded-lg bg-zinc-90 w-full sm:w-auto text-xs text-zinc-400 border border-white/5 disabled:opacity-30 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIdx === MOCK_QUESTIONS.length - 1}
                        className="px-3.5 py-2 rounded-lg bg-zinc-90 w-full sm:w-auto text-xs text-zinc-400 border border-white/5 disabled:opacity-30 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-1 justify-center"
                      >
                        <span>Next Q</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {!currentEvaluation && (
                        <button
                          type="button"
                          onClick={handleIDontKnow}
                          disabled={loadingEvaluation}
                          className="px-4 py-2 bg-transparent text-slate-400 hover:text-slate-300 text-xs font-mono tracking-tight font-medium hover:underline w-full sm:w-auto text-center"
                        >
                          I Don't Know / Skip
                        </button>
                      )}

                      {/* If we answered all or want to finish, show finish btn */}
                      {currentQuestionIdx === MOCK_QUESTIONS.length - 1 && currentEvaluation ? (
                        <button
                          id="finish-interview-top-btn"
                          type="button"
                          onClick={handleTriggerWrapUp}
                          className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/30 w-full sm:w-auto text-center cursor-pointer"
                        >
                          Finish & Get Report
                        </button>
                      ) : (
                        currentEvaluation && (
                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs tracking-wider uppercase hover:bg-slate-100 transition-all shadow-xl w-full sm:w-auto text-center"
                          >
                            Advance to Next Question
                          </button>
                        )
                      )}
                    </div>

                  </div>

                  {/* QUICK PROGRESS DOTS LIST */}
                  <div className="hidden md:flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2">
                    <span>Interview Progression</span>
                    <span>{evaluatedItems.length} of {MOCK_QUESTIONS.length} Graded</span>
                  </div>
                  <div className="hidden md:flex gap-1.5 pt-1">
                    {MOCK_QUESTIONS.map((q, idx) => {
                      const evaluated = history[idx]?.evaluation !== undefined;
                      const active = idx === currentQuestionIdx;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentQuestionIdx(idx)}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            active 
                              ? "bg-indigo-505 bg-indigo-500" 
                              : evaluated 
                              ? "bg-emerald-500" 
                              : "bg-white/5 hover:bg-white/15"
                          }`}
                          title={`Go to Question ${idx + 1}`}
                        />
                      );
                    })}
                  </div>

                </div>

              </div>
            )}

            {/* QUICK FOOTER FOR GENERAL ACTIONS (such as wrap up preview or reset) */}
            <div className="mt-10 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
              <span>Innowise Interview Coach • Senior Mentoring Session</span>
              <div className="flex gap-4">
                {evaluatedItems.length > 0 && !showWrapUp && (
                  <button
                    id="finish-interview-early-btn"
                    onClick={handleTriggerWrapUp}
                    className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] hover:underline"
                  >
                    Finish Early & Compile Report ({evaluatedItems.length} graded)
                  </button>
                )}
                <span>Candidate: {userName}</span>
              </div>
            </div>

          </section>

        </main>
      )}

    </div>
  );
}
