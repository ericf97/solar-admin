"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IPortal } from "@/types/portal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EnergyBadge } from "@/components/energy-badge";
import { PortalModal } from "@/components/portal-modal";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin } from "lucide-react";
import { portalService } from "@/services/portals-service";
import { DefaultImages } from "@/lib/default-images";

export function PortalsWidget() {
  const [portals, setPortals] = useState<IPortal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortals() {
      setIsLoading(true);
      try {
        const response = await portalService.getPortals(
          undefined,
          undefined,
          1,
          10
        );
        setPortals(response.data);
      } catch (error) {
        console.error("Error loading portals:", error);
        setError("Failed to load portals. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadPortals();
  }, []);

  const handlePortalClick = (portal: IPortal) => {
    setSelectedPortalId(portal.id);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (portals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <p className="mb-4">No portals found.</p>
        <Link href="/portals/add">
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
          >
            Create your first portal
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {portals.map(portal => (
          <Card
            key={portal.id}
            className="overflow-hidden transition-all hover:shadow-md cursor-pointer border border-white dark:border-border hover:border-gray-300 dark:hover:border-gray-600"
            onClick={() => handlePortalClick(portal)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-muted shrink-0">
                  <AvatarImage
                    src={portal.cardImage || DefaultImages[portal.portalType]}
                    alt={portal.name}
                  />
                  <AvatarFallback className="bg-muted text-primary">
                    {portal.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-gray-900 dark:text-white">
                    {portal.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <EnergyBadge type={portal.energyType} />
                    <Badge variant="outline" className="truncate text-xs">
                      {portal.portalType}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {portal.address}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <Link href="/portals">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View all portals
          </Button>
        </Link>
      </div>
      <PortalModal
        portalId={selectedPortalId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPortalId(null);
        }}
      />
    </div>
  );
}
