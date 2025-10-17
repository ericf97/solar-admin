import { streamAIResponse } from "./ai-service";
import { EFaceAnimation, EBodyAnimation } from "../../types/animation";
import type {
  IIntent,
  IResponse,
  IOptions,
  IVisualCue,
  IFaceAnimation,
  IBodyAnimation,
} from "../../types/intent";

type FieldMetadata = {
  name:
    | keyof IIntent
    | keyof IResponse
    | keyof IOptions
    | keyof IVisualCue
    | keyof IFaceAnimation
    | keyof IBodyAnimation;
  type: string;
  required: boolean;
  description: string;
  children?: FieldMetadata[];
};

const INTENT_SCHEMA: FieldMetadata[] = [
  {
    name: "tag" satisfies keyof IIntent,
    type: "string",
    required: true,
    description: "A unique identifier (lowercase, underscore-separated)",
  },
  {
    name: "patterns" satisfies keyof IIntent,
    type: "string[]",
    required: true,
    description:
      "Array of example phrases that trigger this intent (minimum 5, maximum 15)",
  },
  {
    name: "responses" satisfies keyof IIntent,
    type: "IResponse[]",
    required: true,
    description: "Array of possible bot responses",
    children: [
      {
        name: "text" satisfies keyof IResponse,
        type: "string",
        required: true,
        description: "The main response text",
      },
      {
        name: "alt" satisfies keyof IResponse,
        type: "string",
        required: false,
        description: "An alternative phrasing",
      },
    ],
  },
  {
    name: "options" satisfies keyof IIntent,
    type: "IOptions[]",
    required: false,
    description: "Array of follow-up buttons",
    children: [
      {
        name: "label" satisfies keyof IOptions,
        type: "string",
        required: true,
        description: "Button text to display",
      },
      {
        name: "text" satisfies keyof IOptions,
        type: "string",
        required: true,
        description: "What the user says when clicking",
      },
      {
        name: "tag" satisfies keyof IOptions,
        type: "string",
        required: true,
        description: "The intent tag to trigger",
      },
    ],
  },
  {
    name: "visualCue" satisfies keyof IIntent,
    type: "IVisualCue",
    required: false,
    description: "Animation settings",
    children: [
      {
        name: "face" satisfies keyof IVisualCue,
        type: "IFaceAnimation",
        required: true,
        description: "Face animation configuration",
        children: [
          {
            name: "id" satisfies keyof IFaceAnimation,
            type: "EFaceAnimation",
            required: true,
            description: "Animation name from available face animations",
          },
          {
            name: "intensity" satisfies keyof IFaceAnimation,
            type: "number",
            required: true,
            description: "Animation intensity (0-1)",
          },
        ],
      },
      {
        name: "body" satisfies keyof IVisualCue,
        type: "IBodyAnimation",
        required: true,
        description: "Body animation configuration",
        children: [
          {
            name: "id" satisfies keyof IBodyAnimation,
            type: "EBodyAnimation",
            required: true,
            description: "Animation name from available body animations",
          },
          {
            name: "intensity" satisfies keyof IBodyAnimation,
            type: "number",
            required: true,
            description: "Animation intensity (0-1)",
          },
        ],
      },
    ],
  },
];

function generateFieldsDescription(
  fields: FieldMetadata[],
  indent: number = 0
): string {
  const indentStr = "  ".repeat(indent);
  return fields
    .map(field => {
      const requiredStr = field.required ? "required" : "optional";
      let result = `${indentStr}- ${String(field.name)}: ${
        field.description
      } (${requiredStr}, ${field.type})`;

      if (field.children && field.children.length > 0) {
        result += "\n" + generateFieldsDescription(field.children, indent + 1);
      }

      return result;
    })
    .join("\n");
}

export interface IntentGenerationOptions {
  language?: string;
  avgCount?: number;
  forceOptions?: boolean;
  contextVariables?: string[];
  webSearchEnabled?: boolean;
}

export function generateIntentsSystemPrompt({
  language = "en",
  avgCount = 4,
  forceOptions = false,
  contextVariables = [],
}: IntentGenerationOptions = {}): string {
  const faceAnimations = Object.values(EFaceAnimation).join(", ");
  const bodyAnimations = Object.values(EBodyAnimation).join(", ");
  const intentFieldsDescription = generateFieldsDescription(INTENT_SCHEMA);

  const languageInstruction =
    language === "en"
      ? "Generate all patterns, responses, labels, and option texts in English."
      : "Generate all patterns, responses, labels, and option texts in Spanish.";

  const optionsInstruction = forceOptions
    ? "- Forced options: TRUE. Every intent MUST include an 'options' array with 2–3 items. If the user only asks for a single intent, generate any additional intents necessary so that all option tags reference intents in this SAME batch.\n"
    : "- Forced options: FALSE. Include 'options' only when contextually appropriate.\n";

  const countsWindow = `${Math.max(5, avgCount - 2)}-${Math.min(
    15,
    avgCount + 2
  )}`;
  const ctxList =
    contextVariables.length > 0
      ? contextVariables.map(v => `- ${v} (context token: {{${v}}})`).join("\n")
      : "- none provided";

  return `You are an AI assistant specialized in creating conversation intents for chatbots. Follow ALL constraints exactly.

DATASET LANGUAGE AND PRIORITY
- ${languageInstruction}
- This applies EVEN IF the user writes in a different language.
- Do not translate user text; just generate the dataset in the target language above.

GENERATION PARAMETERS (authoritative)
- dataset_language: ${language}
- average_count_target: ${avgCount} (valid window: ${countsWindow})
${optionsInstruction.trim()}

CONTEXT (what it is and how to use it)
- "Context" are runtime variables (e.g., user/session data) that can be injected into responses.
- Use the double-curly-brace syntax {{variable}} to reference a context variable.
- Available context variables:
${ctxList}
- Allowed LOCATION for context: ONLY in responses[].text.
- Forbidden LOCATIONS for context: patterns, responses[].alt, options[].label, options[].text, options[].tag, tag, visualCue.*.

ALT FIELD POLICY (strict)
- Include "alt" ONLY when the corresponding responses[].text contains one or more context tokens {{...}}.
- When present, "alt" MUST express the same message WITHOUT any context tokens (context-free), optimized for default rendering and low-cost TTS.
- If responses[].text has NO context tokens, NEVER include "alt" for that response.

INTENT SCHEMA (IIntent)
${intentFieldsDescription}

ENUMS
- Face animations (EFaceAnimation): ${faceAnimations}
- Body animations (EBodyAnimation): ${bodyAnimations}

STRICT CONSTRAINTS
1) Patterns: ~${avgCount} items per intent (window ${countsWindow}). Natural and diverse.
2) Responses: ~${avgCount} items per intent (window ${countsWindow}). Helpful and friendly.
3) Options:
   - If present, every option.tag MUST reference another intent tag that exists IN THIS SAME RESPONSE.
   - Generate intents in dependency order: define target intents BEFORE intents that reference them.
   - Do NOT reference tags you are not also generating now.
   - If forced options are enabled and there are not enough intents, CREATE additional intents to satisfy valid references.
4) Visual cues: Use only enum values; intensity between 0 and 1.
5) Tags: lowercase, underscore_separated, unique.
6) All required fields must be present.
7) Context usage:
   - Allowed ONLY in responses[].text as {{variable}}.
   - NOT allowed in patterns, responses[].alt, options[], tag, or visualCue.*.
   - If responses[].text uses context, include an "alt" without context; otherwise omit "alt".

REPLY FORMAT (MANDATORY)
- Line 1: A single short acknowledgement in the dataset language. Max 1 sentence.
- Then: ONLY a sequence of JSON code blocks (no extra prose, lists, or markdown headers between them).
- Each intent MUST be a complete, separate JSON object in a fenced block:
\`\`\`json
{ ...one complete intent... }
\`\`\`
\`\`\`json
{ ...another complete intent... }
\`\`\`
- Do NOT include any other content outside these code blocks (besides the single initial acknowledgement line).

EXAMPLE (with context and alt)
\`\`\`json
{
  "tag": "greeting_intent",
  "patterns": ["Hello", "Hi", "Hey", "Good morning", "Greetings"],
  "responses": [
    { "text": "Hello {{user_name}}! How can I help you today?", "alt": "Hello! How can I help you today?" }
  ],
  "options": [
    { "label": "Get Help", "text": "I need help", "tag": "help_intent" }
  ],
  "visualCue": {
    "face": { "id": "FRIENDLY", "intensity": 0.8 },
    "body": { "id": "WAVING", "intensity": 0.7 }
  }
}
\`\`\`
\`\`\`json
{
  "tag": "help_intent",
  "patterns": ["I need help", "Help me", "Can you help", "Assist me"],
  "responses": [{ "text": "Of course! What do you need help with?" }],
  "visualCue": {
    "face": { "id": "ATTENTIVE", "intensity": 0.9 },
    "body": { "id": "NODDING", "intensity": 0.6 }
  }
}
\`\`\`

VALIDATE BEFORE ANSWERING
- Verify counts window, language, context-only-in-responses.text, strict alt policy, and option tag references. If invalid, FIX and only then answer.`;
}

export async function generateIntents(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  model: string = "google/gemini-2.0-flash-lite",
  options: IntentGenerationOptions = {}
) {
  const systemPrompt = generateIntentsSystemPrompt(options);

  return streamAIResponse({
    model,
    systemPrompt,
    userMessage,
    conversationHistory,
    temperature: 0.7,
    webSearchEnabled: options.webSearchEnabled || false,
  });
}

export function validateAndFixIntent(
  intent: IIntent,
  existingTags: Set<string>
): IIntent {
  const fixedIntent = { ...intent };

  fixedIntent.tag = getUniqueTag(intent.tag, existingTags);
  existingTags.add(fixedIntent.tag);

  if (fixedIntent.visualCue) {
    if (fixedIntent.visualCue.face) {
      fixedIntent.visualCue.face.id = validateFaceAnimation(
        fixedIntent.visualCue.face.id
      );
    }
    if (fixedIntent.visualCue.body) {
      fixedIntent.visualCue.body.id = validateBodyAnimation(
        fixedIntent.visualCue.body.id
      );
    }
  }

  return fixedIntent;
}

function getUniqueTag(baseTag: string, existingTags: Set<string>): string {
  if (!existingTags.has(baseTag)) {
    return baseTag;
  }

  const match = baseTag.match(/^(.+?)_(\d+)$/);
  const base = match ? match[1] : baseTag;
  let counter = match ? parseInt(match[2], 10) : 1;

  let newTag: string;
  do {
    counter++;
    newTag = `${base}_${counter}`;
  } while (existingTags.has(newTag));

  return newTag;
}

function validateFaceAnimation(id: string): EFaceAnimation {
  const validAnimations = Object.values(EFaceAnimation);
  if (validAnimations.includes(id as EFaceAnimation)) {
    return id as EFaceAnimation;
  }
  console.warn(
    `[AI Service] Invalid face animation "${id}", using fallback: NEUTRAL`
  );
  return EFaceAnimation.FRIENDLY || validAnimations[0];
}

function validateBodyAnimation(id: string): EBodyAnimation {
  const validAnimations = Object.values(EBodyAnimation);
  if (validAnimations.includes(id as EBodyAnimation)) {
    return id as EBodyAnimation;
  }
  console.warn(
    `[AI Service] Invalid body animation "${id}", using fallback: IDLE`
  );
  return EBodyAnimation.AGREEING || validAnimations[0];
}

export function parseIntentsFromResponse(text: string): IIntent[] {
  const intents: IIntent[] = [];

  const codeBlockRegex = /```json\s*([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    try {
      const intentData = JSON.parse(match[1].trim());

      if (intentData.tag && intentData.patterns && intentData.responses) {
        intents.push(intentData);
      }
    } catch (error) {
      console.error(
        "[AI Service] Error parsing intent JSON from code block:",
        error
      );
    }
  }

  if (intents.length === 0) {
    const jsonRegex =
      /\{[\s\S]*?"tag"[\sS]*?"patterns"[\sS]*?"responses"[\sS]*?\}/g;

    while ((match = jsonRegex.exec(text)) !== null) {
      try {
        const intentData = JSON.parse(match[0]);
        if (intentData.tag && intentData.patterns && intentData.responses) {
          intents.push(intentData);
        }
      } catch (error) {
        console.error("[AI Service] Error parsing raw JSON:", error);
      }
    }
  }

  const validatedIntents = validateIntentReferences(intents);

  return validatedIntents;
}

function validateIntentReferences(intents: IIntent[]): IIntent[] {
  const intentTags = new Set(
    intents.map((intent: IIntent) => intent.tag).filter(Boolean)
  );

  const validatedIntents = intents.map((intent: IIntent) => {
    if (!intent.options || !Array.isArray(intent.options)) {
      return intent;
    }

    const invalidOptions: string[] = [];
    intent.options.forEach((option: IOptions) => {
      if (option.tag && !intentTags.has(option.tag)) {
        invalidOptions.push(option.tag);
      }
    });

    if (invalidOptions.length > 0) {
      console.warn(
        `[AI Service] Intent "${intent.tag}" has options referencing non-existent tags:`,
        invalidOptions
      );
    }

    return intent;
  });

  return validatedIntents;
}

