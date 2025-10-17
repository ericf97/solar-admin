export interface IObjective {
  tag: string;
  intervalMessages: number;
  showAfterReply: boolean;
}

export interface IRepeatedInputConfig {
  enabled: boolean;
  tolerance: number;
  historySize: number;
  allowOriginalResponse: boolean;
}

export enum EVoiceProvider {
  PIPER = "piper",
  GOOGLE = "google",
}

export interface IVoiceConfig {
  provider: EVoiceProvider;
  voiceId: string;
  additionalConfig?: {
    speakerId?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export interface IAgent {
  id: string;
  name: string;
  description?: string;
  role?: string;
  systemPrompt?: string;
  objective?: string;
  personality?: string;
  backstory?: string;
  voiceConfig?: IVoiceConfig;
  datasets: string[];
  greetings: string[];
  fallback: string[];
  repeatedInput: string[];
  repeatedInputConfig: IRepeatedInputConfig;
  objectives: IObjective[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface IAgentData {
  data: IAgent[];
  count: number;
}

