import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { IPortal } from "@/types/portal";
import { portalService } from "@/services/portals-service";
import { SearchFilters } from "@/components/portal-search";
import { useDebouncedCallback } from "use-debounce";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const energyIcons = {
  water: L.icon({
    iconUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/water-Ev8745S1qZ6EdeluMuXjDfot62vhjb.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  bio: L.icon({
    iconUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bio-JIRpskV7R25vVa8IWL1fDyGLkvR2ig.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  fire: L.icon({
    iconUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fire-90xJjcxXSqwqxr6MW2UuXpCpIsURFT.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  vita: L.icon({
    iconUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vita-FjYWVQ9SNU9cigFgzjhGjLKpGGzif6.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
};

interface PortalMapProps {
  filters: SearchFilters;
  onPortalClick: (portal: IPortal) => void;
}

const MapEvents = React.memo(
  ({
    onMoveEnd,
  }: {
    onMoveEnd: (center: L.LatLng, radius: number) => void;
  }) => {
    const map = useMapEvents({
      moveend: () => {
        const center = map.getCenter();
        const bounds = map.getBounds();
        const radius = center.distanceTo(bounds.getNorthEast());
        onMoveEnd(center, radius);
      },
    });
    return null;
  }
);
MapEvents.displayName = "MapEvents";

const PortalMarker = React.memo(
  ({
    portal,
    onClick,
  }: {
    portal: IPortal;
    onClick: (portal: IPortal) => void;
  }) => {
    return (
      <Marker
        position={[
          portal.location.coordinates[1],
          portal.location.coordinates[0],
        ]}
        icon={
          energyIcons[
            portal.energyType.toLowerCase() as keyof typeof energyIcons
          ]
        }
        eventHandlers={{
          click: () => onClick(portal),
        }}
      >
        <Tooltip>
          <div className="flex flex-col items-center">
            <h3 className="font-bold">{portal.name}</h3>
            <p className="text-sm">{portal.address}</p>
            {portal.cardImage && (
              <div className="mt-2 relative w-32 h-32">
                <Image
                  src={portal.cardImage}
                  alt={portal.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
            )}
          </div>
        </Tooltip>
      </Marker>
    );
  }
);
PortalMarker.displayName = "PortalMarker";

const PortalMarkers = React.memo(
  ({
    portals,
    onPortalClick,
  }: {
    portals: IPortal[];
    onPortalClick: (portal: IPortal) => void;
  }) => {
    return (
      <>
        {portals.map(portal => (
          <PortalMarker
            key={portal.id}
            portal={portal}
            onClick={onPortalClick}
          />
        ))}
      </>
    );
  }
);
PortalMarkers.displayName = "PortalMarkers";

export const PortalMap = React.memo(
  ({ filters, onPortalClick }: PortalMapProps) => {
    const [portals, setPortals] = useState<IPortal[]>([]);
    const [center, setCenter] = useState<[number, number]>([
      1.290188, 103.8501095,
    ]); // Singapore coordinates
    const [zoom] = useState(15);
    const [isLoading, setIsLoading] = useState(false);
    const lastLoadedCenter = useRef<L.LatLng | null>(null);
    const LOAD_THRESHOLD = 500; // meters

    const loadPortals = useCallback(
      async (center: L.LatLng, radius: number) => {
        setIsLoading(true);
        try {
          const response = await portalService.getPortalsByLocation(
            [center.lng, center.lat],
            radius,
            createFilterString(filters)
          );
          setPortals(response.data);
          lastLoadedCenter.current = center;
        } catch (error) {
          console.error("Error loading portals:", error);
        } finally {
          setIsLoading(false);
        }
      },
      [filters]
    );

    const debouncedLoadPortals = useDebouncedCallback(loadPortals, 300);

    useEffect(() => {
      loadPortals(L.latLng(center[0], center[1]), 1000); // Initial load with 1km radius
    }, [center, loadPortals]);

    const handleMoveEnd = useCallback(
      (newCenter: L.LatLng, radius: number) => {
        setCenter([newCenter.lat, newCenter.lng]);
        if (
          lastLoadedCenter.current &&
          newCenter.distanceTo(lastLoadedCenter.current) > LOAD_THRESHOLD
        ) {
          debouncedLoadPortals(newCenter, radius);
        }
      },
      [debouncedLoadPortals, LOAD_THRESHOLD]
    );

    const memoizedPortals = useMemo(() => portals, [portals]);

    return (
      <div className="relative" style={{ zIndex: 0 }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "600px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapEvents onMoveEnd={handleMoveEnd} />
          <PortalMarkers
            portals={memoizedPortals}
            onPortalClick={onPortalClick}
          />
        </MapContainer>
        {isLoading && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-[1000]">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>
    );
  }
);
PortalMap.displayName = "PortalMap";

function createFilterString(filters: SearchFilters): string {
  const filterParts = [];
  if (filters.name) filterParts.push(`contains(name, '${filters.name}')`);
  if (filters.portalType)
    filterParts.push(`portalType eq '${filters.portalType}'`);
  if (filters.energyType)
    filterParts.push(`energyType eq '${filters.energyType}'`);
  if (filters.zohoRecordId)
    filterParts.push(`zohoRecordId eq '${filters.zohoRecordId}'`);
  if (filters.address)
    filterParts.push(`contains(address, '${filters.address}')`);
  if (filters.shippingCode)
    filterParts.push(`contains(shippingCode, '${filters.shippingCode}')`);
  return filterParts.join(" and ");
}
