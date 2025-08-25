import { PortalFormData } from "@/components/portal-form";
import * as z from "zod";
import { EEnergyType } from "./energy";

export enum EPortalType {
  FOOD = "food",
  WATER = "water",
  GREEN_SPACE = "green_space",
  SOCIAL = "social",
  EDUCATION = "education",
  TRANSPORTATION = "transportation",
  SHOP = "shop",
  WASTE_DISPOSAL = "waste_disposal",
}

export interface IPortalReward {
  energy?: number;
  sap?: number;
  exp?: number;
}

export interface IPortalItem {
  url?: string | null;
  image?: string | null;
}

export interface IPortalLocation {
  type: string;
  coordinates: [number, number];
}

export interface IPortal {
  id: string;
  zohoRecordId: string;
  name: string;
  energyType: EEnergyType;
  portalType: EPortalType;
  location: IPortalLocation;
  cardImage: string;
  items: IPortalItem[];
  rewards: IPortalReward;
  address: string;
  website: string;
  shippingCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPortalData {
  data: IPortal[];
  count: number;
}

export interface PortalFormProps {
  initialData?: IPortal;
  onSubmit: (data: PortalFormData) => Promise<void>;
  onCancel: () => void;
}

