import { IDataset } from "@/types/dataset";
import { createCrudStore } from "./crud-store";

export const useDatasetsStore = createCrudStore<IDataset>();

