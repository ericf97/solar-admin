import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

interface MapProps {
  center: [number, number];
  zoom: number;
  onMapClick: (lat: number, lng: number) => void;
  energyType?: keyof typeof energyIcons;
}

function MapEvents({ onMapClick }: { onMapClick: MapProps["onMapClick"] }) {
  useMapEvents({
    click: e => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function Map({
  center,
  zoom,
  onMapClick,
  energyType = "water",
}: MapProps) {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <style jsx global>{`
        .leaflet-pane {
          z-index: 1 !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 1 !important;
        }
      `}</style>
      <MapContainer
        key={`${center[0]}-${center[1]}`}
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={center} icon={energyIcons[energyType]} />
        <MapEvents onMapClick={onMapClick} />
      </MapContainer>
    </div>
  );
}

