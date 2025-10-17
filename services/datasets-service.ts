import { apiHandler } from "../lib/api-handler";
import { IDataset, IDatasetData } from "@/types/dataset";
import { useDatasetsStore } from "@/store/datasets-store";

export const datasetsService = {
  createDataset: async (data: { name: string; intents: string[] }) => {
    const result = await apiHandler<IDataset>({
      method: "POST",
      path: "/ai/nlp/datasets",
      data,
    });
    useDatasetsStore.getState().addItem(result);
    return result;
  },

  getDataset: (id: string) => {
    return apiHandler<IDataset>({
      method: "GET",
      path: `/ai/nlp/datasets/${id}`,
    });
  },

  getDatasets: async (
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

    const response = await apiHandler<IDatasetData>({
      method: "GET",
      path: "/ai/nlp/datasets",
      params,
    });

    useDatasetsStore.getState().setItems(response.data, response.count);
    return response;
  },

  updateDataset: async (
    id: string,
    data: { name?: string; intents?: string[] }
  ) => {
    const result = await apiHandler<IDataset>({
      method: "PATCH",
      path: `/ai/nlp/datasets/${id}`,
      data,
    });
    useDatasetsStore.getState().updateItem(id, result);
    return result;
  },

  deleteDataset: async (id: string) => {
    await apiHandler<void>({
      method: "DELETE",
      path: `/ai/nlp/datasets/${id}`,
    });
    useDatasetsStore.getState().removeItem(id);
  },
};

