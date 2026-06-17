import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Create Express app
const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini AI client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in your Secrets manager.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Innowise Interview Coach Server running" });
});

// Check configuration status
app.get("/api/config", (req, res) => {
  res.json({ hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Evaluation endpoint
app.post("/api/evaluate", async (req, res) => {
  try {
    const {
      userName,
      interviewerName,
      interviewerTitle,
      questionText,
      questionCategory,
      userAnswer,
    } = req.body;

    if (!questionText || userAnswer === undefined) {
      res.status(400).json({ error: "Missing required fields: questionText and userAnswer" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No GEMINI_API_KEY configured. Providing a simulated mock response.");

      // Calculate a dynamic score based on the response length and some slight variation
      const responseLength = userAnswer ? userAnswer.trim().length : 0;
      let scoreScore = 5.5 + Math.min(responseLength / 120, 3.5); // base 5.5 + up to 3.5
      scoreScore = parseFloat((scoreScore + (Math.random() * 0.8 - 0.4)).toFixed(1)); // small randomness
      
      if (responseLength < 10) {
        scoreScore = 3.0;
      }
      
      const lowerAnswer = (userAnswer || "").toLowerCase();
      if (lowerAnswer.includes("i don't know") || lowerAnswer.includes("not sure") || lowerAnswer.includes("skipped")) {
        scoreScore = 2.0;
      }

      if (scoreScore > 10.0) scoreScore = 10.0;
      if (scoreScore < 0.0) scoreScore = 0.0;

      res.json({
        overallScore: scoreScore,
        technicalAccuracy: `[Demo Mode Enabled] Reviewed response for "${questionText}". To activate custom live AI models, please define GEMINI_API_KEY.`,
        missedTechPoints: [
          "Please verify you mentioned real-world trade-offs in your explanation.",
          `Ensure you highlight the primary keyword terms for ${questionCategory || "this topic"}.`,
          "Provide code syntax examples or state hooks details to support your point."
        ],
        strengths: [
          "Good logical layout and professional structure",
          "Clear tone and developer approach",
          "Shows solid fundamental junior-level reasoning"
        ],
        constructiveFeedback: `### 🚀 Practice Complete (Demo Mode Active)

Your spoken or typed answer:
> *"${userAnswer || "[Empty answer - toggle mic and record your reply!]"}"*

To activate **personalized live feedback and code assistance** from Senior Innowise Interviewers:
1. Open the **Secrets Manager** (Settings panel on the top-right).
2. Enter a secret named \`GEMINI_API_KEY\`.
3. Provide your key, and you'll immediately see real-time custom analysis!

*Helpful Tip for this question:* Be sure to check browser rendering steps, hook updates, or soft-skill STAR format (Situation, Task, Action, Result) in future runs.`,
        modelAnswer: `A robust professional answer should address both theoretical knowledge and implementation details (e.g. state management hooks, typescript guard operators, or fast scripts loading options).`
      });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are playing the role of a Senior Technical Interviewer at Innowise, a top-tier software delivery company. 
Your tone is professional, observant, technically rigorous, but helpful and encouraging. 
The candidate is a Junior React Developer named ${userName || "Candidate"}.
Evaluate their response constructively, keeping in mind they are applying for a Junior position.
Focus on:
1. Technical accuracy: Are they explaining React concepts correctly (e.g. useState vs useRef, virtual DOM, re-renders, useEffect hooks) or soft skills properly?
2. Technical vocabulary: Do they use formal terms (components, state, props, lifecycle, hook dependencies, clean-up functions)?
3. Advice and mentorship: Suggest a clear code snippet or brief practice if they miss essential logic.
If the candidate says "I don't know" or can't answer, provide an encouraging response with a detailed, bite-sized explanation to help them learn, and give them a 0–2 score for that specific answer, but keep feedback supportive.`;

    const promptText = `
Candidate Name: ${userName || "Junior Developer"}
Interviewer Persona: ${interviewerName || "Sergey"} (${interviewerTitle || "Senior React Architect"})
Question Category Group: ${questionCategory || "General"}
Interview Question Asked: "${questionText}"
Candidate's Answer Given: "${userAnswer || "[No answer provided or spoken]"}"

Please evaluate this answer and return a JSON object with the evaluation results.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: {
              type: Type.NUMBER,
              description: "Technical and presentation score from 0.0 to 10.0 (e.g., 7.5) suitable for a Junior React Dev level. Be realistic - standard Junior average is around 5.0 to 7.0.",
            },
            technicalAccuracy: {
              type: Type.STRING,
              description: "A 1-2 sentence overview of the technical correctness of their response.",
            },
            missedTechPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List 2-4 crucial developer concepts, hooks, best practices, keyword definitions, or architectural trade-offs they omitted or forgot.",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List 1-3 strong points, correct technical facts, or good behavioral intuitions shown in their response.",
            },
            constructiveFeedback: {
              type: Type.STRING,
              description: "Detailed, personal coaching in Markdown. Explain *why* their answer is correct/incorrect, how they can improve, and provide short code examples where appropriate to illustrate the best practice.",
            },
            modelAnswer: {
              type: Type.STRING,
              description: "A crisp, short, senior-grade model answer that a junior candidate should aim to articulate during a 1-minute verbal response. Max 3-4 sentences.",
            },
          },
          required: [
            "overallScore",
            "technicalAccuracy",
            "missedTechPoints",
            "strengths",
            "constructiveFeedback",
            "modelAnswer",
          ],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text received from Gemini API");
    }

    try {
      const parsedData = JSON.parse(textOutput.trim());
      res.json(parsedData);
    } catch (parseErr) {
      console.error("Gemini output parsing failed. Raw response:", textOutput);
      res.status(500).json({
        error: "Failed to parse AI response structure",
        rawOutput: textOutput,
      });
    }
  } catch (error: any) {
    console.error("Error in /api/evaluate:", error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred during interview evaluation",
    });
  }
});

// Endpoint to generate a customized wrap-up/overall review
app.post("/api/wrapup", async (req, res) => {
  try {
    const { userName, interviewerName, interviewerTitle, transcript } = req.body;

    if (!transcript || !Array.isArray(transcript)) {
      res.status(400).json({ error: "Missing transcript history array" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No GEMINI_API_KEY configured for wrap-up. Providing simulated dashboard results.");
      
      let sum = 0;
      let count = 0;
      if (Array.isArray(transcript)) {
        transcript.forEach((t) => {
          if (typeof t.score === "number" && t.score > 0) {
            sum += t.score;
            count++;
          }
        });
      }
      const avg = count > 0 ? parseFloat((sum / count).toFixed(1)) : 7.2;

      res.json({
        interviewVerdict: `Great Practice Session Completed with ${interviewerName || "the coach"}. Configure GEMINI_API_KEY to unlock actual hiring reviews.`,
        averageScore: avg,
        communicationRating: "Steady & Constructive",
        technicalVibe: "You successfully initiated and progressed through our full mock syllabus. To receive customized real-time roadmap points compiled for your exact answers, set your Gemini API key in the secrets panel.",
        keyStrengths: [
          "Completed or skipped questions with good flow",
          "Demonstrates high motivation for learning React fundamentals",
          "Maintained a professional, consistent demeanor"
        ],
        highestPriorityGaps: [
          "Activate GEMINI_API_KEY inside AI Studio Settings",
          "Consolidate definitions of Async vs Defer script order",
          "Deepen knowledge in Controlled vs Uncontrolled component hook interactions"
        ],
        customStudyRoadmap: [
          {
            topic: "1. Key Setup: Gemini Secrets",
            explanation: "Configure your GEMINI_API_KEY environment variable. Once set, our Senior Directors will auto-evaluate your technical answers."
          },
          {
            topic: "2. Front-End Script Loading and Orders",
            explanation: "Review how 'async' triggers layout blocking right after loading, while 'defer' guarantees natural source execution order."
          },
          {
            topic: "3. TypeScript Generic Definitions",
            explanation: "Formulate practice functions using types <T> to expand reusable structural components reliably."
          }
        ]
      });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are play-playing the role of a Senior React Director and Mentor at Innowise. 
After observing a candidate's complete mock interview, compile a thoughtful, structured, overall Performance report.
The candidate is a Junior React Developer named ${userName || "Candidate"}.
Be encouraging, detailed, realistic, and highly professional. Offer clear guidelines on how they should shape their studies.`;

    const promptText = `
Candidate Name: ${userName || "Junior Developer"}
Interviewer: ${interviewerName} (${interviewerTitle})

Please construct an overall review based on this interview transcript:
${JSON.stringify(transcript, null, 2)}

Provide a beautiful, structured analysis of their strengths, key technical gaps, overall interview vibe, and a tailored study roadmap. Return a JSON structure.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interviewVerdict: {
              type: Type.STRING,
              description: "A summary sentence reflecting if they are ready for client interviews (e.g., 'Strong Solid Junior potential with minor gaps', 'Highly promising, has excellent technical vocabulary but needs more experience in React performance optimization').",
            },
            averageScore: {
              type: Type.NUMBER,
              description: "Overall math average or weighted interview performance score from 0.0 to 10.0.",
            },
            communicationRating: {
              type: Type.STRING,
              description: "A classification of their delivery: 'Excellent', 'Good, Solid', 'Anxious / Too Brief', or 'Room to Grow'.",
            },
            technicalVibe: {
              type: Type.STRING,
              description: "A short review of their core technical performance.",
            },
            keyStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Top 3 overarching strengths seen across the whole interview.",
            },
            highestPriorityGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Top 3 highest priority technical or soft-skill areas they must study before applying to Innowise client interviews.",
            },
            customStudyRoadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING, description: "Topic name (e.g. Hooks, Context Performance, Redux, Clean Code)" },
                  explanation: { type: Type.STRING, description: "Actionable advice, resources, or code habits to acquire for this topic." }
                },
                required: ["topic", "explanation"]
              },
              description: "A customized 3-step technical roadmap tailored exactly to their visible gaps."
            }
          },
          required: [
            "interviewVerdict",
            "averageScore",
            "communicationRating",
            "technicalVibe",
            "keyStrengths",
            "highestPriorityGaps",
            "customStudyRoadmap"
          ]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text received from Gemini API in wrapup");
    }

    try {
      res.json(JSON.parse(textOutput.trim()));
    } catch (parseErr) {
      res.status(500).json({ error: "Failed to parse wrapup content", rawOutput: textOutput });
    }
  } catch (error: any) {
    console.error("Error in /api/wrapup:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during wrap-up compilation" });
  }
});

// Configure Vite middleware / Serve client
const isProduction = process.env.NODE_ENV === "production";

async function configureVite() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server configured.");
  }
}

// Start the server
configureVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}).catch((err) => {
  console.error("Vite configuration initialization failed:", err);
});
