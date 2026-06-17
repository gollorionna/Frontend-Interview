/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Interviewer, Question } from "./types";

export const INTERVIEWERS: Interviewer[] = [
  {
    id: "sergey",
    name: "Sergey Tarasov",
    title: "Senior React Architect at Innowise",
    avatarSeed: "sergey",
    bio: "Over 8 years of React & modern frontend architecture experience. He is dedicated to clean code, modular folder structures, and atomic component design principles.",
    greetingText: "Hello! Welcome to the Innowise mock interview. I will be your interviewer today. Don't worry about being perfect—tell me about your thinking, your projects, and explain things in your own words. Let's get started!",
    accentClass: "from-cyan-500 to-blue-600",
  },
  {
    id: "elena",
    name: "Elena Petrova",
    title: "Director of React Engineering",
    avatarSeed: "elena",
    bio: "Elena oversees teams of React and React Native developers. She focuses heavily on developer problem-solving strategies, performance optimization, and clean communication.",
    greetingText: "Hi there! I'm Elena. I care deeply about how you approach problems and collaborate on teams. Let's talk about your technical journeys, React experiments, and soft skill situations.",
    accentClass: "from-purple-500 to-indigo-600",
  },
  {
    id: "alex",
    name: "Alex Johnson",
    title: "Lead Frontend Engineer & Mentor",
    avatarSeed: "alex",
    bio: "Alex is a junior mentor and open-source enthusiast. He values curiosity, genuine descriptions of challenges, and a solid understanding of fundamental hooks like useEffect and useState.",
    greetingText: "Hey! Glad you're here. We was all Juniors once, so I'm here to give you practical, constructive feedback on how to stand out in client interviews. Speak naturally, I've got your back!",
    accentClass: "from-emerald-500 to-teal-600",
  },
];

export const MOCK_QUESTIONS: Question[] = [
  // 1. Introduction
  {
    id: "q1_introduce",
    text: "Could you please introduce yourself and tell me about your work experience, technical skills and main technologies you've worked with?",
    category: "soft",
    categoryLabel: "Behavioral: Introduction",
    expectedKeywords: ["experience", "react", "javascript", "skills", "projects", "learning"],
    tips: "Outline your experience path, highlight React and TypeScript, and mention the libraries you commonly use (like Redux, Tailwind, or Axios)."
  },
  // 2. Last Project Details
  {
    id: "q2_last_project",
    text: "Could you tell me more details about your last project? Tell me about how long it was, tell me about your team and your responsibilities.",
    category: "soft",
    categoryLabel: "Behavioral: Last Project",
    expectedKeywords: ["months", "team", "responsibilities", "role", "scrum", "tasks"],
    tips: "Mention duration (e.g. 6 months, 1 year), team size (developers, QA, PM), and highlight your direct responsibilities building frontend modules."
  },
  // 3. Most Challenging Task
  {
    id: "q3_challenging_task",
    text: "Could you tell me about your most challenging or interesting task that you worked on in this project?",
    category: "soft",
    categoryLabel: "Behavioral: Technical Challenge",
    expectedKeywords: ["challenge", "problem", "solution", "debugged", "implemented", "resolved"],
    tips: "Describe a tricky bug, a performance bottleneck, or a complex dynamic form/state you handled. Explain how you solved it systematically."
  },
  // 4. Role Definition
  {
    id: "q4_frontend_fullstack",
    text: "Did you work as a frontend engineer or fullstack engineer on your projects?",
    category: "soft",
    categoryLabel: "Role Definition",
    expectedKeywords: ["frontend", "backend", "api", "integration", "fullstack", "ui/ux"],
    tips: "Be direct. If you focused on UI/UX, states, and APIs, explain you are a Frontend Engineer. If you also touched Node/databases, state that clearly."
  },
  // 5. Code Quality vs Deadline
  {
    id: "q5_quality_deadline",
    text: "Describe a situation where you had to balance code quality and delivery deadlines. How did you approach it?",
    category: "soft",
    categoryLabel: "Behavioral: Deadlines",
    expectedKeywords: ["trade-off", "refactoring", "technical debt", "prioritization", "communication", "MVP"],
    tips: "Explain how you prioritize making it work first (MVP), writing tests, and communicating technical debt clearly to your team or lead if shortcuts were taken."
  },
  // 6. Defend Work to Non-Technical Stakeholders
  {
    id: "q6_stakeholders",
    text: "Have you ever had to present or defend your work to non-technical stakeholders? How did you explain technical things?",
    category: "soft",
    categoryLabel: "Behavioral: Stakeholders",
    expectedKeywords: ["analogies", "business value", "user experience", "clarity", "presentation", "demos"],
    tips: "The key is using plain, simple analogies. Focus on business value, speed, or user experience outcomes rather than code implementation details."
  },
  // 7. Stay Current
  {
    id: "q7_stay_current",
    text: "Could you tell me how you stay current with fast-changing frontend technologies?",
    category: "soft",
    categoryLabel: "Behavioral: Continuous Learning",
    expectedKeywords: ["blogs", "podcasts", "documentation", "newsletter", "pet projects", "community"],
    tips: "Mention reading official documentation, top newsletters (like React Status), technical blogs, YouTube tutorials, or actively building small pet projects."
  },
  // 8. Self Rating
  {
    id: "q8_self_rating",
    text: "On a scale from 0 to 10 how would you rate your professional skills and why?",
    category: "soft",
    categoryLabel: "Behavioral: Self-Reflection",
    expectedKeywords: ["rating", "junior", "learning path", "growth", "senior", "fundamentals"],
    tips: "Be realistic yet confident. Standard rating for a junior/strong junior is between 6 and 8. Explain that you understand core principles well but are excited to learn enterprise scaling."
  },
  // 9. Critical Render Path
  {
    id: "q9_critical_render_path",
    text: "Let's talk about technical skills. Could you tell me what is the critical render path, or what happens when we type a URL in the search bar and press enter in the browser?",
    category: "technical",
    categoryLabel: "Browser: Render Path",
    expectedKeywords: ["dns lookup", "dom tree", "cssom", "render tree", "layout", "paint", "tcp/ip"],
    tips: "Walk through DNS lookup, TCP handshake, HTTP request/response, parsing HTML to DOM, parsing CSS to CSSOM, building Render Tree, Layout, Paint, and Composite."
  },
  // 10. Async vs Defer
  {
    id: "q10_async_defer",
    text: "Could you tell me about the difference between async and defer when we are using script tags?",
    category: "technical",
    categoryLabel: "HTML: Async vs Defer",
    expectedKeywords: ["parser", "execute", "parallel", "download", "render-blocking", "domcontentloaded"],
    tips: "Both download scripts in parallel with HTML parsing. 'async' executes script immediately when downloaded (blocking parser), 'defer' waits until HTML parsing is fully processed."
  },
  // 11. Script Execution Order
  {
    id: "q11_script_order",
    text: "Do we have some specific order of execution when we are loading scripts using async vs. defer?",
    category: "technical",
    categoryLabel: "HTML: Script Order",
    expectedKeywords: ["order of appearance", "document order", "async execution", "independent", "sequential"],
    tips: "Scripts marked 'defer' always execute in the order they appear in the HTML. Scripts with 'async' execute as soon as they finish downloading, unpredictable of relative orders."
  },
  // 12. Auth vs Auth
  {
    id: "q12_auth_vs_auth",
    text: "Let's talk about authorization and authentication. Could you tell me what is the difference between them?",
    category: "technical",
    categoryLabel: "Web: Auth vs Auth",
    expectedKeywords: ["verification", "identity", "permissions", "credentials", "jwt", "roles"],
    tips: "Authentication is verifying WHO you are (e.g. login, credentials). Authorization is verifying WHAT permissions you have (e.g. VIP access, admin roles)."
  },
  // 13. Token Usage
  {
    id: "q13_token_usage",
    text: "But what can we do with this token? Where do we need it and how do we use it in frontend requests?",
    category: "technical",
    categoryLabel: "Web: Token Details",
    expectedKeywords: ["headers", "authorization", "bearer token", "jwt", "localstorage", "cookies"],
    tips: "We attach the token to the 'Authorization: Bearer <token>' HTTP header on outgoing requests to private API endpoints. Usually stored securely in cookies or sessionStorage/localStorage."
  },
  // 14. Controlled vs Uncontrolled Components
  {
    id: "q14_controlled_uncontrolled",
    text: "Could you tell me the difference between controlled and uncontrolled components in React?",
    category: "technical",
    categoryLabel: "React: Component State",
    expectedKeywords: ["state", "onchange", "value", "refs", "source of truth", "dom control"],
    tips: "Controlled component inputs are governed by React state (the react state is the single source of truth). Uncontrolled component inputs are managed by the DOM itself (retrieved via Refs)."
  },
  // 15. Hooks in Controlled Inputs
  {
    id: "q15_controlled_hook",
    text: "Which hook are we typically using when we are working with controlled components?",
    category: "technical",
    categoryLabel: "React: Controlled Hooks",
    expectedKeywords: ["usestate", "state", "setstate", "onchange", "value prop"],
    tips: "We use the 'useState' hook in controlled components to track, hold, and modify the input's current string value."
  },
  // 16. What we can do with Uncontrolled Component
  {
    id: "q16_uncontrolled_use",
    text: "What are some scenarios where we would use uncontrolled components, or what can we do with them?",
    category: "technical",
    categoryLabel: "React: Uncontrolled State",
    expectedKeywords: ["simple forms", "file uploads", "ref", "instantly", "third-party integrations", "performance"],
    tips: "Uncontrolled components are great for non-reactive items, like native file uploads, quick forms that don't need real-time validation, or wrapping legacy DOM plugins."
  },
  // 17. Hooks in Uncontrolled Input
  {
    id: "q17_uncontrolled_hook",
    text: "Within the React ecosystem, what hook do we use to get values from an input in an uncontrolled component?",
    category: "technical",
    categoryLabel: "React: Uncontrolled Hooks",
    expectedKeywords: ["useref", "ref", "current", "current.value", "dom element"],
    tips: "We use the 'useRef' hook. By passing the ref to the input element, we can access its value at any moment using 'myRef.current.value'."
  },
  // 18. Optimise React App
  {
    id: "q18_optimise_react",
    text: "Could you tell me several ways we could optimize our React applications overall?",
    category: "technical",
    categoryLabel: "React: Optimization",
    expectedKeywords: ["lazy loading", "code splitting", "usememo", "usecallback", "react.memo", "virtualization", "bundle size"],
    tips: "Mention Code Splitting (React.lazy / Suspense), Memoization (useMemo, useCallback, React.memo), List Virtualization (for huge scroll lists), and optimizing assets/bundle sizes."
  },
  // 19. Large Component / State Splitting
  {
    id: "q19_state_splitting",
    text: "Imagine we have a huge component with a lot of state inside it. If we split it into smaller components, will that improve performance or will we face the same rendering conditions?",
    category: "technical",
    categoryLabel: "React: Performance Architecture",
    expectedKeywords: ["isolated render", "sub-components", "re-render scope", "prevent unnecessary", "props"],
    tips: "Yes, it improves performance. By isolating states into specific smaller helper components, we prevent the whole massive parent tree from re-rendering when only a localized element state is modified."
  },
  // 20. Why TypeScript
  {
    id: "q20_why_typescript",
    text: "Could you tell me why we need or benefit from using TypeScript in our applications over plain JavaScript?",
    category: "technical",
    categoryLabel: "TS: Architecture",
    expectedKeywords: ["static typing", "type safety", "refactoring", "compile-time errors", "intellisense", "maintainability"],
    tips: "TypeScript grants static typing, catches bugs at compile-time rather than runtime, improves IDE autocomplete (IntelliSense), and makes large-scale team refactoring safe and predictable."
  },
  // 21. Type Guards
  {
    id: "q21_type_guards",
    text: "Could you tell me what type guards are in TypeScript?",
    category: "technical",
    categoryLabel: "TS: Type Guards",
    expectedKeywords: ["narrowing", "runtime check", "type safety", "assertion", "return boolean"],
    tips: "Type guards are expressions that perform runtime checks to narrow down or assert the specific type of a variable within a conditional block."
  },
  // 22. Type Guard Keywords
  {
    id: "q22_guard_keywords",
    text: "Which keywords or operators can we use for providing type guarding in TypeScript?",
    category: "technical",
    categoryLabel: "TS: Guard Keywords",
    expectedKeywords: ["typeof", "instanceof", "in", "is", "user-defined type guard"],
    tips: "We can use standard operators like 'typeof', 'instanceof', 'in', as well as user-defined type predicates with the 'is' keyword (e.g., function isCat(pet: Pet): pet is Cat)."
  },
  // 23. Check String in TS
  {
    id: "q23_check_string",
    text: "How could we check that we are working right now with a string variable in TypeScript?",
    category: "technical",
    categoryLabel: "TS: typeof Operator",
    expectedKeywords: ["typeof", "=== 'string'", "primitive", "narrowing"],
    tips: "Use 'typeof variable === \"string\"'. Inside the block, TypeScript automatically narrows the variable to have string operations."
  },
  // 24. Check Property in Object
  {
    id: "q24_check_property",
    text: "How could we check that a property exists in an object? What kind of keyword or operator is used?",
    category: "technical",
    categoryLabel: "TS: 'in' Operator",
    expectedKeywords: ["in operator", "'prop' in obj", "object keys", "hasownproperty"],
    tips: "Use the 'in' operator, for example: 'if (\"propertyName\" in myObject) { }'. Inside, TS knows the key is verified to exist."
  },
  // 25. Generics
  {
    id: "q25_generics",
    text: "What is a generic in TypeScript? How can we use it, and do you have any visual experience with it?",
    category: "technical",
    categoryLabel: "TS: Generics",
    expectedKeywords: ["reusable components", "placeholder", "angle brackets", "type parameter", "<T>"],
    tips: "Generics allow us to create highly reusable code components (functions, classes, interfaces) that work with any variety of types rather than a single fixed type. Represented using <T>."
  }
];
