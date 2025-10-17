"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { User } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { UserModal } from "@/components/user-modal";
import { usersService } from "@/services/users-service";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import { Search, CheckCircle, XCircle } from "lucide-react";

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      return <span className="font-medium">{email}</span>;
    },
  },
  {
    accessorKey: "providers",
    header: "Provider",
    cell: ({ row }) => {
      const providers = row.getValue("providers") as User["providers"];
      return (
        <Badge variant="secondary" className="text-xs normal-case">
          {providers.firebase.uid}
        </Badge>
      );
    },
  },
  {
    accessorKey: "hasAcceptedTerms",
    header: "Terms Accepted",
    cell: ({ row }) => {
      const hasAccepted = row.getValue("hasAcceptedTerms") as boolean;
      return (
        <div className="flex items-center gap-2">
          {hasAccepted ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="default" className="text-xs">
                Yes
              </Badge>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <Badge variant="destructive" className="text-xs">
                No
              </Badge>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "acceptedTermsAt",
    header: "Accepted At",
    cell: ({ row }) => {
      const date = row.getValue("acceptedTermsAt") as Date | undefined;
      return date ? (
        <span className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">N/A</span>
      );
    },
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = createFilterString(searchTerm);
      const response = await usersService.getUsers(
        filter,
        "email",
        pagination.pageIndex + 1,
        pagination.pageSize
      );
      if (response.data) {
        setUsers(response.data);
        setTotalCount(response.count);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
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
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
          </div>
          <div className="flex items-center space-x-4 w-full lg:w-auto">
            <div className="flex items-center w-full lg:w-[400px] bg-background border rounded-lg px-2">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
              <Input
                className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full"
                onChange={handleSearchChange}
                placeholder="Search by email or uid..."
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 mt-4">
          {isLoading ? (
            <p className="text-foreground">Loading...</p>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              onRowClick={handleRowClick}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              pageCount={Math.ceil(totalCount / pagination.pageSize)}
            />
          )}
        </div>

        <UserModal
          userId={selectedUser?.id ?? null}
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
    `contains(email, '${searchTerm}')`,
    `contains(providers/firebase/uid, '${searchTerm}')`,
  ];

  return `(${searchTerms.join(" or ")})`;
}

