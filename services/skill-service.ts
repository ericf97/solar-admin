import { apiHandler } from "../lib/api-handler";
import { ISkill } from "../types/skill";

export const skillService = {
  getSkills: () => {
    return apiHandler<{ data: ISkill[]; count: number }>({
      method: "GET",
      path: "/skills",
    });
  },

  getSkill: (id: string) => {
    return apiHandler<ISkill>({
      method: "GET",
      path: `/skills/${id}`,
    });
  },

  updateSkill: (id: string, data: Partial<ISkill>) => {
    return apiHandler<ISkill>({
      method: "PATCH",
      path: `/skills/${id}`,
      data,
    });
  },
};
