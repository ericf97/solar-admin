import { User, AuthClaims } from "../types/user";
import { apiHandler } from "../lib/api-handler";

export const authService = {
  loginAdmin: () => {
    return apiHandler<User>({
      method: "GET",
      path: `/login/admin`,
    });
  },

  getUserClaims: (userId: string) => {
    return apiHandler<AuthClaims>({
      method: "GET",
      path: `/claims/${userId}`,
    });
  },

  setUserClaims: (userId: string, claims: AuthClaims) => {
    return apiHandler<AuthClaims>({
      method: "PATCH",
      path: `/claims/${userId}`,
      data: claims,
    });
  },
};
