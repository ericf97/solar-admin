"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange?: (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  pageCount?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  pagination,
  onPaginationChange,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const isPaginated = Boolean(pagination);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      ...(isPaginated && { pagination }),
    },
    ...(isPaginated && {
      pageCount: pageCount,
      onPaginationChange: updaterOrValue => {
        if (typeof updaterOrValue === "function") {
          if (onPaginationChange && pagination) {
            onPaginationChange(
              updaterOrValue({
                pageIndex: pagination.pageIndex,
                pageSize: pagination.pageSize,
              })
            );
          }
        } else {
          if (onPaginationChange) {
            onPaginationChange(updaterOrValue);
          }
        }
      },
      manualPagination: true,
    }),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(isPaginated && { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none">
                      {header.isPlaceholder
                        ? null
                        : (
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" && (
                              <ArrowUp className="w-4 h-4 inline" />
                            )}
                            {header.column.getIsSorted() === "desc" && (
                              <ArrowDown className="w-4 h-4 inline" />
                            )}
                          </div>
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {isPaginated && (
        <div className="flex-none mt-4">
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
  );
}

