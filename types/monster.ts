export interface IMonster {
  id: string;
  name: string;
  health: number;
  damage: number;
  speed: [number, number];
  cooldown: number;
}

export interface IMonsterData {
  data: IMonster[];
  count: number;
}

