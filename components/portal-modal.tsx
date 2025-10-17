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
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  MapPin,
  Package,
  Award,
  Globe,
} from "lucide-react";
import { IPortal } from "@/types/portal";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import Link from "next/link";
import { portalService } from "@/services/portals-service";
import { DefaultImages, DefaultItemImages } from "@/lib/default-images";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

          const replaceDefault: IPortal = {
            ...data,
            cardImage: data.cardImage || DefaultImages[data.portalType] || "",
            items:
              data.items && data.items.length > 0
                ? data.items
                : DefaultItemImages[data.portalType] || [],
          };
          setPortal(replaceDefault);
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto pt-10">
        <DialogHeader className="flex flex-row justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              <DialogTitle className="text-2xl font-bold">
                {portal.name}
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Portal details and configuration
            </p>
          </div>
          <Link href={`/portals/edit/${portal.id}`} passHref>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>Portal Image</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted border">
                  {imageError || !portal.cardImage ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <Image
                      src={
                        portal.cardImage ||
                        DefaultImages[portal.portalType] ||
                        ""
                      }
                      alt={portal.name}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <EnergyBadge type={portal.energyType || "unknown"} />
                  <Badge
                    variant="secondary"
                    className="text-sm normal-case px-3 py-1"
                  >
                    {portal.portalType}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Location Information</CardTitle>
                </div>
                <CardDescription>Address and shipping details</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 border rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Address
                    </p>
                    <p className="text-sm font-medium">
                      {portal.address || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 border rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Shipping Code
                    </p>
                    <p className="text-sm font-medium">
                      {portal.shippingCode || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <CardTitle>Rewards</CardTitle>
                </div>
                <CardDescription>
                  Rewards earned from this portal
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/50 border rounded-lg text-center">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Energy
                    </p>
                    <p className="text-lg font-bold">
                      {portal.rewards?.energy ?? "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 border rounded-lg text-center">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Sap
                    </p>
                    <p className="text-lg font-bold">
                      {portal.rewards?.sap ?? "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 border rounded-lg text-center">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Exp
                    </p>
                    <p className="text-lg font-bold">
                      {portal.rewards?.exp ?? "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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

          <div className="space-y-6">
            {portal.items && portal.items.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle>Portal Items</CardTitle>
                  </div>
                  <CardDescription>
                    Browse through portal items ({currentItemIndex + 1} of{" "}
                    {portal.items.length})
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted border">
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 shadow-lg"
                      onClick={prevItem}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 shadow-lg"
                      onClick={nextItem}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Map Location</CardTitle>
                </div>
                <CardDescription>
                  Geographic location of this portal
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="w-full h-[300px] rounded-lg overflow-hidden border">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
