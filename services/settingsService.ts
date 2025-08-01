import { apiHandler } from "../lib/apiHandler";
import { ISettings } from "../types/settings";

export const settingsService = {
  getSettings: () => {
    return apiHandler<ISettings>({
      method: "GET",
      path: "/settings",
    });
  },

  updateSettings: (data: Partial<ISettings>) => {
    return apiHandler<ISettings>({
      method: "PATCH",
      path: "/settings",
      data,
    });
  },
};

