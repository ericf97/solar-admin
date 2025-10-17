"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { IAgent } from "@/types/agent";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { AgentModal } from "@/components/agent-modal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { agentsService } from "@/services/agents-service";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";

const columns: ColumnDef<IAgent>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <Badge variant="secondary">{name}</Badge>;
    },
  },
  {
    accessorKey: "datasets",
    header: "Datasets",
    cell: ({ row }) => {
      const datasets = row.getValue("datasets") as string[];
      return (
        <div className="max-w-md">
          <p className="text-sm">
            {datasets.length} dataset{datasets.length !== 1 ? "s" : ""}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "greetings",
    header: "Greetings",
    cell: ({ row }) => {
      const greetings = row.getValue("greetings") as string[];
      return (
        <div className="max-w-md">
          <p className="text-sm truncate">
            {greetings.slice(0, 2).join(", ")}
            {greetings.length > 2 && ` +${greetings.length - 2} more`}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "objectives",
    header: "Objectives",
    cell: ({ row }) => {
      const objectives = row.original.objectives;
      return (
        <div className="max-w-md">
          <p className="text-sm">
            {objectives.length} objective{objectives.length !== 1 ? "s" : ""}
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<IAgent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<IAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = createFilterString(searchTerm);
      const response = await agentsService.getAgents(
        filter,
        "name",
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      if (response.data) {
        setAgents(response.data);
        setTotalCount(response.count);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleRowClick = (agent: IAgent) => {
    setSelectedAgent(agent);
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
            <h1 className="text-3xl font-bold text-foreground">Agents</h1>
            <div className="flex items-center space-x-4 lg:hidden">
              <Link href="/ai/agents/add" passHref>
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
                placeholder="Search by name or greetings..."
              />
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/ai/agents/add" passHref>
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
              data={agents}
              onRowClick={handleRowClick}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              pageCount={Math.ceil(totalCount / pagination.pageSize)}
            />
          )}
        </div>

        <AgentModal
          agentId={selectedAgent?.id ?? null}
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
    `contains(name, '${searchTerm}')`,
    `greetings/any(g: contains(g, '${searchTerm}'))`,
  ];

  return `(${searchTerms.join(" or ")})`;
}

