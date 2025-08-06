import { User } from "../types/user";
import { apiHandler } from "../lib/apiHandler";

export const authService = {
  loginAdmin: () => {
    return apiHandler<User>({
      method: "GET",
      path: `/login/admin`,
    });
  },
}
