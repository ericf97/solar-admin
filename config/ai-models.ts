import type { ModelOption } from "@/components/ai-chat/chat-input";

export const AI_MODELS: ModelOption[] = [
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    price: { input: "$0.10/M", output: "$0.40/M" },
    capacity: 3,
    speed: 5,
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    price: { input: "$0.30/M", output: "$2.50/M" },
    capacity: 4,
    speed: 4,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    price: { input: "$2.50/M", output: "$10.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    price: { input: "$0.15/M", output: "$0.60/M" },
    capacity: 3,
    speed: 4,
  },
  {
    id: "google/gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    price: { input: "$0.07/M", output: "$0.30/M" },
    capacity: 2,
    speed: 5,
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    price: { input: "$1.25/M", output: "$10.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "openai/gpt-5-pro",
    name: "GPT-5 Pro",
    price: { input: "$15.00/M", output: "$120.00/M" },
    capacity: 5,
    speed: 2,
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    price: { input: "$0.25/M", output: "$2.00/M" },
    capacity: 4,
    speed: 5,
  },
  {
    id: "openai/gpt-5-nano",
    name: "GPT-5 Nano",
    price: { input: "$0.05/M", output: "$0.40/M" },
    capacity: 3,
    speed: 5,
  },
  {
    id: "openai/gpt-5-codex",
    name: "GPT-5 Codex",
    price: { input: "$1.25/M", output: "$10.00/M" },
    capacity: 5,
    speed: 4,
  },
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    price: { input: "$2.00/M", output: "$8.00/M" },
    capacity: 4,
    speed: 3,
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    price: { input: "$0.40/M", output: "$1.60/M" },
    capacity: 3,
    speed: 4,
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    price: { input: "$0.10/M", output: "$0.40/M" },
    capacity: 2,
    speed: 5,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    price: { input: "$2.50/M", output: "$10.00/M" },
    capacity: 5,
    speed: 4,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    price: { input: "$0.15/M", output: "$0.60/M" },
    capacity: 3,
    speed: 5,
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    price: { input: "$0.07/M", output: "$0.30/M" },
    capacity: 2,
    speed: 5,
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    price: { input: "$0.10/M", output: "$0.50/M" },
    capacity: 3,
    speed: 4,
  },
  {
    id: "openai/o1",
    name: "OpenAI O1",
    price: { input: "$15.00/M", output: "$60.00/M" },
    capacity: 5,
    speed: 2,
  },
  {
    id: "openai/o3",
    name: "OpenAI O3",
    price: { input: "$2.00/M", output: "$8.00/M" },
    capacity: 4,
    speed: 3,
  },
  {
    id: "openai/o3-mini",
    name: "OpenAI O3 Mini",
    price: { input: "$1.10/M", output: "$4.40/M" },
    capacity: 4,
    speed: 4,
  },
  {
    id: "openai/o4-mini",
    name: "OpenAI O4 Mini",
    price: { input: "$1.10/M", output: "$4.40/M" },
    capacity: 4,
    speed: 4,
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    price: { input: "$0.25/M", output: "$1.25/M" },
    capacity: 3,
    speed: 5,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    price: { input: "$0.80/M", output: "$4.00/M" },
    capacity: 4,
    speed: 5,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    price: { input: "$3.00/M", output: "$15.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    price: { input: "$3.00/M", output: "$15.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    price: { input: "$3.00/M", output: "$15.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    price: { input: "$3.00/M", output: "$15.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "anthropic/claude-opus-4",
    name: "Claude Opus 4",
    price: { input: "$15.00/M", output: "$75.00/M" },
    capacity: 5,
    speed: 2,
  },
  {
    id: "anthropic/claude-opus-4.1",
    name: "Claude Opus 4.1",
    price: { input: "$15.00/M", output: "$75.00/M" },
    capacity: 5,
    speed: 2,
  },
  {
    id: "deepseek/deepseek-v3.1",
    name: "DeepSeek V3.1",
    price: { input: "$0.20/M", output: "$0.80/M" },
    capacity: 4,
    speed: 4,
  },
  {
    id: "deepseek/deepseek-v3.2-exp",
    name: "DeepSeek V3.2 Exp",
    price: { input: "$0.27/M", output: "$0.41/M" },
    capacity: 3,
    speed: 4,
  },
  {
    id: "deepseek/deepseek-v3.2-exp-thinking",
    name: "DeepSeek V3.2 Exp Thinking",
    price: { input: "$0.28/M", output: "$0.42/M" },
    capacity: 4,
    speed: 3,
  },
  {
    id: "deepseek/deepseek-v3.1-terminus",
    name: "DeepSeek V3.1 Terminus",
    price: { input: "$0.27/M", output: "$1.00/M" },
    capacity: 4,
    speed: 3,
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    price: { input: "$0.79/M", output: "$4.00/M" },
    capacity: 4,
    speed: 3,
  },
  {
    id: "xai/grok-4-fast",
    name: "Grok 4 Fast",
    price: { input: "$0.20/M", output: "$0.50/M" },
    capacity: 4,
    speed: 5,
  },
  {
    id: "xai/grok-4-fast-reasoning",
    name: "Grok 4 Fast Reasoning",
    price: { input: "$0.20/M", output: "$0.50/M" },
    capacity: 4,
    speed: 4,
  },
  {
    id: "xai/grok-4-fast-non-reasoning",
    name: "Grok 4 Fast Non-Reasoning",
    price: { input: "$0.20/M", output: "$0.50/M" },
    capacity: 4,
    speed: 5,
  },
  {
    id: "xai/grok-code-fast-1",
    name: "Grok Code Fast 1",
    price: { input: "$0.20/M", output: "$1.50/M" },
    capacity: 3,
    speed: 5,
  },
  {
    id: "meta/llama-4-maverick",
    name: "Llama 4 Maverick",
    price: { input: "$0.15/M", output: "$0.60/M" },
    capacity: 4,
    speed: 3,
  },
  {
    id: "meta/llama-4-scout",
    name: "Llama 4 Scout",
    price: { input: "$0.08/M", output: "$0.30/M" },
    capacity: 3,
    speed: 4,
  },
  {
    id: "alibaba/qwen3-coder",
    name: "Qwen3 Coder",
    price: { input: "$0.40/M", output: "$1.60/M" },
    capacity: 3,
    speed: 4,
  },
  {
    id: "alibaba/qwen3-coder-30b-a3b",
    name: "Qwen3 Coder 30B A3B",
    price: { input: "$0.15/M", output: "$0.60/M" },
    capacity: 3,
    speed: 4,
  },
  {
    id: "alibaba/qwen3-max",
    name: "Qwen3 Max",
    price: { input: "$1.20/M", output: "$6.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "alibaba/qwen3-max-preview",
    name: "Qwen3 Max Preview",
    price: { input: "$1.20/M", output: "$6.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "amazon/nova-lite",
    name: "Amazon Nova Lite",
    price: { input: "$0.06/M", output: "$0.24/M" },
    capacity: 2,
    speed: 5,
  },
  {
    id: "amazon/nova-pro",
    name: "Amazon Nova Pro",
    price: { input: "$0.80/M", output: "$3.20/M" },
    capacity: 4,
    speed: 4,
  },
  {
    id: "perplexity/sonar",
    name: "Perplexity Sonar",
    price: { input: "$1.00/M", output: "$1.00/M" },
    capacity: 3,
    speed: 4,
  },
  {
    id: "perplexity/sonar-pro",
    name: "Perplexity Sonar Pro",
    price: { input: "$3.00/M", output: "$15.00/M" },
    capacity: 5,
    speed: 3,
  },
  {
    id: "perplexity/sonar-reasoning",
    name: "Perplexity Sonar Reasoning",
    price: { input: "$1.00/M", output: "$5.00/M" },
    capacity: 4,
    speed: 3,
  },
  {
    id: "perplexity/sonar-reasoning-pro",
    name: "Perplexity Sonar Reasoning Pro",
    price: { input: "$2.00/M", output: "$8.00/M" },
    capacity: 5,
    speed: 3,
  },
];

export const getModelById = (id: string): ModelOption | undefined => {
  return AI_MODELS.find(model => model.id === id);
};

export const getModelsByCapacity = (minCapacity: number): ModelOption[] => {
  return AI_MODELS.filter(model => model.capacity >= minCapacity);
};

export const getModelsBySpeed = (minSpeed: number): ModelOption[] => {
  return AI_MODELS.filter(model => model.speed >= minSpeed);
};

export const getFastestModels = (limit: number = 5): ModelOption[] => {
  return [...AI_MODELS].sort((a, b) => b.speed - a.speed).slice(0, limit);
};

export const getMostCapableModels = (limit: number = 5): ModelOption[] => {
  return [...AI_MODELS].sort((a, b) => b.capacity - a.capacity).slice(0, limit);
};

