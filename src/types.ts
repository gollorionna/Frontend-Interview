/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Interviewer {
  id: string;
  name: string;
  title: string;
  avatarSeed: string; // Used to generate custom SVG avatar
  bio: string;
  greetingText: string;
  accentClass: string; // e.g. "from-emerald-500 to-teal-400"
}

export interface Question {
  id: string;
  text: string;
  category: "soft" | "technical" | "closing";
  categoryLabel: string;
  expectedKeywords: string[];
  tips: string;
}

export interface EvaluationResult {
  overallScore: number;
  technicalAccuracy: string;
  missedTechPoints: string[];
  strengths: string[];
  constructiveFeedback: string;
  modelAnswer: string;
}

export interface AnswerHistoryItem {
  questionId: string;
  questionText: string;
  category: string;
  userAnswer: string;
  evaluation?: EvaluationResult;
  loading: boolean;
  error?: string;
}

export interface WrapUpReport {
  interviewVerdict: string;
  averageScore: number;
  communicationRating: string;
  technicalVibe: string;
  keyStrengths: string[];
  highestPriorityGaps: string[];
  customStudyRoadmap: {
    topic: string;
    explanation: string;
  }[];
}
