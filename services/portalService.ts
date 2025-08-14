import { apiHandler } from "../lib/apiHandler";
import { IPortal } from "../types/portal";

export const portalService = {
  getPortal: (id: string) => {
    return apiHandler<IPortal>({
      method: "GET",
      path: `/admin/portals/${id}`,
    });
  },

  getPortals: (
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

    return apiHandler<{ data: IPortal[]; count: number }>({
      method: "GET",
      path: "/admin/portals",
      params,
    });
  },

  updatePortal: (id: string, data: Partial<IPortal>) => {
    return apiHandler<IPortal>({
      method: "PATCH",
      path: `/portals/${id}`,
      data,
    });
  },

  createPortal: (data: Omit<IPortal, "id">) => {
    return apiHandler<IPortal>({
      method: "POST",
      path: "/portals",
      data,
    });
  },

  getPortalsByLocation: (
    coordinates: [number, number],
    radius: number,
    filter?: string
  ) => {
    const params: Record<string, string> = {
      coordinates: `${coordinates[0]},${coordinates[1]}`,
      radius: radius.toString(),
    };
    if (filter) params["$filter"] = filter;

    return apiHandler<{ data: IPortal[]; count: number }>({
      method: "GET",
      path: "/portals",
      params,
    });
  },
};

