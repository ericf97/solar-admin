import { EEnergyType } from "./energy";

export interface ISkill {
  id: string;
  energy: EEnergyType;
  type: string;
  name: string;
  damage: number;
  cooldown: number;
  castSpeed: number;
}

export interface ISkillData {
  data: ISkill[];
  count: number;
}

