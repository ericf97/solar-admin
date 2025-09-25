"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { IPortal } from "@/types/portal";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EnergyBadge } from "@/components/energy-badge";
import { Layout } from "@/components/layout";
import { PortalModal } from "@/components/portal-modal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Table, Upload } from "lucide-react";
import { portalService } from "@/services/portalService";
import { PortalSearch, SearchFilters } from "@/components/portal-search";
import { EEnergyType } from "@/types/energy";
import { DefaultImages } from "@/lib/defaultImages";

const columns: ColumnDef<IPortal>[] = [
  {
    id: "avatar",
    header: "",
    cell: ({ row }) => {
      const portal: IPortal = row.original;
      return (
        <Avatar>
          <AvatarImage src={portal.cardImage || DefaultImages[portal.portalType]} alt={portal.name} />
          <AvatarFallback>
            {portal.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "energyType",
    header: "Energy Type",
    cell: ({ row }) => {
      const energyType = row.getValue("energyType") as EEnergyType;
      return (
        <div className="flex justify-center">
          <EnergyBadge type={energyType} />
        </div>
      );
    },
  },
  {
    accessorKey: "portalType",
    header: "Portal Type",
    cell: ({ row }) => {
      const portalType = row.getValue("portalType") as string;
      return <Badge>{portalType.toUpperCase()}</Badge>;
    },
  },
  {
    accessorKey: "industry",
    header: "Industry Type",
    cell: ({ row }) => {
      const industry = row.getValue("industry") as string;
      return <Badge>{industry.toUpperCase()}</Badge>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.getValue("createdAt")).toLocaleDateString();
    },
  },
];

function ViewModeButtons({
  viewMode,
  setViewMode,
}: {
  viewMode: "table" | "map";
  setViewMode: (mode: "table" | "map") => void;
}) {
  return (
    <div className="flex rounded-md bg-secondary p-1">
      <button
        onClick={() => setViewMode("table")}
        className={`flex items-center justify-center rounded-md px-3 py-2 transition-colors ${
          viewMode === "table"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground"
        }`}
      >
        <Table className="h-4 w-4" />
      </button>
      <button
        onClick={() => setViewMode("map")}
        className={`flex items-center justify-center rounded-md px-3 py-2 transition-colors ${
          viewMode === "map"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground"
        }`}
      >
        <MapPin className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function PortalsPage() {
  const [portals, setPortals] = useState<IPortal[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState<IPortal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  const loadPortals = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = createFilterString(searchFilters);
      console.log(filter)
      const response = await portalService.getPortals(
        filter,
        "name",
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      if (response.data) {
        setPortals(response.data);
        setTotalCount(response.count);
      }
    } catch (error) {
      console.error("Error loading portals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchFilters, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    if (viewMode === "table") {
      loadPortals();
    }
  }, [viewMode, loadPortals]);

  const handleRowClick = (portal: IPortal) => {
    setSelectedPortal(portal);
    setIsModalOpen(true);
  };

  const handleSearch = (filters: SearchFilters) => {
    const processedFilters: {
      searchTerm?: string;
      portalType?: string | null;
      energyType?: string | null;
      state?: string[]
    } = {};
    if (filters.searchTerm) {
      const searchTerms = [
        `contains(name, '${filters.searchTerm}')`,
        `contains(zohoRecordId, '${filters.searchTerm}')`,
        `contains(address, '${filters.searchTerm}')`,
        `contains(shippingCode, '${filters.searchTerm}')`,
      ];
      processedFilters.searchTerm = `(${searchTerms.join(" or ")})`;
    }
    if (filters.portalType) {
      processedFilters.portalType = filters.portalType;
    }
    if (filters.energyType) {
      processedFilters.energyType = filters.energyType;
    }
    if (filters.state && filters.state.length) {
      processedFilters.state = filters.state
    }
    setSearchFilters(processedFilters);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const handlePaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPagination(newPagination);
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <h1 className="text-3xl font-bold text-foreground">Portals</h1>
            <div className="flex items-center space-x-4 lg:hidden">
              <ViewModeButtons viewMode={viewMode} setViewMode={setViewMode} />
              <Link href="/portals/add" passHref>
                <Button variant="outline" size="icon">
                  <Plus className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <div className="w-full lg:w-auto">
              <PortalSearch onSearch={handleSearch} />
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <ViewModeButtons viewMode={viewMode} setViewMode={setViewMode} />
              <Link href="/portals/add" passHref>
                <Button variant="outline" size="icon">
                  <Plus className="h-6 w-6" />
                </Button>
              </Link>
              <Link href="/portals/bulk-add" passHref>
              <Button variant="outline" size="icon" title="Upload CSV for bulk portals">
                <Upload className="h-6 w-6" /> {/* Replace with your preferred icon */}
              </Button>
            </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden mt-4">
          {isLoading && viewMode === "table" ? (
            <p className="text-foreground">Loading...</p>
          ) : viewMode === "table" ? (
            <DataTable
              columns={columns}
              data={portals}
              onRowClick={handleRowClick}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              pageCount={Math.ceil(totalCount / pagination.pageSize)}
            />
          ) : (
            <></>
          )}
        </div>

        <PortalModal
          portalId={selectedPortal?.id ?? null}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
}

function createFilterString(filters: SearchFilters): string {
  const filterParts = [];
  if (filters.searchTerm) filterParts.push(filters.searchTerm);
  if (filters.portalType)
    filterParts.push(`portalType eq '${filters.portalType}'`);
  if (filters.energyType)
    filterParts.push(`energyType eq '${filters.energyType}'`);

  if (filters.state && filters.state.length > 0) {
    const stateFilter = `(${filters.state
      .map(s => `state eq '${s}'`)
      .join(" or ")})`;
    filterParts.push(stateFilter);
  }
  return filterParts.join(" and ");
}

