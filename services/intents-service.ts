import { apiHandler } from "../lib/api-handler";
import { IIntent, IIntentData } from "@/types/intent";
import { useIntentsStore } from "@/store/intents-store";

export const intentsService = {
  createIntent: async (
    data: Omit<IIntent, "id" | "createdAt" | "updatedAt">
  ) => {
    const result = await apiHandler<IIntent>({
      method: "POST",
      path: "/ai/nlp/intents",
      data,
    });
    useIntentsStore.getState().addItem(result);
    return result;
  },

  getIntent: (id: string) => {
    return apiHandler<IIntent>({
      method: "GET",
      path: `/ai/nlp/intents/${id}`,
    });
  },

  getIntents: async (
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

    const response = await apiHandler<IIntentData>({
      method: "GET",
      path: "/ai/nlp/intents",
      params,
    });

    useIntentsStore.getState().setItems(response.data, response.count);
    return response;
  },

  updateIntent: async (id: string, data: Partial<IIntent>) => {
    const result = await apiHandler<IIntent>({
      method: "PATCH",
      path: `/ai/nlp/intents/${id}`,
      data,
    });
    useIntentsStore.getState().updateItem(id, result);
    return result;
  },

  deleteIntent: async (id: string) => {
    await apiHandler<void>({
      method: "DELETE",
      path: `/ai/nlp/intents/${id}`,
    });
    useIntentsStore.getState().removeItem(id);
  },
};

