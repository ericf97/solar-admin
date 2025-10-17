"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { IIntent } from "@/types/intent";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { IntentModal } from "@/components/intent-modal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search, Sparkles } from "lucide-react";
import { intentsService } from "@/services/intents-service";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";

const columns: ColumnDef<IIntent>[] = [
  {
    accessorKey: "tag",
    header: "Tag",
    cell: ({ row }) => {
      const tag = row.getValue("tag") as string;
      return <Badge variant="secondary">{tag}</Badge>;
    },
  },
  {
    accessorKey: "patterns",
    header: "Patterns",
    cell: ({ row }) => {
      const patterns = row.getValue("patterns") as string[];
      return (
        <div className="max-w-md">
          <p className="text-sm truncate">
            {patterns.slice(0, 2).join(", ")}
            {patterns.length > 2 && ` +${patterns.length - 2} more`}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "responses",
    header: "Responses",
    cell: ({ row }) => {
      const responses = row.original.responses;
      return (
        <div className="max-w-md">
          <p className="text-sm truncate">
            {responses[0]?.text}
            {responses.length > 1 && ` +${responses.length - 1} more`}
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

export default function IntentsPage() {
  const [intents, setIntents] = useState<IIntent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntent, setSelectedIntent] = useState<IIntent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const loadIntents = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = createFilterString(searchTerm);
      const response = await intentsService.getIntents(
        filter,
        "tag",
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      if (response.data) {
        setIntents(response.data);
        setTotalCount(response.count);
      }
    } catch (error) {
      console.error("Error loading intents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    loadIntents();
  }, [loadIntents]);

  const handleRowClick = (intent: IIntent) => {
    console.log("Clicked intent:", intent);
    setSelectedIntent(intent);
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
            <h1 className="text-3xl font-bold text-foreground">Intents</h1>
            <div className="flex items-center space-x-4 lg:hidden">
              <Link href="/ai/creator/intents" passHref>
                <Button variant="outline" size="icon">
                  <Sparkles className="h-6 w-6" />
                </Button>
              </Link>
              <Link href="/ai/intents/add" passHref>
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
                placeholder="Search by tag, patterns or responses..."
              />
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/ai/creator/intents" passHref>
                <Button variant="outline" size="icon">
                  <Sparkles className="h-6 w-6" />
                </Button>
              </Link>
              <Link href="/ai/intents/add" passHref>
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
              data={intents}
              onRowClick={handleRowClick}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              pageCount={Math.ceil(totalCount / pagination.pageSize)}
            />
          )}
        </div>

        <IntentModal
          intentId={selectedIntent?.id ?? null}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
}

function createFilterString(searchTerm: string): string {
  if (!searchTerm) return "";

  const searchTerms = [
    `contains(tag, '${searchTerm}')`,
    `patterns/any(p: contains(p, '${searchTerm}'))`,
    `responses/any(r: contains(r/text, '${searchTerm}'))`,
  ];

  return `(${searchTerms.join(" or ")})`;
}

