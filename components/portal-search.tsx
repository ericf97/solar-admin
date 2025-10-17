"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Search } from "lucide-react";
import { EnergyBadge } from "@/components/energy-badge";
import { useDebouncedCallback } from "use-debounce";
import { EEnergyType } from "@/types/energy";
import { EPortalType } from "@/types/portal";

export interface SearchFilters {
  name?: string;
  zohoRecordId?: string;
  address?: string;
  searchTerm?: string;
  shippingCode?: string;
  portalType?: string | null;
  energyType?: string | null;
  state?: string[];
}

interface PortalSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

const portalTypes = Object.values(EPortalType);
const energyTypes = Object.values(EEnergyType);

export function PortalSearch({ onSearch }: PortalSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  useEffect(() => {
    setHasActiveFilters(
      !!filters.searchTerm || !!filters.energyType || !!filters.portalType
    );
  }, [filters]);

  const debouncedSearch = useDebouncedCallback((newFilters: SearchFilters) => {
    onSearch(newFilters);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, searchTerm: e.target.value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  const handleSelectChange = (name: string, value: string) => {
    const newFilters = { ...filters, [name]: value === "any" ? null : value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onSearch({});
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
      <div className="flex flex-col md:flex-row w-full items-center gap-2 bg-background border rounded-lg px-2">
        <div className="flex items-center w-full md:flex-1">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
          <Input
            className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full"
            value={filters.searchTerm || ""}
            onChange={handleSearchChange}
            placeholder="Search by name, ID, address or shipping code..."
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={filters.portalType || "any"}
            onValueChange={value => handleSelectChange("portalType", value)}
          >
            <SelectTrigger className="w-[140px] border-0 focus:ring-0">
              <SelectValue placeholder="Portal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Portal Type</SelectItem>
              {portalTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace("_", " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.energyType || "any"}
            onValueChange={value => handleSelectChange("energyType", value)}
          >
            <SelectTrigger className="w-[140px] border-0 focus:ring-0">
              <SelectValue placeholder="Energy Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Energy Type</SelectItem>
              {energyTypes.map(type => (
                <SelectItem key={type} value={type}>
                  <EnergyBadge type={type as EEnergyType} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-2 hover:bg-muted rounded-full"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
