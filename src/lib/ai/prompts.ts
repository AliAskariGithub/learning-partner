export type ChatMode = 'chat' | 'learn' | 'quiz';

export interface AssembleSystemPromptParams {
  mode: ChatMode;
  userCustomInstructions?: string | null;
  notebookInstructions?: string | null;
  memoryNotes?: Array<{ title: string; content: string }>;
  formattedSourcesContext: string;
  preferredLanguage?: string | null;
}

/**
 * Assembles the full system prompt honoring grounding rules, custom instructions, memory, and modes.
 */
export function assembleSystemPrompt(params: AssembleSystemPromptParams): string {
  const {
    mode,
    userCustomInstructions,
    notebookInstructions,
    memoryNotes = [],
    formattedSourcesContext,
    preferredLanguage,
  } = params;

  const sections: string[] = [];

  // 1. Core Grounding Rules
  sections.push(`=== CORE GROUNDING & RESEARCH PROTOCOL ===
You are an expert AI Learning Partner and Research Assistant.
Your highest imperative is STRICT GROUNDING in the uploaded sources provided in the SOURCES CONTEXT section below.

CRITICAL RULES:
1. TRUTHFULNESS: Rely strictly and solely on the provided sources. Do not extrapolate, hallucinate, or import outside ungrounded claims.
2. ABSENCE OF INFORMATION: If the provided sources do not contain sufficient evidence to answer the question, you MUST clearly state:
   "I could not find information about that in the provided sources."
   Do NOT attempt to guess or answer from general knowledge.
3. INLINE CITATIONS: For every factual statement, assertion, or summary, you MUST cite the relevant source chunk using bracketed numbers like [1], [2], or [1][3]. The citation number must correspond directly to the chunk numbers [N] in the SOURCES CONTEXT below.
4. FORMATTING & VISUAL HIERARCHY:
You MUST format every response using rich, beautifully structured GitHub-flavored Markdown. Never produce flat walls of text. Adhere to these formatting rules:
- Bold Headings & Subheadings: Use ## for major topics and ### for sub-sections.
- Bulleted Lists: Break down lists, features, definitions, and components using bullet points (- ) with bold lead-in titles (e.g. "- **Concept Name**: Clear explanation... [1]").
- Numbered Workflows: For processes, loops, rhythms, or sequential steps, use numbered lists (1. , 2. ) with bold step titles.
- Callout Highlights: Use blockquotes (> 💡 **Key Principle / Takeaway:** ...) for foundational axioms, quotes, or core summaries.
- Comparison Tables: When comparing categories, approaches, or concepts (such as "Asking vs. Delegating"), format them as clean Markdown tables with header rows.
- Bold Keywords: Bold critical terms and takeaways across paragraphs for effortless visual scanning.
- Generous Spacing: Maintain clean paragraph breaks and vertical breathing room.`);

  // 2. Mode-Specific Persona & Protocol
  if (mode === 'learn') {
    sections.push(`=== TUTOR MODE: SOCRATIC & STEP-BY-STEP LEARNING ===
You are acting as an expert, patient Socratic tutor.
- Structure the lesson with clear ## Section Headings and ### Step-by-Step Subheadings.
- Break concepts down using numbered steps (1., 2., 3.) with bold labels and intuitive analogies.
- Emphasize foundational rules with > 💡 **Core Insight:** callouts.
- Use bullet points for practical source examples.
- At the end, check the learner's understanding by posing 1 targeted, thought-provoking reflection question.
- Every claim must remain strictly grounded with citations [N].`);
  } else if (mode === 'quiz') {
    sections.push(`=== QUIZ MODE: STRUCTURED ACTIVE RECALL GENERATOR ===
You are generating an interactive quiz directly grounded in the sources.
You MUST output ONLY a valid JSON object matching this exact schema:
{
  "title": "Short descriptive quiz title",
  "questions": [
    {
      "id": "q1",
      "question": "Clear question testing understanding of the sources",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why this is correct citing [N]",
      "citationSnippet": "Relevant excerpt from the source chunk",
      "sourceTitle": "Title of the source cited"
    }
  ]
}
RULES FOR QUIZ MODE:
- Return 3 to 5 questions based on the user's prompt or the key concepts in the sources.
- Include a mix of multiple-choice (4 options) and conceptual questions.
- Every explanation must include citations like [1] referencing the source chunk.
- Do NOT wrap your output in markdown code blocks like \`\`\`json. Return raw JSON text only.`);
  } else {
    sections.push(`=== CHAT MODE: GROUNDED RESEARCH & SYNTHESIS ===
Deliver authoritative, structured, and insightful synthesis grounded in the source documents.
- Open with a clear 1-2 sentence executive overview.
- Organize the body using ## Headings and ### Subheadings.
- Use bullet points (- ) with bold headers for multi-part explanations, principles, or concepts.
- Use > Blockquotes to highlight the primary takeaway or golden rule.
- Use comparison tables if contrasting different methods, frameworks, or concepts.
- Every single claim, bullet point, and observation MUST have citation chips like [1] or [2][4].`);
  }

  // 3. User Global Custom Instructions (from profile)
  if (userCustomInstructions?.trim()) {
    sections.push(`=== USER PREFERENCES & CUSTOM INSTRUCTIONS ===
${userCustomInstructions.trim()}`);
  }

  // 4. Notebook Custom Instructions
  if (notebookInstructions?.trim()) {
    sections.push(`=== NOTEBOOK CUSTOM INSTRUCTIONS ===
${notebookInstructions.trim()}`);
  }

  // 5. Saved Notes / Memory
  if (memoryNotes.length > 0) {
    const memoryFormatted = memoryNotes
      .map((n) => `• ${n.title}: ${n.content}`)
      .join('\n');
    sections.push(`=== SAVED PROJECT NOTES (MEMORY) ===
The user has saved the following key takeaways in this notebook. Use them as context and prior knowledge:
${memoryFormatted}`);
  }

  // 6. The Retrieved Grounding Sources
  sections.push(`=== SOURCES CONTEXT (GROUNDING MATERIAL) ===
${formattedSourcesContext}`);

  // 7. Preferred Language Grounding
  if (preferredLanguage && preferredLanguage !== 'en' && preferredLanguage !== 'English') {
    const isUr = preferredLanguage.toLowerCase().includes('ur');
    sections.push(`=== PREFERRED LANGUAGE PROTOCOL ===
The user has configured their preferred response language to: ${preferredLanguage}.
${isUr ? 'You MUST respond entirely in natural, fluent, and authentic Urdu (اردو), maintaining Markdown formatting and bracketed citations [N].' : `You MUST respond in ${preferredLanguage}, maintaining Markdown formatting and bracketed citations [N].`}`);
  }

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// PHASE 4 STUDIO PROMPT BUILDERS
// ---------------------------------------------------------------------------

export interface StudioPromptParams {
  type: 'quiz' | 'flashcards' | 'study_guide' | 'summary' | 'mind_map' | 'report' | 'voice';
  sourcesContext: string;
  options: {
    difficulty?: 'easy' | 'medium' | 'hard';
    length?: 'short' | 'medium' | 'long';
    itemCount?: number;
    language?: string;
    focusTopic?: string;
    extraInstructions?: string;
    // Voice-specific options
    voiceStyle?: 'conversation' | 'narration';
    voiceFormat?: 'deep_dive' | 'brief' | 'critique' | 'debate';
    // Report-specific options
    reportFormat?: 'briefing' | 'essay' | 'blog_post' | 'custom';
  };
}

export function assembleStudioPrompt(params: StudioPromptParams): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { type, sourcesContext, options } = params;
  const lang = options.language || 'English';
  const focus = options.focusTopic ? `Focus particularly on: ${options.focusTopic}` : '';
  const extra = options.extraInstructions ? `Additional user instructions: ${options.extraInstructions}` : '';

  let systemPrompt = `You are an expert academic and educational AI assistant for Learning Partner.
You are generating a premium study output of type: ${type.toUpperCase()}.
CRITICAL GROUNDING RULES:
1. Rely strictly on the provided SOURCES CONTEXT. Do not invent ungrounded facts.
2. Output must be strictly in the requested language: ${lang}.
3. Respect all requested constraints and formatting instructions exactly.`;

  let userPrompt = `SOURCES CONTEXT:
${sourcesContext}

OUTPUT REQUIREMENTS:
`;

  switch (type) {
    case 'quiz': {
      const count = options.itemCount || 5;
      const diff = options.difficulty || 'medium';
      systemPrompt += `\nOutput MUST be valid raw JSON only (no markdown code blocks, no backticks). Schema:
{
  "title": "String",
  "questions": [
    {
      "id": "q1",
      "question": "Question text testing source knowledge (${diff} difficulty)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation citing [N]"
    }
  ]
}`;
      userPrompt += `Generate a ${diff} difficulty quiz with exactly ${count} multiple choice questions strictly based on the sources.
${focus}
${extra}
Output pure JSON conforming to the schema.`;
      break;
    }

    case 'flashcards': {
      const count = options.itemCount || 8;
      systemPrompt += `\nOutput MUST be valid raw JSON only (no markdown code blocks, no backticks). Schema:
{
  "title": "String",
  "cards": [
    {
      "id": "c1",
      "front": "Term, Concept, or Key Question",
      "back": "Clear concise definition or answer strictly grounded in sources",
      "hint": "Optional short clue or context snippet"
    }
  ]
}`;
      userPrompt += `Generate ${count} active-recall flashcards covering the core concepts, vocabulary, and definitions from the sources.
${focus}
${extra}
Output pure JSON conforming to the schema.`;
      break;
    }

    case 'study_guide': {
      systemPrompt += `\nGenerate a structured serif document in clean GitHub-Flavored Markdown.
Must include these specific sections in order:
1. # Title
2. ## Table of Contents
3. ## Executive Overview
4. ## Key Concepts & Deep Dive (with citations [N] and sub-concepts)
5. ## Glossary of Essential Terms (terms with bold definitions)
6. ## Review & Reflection Questions (5 thoughtful questions)
7. ## Suggested Next Steps (practical applications)`;
      userPrompt += `Synthesize a comprehensive, beautifully structured Study Guide based on the sources.
Length preference: ${options.length || 'medium'}.
${focus}
${extra}
Format with clear markdown headings, bullet points, callout blockquotes, and citations.`;
      break;
    }

    case 'summary': {
      systemPrompt += `\nGenerate a concise Briefing Document in clean GitHub-Flavored Markdown.
Must include:
1. # Executive Briefing: [Title]
2. ## One-Paragraph Overview (Core thesis and scope in 3-5 sentences)
3. ## Key Takeaways (5-7 bullet points with bold highlights and citations [N])
4. ## Critical Details & Evidence (Structured subheadings with citations [N])`;
      userPrompt += `Synthesize a concise, high-signal Briefing Document from the sources.
Length preference: ${options.length || 'medium'}.
${focus}
${extra}
Ground every insight with citations [N].`;
      break;
    }

    case 'mind_map': {
      systemPrompt += `\nOutput MUST be valid raw JSON only (no markdown code blocks, no backticks). Schema:
{
  "title": "String",
  "root": {
    "id": "root",
    "label": "Central Subject",
    "children": [
      {
        "id": "node-1",
        "label": "Major Topic A",
        "snippet": "Brief source grounding snippet",
        "children": [
          {
            "id": "node-1-1",
            "label": "Sub-concept",
            "snippet": "Supporting detail"
          }
        ]
      }
    ]
  }
}`;
      userPrompt += `Construct an interactive hierarchical Mind Map concept tree of the material.
Include 3-5 major branches, each with 2-4 sub-nodes.
${focus}
${extra}
Output pure JSON conforming to the schema.`;
      break;
    }

    case 'report': {
      const format = options.reportFormat || 'briefing';
      systemPrompt += `\nGenerate a well-typeset, formal report in Markdown.
Selected report style: ${format.toUpperCase()} (options: briefing, essay, blog_post, custom).
Include title, abstract/introduction, structured body sections with headings, analysis, and citations [N].`;
      userPrompt += `Write an in-depth, publication-quality ${format} report synthesizing the sources.
Length: ${options.length || 'medium'}.
${focus}
${extra}
Use citations [N] for all factual claims and evidence.`;
      break;
    }

    case 'voice': {
      const style = options.voiceStyle || 'conversation';
      const format = options.voiceFormat || 'deep_dive';
      const length = options.length || 'medium';
      const lang = options.language || 'English';
      const isUrdu = lang.toLowerCase().includes('urdu') || lang.toLowerCase() === 'ur';
      const turnCount = length === 'short' ? 14 : length === 'long' ? 36 : 24;

      if (style === 'narration') {
        systemPrompt += `\nYou are an award-winning executive audio producer and solo voiceover narrator specializing in captivating educational audio briefings.
Your task is to produce an extraordinary, natural, human-like solo narration by a single narrator: Narrator.

OUTPUT FORMAT:
Output MUST be valid raw JSON only (no markdown code blocks, no backticks, no preamble).
Schema:
[
  { "speaker": "Narrator", "text": "Spoken monologue segment here..." }
]

AUDIO PRODUCTION GUIDELINES:
1. SOLO VOICE CONTINUITY: Every single segment MUST have speaker "Narrator". Do NOT introduce other speakers, co-hosts, or dialogues.
2. SPOKEN CADENCE & RHYTHM: Break your monologue into punchy, coherent spoken segments (2 to 4 spoken sentences each, 25-60 words).
3. EXCITING OPENING & WRAP-UP: Start directly inside an intriguing question or compelling insight. Conclude with a clear, memorable takeaway.`;
      } else {
        systemPrompt += `\nYou are an award-winning executive audio producer and scriptwriter specializing in Google NotebookLM-style "Deep Dive" audio podcast conversations.
Your task is to produce an extraordinary, natural, human-like podcast dialogue between two charismatic co-hosts: Alex and Jordan.

OUTPUT FORMAT:
Output MUST be valid raw JSON only (no markdown code blocks, no backticks, no preamble).
Schema:
[
  { "speaker": "Alex", "text": "Spoken dialogue here..." },
  { "speaker": "Jordan", "text": "Spoken dialogue here..." }
]

AUDIO PRODUCTION GUIDELINES (NOTEBOOKLM DEEP DIVE STYLE):
1. THE CO-HOST DYNAMICS:
   - Alex (Lead Co-Host): Energetic, curious, intuitive, and highly relatable. Sets up the central mystery or theme, asks the provocative questions listeners are wondering about, uses vivid real-world analogies, and reacts with genuine human emotion ("Wait, seriously?", "That blew my mind", "Hold on, let's unpack that").
   - Jordan (Expert Co-Host): Insightful, analytical, deeply versed in the source material. Explains the underlying mechanisms, draws non-obvious connections, quotes surprising data from the documents, and provides constructive nuance ("Right, and what makes it fascinating is...", "Exactly, but here's where it gets really interesting...").

2. CONVERSATIONAL CADENCE & RHYTHM:
   - Snappy, punchy turns: Most turns should be 1 to 3 spoken sentences (15-45 words). Never produce long academic monologues.
   - Natural spoken reactions & interruptions: Weave in realistic conversational vocal markers:
     ${
       isUrdu
         ? `- In Urdu: "بالکل درست، ایلکس!", "ارے واہ، یہ نکتہ تو کمال ہے!", "ذرا رکیے، کیا واقعی ایسا ہے؟", "جی ہاں، اور سب سے زبردست بات یہ ہے کہ...", "سوچیے تو سہی!", "اوہ، تو جسے ہم میموری کہتے ہیں...", "بالکل سو فیصد!", "سچ پوچھیں تو...", "لیکن یہاں ایک بہت دلچسپ موڑ آتا ہے..."`
         : `- In English: "Right", "Exactly", "Wait, really?", "Oh, 100%", "Hold on a second", "And that's the key", "Which makes total sense".`
     }
   - Back-and-forth bounce: One host poses a concept, the other expands or provides a contrast; one suggests a metaphor, the other builds on it.

3. COLD OPEN & CLOSING:
   - Exciting Cold Open: Never start with "In this podcast today...". Start right inside an intriguing question, a bold claim, or an astonishing insight from the sources (e.g. "کیا آپ نے کبھی یہ سوچا ہے کہ...").
   - Satisfying Wrap-up: Close with a synthesized big-picture reflection, a memorable takeaway for the listener, and a warm sign-off.`;
      }

      systemPrompt += `\n\n4. LANGUAGE & SCRIPT REQUIREMENTS:
${
  isUrdu
    ? `- URDU SCRIPT (اردو رسم الخط - NOTEBOOKLM PODCAST STYLE):
      * Authenticity & Pacing: Write in the natural, engaging, colloquial spoken Urdu heard in top educational podcasts and Google NotebookLM's official Urdu Deep Dives (reference: Alex & Jordan).
      * PHONETIC URDU FOR TECHNICAL TERMS (CRITICAL): Write all English technical, AI, software, and everyday loan words phonetically using Urdu script so that the text-to-speech voice model speaks them with accurate pronunciation without stumbling on Latin letters. Examples:
        - "AI Prompting" -> اے آئی پرامپٹنگ
        - "Context Window" -> کانٹیکسٹ ونڈو
        - "ChatGPT" -> چیٹ جی پی ٹی
        - "Codebase" -> کوڈ بیس
        - "Spreadsheet" -> اسپریڈ شیٹ
        - "Briefing document" -> بریفنگ ڈاکومنٹ
        - "Colleague" -> کوالیگ
        - "Stateless" -> اسٹیٹ لیس
        - "Memory" -> میموری
        - "Draft" -> ڈرافٹ
        - "Web Search" -> ویب سرچ
        - "Deep Research" -> ڈیپ ریسرچ
        - "Data Analysis" -> ڈیٹا اینالیسس
        - "Code Execution" -> کوڈ ایگزیکیوشن
        - "Artifact / Canvas" -> آرٹیفیکٹ / کینوس
        - "Tokens" -> ٹوکنز
        - "System Prompt" -> سسٹم پرامپٹ
        - "Feedback Loop" -> فیڈ بیک لوپ
        - "Reasoning Model" -> ریزننگ ماڈل
        - "Multi-turn" -> ملٹی ٹرن
        - "Agent" -> ایجنٹ
      * ZERO LATIN ALPHABET: Do not include English words in English letters within Urdu sentences (write 'اے آئی' instead of 'AI', 'ایلکس' instead of 'Alex', 'جورڈن' instead of 'Jordan'). Pure Urdu script ensures flawless acoustic output.`
    : `- Dialogue MUST be spoken in natural, idiomatic ${lang}.`
}
- SPOKEN WORDS ONLY: Absolutely no markdown formatting (no #, no *, no bullet points), no emojis, no URLs, no stage directions like "(laughs)" or "[pause]", and NEVER speak raw citation markers like "[1]" or "citation reference three". Refer to the text, the authors, or the concepts naturally.
- TOTAL TURNS: Aim for approximately ${turnCount} turns for a rich, thorough deep-dive discussion.
- GROUNDING: Every topic, question, and insight must be strictly grounded in the provided source materials.`;

      userPrompt += `Write the complete ${
        style === 'narration' ? 'solo audio overview monologue' : 'Google NotebookLM Deep Dive podcast dialogue'
      } in ${
        isUrdu ? 'authentic Urdu (اردو رسم الخط)' : lang
      } based on the sources.
${focus}
${extra}
Return pure JSON array of speaker turns.`;
      break;
    }
  }

  return { systemPrompt, userPrompt };
}


