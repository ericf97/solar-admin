"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { IPortal } from "@/types/portal";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EnergyBadge } from "@/components/energy-badge";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { portalService } from "@/services/portals-service";
import { PortalSearch, SearchFilters } from "@/components/portal-search";
import { EEnergyType } from "@/types/energy";
import { DefaultImages } from "@/lib/default-images";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SplitView } from "@/components/split-view";
import { PortalForm } from "@/components/portal-form";
import { cn } from "@/lib/utils";
import Link from "next/link";

const columns: ColumnDef<IPortal>[] = [
  {
    id: "avatar",
    header: "",
    cell: ({ row }) => {
      const portal: IPortal = row.original;
      return (
        <Avatar>
          <AvatarImage
            src={portal.cardImage || DefaultImages[portal.portalType]}
            alt={portal.name}
          />
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
    header: "Energy",
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
    header: "Type",
    cell: ({ row }) => {
      const portalType = row.getValue("portalType") as string;
      return <Badge>{portalType.toUpperCase()}</Badge>;
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

const portalStates = ["draft", "staged", "published", "archived"] as const;

export default function PortalsPage() {
  const [portals, setPortals] = useState<IPortal[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState<IPortal | null>(null);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedStates, setSelectedStates] = useState<string[]>([
    ...portalStates,
  ]);

  const loadPortals = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = createFilterString(searchFilters);
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
    loadPortals();
  }, [loadPortals]);

  const handleRowClick = async (portal: IPortal) => {
    try {
      const fullPortal = await portalService.getPortal(portal.id);
      setSelectedPortal(fullPortal);
      setIsSplitViewOpen(true);
    } catch (e) {
      console.error("Error loading portal:", e);
    }
  };

  const handleCloseSplitView = () => {
    setIsSplitViewOpen(false);
    setSelectedPortal(null);
  };

  const handlePortalSave = async () => {
    const formElement = document.querySelector("form");
    if (formElement) {
      formElement.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  const handlePortalUpdate = async (data: unknown) => {
    if (!selectedPortal) return;
    setIsSubmitting(true);
    try {
      await portalService.updatePortal(
        selectedPortal.id,
        data as Partial<IPortal>
      );
      await loadPortals();
      handleCloseSplitView();
    } catch (error) {
      console.error("Error updating portal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  useEffect(() => {
    const newFilters = { ...searchFilters, state: selectedStates };
    setSearchFilters(newFilters);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [selectedStates]);

  const handleSearch = (filters: SearchFilters) => {
    const processedFilters: {
      searchTerm?: string;
      portalType?: string | null;
      energyType?: string | null;
      state?: string[];
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
    processedFilters.state = selectedStates;
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
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <h1 className="text-3xl font-bold text-foreground">Portals</h1>
          </div>
          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <div className="w-full lg:w-auto">
              <PortalSearch onSearch={handleSearch} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[160px] justify-between p-5 border rounded-lg"
                >
                  Filter State
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                {portalStates.map(state => (
                  <DropdownMenuCheckboxItem
                    key={state}
                    checked={selectedStates.includes(state)}
                    onCheckedChange={() => toggleState(state)}
                  >
                    {state}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/portals/add" passHref>
                <Button variant="outline" size="icon">
                  <Plus className="h-6 w-6" />
                </Button>
              </Link>
              <Link href="/portals/bulk-add" passHref>
                <Button
                  variant="outline"
                  size="icon"
                  title="Upload CSV for bulk portals"
                >
                  <Upload className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-1 gap-0 overflow-hidden">
          <div
            className={cn(
              "flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out",
              isSplitViewOpen ? "w-[45%] min-w-[600px]" : "w-full"
            )}
          >
            <div className="flex-1 overflow-hidden mt-4">
              {isLoading ? (
                <p className="text-foreground">Loading...</p>
              ) : (
                <DataTable
                  columns={columns}
                  data={portals}
                  onRowClick={handleRowClick}
                  pagination={pagination}
                  onPaginationChange={handlePaginationChange}
                  pageCount={Math.ceil(totalCount / pagination.pageSize)}
                />
              )}
            </div>
          </div>

          <SplitView
            isOpen={isSplitViewOpen}
            onClose={handleCloseSplitView}
            title={selectedPortal ? `Portal: ${selectedPortal.name}` : "Portal"}
            actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseSplitView}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handlePortalSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </>
            }
          >
            {selectedPortal && (
              <PortalForm
                key={selectedPortal.id} // remount form on selection change
                initialData={selectedPortal}
                onSubmit={handlePortalUpdate}
                onCancel={handleCloseSplitView}
                hideActions
              />
            )}
          </SplitView>
        </div>
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
