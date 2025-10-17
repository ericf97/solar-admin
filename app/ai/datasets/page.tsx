"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { IDataset } from "@/types/dataset";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { DatasetModal } from "@/components/dataset-modal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { datasetsService } from "@/services/datasets-service";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";

const columns: ColumnDef<IDataset>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <Badge variant="secondary">{name}</Badge>;
    },
  },
  {
    accessorKey: "intents",
    header: "Intents",
    cell: ({ row }) => {
      const intents = row.original.intents || [];
      return (
        <div className="max-w-md">
          <p className="text-sm">
            {intents.length} intent{intents.length !== 1 ? "s" : ""}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string | undefined;
      return date ? new Date(date).toLocaleDateString() : "N/A";
    },
  },
];

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<IDataset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<IDataset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const loadDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = createFilterString(searchTerm);
      const response = await datasetsService.getDatasets(
        filter,
        "name",
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      if (response.data) {
        setDatasets(response.data);
        setTotalCount(response.count);
      }
    } catch (error) {
      console.error("Error loading datasets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const handleRowClick = (dataset: IDataset) => {
    console.log("Clicked dataset:", dataset);
    setSelectedDataset(dataset);
    setIsModalOpen(true);
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
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
            <h1 className="text-3xl font-bold text-foreground">Datasets</h1>
            <div className="flex items-center space-x-4 lg:hidden">
              <Link href="/ai/datasets/add" passHref>
                <Button variant="outline" size="icon">
                  <Plus className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <div className="flex items-center w-full lg:w-[400px] bg-background border rounded-lg px-2">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
              <Input
                className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full"
                onChange={handleSearchChange}
                placeholder="Search by name..."
              />
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/ai/datasets/add" passHref>
                <Button variant="outline" size="icon">
                  <Plus className="h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden mt-4">
          {isLoading ? (
            <p className="text-foreground">Loading...</p>
          ) : (
            <DataTable
              columns={columns}
              data={datasets}
              onRowClick={handleRowClick}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              pageCount={Math.ceil(totalCount / pagination.pageSize)}
            />
          )}
        </div>

        <DatasetModal
          datasetId={selectedDataset?.id ?? null}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
}

function createFilterString(searchTerm: string): string {
  if (!searchTerm) return "";
  return `contains(name, '${searchTerm}')`;
}

