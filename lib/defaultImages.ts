import { EPortalType, IPortalItem } from "@/types/portal";

const DefaultImages: Partial<Record<EPortalType, string>> = {
  [EPortalType.GREEN_SPACE]: '/default/community_garden.png',
  [EPortalType.TRANSPORTATION]: '/default/transport.png',
  [EPortalType.WASTE_DISPOSAL]: '/default/waste_disposal.png',
  [EPortalType.WATER]: '/default/water_cooler.png',
};

const DefaultItemImages: Partial<Record<EPortalType, IPortalItem[]>> = {
  [EPortalType.GREEN_SPACE]: [
    {url: '', image:'/default/items/community_garden_1.png'},
    {url: '', image:'/default/items/community_garden_2.png'},
    {url: '', image:'/default/items/community_garden_3.png'},
  ],
  [EPortalType.TRANSPORTATION]: [
    {url: '', image:'/default/items/transport_1.png'},
    {url: '', image:'/default/items/transport_2.png'},
  ],
  [EPortalType.WASTE_DISPOSAL]: [
    {url: '', image:'/default/items/waste_disposal_1.png'},
    {url: '', image:'/default/items/waste_disposal_2.png'},
    {url: '', image:'/default/items/waste_disposal_2.png'},
  ],
  [EPortalType.WATER]: [
    {url: '', image:'/default/items/water_cooler_1.png'},
    {url: '', image:'/default/items/water_cooler_2.png'},
    {url: '', image:'/default/items/water_cooler_3.png'},
  ],
};

export {DefaultImages, DefaultItemImages};
