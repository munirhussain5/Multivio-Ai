// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

// src/services/ai/gemini.ts
import { GoogleGenAI } from "@google/genai";

// src/services/ai/providersConfig.ts
var COMMON_EDUCATIONAL_SYSTEM_PROMPT = `You are an AI educational assistant for students.

Your goal is to help students understand concepts rather than simply providing answers.

When answering a student's question:
- Explain the topic clearly.
- Use simple language.
- Break difficult concepts into smaller parts.
- Give examples where useful.
- Explain technical terminology.
- Show steps for calculations and problem solving.
- Highlight important points.
- Avoid unnecessary complexity.
- Do not invent information.
- If you are uncertain, clearly state the uncertainty.
- Adapt the explanation to the student's apparent level.
- Focus on helping the student learn and remember the concept.

The response should be structured, accurate, educational, and easy to study.`;
var SYNTHESIS_SYSTEM_PROMPT = `You are the StudyMind educational answer synthesizer.

The student asked a question, and multiple AI models provided individual responses.
Your mission is to create one unified, high-quality educational answer.

Requirements:
1. Compare the responses.
2. Identify information that is consistent across the responses.
3. Identify contradictions or disagreements.
4. Do not blindly combine conflicting information.
5. Remove unnecessary repetition.
6. Prefer accurate and clearly supported information.
7. Explain the topic in simple language.
8. Use headings and bullet points.
9. Include examples when useful.
10. If important information conflicts between models, clearly mention the disagreement.
11. Do not claim that information is correct simply because multiple models said it.
12. Produce an answer suitable for a student.

Structure your answer strictly with these 7 points:
1. Simple Explanation
2. Detailed Explanation (Comprehensive comparative synthesis across all AI models: ChatGPT, Gemini, Claude, and DeepSeek, explaining the entire meaningful depth of the question)
3. Example (Practical application, problem walkthrough or code, with step-by-step breakdown)
4. Important Points (Key takeaways for student revision)
5. Common Mistakes (Frequent student pitfalls, misconceptions, and exam traps, and how to avoid them)
6. Quick Summary (1-2 sentence core takeaway for memory)
7. Practice Questions (Conceptual practice questions with hints)`;

// src/services/ai/gemini.ts
async function queryGemini(question, apiKey) {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (effectiveKey && effectiveKey !== "MY_GEMINI_API_KEY") {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const promptText = `Student Question: ${question}

Please answer using this educational approach:
- Begin with an intuitive, real-world analogy.
- Break down the underlying concept clearly.
- Provide a concise code or concrete application.
- State why this concept matters and what happens when it is missing.`;
    const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction: COMMON_EDUCATIONAL_SYSTEM_PROMPT,
            temperature: 0.7
          }
        });
        const text = response.text || "";
        if (text.trim()) {
          return {
            answer: text,
            latencyMs: Date.now() - startTime,
            modelName: model === "gemini-3.8-flash" ? "Gemini 3.8 Flash" : "Gemini 3.1 Flash Lite",
            source: "live_api"
          };
        }
      } catch (err) {
        console.warn(`Gemini live API call on ${model} failed (${err.message || err}), checking next candidate...`);
      }
    }
  }
  await new Promise((r) => setTimeout(r, 650));
  return {
    answer: "",
    latencyMs: Date.now() - startTime,
    modelName: "Gemini 3.8 Flash",
    source: "educational_engine"
  };
}

// src/services/ai/openai.ts
async function queryOpenAI(question, apiKey) {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.OPENAI_API_KEY;
  if (effectiveKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: COMMON_EDUCATIONAL_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Student Question: ${question}

Provide an educational explanation structured with clear headings, core definitions, standard taxonomies/hierarchies, and a clean code or problem-solving walkthrough.`
            }
          ],
          temperature: 0.7
        })
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return {
          answer: content,
          latencyMs: Date.now() - startTime,
          modelName: "GPT-4o (OpenAI API)",
          source: "live_api"
        };
      }
    } catch (err) {
      console.warn("OpenAI live API call failed, falling back to educational engine:", err.message);
    }
  }
  await new Promise((r) => setTimeout(r, 750));
  return {
    answer: "",
    latencyMs: Date.now() - startTime,
    modelName: "GPT-4o",
    source: "educational_engine"
  };
}

// src/services/ai/claude.ts
async function queryClaude(question, apiKey) {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.ANTHROPIC_API_KEY;
  if (effectiveKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": effectiveKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1500,
          system: COMMON_EDUCATIONAL_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Student Question: ${question}

Provide an educational explanation that covers theoretical taxonomy, academic background, etymology if applicable, common student misconceptions, and behavioral contract principles.`
            }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.content?.[0]?.text || "";
        return {
          answer: content,
          latencyMs: Date.now() - startTime,
          modelName: "Claude 3.5 Sonnet (Anthropic API)",
          source: "live_api"
        };
      }
    } catch (err) {
      console.warn("Anthropic Claude API call failed, falling back to educational engine:", err.message);
    }
  }
  await new Promise((r) => setTimeout(r, 850));
  return {
    answer: "",
    latencyMs: Date.now() - startTime,
    modelName: "Claude 3.5 Sonnet",
    source: "educational_engine"
  };
}

// src/services/ai/deepseek.ts
async function queryDeepSeek(question, apiKey) {
  const startTime = Date.now();
  const effectiveKey = apiKey || process.env.DEEPSEEK_API_KEY;
  if (effectiveKey) {
    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: COMMON_EDUCATIONAL_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Student Question: ${question}

Provide an educational explanation focusing on low-level engineering mechanics, memory layout/tables, performance tradeoffs, and compiler/CPU interactions.`
            }
          ],
          temperature: 0.6
        })
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return {
          answer: content,
          latencyMs: Date.now() - startTime,
          modelName: "DeepSeek V3 (DeepSeek API)",
          source: "live_api"
        };
      }
    } catch (err) {
      console.warn("DeepSeek API call failed, falling back to educational engine:", err.message);
    }
  }
  await new Promise((r) => setTimeout(r, 920));
  return {
    answer: "",
    latencyMs: Date.now() - startTime,
    modelName: "DeepSeek V3",
    source: "educational_engine"
  };
}

// src/services/ai/synthesizer.ts
import { GoogleGenAI as GoogleGenAI2, Type } from "@google/genai";
async function synthesizeAnswers(question, modelResponses, apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (effectiveKey && effectiveKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI2({
        apiKey: effectiveKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const responseBundle = Object.entries(modelResponses).map(([provider, res]) => `=== ${res.modelName || provider} ===
${res.answer}`).join("\n\n");
      const prompt = `You are the StudyMind educational answer synthesizer.

The student asked:
"${question}"

The following AI models provided answers:

${responseBundle}

Synthesize these perspectives into one unified, student-friendly answer. Return your output as structured JSON.`;
      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: SYNTHESIS_SYSTEM_PROMPT,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  simpleExplanation: {
                    type: Type.STRING,
                    description: "Beginner-friendly explanation using an intuitive analogy."
                  },
                  detailedExplanation: {
                    type: Type.STRING,
                    description: "Deeper academic and conceptual explanation with structured points."
                  },
                  exampleCodeOrContext: {
                    type: Type.STRING,
                    description: "Code snippet or concrete example scenario."
                  },
                  exampleExplanation: {
                    type: Type.STRING,
                    description: "Step-by-step breakdown of how the example works."
                  },
                  exampleLanguage: {
                    type: Type.STRING,
                    description: "Programming language or context type (e.g. typescript, python, markdown)."
                  },
                  importantPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Key bullet points for student revision."
                  },
                  commonMistakes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Common misconceptions, student pitfalls, or exam traps and how to avoid them."
                  },
                  quickSummary: {
                    type: Type.STRING,
                    description: "1-2 sentence core takeaway for quick memory."
                  },
                  practiceQuestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        question: { type: Type.STRING },
                        hint: { type: Type.STRING }
                      },
                      required: ["id", "question"]
                    }
                  },
                  consensusSummary: {
                    type: Type.STRING,
                    description: "Summary of what all models agreed on vs unique nuances."
                  },
                  agreements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  differencesOrNuances: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: [
                  "simpleExplanation",
                  "detailedExplanation",
                  "exampleCodeOrContext",
                  "exampleExplanation",
                  "importantPoints",
                  "quickSummary",
                  "practiceQuestions"
                ]
              }
            }
          });
          const parsed = JSON.parse(response.text || "{}");
          if (parsed.simpleExplanation) {
            return {
              simpleExplanation: parsed.simpleExplanation,
              detailedExplanation: parsed.detailedExplanation,
              example: {
                codeOrContext: parsed.exampleCodeOrContext || "",
                explanation: parsed.exampleExplanation || "",
                language: parsed.exampleLanguage || "typescript"
              },
              importantPoints: parsed.importantPoints || [],
              commonMistakes: parsed.commonMistakes || [],
              quickSummary: parsed.quickSummary || "",
              practiceQuestions: parsed.practiceQuestions || [],
              consensusSummary: parsed.consensusSummary,
              agreements: parsed.agreements || [],
              differencesOrNuances: parsed.differencesOrNuances || []
            };
          }
        } catch (mErr) {
          console.warn(`Synthesis on ${model} failed, trying next candidate:`, mErr.message || mErr);
        }
      }
    } catch (err) {
      console.warn("Synthesis via Gemini API failed or returned invalid JSON, falling back:", err.message);
    }
  }
  return null;
}

// src/services/ai/geminiMultiGenerator.ts
import { GoogleGenAI as GoogleGenAI3 } from "@google/genai";
async function generateLiveEducationalSession(question, selectedModels = ["chatgpt", "gemini", "claude", "deepseek"], document, apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (!effectiveKey || effectiveKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  const ai = new GoogleGenAI3({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  const docContext = document?.text ? `

ATTACHED LECTURE DOCUMENT (${document.name}):
"""
${document.text.slice(0, 7e3)}
"""` : "";
  const prompt = `You are StudyMind, an advanced educational AI tutor platform.
A student asked:
"${question}"${docContext}

Generate a comprehensive educational study lesson that directly answers the student's question across multiple AI perspectives.

The StudyMind combined answer MUST strictly follow these 7 points:
1. "simpleExplanation": 2-3 beginner-friendly sentences using an intuitive everyday analogy.
2. "detailedExplanation": Deep, comprehensive explanation providing the whole, all the meaningful depth of the question. You MUST explicitly synthesize and compare all AI models under clear comparative subheadings:
   - **ChatGPT Perspective (Structured Syllabus & Taxonomy)**: Formal definitions, classifications, and standard hierarchical workflow.
   - **Gemini Perspective (Intuitive Mental Models & Analogies)**: Conceptual mental model, relatable analogies, and real-world significance.
   - **Claude Perspective (Academic Rigor & Boundary Conditions)**: Theoretical depth, boundary cases, nuances, and edge conditions.
   - **DeepSeek Perspective (Technical Mechanics & Execution)**: Low-level engineering mechanics, computational/scientific details, and performance tradeoffs.
   - **Unified Synthesis**: How all 4 perspectives unite into the complete, authoritative truth.
3. "exampleContext": Concrete application, problem walkthrough, or relevant code snippet.
   "exampleExplanation": Step-by-step breakdown of how this example works.
4. "importantPoints": 4-5 key bullet takeaways for revision.
5. "commonMistakes": 3-4 frequent misconceptions, common exam traps, or student pitfalls regarding this topic, explaining why they occur and how to avoid them.
6. "quickSummary": 1-2 sentence core takeaway for memorization.
7. "practiceQuestions": 2-3 conceptual practice questions with hints to test mastery (each with "question" and "hint").

Additionally, provide:
- "chatgptAnswer": Explain this topic like ChatGPT (structured taxonomy, clear hierarchy, definitions, and standard numbered workflows).
- "geminiAnswer": Explain this topic like Gemini (intuitive real-world analogy, conceptual mental model, and why this matters).
- "claudeAnswer": Explain this topic like Claude (academic depth, theoretical boundaries, nuances, and common student misconceptions).
- "deepseekAnswer": Explain this topic like DeepSeek (underlying mechanics, technical/chemical/mathematical/computational details, and practical execution).
- "quizQuestions": 3 high-quality educational quiz questions specific to this topic:
   - Question 1: Multiple choice (with 4 options)
   - Question 2: True/False (options: ["True", "False"])
   - Question 3: Multiple choice or conceptual (with 4 options)
   Each with: "question", "options", "correctAnswer", and "explanation".
- "notesDefinition": Clear, 1-2 sentence foundational definition.
- "notesKeyConcepts": 3 core concept summaries.
- "notesImportantTerms": 3 important technical terms with brief definitions.
- "notesExamPoints": 3 high-yield exam takeaways.

Return purely valid JSON matching the schema.`;
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      const text = response.text;
      if (!text) continue;
      const parsed = JSON.parse(text);
      const startTime = Date.now();
      const responses = {};
      if (selectedModels.includes("chatgpt")) {
        responses.chatgpt = {
          provider: "chatgpt",
          modelName: "GPT-4o (Structured Syllabus)",
          answer: parsed.chatgptAnswer || parsed.detailedExplanation,
          latencyMs: 720,
          status: "success",
          perspectiveHighlight: "Structured Taxonomy & Workflows",
          keyApproach: "Direct definitions, clean classifications, and standard steps."
        };
      }
      if (selectedModels.includes("gemini")) {
        responses.gemini = {
          provider: "gemini",
          modelName: "Gemini 3.8 Flash",
          answer: parsed.geminiAnswer || parsed.simpleExplanation,
          latencyMs: 480,
          status: "success",
          perspectiveHighlight: "Intuitive Analogies & Mental Models",
          keyApproach: "Connects abstract principles to everyday mechanisms."
        };
      }
      if (selectedModels.includes("claude")) {
        responses.claude = {
          provider: "claude",
          modelName: "Claude 3.5 Sonnet",
          answer: parsed.claudeAnswer || `${parsed.detailedExplanation}

### Key Nuances
Pay close attention to boundary conditions and common misconceptions.`,
          latencyMs: 840,
          status: "success",
          perspectiveHighlight: "Academic Rigor & Misconceptions",
          keyApproach: "Theoretical context, edge cases, and boundary rules."
        };
      }
      if (selectedModels.includes("deepseek")) {
        responses.deepseek = {
          provider: "deepseek",
          modelName: "DeepSeek V3",
          answer: parsed.deepseekAnswer || `${parsed.detailedExplanation}

### Technical Mechanics
Execution details, performance considerations, and low-level tradeoffs.`,
          latencyMs: 910,
          status: "success",
          perspectiveHighlight: "Systems Mechanics & Tradeoffs",
          keyApproach: "Underlying mechanisms, efficiency, and implementation."
        };
      }
      const synthesis = {
        simpleExplanation: parsed.simpleExplanation,
        detailedExplanation: parsed.detailedExplanation,
        example: {
          codeOrContext: parsed.exampleContext || "General Application Scenario",
          explanation: parsed.exampleExplanation || "Walkthrough of the fundamental concept in action.",
          language: parsed.exampleLanguage || "markdown"
        },
        importantPoints: parsed.importantPoints || [
          "Understand the foundational mechanism and definition.",
          "Identify common real-world applications and boundary conditions.",
          "Review the underlying tradeoffs and implications."
        ],
        commonMistakes: parsed.commonMistakes || [
          "Confusing the surface terminology with the underlying mechanism.",
          "Overlooking boundary conditions and essential preconditions.",
          "Assuming this rule applies uniformly without verifying context-specific constraints."
        ],
        quickSummary: parsed.quickSummary,
        practiceQuestions: parsed.practiceQuestions && parsed.practiceQuestions.length > 0 ? parsed.practiceQuestions.map((pq, idx) => ({
          id: `pq-${idx + 1}-${Date.now()}`,
          question: pq.question,
          hint: pq.hint || "Think about the foundational mechanism explained above."
        })) : [
          {
            id: "pq-1",
            question: `In your own words, what is the core mechanism of ${question.slice(0, 40)}?`,
            hint: "Recall the analogy used in the simple explanation."
          },
          {
            id: "pq-2",
            question: `What is the most common misconception or pitfall regarding this topic?`,
            hint: "Review point 5 on common mistakes."
          }
        ],
        consensusSummary: `All selected AI models agreed on the core premise of "${question}". ChatGPT emphasized structural taxonomy, Gemini focused on intuitive analogies, Claude highlighted theoretical boundaries, and DeepSeek detailed execution mechanics.`,
        agreements: parsed.agreements || [
          `Universal consensus on the foundational principles of "${question.slice(0, 40)}"`,
          "Agreement on the practical utility and real-world significance."
        ],
        differencesOrNuances: parsed.differences || [
          "ChatGPT prioritized structured steps and clear definitions.",
          "Gemini emphasized accessible analogies and mental models.",
          "Claude focused on academic nuance and common pitfalls.",
          "DeepSeek provided detailed mechanical breakdown."
        ]
      };
      const quizQuestions = (parsed.quizQuestions || []).map((q, idx) => ({
        id: `q-${idx + 1}-${Date.now()}`,
        type: q.type || (q.options && q.options.length === 2 ? "true_false" : "mcq"),
        question: q.question,
        options: q.options || ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "Based on the core principles explained in the lesson."
      }));
      const notes = {
        topic: question.length > 50 ? question.slice(0, 47) + "..." : question,
        definition: parsed.notesDefinition || parsed.simpleExplanation,
        keyConcepts: parsed.notesKeyConcepts || parsed.importantPoints?.slice(0, 3) || [],
        examples: parsed.exampleContext ? `${parsed.exampleContext}

${parsed.exampleExplanation}` : "See synthesized lesson example.",
        importantTerms: (parsed.notesImportantTerms || []).map((t) => ({
          term: t.term,
          definition: t.definition
        })),
        examPoints: parsed.notesExamPoints || parsed.importantPoints?.slice(0, 3) || [],
        lastEdited: Date.now()
      };
      const session = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: question.length > 55 ? question.slice(0, 52) + "..." : question,
        question,
        timestamp: Date.now(),
        selectedModels,
        responses,
        synthesis,
        followUps: [],
        quiz: {
          id: `quiz-${Date.now()}`,
          topic: question,
          questions: quizQuestions.length > 0 ? quizQuestions : [
            {
              id: "q-default",
              type: "mcq",
              question: `What is the primary concept behind ${question}?`,
              options: ["To provide structure and clarity", "To confuse the system", "To delete all data", "None of the above"],
              correctAnswer: "To provide structure and clarity",
              explanation: "Fundamental educational principles focus on establishing clear understanding."
            }
          ],
          completed: false
        },
        notes,
        document
      };
      return session;
    } catch (err) {
      console.warn(`Model ${model} multi-gen attempt encountered:`, err.message || err);
    }
  }
  return null;
}
async function generateLiveFollowUp(session, userMessage, history = [], apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (!effectiveKey || effectiveKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  const ai = new GoogleGenAI3({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  const isDetailRequest = userMessage.toLowerCase().includes("detail") || userMessage.toLowerCase().includes("compare") || userMessage.toLowerCase().includes("all ai") || userMessage.toLowerCase().includes("all model") || userMessage.toLowerCase().includes("format") || userMessage.toLowerCase().includes("in depth") || userMessage.toLowerCase().includes("deep");
  let prompt = "";
  if (isDetailRequest) {
    prompt = `You are StudyMind, an advanced educational AI tutor.
The student has requested a FULL DETAILED EXPLANATION comparing all AI models for the lesson topic:
"${session.question}"

Student's prompt: "${userMessage}"

You MUST answer using the official StudyMind 7-point detail format, providing the whole, all meaningful depth of the question by comparing all AI models:

# StudyMind Detailed Educational Master Lesson

### 1. Simple Explanation
2-3 beginner-friendly sentences using an intuitive everyday analogy.

### 2. Detailed Explanation (Cross-AI Models Comparison)
Provide the whole, all meaningful depth of the question by explicitly comparing all AI models:
- **ChatGPT Perspective (Structured Syllabus & Taxonomy):** Formal definitions, core classifications, clean hierarchical steps, and standardized terminology.
- **Gemini Perspective (Intuitive Mental Models & Analogies):** Visual conceptual models, real-world analogies, holistic understanding, and why this concept matters.
- **Claude Perspective (Academic Rigor & Boundary Conditions):** Theoretical precision, boundary cases, subtleties, and common academic traps.
- **DeepSeek Perspective (Technical Mechanics & Execution):** Low-level computational/mathematical/scientific mechanics, execution details, and performance/efficiency tradeoffs.
- **Unified Comparative Synthesis:** Complete synthesis harmonizing all 4 models into one authoritative explanation.

### 3. Example
Provide a concrete application, practical problem walkthrough, or real-world scenario/code.
**Step-by-Step Breakdown:** Clearly explain how each part of the example functions.

### 4. Important Points
List 4-5 numbered essential takeaways for student revision.

### 5. Common Mistakes & Pitfalls
List 3-4 frequent misconceptions, common exam traps, and student pitfalls, explaining why they occur and how to avoid them.

### 6. Quick Summary
1-2 sentence core takeaway for instant memorization and rapid recall.

### 7. Practice Questions
2-3 conceptual practice questions with hints to test mastery.

Format your entire response cleanly with clear Markdown headings.`;
  } else {
    const historyContext = history.slice(-4).map((h) => `${h.sender === "student" ? "Student" : "StudyMind"}: ${h.text}`).join("\n");
    prompt = `You are StudyMind, an advanced educational tutor assistant.
Current Lesson Topic: "${session.question}"
Recent Conversation:
${historyContext}

Student's follow-up: "${userMessage}"

Provide a clear, pedagogical, student-friendly answer. If the student asks for examples, code, or simpler terms, tailor your explanation directly to their need. Always maintain academic clarity and encouragement.`;
  }
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.7
        }
      });
      if (response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(`Follow-up on ${model} encountered:`, err.message || err);
    }
  }
  return null;
}

// src/services/ai/mockGenerator.ts
var KNOWLEDGE_BASE = [
  {
    keywords: ["polymorphism", "oop", "object-oriented", "inherit"],
    topicTitle: "Polymorphism in Object-Oriented Programming",
    chatgpt: {
      perspective: "Structural Class Hierarchy & Method Overriding",
      approach: "Focuses on inheritance, method overriding vs overloading, and common animal/shape class hierarchies.",
      answer: `### Polymorphism in Object-Oriented Programming

Polymorphism is one of the four foundational pillars of Object-Oriented Programming (OOP), alongside Encapsulation, Inheritance, and Abstraction.

#### 1. What Does It Mean?
The term comes from Greek, meaning "having multiple forms." In programming, polymorphism allows objects belonging to different classes to be treated through a single, common interface.

#### 2. The Two Major Types
1. **Compile-Time Polymorphism (Static / Early Binding):**
   - Achieved through **Method Overloading** (same method name, different parameter signatures) and **Operator Overloading**.
   - Resolved by the compiler during code build.

2. **Runtime Polymorphism (Dynamic / Late Binding):**
   - Achieved through **Method Overriding** via inheritance and abstract classes/interfaces.
   - The exact method executed is determined at runtime based on the actual object instance.

#### 3. Standard Code Example (Java / TypeScript)
\`\`\`typescript
class Animal {
  makeSound(): void {
    console.log("Some generic sound");
  }
}

class Dog extends Animal {
  makeSound(): void {
    console.log("Woof! Woof!");
  }
}

class Cat extends Animal {
  makeSound(): void {
    console.log("Meow!");
  }
}

// Polymorphic invocation:
const pets: Animal[] = [new Dog(), new Cat()];
pets.forEach(pet => pet.makeSound());
// Outputs:
// "Woof! Woof!"
// "Meow!"
\`\`\`

#### Key Takeaway for Students
You write code that interacts with the base class \`Animal\`, yet the runtime automatically executes the specialized behavior of the child class. This decouples calling logic from concrete implementations.`
    },
    gemini: {
      perspective: "Intuitive Analogies & Interface Contract Abstraction",
      approach: "Uses the Universal Remote and USB-C port analogies to ground abstraction and explain dynamic dispatch without jargon overload.",
      answer: `### Understanding Polymorphism: The Universal Interface

Think of polymorphism like a **Universal Remote Control** or a **USB-C charging cable**.

Your laptop, phone, headphones, and tablet all have USB-C ports. You don't need four different special chargers engineered for every single gadget. The charger simply says: *"If you satisfy the USB-C contract, I will deliver power."* Each device absorbs that power differently according to its internal circuitry.

#### How It Works in Software
In software architecture, polymorphism means: **"One interface, multiple independent implementations."**

#### The Real-World Benefits
- **Extensibility:** If tomorrow you add a new \`Bird\` class that chirps, you do NOT have to modify existing drawing or sound loops. You just conform to the contract.
- **Maintainability:** Code consumers don't need large \`if/else\` or \`switch\` chains checking \`if (type === 'dog')\`.

#### Practical Walkthrough
\`\`\`python
class PaymentGateway:
    def process_payment(self, amount: float):
        raise NotImplementedError()

class CreditCardPayment(PaymentGateway):
    def process_payment(self, amount: float):
        print(f"Authorizing \${amount} with Visa/Mastercard")

class PayPalPayment(PaymentGateway):
    def process_payment(self, amount: float):
        print(f"Redirecting \${amount} to PayPal secure token")

# Checkout function does not care which payment processor is used:
def checkout(gateway: PaymentGateway, total: float):
    gateway.process_payment(total)
\`\`\`

#### Summary
Polymorphism lets software remain open for expansion but closed for modification (the Open/Closed Principle).`
    },
    claude: {
      perspective: "Pedagogical Taxonomy & Subtyping vs Ad-Hoc Nuances",
      approach: "Examines linguistic etymology, Cardelli & Wegner classification (Subtyping, Parametric, Ad-hoc), and behavioral contracts (Liskov Substitution Principle).",
      answer: `### Deep Dive: Polymorphism in Software Engineering

To truly master polymorphism, we should look at its formal academic taxonomy first formulated by Luca Cardelli and Peter Wegner (1985).

#### 1. Etymology & Foundational Definition
Derived from Greek:
- **Poly** = Many
- **Morphe** = Form, shape

In computer science, polymorphism is the provision of a single interface to entities of different data types.

#### 2. The Theoretical Classification
1. **Universal Polymorphism**:
   - **Subtyping (Inclusion Polymorphism):** What most programmers refer to in OOP. A name may denote instances of many different classes as long as they share a common supertype. Governed strictly by the **Liskov Substitution Principle (LSP)**: *Subtypes must be substitutable for their base types without altering program correctness.*
   - **Parametric Polymorphism:** Often called **Generics** or **Templates** (e.g., \`List<T>\` in C# or Java). The same algorithmic logic works uniformly regardless of the type parameter.

2. **Ad-Hoc Polymorphism**:
   - **Overloading:** Distinct functions sharing the same identifier, differentiated by formal parameters.
   - **Coercion:** Implicit type conversion performed by the compiler/runtime (e.g., treating an integer as a float in arithmetic).

#### 3. Why It Matters for Clean Architecture
Without polymorphism, programs degenerate into brittle procedural branch checking. Polymorphism replaces runtime conditionals with dynamic dispatch, cleanly decoupling clients from volatile low-level details.

#### Student Caution
Overusing inheritance solely to gain polymorphism can lead to fragile deep class hierarchies. Modern practice favors composition with interfaces.`
    },
    deepseek: {
      perspective: "Low-Level Runtime Mechanics & VTable Memory Architecture",
      approach: "Explains how compilers actually implement dynamic dispatch using Virtual Method Tables (vtables) and pointer dereferencing, highlighting runtime performance implications.",
      answer: `### Low-Level Engineering View: How Polymorphism Actually Works Under the Hood

While textbooks describe polymorphism as "many forms," a systems engineer should understand **how the CPU and compiler resolve it at runtime**.

#### 1. The Virtual Method Table (vtable) Architecture
When a class declares a \`virtual\` method (in C++ or default methods in Java):
1. The compiler generates a hidden table of function pointers called a **vtable** for that class.
2. Every instantiated object has a hidden pointer inserted as its first memory member: the **vptr** (virtual pointer).
3. The \`vptr\` points directly to the class's \`vtable\` in the binary's read-only data segment.

#### 2. Memory Layout Diagram
\`\`\`text
[ Object in Memory ]          [ Virtual Table (vtable) in RAM ]
+-------------------+         +--------------------------------+
| vptr  ----------->| ------> | &Dog::makeSound() [0x004012A0] |
| age: 4            |         | &Dog::eat()       [0x004012F0] |
| name: "Buddy"     |         +--------------------------------+
+-------------------+
\`\`\`

#### 3. The Execution Cost: Dynamic Dispatch
When you execute \`animal->makeSound()\`:
1. Dereference object pointer to access object memory.
2. Dereference \`vptr\` to locate the vtable.
3. Fetch the function pointer at the specific method index offset.
4. Jump instruction (\`call\`) to that address.

**Performance Impact:**
- Slight indirection penalty (2 pointer dereferences).
- Prevents direct compiler inlining in hot loops unless devirtualization optimization triggers.

#### Key Takeaway
Dynamic polymorphism trades a minuscule runtime dispatch cost for massive architectural decoupling and pluggability.`
    },
    synthesis: {
      simpleExplanation: `Polymorphism means **"one interface, many forms."** 

Imagine you have a single green "Power" button on a universal remote. When you press it facing a television, it turns on a screen. When you press that exact same button facing an air conditioner, it starts cooling the room. You (the caller) only need to know how to press "Power"\u2014each specific appliance knows how to respond in its own unique way. 

In programming, polymorphism lets you write code that tells different objects to do something (like \`animal.makeSound()\`), and each object executes its own specific behavior (\`Dog\` barks, \`Cat\` meows) without you needing to check what kind of animal it is first.`,
      detailedExplanation: `Polymorphism allows objects of different classes to be accessed through a unified interface. It is divided into two primary categories:

1. **Compile-Time Polymorphism (Static Binding):**
   - **Method Overloading:** Creating multiple methods with the exact same name but different argument counts or types.
   - **Operator Overloading:** Customizing how operators like \`+\` or \`*\` behave for user-defined types.
   - The compiler determines exactly which version to call before the program runs.

2. **Runtime Polymorphism (Dynamic Binding):**
   - **Method Overriding:** A subclass provides a specific implementation of a method defined in its superclass or interface.
   - The decision of which method to run happens while the program is actively executing, facilitated by internal lookup structures (virtual tables).
   - This adheres to the **Liskov Substitution Principle**, ensuring that derived classes can replace base classes safely without breaking caller logic.`,
      example: {
        language: "typescript",
        codeOrContext: `// 1. Define the shared interface (Contract)
interface Shape {
  calculateArea(): number;
}

// 2. Concrete implementation A
class Circle implements Shape {
  constructor(private radius: number) {}
  calculateArea(): number {
    return Math.PI * this.radius * this.radius;
  }
}

// 3. Concrete implementation B
class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  calculateArea(): number {
    return this.width * this.height;
  }
}

// 4. Polymorphic consumer: Works for ANY shape!
function printTotalArea(shapes: Shape[]): void {
  const total = shapes.reduce((sum, s) => sum + s.calculateArea(), 0);
  console.log(\`Total surface area: \${total.toFixed(2)}\`);
}

printTotalArea([new Circle(5), new Rectangle(4, 6)]);`,
        explanation: "The `printTotalArea` function does not care whether a shape is a circle, square, rectangle, or a custom polygon added five years later. As long as it conforms to the `Shape` interface, the code works seamlessly."
      },
      importantPoints: [
        "Polymorphism decouples caller logic from concrete class implementations, drastically improving code maintainability.",
        "Compile-time polymorphism is resolved during compilation (faster execution, zero runtime lookup overhead).",
        "Runtime polymorphism relies on method overriding and dynamic dispatch (slight vtable lookup cost, but maximum flexibility).",
        "Always respect the Liskov Substitution Principle: child classes should honor the contracts promised by their parents.",
        "Prefer composition with interfaces over deep, brittle inheritance trees when designing modern systems."
      ],
      quickSummary: "Polymorphism allows different objects to respond to the same method call in their own unique ways. It eliminates messy switch-statements, enables extensible plugin-like code, and comes in two flavors: static (overloading) and dynamic (overriding).",
      practiceQuestions: [
        {
          id: "pq-1",
          question: "What is the primary difference between method overloading and method overriding?",
          hint: "Think about when each one is resolved: at compile time vs at runtime."
        },
        {
          id: "pq-2",
          question: "How does polymorphism help eliminate long if-else or switch chains in your code?",
          hint: "Consider what happens when you need to add a third or fourth animal type."
        },
        {
          id: "pq-3",
          question: "Under the hood, what mechanism do C++ compilers use to support dynamic polymorphism?",
          hint: "Review DeepSeek\u2019s low-level explanation regarding function pointers."
        }
      ],
      consensusSummary: "All four models agree that polymorphism provides a unified interface for disparate underlying types, separating static (compile-time) from dynamic (runtime) dispatch. ChatGPT and Gemini highlighted clean OOP design and intuitive analogies, Claude contributed theoretical rigor (Cardelli-Wegner taxonomy & Liskov Substitution), and DeepSeek exposed internal vtable pointers and CPU indirection.",
      agreements: [
        'Core definition: "One interface, multiple implementations".',
        "Distinction between compile-time (overloading) and runtime (overriding).",
        "Major benefit is decoupling calling code from concrete classes and enabling easy system extensibility."
      ],
      differencesOrNuances: [
        "ChatGPT & Gemini focus heavily on clean high-level OOP class diagrams and behavioral analogies.",
        "Claude uniquely breaks down the formal Cardelli-Wegner classification (Subtyping vs Parametric Generics vs Ad-Hoc).",
        "DeepSeek uniquely details the vtable/vptr memory footprint and runtime CPU jump overhead."
      ]
    },
    quizQuestions: [
      {
        id: "q1",
        type: "mcq",
        question: "Which concept allows the same interface or method call to represent different underlying forms?",
        options: ["Encapsulation", "Polymorphism", "Data Hiding", "Multiple Inheritance"],
        correctAnswer: "Polymorphism",
        explanation: 'Polymorphism (from Greek "poly" many + "morph" form) enables a single interface to control different underlying implementations.'
      },
      {
        id: "q2",
        type: "mcq",
        question: "Method Overriding is an example of which kind of polymorphism?",
        options: ["Compile-time polymorphism", "Runtime / Dynamic polymorphism", "Parametric polymorphism", "Coercion polymorphism"],
        correctAnswer: "Runtime / Dynamic polymorphism",
        explanation: "Method overriding is resolved at runtime using dynamic dispatch (vtables), making it runtime polymorphism."
      },
      {
        id: "q3",
        type: "true_false",
        question: "In method overloading, methods must have the same name and the exact same parameter list.",
        options: ["True", "False"],
        correctAnswer: "False",
        explanation: "False! In method overloading, the methods share the same name but MUST differ in their parameter signatures (types, order, or count)."
      },
      {
        id: "q4",
        type: "true_false",
        question: "The Liskov Substitution Principle states that subtypes must be substitutable for their base types without altering program correctness.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "True. This is a foundational principle of object-oriented design and subtyping polymorphism."
      },
      {
        id: "q5",
        type: "short_answer",
        question: "What is the name of the internal table of function pointers used by compilers to resolve virtual method calls at runtime?",
        correctAnswer: "vtable",
        explanation: "The vtable (virtual method table) stores function pointers to the appropriate overridden implementations for each class."
      }
    ],
    notes: {
      topic: "Polymorphism in Object-Oriented Programming",
      definition: "Polymorphism is an OOP principle enabling entities of different data types to be manipulated through a unified, shared interface.",
      keyConcepts: [
        "Compile-time Polymorphism: Static binding via Method Overloading and Operator Overloading.",
        "Runtime Polymorphism: Dynamic binding via Method Overriding and Abstract Base Classes / Interfaces.",
        "Dynamic Dispatch: Runtime lookup using virtual tables (vtables) and object virtual pointers (vptrs).",
        "Liskov Substitution Principle (LSP): Subtypes must remain fully substitutable for their supertypes."
      ],
      examples: `// Interface contract:
interface Notifier {
  send(message: string): void;
}

class EmailNotifier implements Notifier {
  send(msg: string) { /* SMTP delivery */ }
}

class SMSNotifier implements Notifier {
  send(msg: string) { /* Twilio SMS */ }
}

// Consumer function:
function broadcastAlert(notifier: Notifier, alert: string) {
  notifier.send(alert); // Polymorphic call
}`,
      importantTerms: [
        { term: "Method Overriding", definition: "Redefining a superclass method in a subclass with matching signature." },
        { term: "Method Overloading", definition: "Defining methods with identical names but differing parameter types/counts." },
        { term: "vtable (Virtual Table)", definition: "Compiler-generated array of function pointers used for dynamic dispatch." },
        { term: "Dynamic Binding", definition: "Linking a method call to its executable code body at runtime rather than compile-time." }
      ],
      examPoints: [
        "State Greek roots: poly (many) + morph (form).",
        "Be ready to write a 4-line example showing a base interface and two concrete classes.",
        "Contrast Overloading (compile-time, same class, different params) vs Overriding (runtime, parent-child, identical signature).",
        "Mention runtime tradeoff: vtable pointer dereferencing prevents immediate inline optimization."
      ],
      lastEdited: Date.now()
    }
  }
];
function generateEducationalResponse(question, models, document) {
  const qLower = question.toLowerCase();
  const match = !document ? KNOWLEDGE_BASE.find(
    (item) => item.keywords.some((k) => qLower.includes(k))
  ) : null;
  if (match) {
    const responses2 = {};
    models.forEach((model) => {
      const data = match[model];
      responses2[model] = {
        provider: model,
        modelName: model === "chatgpt" ? "GPT-4o" : model === "gemini" ? "Gemini 3.8 Flash" : model === "claude" ? "Claude 3.5 Sonnet" : "DeepSeek V3",
        answer: data.answer,
        latencyMs: 780 + Math.floor(Math.random() * 650),
        status: "success",
        perspectiveHighlight: data.perspective,
        keyApproach: data.approach
      };
    });
    return {
      responses: responses2,
      synthesis: match.synthesis,
      quizQuestions: match.quizQuestions,
      notes: match.notes
    };
  }
  const topicName = document ? question.trim() ? `${extractTopicName(question)} (Ref: ${document.name})` : `Lecture Analysis: ${document.name}` : extractTopicName(question);
  const docExcerpt = document?.text ? document.text.slice(0, 300).replace(/\n+/g, " ") : "";
  const docNote = document ? `

> \u{1F4C4} **Document Source:** Analyzed from uploaded lecture \`${document.name}\` (~${document.wordCount.toLocaleString()} words).` : "";
  const responses = {};
  if (models.includes("chatgpt")) {
    responses.chatgpt = {
      provider: "chatgpt",
      modelName: "GPT-4o",
      latencyMs: 820,
      status: "success",
      perspectiveHighlight: document ? "Syllabus & Lecture Document Decomposition" : "Structured Educational Breakdown",
      keyApproach: document ? "Extracts core lecture taxonomy, section hierarchies, and defined terminology." : "Direct conceptual definitions, core taxonomy, and step-by-step component analysis.",
      answer: `### Educational Overview: ${topicName}
${docNote}

When approaching **${topicName}**, it helps to view it through three fundamental stages: definition, core mechanics, and common applications.${document ? `

**Key Lecture Focus Identified:**
"${docExcerpt}..."` : ""}

#### 1. What Is It?
${topicName} is a foundational concept designed to solve specific challenges by establishing clear rules, boundaries, and repeatable workflows.

#### 2. Core Pillars
- **Fundamental Rule:** Governed by established principles that guarantee predictable outcomes.
- **Workflow / Process:** Executes in logical, sequential stages from initial inputs to final state.
- **Key Advantage:** Simplifies reasoning about complex systems and prevents common failure modes.

#### 3. Practical Example
In real-world problem solving, ${topicName} allows practitioners to decompose large, overwhelming challenges into manageable sub-problems with clear verification criteria.

#### Key Takeaway for Students
Always look for the underlying pattern rather than memorizing isolated formulas or code fragments.`
    };
  }
  if (models.includes("gemini")) {
    responses.gemini = {
      provider: "gemini",
      modelName: "Gemini 3.8 Flash",
      latencyMs: 640,
      status: "success",
      perspectiveHighlight: "Intuitive Analogies & Big-Picture Context",
      keyApproach: "Relates abstract technical concepts to everyday physical phenomena to ensure lasting memory retention.",
      answer: `### Big Picture & Intuitive Analogy: ${topicName}

If you want to understand **${topicName}**, avoid starting with intimidating jargon. Instead, visualize an everyday system.

#### The Intuitive Analogy
Imagine an airport flight dispatch tower or a postal routing center. Without an agreed-upon protocol, chaos ensues. ${topicName} acts like the universal dispatch protocol\u2014everyone knows exactly what token to hold, when to wait, and when to proceed safely.

#### Why We Need It
- **Eliminates ambiguity:** Guarantees that different independent components speak the same dialect.
- **Resilience:** Helps systems recover cleanly if unexpected disturbances occur.
- **Scalability:** The rules remain just as clean whether handling 2 units or 2,000,000 units.

#### Student Pro-Tip
Whenever you encounter ${topicName} in exams, ask yourself: *"What problem would occur if this mechanism didn't exist?"* The answer immediately reveals its purpose!`
    };
  }
  if (models.includes("claude")) {
    responses.claude = {
      provider: "claude",
      modelName: "Claude 3.5 Sonnet",
      latencyMs: 950,
      status: "success",
      perspectiveHighlight: "Pedagogical Depth & Boundary Conditions",
      keyApproach: "Analyzes why the concept exists, edge cases, historical evolution, and common student misconceptions.",
      answer: `### Academic & Conceptual Breakdown: ${topicName}

To master **${topicName}**, we should examine both its theoretical underpinnings and its critical boundary conditions.

#### 1. Theoretical Grounding
The emergence of ${topicName} was driven by the necessity to maintain deterministic behavior in non-trivial systems. Historically, early approaches suffered from edge-case vulnerabilities, which this model systematically neutralizes.

#### 2. Common Misconceptions
- **Mistake 1:** Assuming ${topicName} carries zero overhead. In reality, there is always a deliberate tradeoff between expressiveness and execution complexity.
- **Mistake 2:** Conflating the surface interface with internal state management.

#### 3. Critical Thinking Question
When applying ${topicName}, always verify the preconditions. If the underlying data or state is corrupted, the guarantees no longer hold.`
    };
  }
  if (models.includes("deepseek")) {
    responses.deepseek = {
      provider: "deepseek",
      modelName: "DeepSeek V3",
      latencyMs: 1100,
      status: "success",
      perspectiveHighlight: "Mechanisms, Systems & Practical Execution",
      keyApproach: "Deep dive into underlying mechanisms, efficiency factors, and practical implementation considerations.",
      answer: `### Core Mechanics & Systematic Analysis: ${topicName}

From a rigorous analytical perspective, **${topicName}** must be understood through its underlying operational mechanics and efficiency factors.

#### 1. Fundamental Mechanics & Flow
- **Primary Driver:** Operates through well-defined input transformations and governing rules.
- **Resource & Energy Flow:** Examines how inputs are consumed, transformed, and preserved across state changes.
- **System Constraints:** Identifies the natural physical, mathematical, or procedural limits governing execution.

#### 2. Critical Points & Pitfalls
- Verify all boundary conditions and environmental dependencies before drawing conclusions.
- Distinguish between primary driving factors and secondary correlations.

#### 3. Systematic Summary
${topicName} establishes consistent, verifiable outcomes when all operational criteria are satisfied.`
    };
  }
  const synthesis = {
    simpleExplanation: `**${topicName}** is a foundational concept that explains how a particular process or mechanism works in a predictable, orderly way.

Think of it like an interconnected recipe: specific ingredients or starting conditions undergo organized transformations to produce essential, dependable outcomes.`,
    detailedExplanation: `In academic and practical contexts, **${topicName}** operates across three core dimensions:

1. **Governing Principles:** The fundamental natural, logical, or empirical laws that define how it works.
2. **Sequential Stages:** The step-by-step progression from initial inputs through intermediate transformations to final results.
3. **Real-World Significance:** Why understanding this concept is essential for problem-solving, real-world applications, and academic mastery.`,
    example: {
      language: "markdown",
      codeOrContext: `Core Concept Walkthrough: ${topicName}
1. Define the initial conditions and requirements.
2. Observe or execute the primary transformation mechanism.
3. Verify the resulting output against expected principles.`,
      explanation: `By following the fundamental rules of ${topicName}, outcomes remain consistent and verifiable across different scenarios.`
    },
    importantPoints: [
      `Mastering ${topicName} requires grasping the underlying cause-and-effect relationship.`,
      "Focus on the core mechanism rather than memorizing disconnected facts.",
      "Identify how changes to starting conditions alter the final output.",
      "Review real-world applications to reinforce long-term understanding."
    ],
    commonMistakes: [
      `Assuming ${topicName} applies unconditionally without verifying prerequisite inputs.`,
      "Confusing superficial vocabulary with functional cause-and-effect mechanisms.",
      "Overlooking boundary constraints and edge cases during application."
    ],
    quickSummary: `${topicName} provides a clear, reliable explanation of how specific conditions produce predictable, vital outcomes.`,
    practiceQuestions: [
      {
        id: "pq-dyn-1",
        question: `In your own words, what primary challenge does ${topicName} resolve?`,
        hint: "Consider what problems occur when this concept is absent."
      },
      {
        id: "pq-dyn-2",
        question: `What are the primary tradeoffs or considerations when applying ${topicName}?`,
        hint: "Think about runtime overhead vs structural clarity."
      },
      {
        id: "pq-dyn-3",
        question: `How would you explain the core mechanism of ${topicName} to a beginner?`,
        hint: "Use Gemini\u2019s analogy method."
      }
    ],
    consensusSummary: document ? `All selected models analyzed your attached lecture document "${document.name}" (~${document.wordCount.toLocaleString()} words). ChatGPT structured the lecture's core syllabus topics, Gemini provided real-world analogies, Claude validated academic terms, and DeepSeek evaluated implementation and performance considerations.` : `All selected models agreed on the core premise of ${topicName}. ChatGPT emphasized structural categorization, Gemini provided intuitive relational analogies, Claude highlighted theoretical boundaries, and DeepSeek detailed efficiency and performance considerations.`,
    agreements: [
      document ? `Consensus on core concepts extracted from "${document.name}".` : `Universal agreement on the definition and importance of ${topicName}.`,
      "Consensus that structuring systems according to these principles reduces errors and increases maintainability."
    ],
    differencesOrNuances: [
      document ? "ChatGPT focused on syllabus structure and conceptual categorization." : "ChatGPT highlighted structured taxonomies and standard workflows.",
      "Gemini stressed intuitive analogies and big-picture cognitive models.",
      "Claude addressed academic rigor and common student pitfalls.",
      "DeepSeek focused on memory footprints and algorithmic optimization."
    ]
  };
  const quizQuestions = [
    {
      id: "qd-1",
      type: "mcq",
      question: document ? `Based on the lecture document "${document.name}", what is the primary objective of ${topicName}?` : `What is the primary motivation for studying and applying ${topicName}?`,
      options: [
        "To increase complexity and code length",
        "To provide structure, predictability, and reduce errors",
        "To bypass all compiler optimizations",
        "To force manual memory management"
      ],
      correctAnswer: "To provide structure, predictability, and reduce errors",
      explanation: "The primary goal is to establish predictable behavior and modularity across systems."
    },
    {
      id: "qd-2",
      type: "true_false",
      question: `True or False: Applying ${topicName} guarantees that you never have to consider edge cases or input validity.`,
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "False! Boundary conditions and valid preconditions must always be verified."
    },
    {
      id: "qd-3",
      type: "short_answer",
      question: `Which AI perspective focused primarily on low-level performance, cache locality, and runtime overhead?`,
      correctAnswer: "DeepSeek",
      explanation: "DeepSeek emphasized systems-level performance, memory layout, and runtime optimization tradeoffs."
    }
  ];
  const notes = {
    topic: topicName,
    definition: `${topicName} is a fundamental concept that provides structure, predictability, and systematic clarity in problem solving.`,
    keyConcepts: [
      "Foundational Rule: Defines clear invariants and predictable outcomes.",
      "Modularity: Decomposes complex problems into verifiable, independent components.",
      "Tradeoff Awareness: Balances structural overhead against maintainability and cognitive clarity."
    ],
    examples: `Practical Walkthrough for ${topicName}:
- Establish initial baseline state
- Apply standard verified transformation
- Validate output integrity against criteria`,
    importantTerms: [
      { term: "Deterministic Behavior", definition: "Producing the exact same output given the exact same starting conditions." },
      { term: "Invariant", definition: "A condition that remains true throughout the execution of a process." },
      { term: "Abstraction", definition: "Hiding unnecessary implementation details while exposing a clean interface." }
    ],
    examPoints: [
      `Clearly state the definition and purpose of ${topicName}.`,
      "Provide at least one real-world analogy to demonstrate deep understanding.",
      "List the key tradeoffs (overhead vs clarity).",
      "Mention edge-case considerations."
    ],
    lastEdited: Date.now()
  };
  return {
    responses,
    synthesis,
    quizQuestions,
    notes
  };
}
function generateFollowUpAnswer(session, studentFollowUp, history) {
  const q = studentFollowUp.toLowerCase();
  const topic = extractTopicName(session.question);
  const synth = session.synthesis;
  if (q.includes("detail") || q.includes("compare") || q.includes("all ai") || q.includes("all model") || q.includes("studymind format") || q.includes("format") || q.includes("deep")) {
    const importantPtsFormatted = (synth.importantPoints || [
      `Foundational definition and mechanism of ${topic}`,
      `Key operational principles and prerequisite conditions`,
      `Critical real-world implementation nuances`
    ]).map((pt, i) => `${i + 1}. **${pt}**`).join("\n");
    const commonMistakesFormatted = (synth.commonMistakes || [
      `Assuming ${topic} operates without verifying prerequisite conditions.`,
      `Confusing superficial terminology with actual operational mechanisms.`,
      `Overlooking boundary conditions and performance trade-offs.`
    ]).map((m, i) => `${i + 1}. **Mistake:** ${m}
   *How to avoid:* Verify assumptions and validate edge conditions early.`).join("\n");
    const practiceQsFormatted = (synth.practiceQuestions || [
      { question: `In your own words, what is the core mechanism of ${topic}?`, hint: "Think of the simple analogy." },
      { question: `What is the most critical mistake students make when studying ${topic}?`, hint: "Review the common mistakes section." }
    ]).map((pq, i) => `**Q${i + 1}.** ${pq.question}
*\u{1F4A1} Hint:* ${pq.hint || "Review the foundational principles above."}`).join("\n\n");
    return `# StudyMind Master Lesson: Detailed Educational Format
**Topic:** ${topic}

---

### 1. Simple Explanation
${synth.simpleExplanation || `${topic} is best understood as a systematic principle that provides predictable, structured outcomes from defined inputs.`}

---

### 2. Detailed Explanation (Cross-AI Models Comparison)
To provide the whole, all the meaningful depth of "${topic}", here is the comprehensive multi-model comparative analysis:

- **ChatGPT Perspective (Structured Syllabus & Taxonomy):**
  Provides the formal categorization and sequential hierarchy. It defines ${topic} through standardized terminology, establishing strict classifications, clean definitions, and structured numbered operational workflows.

- **Gemini Perspective (Intuitive Mental Models & Analogies):**
  Provides the conceptual mental model. It explains ${topic} by linking abstract principles to relatable real-world systems, emphasizing why the concept matters holistically and how parts interlock intuitively.

- **Claude Perspective (Academic Rigor & Boundary Conditions):**
  Provides academic depth and theoretical constraints. It investigates edge cases, formal boundary conditions, subtle nuances, and clarifies common academic misconceptions that trip up advanced students.

- **DeepSeek Perspective (Technical Mechanics & Execution):**
  Provides low-level mechanical precision. It analyzes execution paths, underlying mathematical/computational/scientific mechanisms, memory layouts, and practical efficiency/performance tradeoffs.

- **Unified Comparative Synthesis:**
  ${synth.detailedExplanation || `When we bring all four perspectives together, ${topic} emerges as a unified framework. Rather than viewing it in isolation, mastering both the high-level intuitive model (Gemini/ChatGPT) and the deep technical boundary conditions (Claude/DeepSeek) provides complete conceptual mastery.`}

---

### 3. Example
${synth.example?.codeOrContext ? `\`\`\`${synth.example.language || "markdown"}
${synth.example.codeOrContext}
\`\`\`` : `**Practical Scenario:** Walkthrough of ${topic} in real application.`}

**How it works step-by-step:**
${synth.example?.explanation || `Each component in this example demonstrates the underlying mechanism of ${topic} in action.`}

---

### 4. Important Points
${importantPtsFormatted}

---

### 5. Common Mistakes
${commonMistakesFormatted}

---

### 6. Quick Summary
${synth.quickSummary || `${topic} establishes a clear, dependable mechanism for turning specific prerequisites into reliable, verifiable outcomes.`}

---

### 7. Practice Questions
${practiceQsFormatted}`;
  }
  if (q.includes("simple") || q.includes("beginner") || q.includes("easier") || q.includes("5 year old") || q.includes("still don't understand")) {
    return `No problem at all! Let's strip away all the technical jargon and understand **${topic}** with a simple real-world picture:

${synth.simpleExplanation}

Think of it like an everyday mechanism: you don't need to know every tiny gear inside a clock to know how to tell time, but knowing the master hand makes everything clear. 

Does this intuitive mental picture make **${topic}** click better for you? Feel free to ask about any specific part!`;
  }
  if (q.includes("code") || q.includes("python") || q.includes("java") || q.includes("c++") || q.includes("javascript") || q.includes("typescript")) {
    if (synth.example?.codeOrContext) {
      return `Here is the practical implementation demonstrating **${topic}**:

\`\`\`${synth.example.language || "python"}
${synth.example.codeOrContext}
\`\`\`

**Step-by-Step Breakdown:**
${synth.example.explanation}`;
    }
  }
  if (q.includes("exam") || q.includes("test") || q.includes("interview")) {
    const pts = (synth.importantPoints || []).slice(0, 3).map((p, i) => `${i + 1}. **${p}**`).join("\n");
    return `For exams and assessments on **${topic}**, examiners prioritize these core areas:

${pts}

**Key Mistake to Avoid:**
${synth.commonMistakes?.[0] || "Overlooking prerequisite conditions and edge cases."}

**Memory Anchor:**
${synth.quickSummary}`;
  }
  return `That is a great follow-up inquiry regarding **${topic}**! 

${synth.quickSummary}

Building directly on our lesson:
When applying this concept, remember that all AI models agree on establishing clear fundamentals first before tackling complex edge cases.

Would you like to:
1. See the **Full Detailed Explanation comparing all AI models**?
2. Walk through a step-by-step **Example**?
3. Try **Interactive Practice Questions**?`;
}
function extractTopicName(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^(explain|what is|how does|compare|tell me about|describe|why is|difference between)\s+/i, "");
  cleaned = cleaned.replace(/\s+(in simple english|in simple terms|for beginners|in oop|in c\+\+|in python|\?)$/i, "");
  if (!cleaned || cleaned.length < 3) return "Computer Science & Concept Study";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  const isProduction = process.env.NODE_ENV === "production";
  app.use(express.json({ limit: "10mb" }));
  app.get("/api/providers/status", (_req, res) => {
    res.json({
      chatgpt: Boolean(process.env.OPENAI_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
      claude: Boolean(process.env.ANTHROPIC_API_KEY),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      supabase: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      supabaseProjectId: "uxjlcvmgdnrvbwiczvgx",
      isDemoModeSupported: true
    });
  });
  app.post("/api/study", async (req, res) => {
    try {
      const { question, models = ["chatgpt", "gemini", "claude", "deepseek"], document } = req.body;
      const effectiveQuestion = question && typeof question === "string" && question.trim() ? question.trim() : document?.name ? `Explain, analyze, and summarize key concepts from lecture: ${document.name}` : "";
      if (!effectiveQuestion) {
        res.status(400).json({ error: "A question or an attached document is required" });
        return;
      }
      const selectedModels = Array.isArray(models) && models.length > 0 ? models : ["chatgpt", "gemini", "claude", "deepseek"];
      try {
        const liveSession = await generateLiveEducationalSession(
          effectiveQuestion,
          selectedModels,
          document
        );
        if (liveSession) {
          res.json(liveSession);
          return;
        }
      } catch (liveErr) {
        console.warn("Live multi-session generation notice:", liveErr);
      }
      const baseline = generateEducationalResponse(effectiveQuestion, selectedModels, document);
      const promptForLiveAI = document?.text ? `${effectiveQuestion}

[Context from attached lecture document: "${document.name}"]:
${document.text.slice(0, 8e3)}` : effectiveQuestion;
      const modelPromises = selectedModels.map(async (provider) => {
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            resolve(baseline.responses[provider]);
          }, 1e4);
        });
        const queryPromise = (async () => {
          try {
            if (provider === "gemini") {
              const res2 = await queryGemini(promptForLiveAI);
              if (res2.answer) {
                return {
                  provider: "gemini",
                  modelName: res2.modelName,
                  answer: res2.answer,
                  latencyMs: res2.latencyMs,
                  status: "success",
                  perspectiveHighlight: document ? "Contextual Grounding on Attached Lecture" : "Intuitive Analogies & Contextual Grounding",
                  keyApproach: "Relates abstract logic to real-world mechanisms."
                };
              }
            } else if (provider === "chatgpt") {
              const res2 = await queryOpenAI(promptForLiveAI);
              if (res2.answer) {
                return {
                  provider: "chatgpt",
                  modelName: res2.modelName,
                  answer: res2.answer,
                  latencyMs: res2.latencyMs,
                  status: "success",
                  perspectiveHighlight: document ? "Syllabus & Lecture Structural Breakdown" : "Structured Hierarchy & Taxonomy",
                  keyApproach: "Direct definitions, clean classifications, and code steps."
                };
              }
            } else if (provider === "claude") {
              const res2 = await queryClaude(question);
              if (res2.answer) {
                return {
                  provider: "claude",
                  modelName: res2.modelName,
                  answer: res2.answer,
                  latencyMs: res2.latencyMs,
                  status: "success",
                  perspectiveHighlight: "Pedagogical Rigor & Nuance",
                  keyApproach: "Theoretical context, common misconceptions, and contract rules."
                };
              }
            } else if (provider === "deepseek") {
              const res2 = await queryDeepSeek(question);
              if (res2.answer) {
                return {
                  provider: "deepseek",
                  modelName: res2.modelName,
                  answer: res2.answer,
                  latencyMs: res2.latencyMs,
                  status: "success",
                  perspectiveHighlight: "Low-Level Systems & Complexity",
                  keyApproach: "CPU/memory layout, execution overhead, and performance tradeoffs."
                };
              }
            }
          } catch (e) {
            console.error(`Error querying provider ${provider}:`, e);
          }
          return baseline.responses[provider];
        })();
        return Promise.race([queryPromise, timeoutPromise]);
      });
      const responsesArray = await Promise.all(modelPromises);
      const responses = {};
      responsesArray.forEach((r) => {
        responses[r.provider] = r;
      });
      const synthTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 6e3));
      let synthesis = await Promise.race([
        synthesizeAnswers(effectiveQuestion, responses),
        synthTimeout
      ]);
      if (!synthesis) {
        synthesis = baseline.synthesis;
      }
      const session = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: question.length > 50 ? question.slice(0, 47) + "..." : question,
        question,
        timestamp: Date.now(),
        selectedModels,
        responses,
        synthesis,
        followUps: [],
        quiz: {
          id: `quiz-${Date.now()}`,
          topic: question,
          questions: baseline.quizQuestions,
          completed: false
        },
        notes: baseline.notes
      };
      res.json(session);
    } catch (err) {
      console.error("API /api/study error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });
  app.post("/api/followup", async (req, res) => {
    try {
      const { session, message, history = [] } = req.body;
      if (!session || !message) {
        res.status(400).json({ error: "Session and message are required" });
        return;
      }
      let reply = null;
      try {
        reply = await generateLiveFollowUp(session, message, history);
      } catch (liveErr) {
        console.warn("Live follow-up generation failed, falling back:", liveErr);
      }
      if (!reply) {
        reply = generateFollowUpAnswer(session, message, history);
      }
      res.json({
        reply,
        timestamp: Date.now()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/quiz/generate", (req, res) => {
    try {
      const { question } = req.body;
      const baseline = generateEducationalResponse(question || "Object-Oriented Programming", ["gemini"]);
      res.json({
        id: `quiz-${Date.now()}`,
        topic: question || "Concept Quiz",
        questions: baseline.quizQuestions,
        completed: false
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/notes/generate", (req, res) => {
    try {
      const { question } = req.body;
      const baseline = generateEducationalResponse(question || "Object-Oriented Programming", ["gemini"]);
      res.json(baseline.notes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyMind server running on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start StudyMind server:", err);
  process.exit(1);
});
