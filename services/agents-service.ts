import { apiHandler } from "../lib/api-handler";
import { IAgent, IAgentData } from "@/types/agent";
import { useAgentsStore } from "@/store/agents-store";

export const agentsService = {
  createAgent: async (data: Omit<IAgent, "id" | "createdAt" | "updatedAt">) => {
    const result = await apiHandler<IAgent>({
      method: "POST",
      path: "/ai/nlp/agents",
      data,
    });
    useAgentsStore.getState().addItem(result);
    return result;
  },

  getAgent: (id: string) => {
    return apiHandler<IAgent>({
      method: "GET",
      path: `/ai/nlp/agents/${id}`,
    });
  },

  getAgents: async (
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

    const response = await apiHandler<IAgentData>({
      method: "GET",
      path: "/ai/nlp/agents",
      params,
    });

    useAgentsStore.getState().setItems(response.data, response.count);
    return response;
  },

  updateAgent: async (id: string, data: Partial<IAgent>) => {
    const result = await apiHandler<IAgent>({
      method: "PATCH",
      path: `/ai/nlp/agents/${id}`,
      data,
    });
    useAgentsStore.getState().updateItem(id, result);
    return result;
  },

  deleteAgent: async (id: string) => {
    await apiHandler<void>({
      method: "DELETE",
      path: `/ai/nlp/agents/${id}`,
    });
    useAgentsStore.getState().removeItem(id);
  },
};

