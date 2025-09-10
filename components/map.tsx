import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const energyIcons = {
  water: L.icon({
    iconUrl: '/icons/water.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  bio: L.icon({
    iconUrl: '/icons/bio.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  fire: L.icon({
    iconUrl: '/icons/fire.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  vita: L.icon({
    iconUrl: '/icons/vita.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  air: L.icon({
    iconUrl:'/icons/air.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  heart: L.icon({
    iconUrl: '/icons/heart.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  mind: L.icon({
    iconUrl: '/icons/mind.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  sand: L.icon({
    iconUrl: '/icons/sand.png',
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

