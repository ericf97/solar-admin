import { IIntent } from "@/types/intent";
import { createCrudStore } from "./crud-store";

export const useIntentsStore = createCrudStore<IIntent>();

