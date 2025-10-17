import { IAgent } from "@/types/agent";
import { createCrudStore } from "./crud-store";

export const useAgentsStore = createCrudStore<IAgent>();

