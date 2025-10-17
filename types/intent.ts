import { EBodyAnimation, EFaceAnimation } from "./animation";

export interface IResponse {
  text: string;
  alt?: string;
}

export interface IOptions {
  label: string;
  text: string;
  tag: string;
}

export interface IFaceAnimation {
  id: EFaceAnimation;
  intensity: number;
}

export interface IBodyAnimation {
  id: EBodyAnimation;
  intensity: number;
}

export interface IVisualCue {
  face: IFaceAnimation;
  body: IBodyAnimation;
}

export interface IIntent {
  id: string;
  tag: string;
  patterns: string[];
  responses: IResponse[];
  options?: IOptions[];
  visualCue?: IVisualCue;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface IIntentData {
  data: IIntent[];
  count: number;
}

