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
import { ChevronRight } from "lucide-react";
import { portalService } from "@/services/portalService";
import { DefaultImages } from "@/lib/defaultImages";

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
      <div className="text-center text-muted-foreground">
        Loading portals...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (portals.length === 0) {
    return (
      <div className="text-center text-muted-foreground">No portals found.</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portals.map(portal => (
          <Card
            key={portal.id}
            className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
            onClick={() => handlePortalClick(portal)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={portal.cardImage || DefaultImages[portal.portalType]} alt={portal.name} />
                  <AvatarFallback>
                    {portal.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{portal.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <EnergyBadge type={portal.energyType} />
                    <Badge variant="outline" className="truncate">
                      {portal.portalType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {portal.address}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center">
        <Link href="/portals">
          <Button variant="outline" size="sm">
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

