import { IVisualCue } from "./intent";

export interface IOptions {
  label: string;
  text: string;
  tag: string;
}

export interface IReply {
  tag: string;
  text: string;
  options?: IOptions[];
  visualCue?: IVisualCue;
  confidence?: number;
  isFallback?: boolean;
  isObjective?: boolean;
  isRepeatedInput?: boolean;
}

export interface IMessage {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
  isObjective?: boolean;
  isRepeatedInput?: boolean;
  options?: IOptions[];
}

