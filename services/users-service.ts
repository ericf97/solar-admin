import { apiHandler } from "../lib/api-handler";
import { User } from "@/types/user";

interface IUserData {
  data: User[];
  count: number;
  limit: number;
  skip: number;
}

export const usersService = {
  createUser: (data: Omit<User, "id">) => {
    return apiHandler<User>({
      method: "POST",
      path: "/admin/users",
      data,
    });
  },

  getUser: (id: string) => {
    return apiHandler<User>({
      method: "GET",
      path: `/admin/users/${id}`,
    });
  },

  getUsers: (
    filter?: string,
    sort?: string,
    page: number = 1,
    pageSize: number = 10
  ) => {
    const params: Record<string, string> = {};
    if (filter) params["$filter"] = filter;
    if (sort) params["$sort"] = sort;
    params["$skip"] = ((page - 1) * pageSize).toString();
    params["$limit"] = pageSize.toString();

    return apiHandler<IUserData>({
      method: "GET",
      path: "/admin/users",
      params,
    });
  },

  updateUser: (id: string, data: Partial<User>) => {
    return apiHandler<User>({
      method: "PATCH",
      path: `/admin/users/${id}`,
      data,
    });
  },

  deleteUser: (id: string) => {
    return apiHandler<void>({
      method: "DELETE",
      path: `/admin/users/${id}`,
    });
  },
};

