export interface IPortalRewards {
  energy: number;
  sap: number;
  exp: number;
}

export interface ICheckIn {
  rewards: IPortalRewards;
  checkInInterval: number;
}

export interface IPortals {
  checkIn: ICheckIn;
}

export interface IRifts {
  amountPerTile: number;
  expirationTime: number;
}

export interface ISkillsBase {
  energy: number;
  sap: number;
}

export interface ISkillsCosts {
  basic: number;
  longPress: number;
  ultimate: number;
}

export interface ISkillsGrowthRate {
  energy: number;
  sap: number;
}

export interface ISkills {
  base: ISkillsBase;
  costs: ISkillsCosts;
  growthRate: ISkillsGrowthRate;
}

export interface IValidations {
  maxAllowedMovementSpeed: number;
}

export interface ISettings {
  portals: IPortals;
  rifts: IRifts;
  skills: ISkills;
  validations: IValidations;
}