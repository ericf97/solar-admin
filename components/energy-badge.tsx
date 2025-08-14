import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { EEnergyType } from "@/types/energy";

interface EnergyBadgeProps {
  type: EEnergyType;
}

const energyTypeConfig: Record<EEnergyType, { color: string; icon: string }> = {
  water: {
    color: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
    icon: "/icons/water.png",
  },
  vita: {
    color: "bg-pink-500/10 text-pink-500 dark:bg-pink-500/20",
    icon: "/icons/vita.png",
  },
  fire: {
    color: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20",
    icon: "/icons/fire.png",
  },
  bio: {
    color: "bg-green-500/10 text-green-500 dark:bg-green-500/20",
    icon: "/icons/bio.png",
  },
  air: {
    color: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20",
    icon: "/icons/air.png",
  },
  heart: {
    color: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20",
    icon: "/icons/heart.png",
  },
  mind: {
    color: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
    icon: "/icons/mind.png",
  },
  sand: {
    color: "bg-green-500/10 text-green-500 dark:bg-green-500/20",
    icon: "/icons/sand.png",
  },
};

export function EnergyBadge({ type }: EnergyBadgeProps) {
  const normalizedType = type?.toUpperCase() as keyof typeof energyTypeConfig;
  const config = energyTypeConfig[type];

  return (
    <Badge
      className={`${config?.color} inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5`}
    >
      <Image
        src={config.icon}
        alt={`${normalizedType} energy type`}
        width={12}
        height={12}
        className="object-contain"
      />
      <span>{normalizedType}</span>
    </Badge>
  );
}

