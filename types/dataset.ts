import { IIntent } from "./intent";

export interface IDataset {
  id: string;
  name: string;
  intents: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface IDatasetData {
  data: IDataset[];
  count: number;
}

export interface IDatasetWithIntents extends Omit<IDataset, "intents"> {
  intents: IIntent[];
}

