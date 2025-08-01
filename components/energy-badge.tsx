import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { EEnergyType } from "@/types/energy";

interface EnergyBadgeProps {
  type: EEnergyType;
}

const energyTypeConfig: Record<EEnergyType, { color: string; icon: string }> = {
  water: {
    color: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/water-K7xFCut8k6hdy8HZvllvcTQtWtem28.png",
  },
  vita: {
    color: "bg-pink-500/10 text-pink-500 dark:bg-pink-500/20",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vita-3sHAte4QsCuo5vJdiYJksJxbNmVO7Z.png",
  },
  fire: {
    color: "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fire-umO8XBlStLnbDPslwZ85ae6qbwpb2s.png",
  },
  bio: {
    color: "bg-green-500/10 text-green-500 dark:bg-green-500/20",
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bio-ghOI7JuZNo3N4LTx6PQlXrM5lkMyX3.png",
  },
};

export function EnergyBadge({ type }: EnergyBadgeProps) {
  const normalizedType = type?.toUpperCase() as keyof typeof energyTypeConfig;
  const config = energyTypeConfig[type];

  return (
    <Badge
      className={`${config.color} inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5`}
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

