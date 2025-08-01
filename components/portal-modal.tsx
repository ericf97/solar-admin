"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnergyBadge } from "@/components/energy-badge";
import { ChevronLeft, ChevronRight, ExternalLink, Edit } from "lucide-react";
import { IPortal } from "@/types/portal";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import Link from "next/link";
import { portalService } from "@/services/portalService";

const MapWithNoSSR = dynamic(() => import("@/components/map"), {
  ssr: false,
});

interface PortalModalProps {
  portalId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PortalModal({ portalId, isOpen, onClose }: PortalModalProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [portal, setPortal] = useState<IPortal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadPortal() {
      if (portalId && isOpen) {
        setIsLoading(true);
        try {
          const data = await portalService.getPortal(portalId);
          setPortal(data);
        } catch (error) {
          console.error("Error loading portal:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadPortal();
  }, [portalId, isOpen]);

  if (!portalId || !isOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="w-full h-64" />
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-8" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!portal) {
    return null;
  }

  const nextItem = () => {
    setCurrentItemIndex(prevIndex =>
      prevIndex + 1 >= portal.items.length ? 0 : prevIndex + 1
    );
    setImageError(false);
  };

  const prevItem = () => {
    setCurrentItemIndex(prevIndex =>
      prevIndex - 1 < 0 ? portal.items.length - 1 : prevIndex - 1
    );
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center mt-6">
          <DialogTitle className="text-2xl font-bold">
            {portal.name}
          </DialogTitle>
          <Link href={`/portals/edit/${portal.id}`} passHref>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Portal
            </Button>
          </Link>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                {imageError || !portal.cardImage ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <Image
                    src={portal.cardImage}
                    alt={portal.name}
                    fill
                    className="object-cover"
                    onError={handleImageError}
                  />
                )}
              </div>
              <div className="flex justify-between items-center">
                <EnergyBadge type={portal.energyType || "unknown"} />
                <Badge>{portal.portalType}</Badge>
              </div>
              <div className="text-sm">
                <p>
                  <strong>Address:</strong> {portal.address || "N/A"}
                </p>
                <p>
                  <strong>Shipping Code:</strong> {portal.shippingCode || "N/A"}
                </p>
              </div>
              <div className="text-sm">
                <p>
                  <strong>Rewards:</strong>
                </p>
                <ul className="list-disc list-inside">
                  <li>Energy: {portal.rewards?.energy ?? "N/A"}</li>
                  <li>Sap: {portal.rewards?.sap ?? "N/A"}</li>
                  <li>Exp: {portal.rewards?.exp ?? "N/A"}</li>
                </ul>
              </div>
              {portal.website && (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={portal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {portal.items && portal.items.length > 0 && (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  {imageError || !portal.items[currentItemIndex].image ? (
                    <Skeleton className="w-full h-full" />
                  ) : portal.items[currentItemIndex].url ? (
                    <a
                      href={portal.items[currentItemIndex].url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={portal.items[currentItemIndex].image}
                        alt={`Item ${currentItemIndex + 1}`}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                      />
                    </a>
                  ) : (
                    <Image
                      src={portal.items[currentItemIndex].image}
                      alt={`Item ${currentItemIndex + 1}`}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={prevItem}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={nextItem}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="w-full h-[300px] rounded-lg overflow-hidden">
            <MapWithNoSSR
              center={[
                portal.location.coordinates[1],
                portal.location.coordinates[0],
              ]}
              zoom={13}
              onMapClick={() => {}}
              energyType={portal.energyType}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

