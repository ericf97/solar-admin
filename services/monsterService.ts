import { apiHandler } from "../lib/apiHandler";
import { IMonster } from "../types/monster";

export const monsterService = {
  getMonsters: () => {
    return apiHandler<{ data: IMonster[]; count: number }>({
      method: "GET",
      path: "/monsters",
    });
  },

  getMonster: (id: string) => {
    return apiHandler<IMonster>({
      method: "GET",
      path: `/monsters/${id}`,
    });
  },

  updateMonster: (id: string, data: Partial<IMonster>) => {
    return apiHandler<IMonster>({
      method: "PATCH",
      path: `/monsters/${id}`,
      data,
    });
  },
};

