"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Sparkles,
  Bot,
  Database,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IIntent } from "@/types/intent";
import { IAgent } from "@/types/agent";
import { IDataset } from "@/types/dataset";
import { intentsService } from "@/services/intents-service";
import { agentsService } from "@/services/agents-service";
import { datasetsService } from "@/services/datasets-service";
import { SplitView } from "@/components/split-view";
import {
  IntentForm,
  IntentSubmitData,
  IntentFormActions,
} from "@/components/intent-form";
import {
  AgentForm,
  AgentSubmitData,
  AgentFormActions,
} from "@/components/agent-form";
import {
  DatasetForm,
  DatasetFormData,
  DatasetFormActions,
} from "@/components/dataset-form";
import { useDebouncedCallback } from "use-debounce";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useIntentsStore } from "@/store/intents-store";
import { useAgentsStore } from "@/store/agents-store";
import { useDatasetsStore } from "@/store/datasets-store";
import { useRouter, useSearchParams } from "next/navigation";

const UnityChatWindowLLM = dynamic(
  () =>
    import("@/components/unity-chat-window-llm").then(
      m => m.UnityChatWindowLLM
    ),
  { ssr: false }
);

const intentColumns: ColumnDef<IIntent>[] = [
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

const agentColumns: ColumnDef<IAgent>[] = [
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

const datasetColumns: ColumnDef<IDataset>[] = [
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

type TabConfig = {
  agents: {
    data: IAgent[];
    columns: ColumnDef<IAgent>[];
    handler: (row: IAgent) => void;
    placeholder: string;
    addLink: string;
    icon: typeof Bot;
  };
  datasets: {
    data: IDataset[];
    columns: ColumnDef<IDataset>[];
    handler: (row: IDataset) => void;
    placeholder: string;
    addLink: string;
    icon: typeof Database;
  };
  intents: {
    data: IIntent[];
    columns: ColumnDef<IIntent>[];
    handler: (row: IIntent) => void;
    placeholder: string;
    addLink: string;
    icon: typeof Sparkles;
  };
};

function AIPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as keyof TabConfig | null;
  const viewParam = searchParams.get("view");
  const idParam = searchParams.get("id");

  const [activeTab, setActiveTab] = useState<keyof TabConfig>(
    tabParam || "agents"
  );

  const intents = useIntentsStore(state => state.items);
  const agents = useAgentsStore(state => state.items);
  const datasets = useDatasetsStore(state => state.items);

  const intentsCount = useIntentsStore(state => state.totalCount);
  const agentsCount = useAgentsStore(state => state.totalCount);
  const datasetsCount = useDatasetsStore(state => state.totalCount);

  const isLoadingIntents = useIntentsStore(state => state.isLoading);
  const isLoadingAgents = useAgentsStore(state => state.isLoading);
  const isLoadingDatasets = useDatasetsStore(state => state.isLoading);

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [selectedIntent, setSelectedIntent] = useState<IIntent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<IAgent | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<IDataset | null>(null);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnityChatOpen, setIsUnityChatOpen] = useState(false);
  const [chatAgentId, setChatAgentId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
  }, 300);

  useEffect(() => {
    if (viewParam && idParam && tabParam === activeTab) {
      loadItemFromUrl(activeTab, idParam, viewParam === "edit");
    }
  }, [viewParam, idParam, activeTab, tabParam]);

  const loadItemFromUrl = async (
    tab: keyof TabConfig,
    id: string,
    editing: boolean
  ) => {
    try {
      if (tab === "intents") {
        const fullIntent = await intentsService.getIntent(id);
        setSelectedIntent(fullIntent);
        setSelectedAgent(null);
        setSelectedDataset(null);
      } else if (tab === "agents") {
        const fullAgent = await agentsService.getAgent(id);
        setSelectedAgent(fullAgent);
        setSelectedIntent(null);
        setSelectedDataset(null);
      } else if (tab === "datasets") {
        const fullDataset = await datasetsService.getDataset(id);
        setSelectedDataset(fullDataset);
        setSelectedIntent(null);
        setSelectedAgent(null);
      }
      setIsSplitViewOpen(true);
      setIsEditing(editing);
    } catch (error) {
      console.error("Error loading item from URL:", error);
      handleCloseSplitView();
    }
  };

  const updateUrl = (tab: keyof TabConfig, view?: string, id?: string) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (view && id) {
      params.set("view", view);
      params.set("id", id);
    }
    router.push(`/ai?${params.toString()}`, { scroll: false });
  };

  const loadData = useCallback(async () => {
    const filter = createFilterString(searchTerm, activeTab);

    if (activeTab === "intents") {
      useIntentsStore.getState().setLoading(true);
      try {
        await intentsService.getIntents(
          filter,
          "tag",
          pagination.pageIndex + 1,
          pagination.pageSize
        );
      } catch (error) {
        console.error("Error loading intents:", error);
        useIntentsStore.getState().setLoading(false);
      }
    } else if (activeTab === "agents") {
      useAgentsStore.getState().setLoading(true);
      try {
        await agentsService.getAgents(
          filter,
          "name",
          pagination.pageIndex + 1,
          pagination.pageSize
        );
      } catch (error) {
        console.error("Error loading agents:", error);
        useAgentsStore.getState().setLoading(false);
      }
    } else if (activeTab === "datasets") {
      useDatasetsStore.getState().setLoading(true);
      try {
        await datasetsService.getDatasets(
          filter,
          "name",
          pagination.pageIndex + 1,
          pagination.pageSize
        );
      } catch (error) {
        console.error("Error loading datasets:", error);
        useDatasetsStore.getState().setLoading(false);
      }
    }
  }, [searchTerm, pagination.pageIndex, pagination.pageSize, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handlePaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPagination(newPagination);
  };

  const handleIntentRowClick = async (intent: IIntent) => {
    try {
      const fullIntent = await intentsService.getIntent(intent.id);
      setSelectedIntent(fullIntent);
      setSelectedAgent(null);
      setSelectedDataset(null);
      setIsSplitViewOpen(true);
      setIsEditing(false);
      updateUrl("intents", "view", intent.id);
    } catch (error) {
      console.error("Error loading intent:", error);
    }
  };

  const agentColumnsWithChat: ColumnDef<IAgent>[] = [
    ...agentColumns,
    {
      id: "actions",
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div
            className="flex items-center gap-2"
            onClick={e => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setChatAgentId(agent.id);
                setIsUnityChatOpen(true);
              }}
            >
              <Bot className="h-4 w-4 mr-1" />
              Chat
            </Button>
          </div>
        );
      },
    },
  ];

  const handleAgentRowClick = async (agent: IAgent) => {
    try {
      const fullAgent = await agentsService.getAgent(agent.id);
      setSelectedAgent(fullAgent);
      setSelectedIntent(null);
      setSelectedDataset(null);
      setIsSplitViewOpen(true);
      setIsEditing(false);
      updateUrl("agents", "view", agent.id);
    } catch (error) {
      console.error("Error loading agent:", error);
    }
  };

  const handleDatasetRowClick = async (dataset: IDataset) => {
    try {
      const fullDataset = await datasetsService.getDataset(dataset.id);
      setSelectedDataset(fullDataset);
      setSelectedIntent(null);
      setSelectedAgent(null);
      setIsSplitViewOpen(true);
      setIsEditing(false);
      updateUrl("datasets", "view", dataset.id);
    } catch (error) {
      console.error("Error loading dataset:", error);
    }
  };

  const handleCloseSplitView = () => {
    setIsSplitViewOpen(false);
    setSelectedIntent(null);
    setSelectedAgent(null);
    setSelectedDataset(null);
    setIsEditing(false);
    updateUrl(activeTab);
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (selectedIntent) {
      updateUrl("intents", "edit", selectedIntent.id);
    } else if (selectedAgent) {
      updateUrl("agents", "edit", selectedAgent.id);
    } else if (selectedDataset) {
      updateUrl("datasets", "edit", selectedDataset.id);
    }
  };

  const handleCancelEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      if (selectedIntent) {
        updateUrl("intents", "view", selectedIntent.id);
      } else if (selectedAgent) {
        updateUrl("agents", "view", selectedAgent.id);
      } else if (selectedDataset) {
        updateUrl("datasets", "view", selectedDataset.id);
      }
    } else {
      handleCloseSplitView();
    }
  };

  const handleIntentSave = async () => {
    if (!selectedIntent) return;
    const formElement = document.querySelector("form");
    if (formElement) {
      formElement.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  const handleAgentSave = async () => {
    if (!selectedAgent) return;
    const formElement = document.querySelector("form");
    if (formElement) {
      formElement.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  const handleDatasetSave = async () => {
    if (!selectedDataset) return;
    const formElement = document.querySelector("form");
    if (formElement) {
      formElement.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  const handleIntentUpdate = async (data: IntentSubmitData) => {
    if (!selectedIntent) return;
    setIsSubmitting(true);
    try {
      await intentsService.updateIntent(selectedIntent.id, data);
      handleCloseSplitView();
    } catch (error) {
      console.error("Error updating intent:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAgentUpdate = async (data: AgentSubmitData) => {
    if (!selectedAgent) return;
    setIsSubmitting(true);
    try {
      await agentsService.updateAgent(selectedAgent.id, data);
      handleCloseSplitView();
    } catch (error) {
      console.error("Error updating agent:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDatasetUpdate = async (data: DatasetFormData) => {
    if (!selectedDataset) return;
    setIsSubmitting(true);
    try {
      await datasetsService.updateDataset(selectedDataset.id, data);
      handleCloseSplitView();
    } catch (error) {
      console.error("Error updating dataset:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSplitViewTitle = () => {
    if (selectedIntent) return `Intent: ${selectedIntent.tag}`;
    if (selectedAgent) return `Agent: ${selectedAgent.name}`;
    if (selectedDataset) return `Dataset: ${selectedDataset.name}`;
    return "Details";
  };

  const getSplitViewActions = () => {
    if (selectedIntent) {
      return (
        <IntentFormActions
          isViewMode={true}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onEdit={handleEdit}
          onCancel={handleCancelEdit}
          onSave={handleIntentSave}
          hasInitialData={!!selectedIntent}
        />
      );
    }
    if (selectedAgent) {
      return (
        <AgentFormActions
          isViewMode={true}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onEdit={handleEdit}
          onCancel={handleCancelEdit}
          onSave={handleAgentSave}
          hasInitialData={!!selectedAgent}
        />
      );
    }
    if (selectedDataset) {
      return (
        <DatasetFormActions
          isViewMode={true}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onEdit={handleEdit}
          onCancel={handleCancelEdit}
          onSave={handleDatasetSave}
          hasInitialData={!!selectedDataset}
        />
      );
    }
    return null;
  };

  const getSplitViewContent = () => {
    if (selectedIntent) {
      return (
        <IntentForm
          initialData={selectedIntent}
          onSubmit={handleIntentUpdate}
          mode={isEditing ? "edit" : "view"}
        />
      );
    }
    if (selectedAgent) {
      return (
        <AgentForm
          initialData={selectedAgent}
          onSubmit={handleAgentUpdate}
          mode={isEditing ? "edit" : "view"}
        />
      );
    }
    if (selectedDataset) {
      return (
        <DatasetForm
          initialData={selectedDataset}
          onSubmit={handleDatasetUpdate}
          mode={isEditing ? "edit" : "view"}
        />
      );
    }
    return null;
  };

  const tabConfig: TabConfig = {
    agents: {
      data: agents,
      columns: agentColumnsWithChat,
      handler: handleAgentRowClick,
      placeholder: "Search by name or greetings...",
      addLink: "/ai/agents/add",
      icon: Bot,
    },
    datasets: {
      data: datasets,
      columns: datasetColumns,
      handler: handleDatasetRowClick,
      placeholder: "Search by name...",
      addLink: "/ai/datasets/add",
      icon: Database,
    },
    intents: {
      data: intents,
      columns: intentColumns,
      handler: handleIntentRowClick,
      placeholder: "Search by tag, patterns or responses...",
      addLink: "/ai/intents/add",
      icon: Sparkles,
    },
  };

  const currentTabConfig = tabConfig[activeTab];

  const isLoading =
    activeTab === "intents"
      ? isLoadingIntents
      : activeTab === "agents"
      ? isLoadingAgents
      : isLoadingDatasets;

  const totalCount =
    activeTab === "intents"
      ? intentsCount
      : activeTab === "agents"
      ? agentsCount
      : datasetsCount;

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );

  const renderTabContent = <T,>(config: {
    data: T[];
    columns: ColumnDef<T>[];
    handler: (row: T) => void;
  }) => (
    <div className="h-full overflow-hidden">
      {isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <DataTable<T, unknown>
          columns={config.columns}
          data={config.data}
          onRowClick={config.handler}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          pageCount={Math.ceil(totalCount / pagination.pageSize)}
        />
      )}
    </div>
  );

  const handleAgentChange = (newAgentId: string) => {
    setChatAgentId(newAgentId);
  };

  const handleTabChange = (value: string) => {
    const newTab = value as keyof TabConfig;
    setActiveTab(newTab);
    setIsSplitViewOpen(false);
    setSelectedIntent(null);
    setSelectedAgent(null);
    setSelectedDataset(null);
    setIsEditing(false);
    updateUrl(newTab);
  };

  return (
    <Layout>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex flex-1 gap-0 overflow-hidden">
          <div
            className={cn(
              "flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out",
              isSplitViewOpen
                ? "hidden lg:flex lg:w-[40%] xl:w-[45%] lg:min-w-[400px]"
                : "w-full"
            )}
          >
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 flex-shrink-0 flex-wrap sm:flex-nowrap">
                <TabsList className="grid w-full sm:w-auto sm:min-w-[280px] lg:min-w-[320px] grid-cols-3 flex-shrink-0 order-1">
                  {(Object.keys(tabConfig) as Array<keyof TabConfig>).map(
                    key => {
                      const Icon = tabConfig[key].icon;
                      return (
                        <TabsTrigger
                          key={key}
                          value={key}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                        </TabsTrigger>
                      );
                    }
                  )}
                </TabsList>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-initial order-3 sm:order-2 min-w-0">
                  <div
                    className={cn(
                      "flex items-center bg-background border rounded-lg px-2 transition-all duration-300 flex-1 min-w-0",
                      isSplitViewOpen
                        ? "sm:min-w-[150px] sm:max-w-[300px]"
                        : "sm:min-w-[200px] sm:max-w-[300px]"
                    )}
                  >
                    <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
                    <Input
                      className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full min-w-0"
                      onChange={handleSearchChange}
                      placeholder={currentTabConfig.placeholder}
                      value={searchTerm}
                    />
                  </div>
                  <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                    <Link href={currentTabConfig.addLink} passHref>
                      <Button variant="outline" size="icon">
                        <Plus className="h-6 w-6" />
                      </Button>
                    </Link>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      className="lg:hidden flex-shrink-0"
                    >
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={currentTabConfig.addLink}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add New</span>
                        </Link>
                      </DropdownMenuItem>
                      {activeTab === "intents" && (
                        <DropdownMenuItem asChild>
                          <Link
                            href="/ai/creator/intents"
                            className="flex items-center gap-2"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Intent Creator</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <TabsContent
                value="agents"
                className="mt-0 flex-1 overflow-hidden"
              >
                <div className="h-full overflow-auto">
                  {renderTabContent(tabConfig.agents)}
                </div>
              </TabsContent>

              <TabsContent
                value="datasets"
                className="mt-0 flex-1 overflow-hidden"
              >
                <div className="h-full overflow-auto">
                  {renderTabContent(tabConfig.datasets)}
                </div>
              </TabsContent>

              <TabsContent
                value="intents"
                className="mt-0 flex-1 overflow-hidden"
              >
                <div className="h-full overflow-auto">
                  {renderTabContent(tabConfig.intents)}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <SplitView
            isOpen={isSplitViewOpen}
            onClose={handleCloseSplitView}
            title={getSplitViewTitle()}
            actions={getSplitViewActions()}
          >
            {getSplitViewContent()}
          </SplitView>
        </div>
        {isUnityChatOpen && chatAgentId && (
          <UnityChatWindowLLM
            isOpen={isUnityChatOpen}
            onClose={() => {
              setIsUnityChatOpen(false);
              setChatAgentId(null);
            }}
            agentId={chatAgentId}
            availableAgents={agents}
            onAgentChange={handleAgentChange}
          />
        )}
      </div>
    </Layout>
  );
}

export default function AIPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="h-full flex items-center justify-center">
            <div className="space-y-3 w-full max-w-4xl px-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </Layout>
      }
    >
      <AIPageContent />
    </Suspense>
  );
}

function createFilterString(searchTerm: string, activeTab: string): string {
  if (!searchTerm) return "";

  switch (activeTab) {
    case "agents":
      const agentSearchTerms = [
        `contains(name, '${searchTerm}')`,
        `greetings/any(g: contains(g, '${searchTerm}'))`,
      ];
      return `(${agentSearchTerms.join(" or ")})`;

    case "datasets":
      return `contains(name, '${searchTerm}')`;

    case "intents":
      const intentSearchTerms = [
        `contains(tag, '${searchTerm}')`,
        `patterns/any(p: contains(p, '${searchTerm}'))`,
        `responses/any(r: contains(r/text, '${searchTerm}'))`,
      ];
      return `(${intentSearchTerms.join(" or ")})`;

    default:
      return "";
  }
}
