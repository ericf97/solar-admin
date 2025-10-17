"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EPortalType, IPortal } from "@/types/portal";
import { DataTable } from "@/components/data-table";
import { Layout } from "@/components/layout";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/badge";
import { EnergyBadge } from "@/components/energy-badge";
import { EEnergyType } from "@/types/energy";
import { portalService } from "@/services/portals-service";
import { useRouter } from "next/navigation";
import { useAlert } from "@/app/context/alert.context";

interface IPortalCSV {
  zohoRecordId: string;
  name: string;
  energyType: EEnergyType;
  portalType: EPortalType;
  address: string;
  website: string;
  shippingCode: string;
  latitude: number;
  longitude: number;
}

const columns: ColumnDef<IPortal>[] = [
  {
    accessorKey: "zohoRecordId",
    header: "Zoho Record Id",
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
    header: "Location",
    cell: ({ row }) => {
      return row.original?.location.coordinates?.join(", ");
    },
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "website",
    header: "website",
  },
  {
    accessorKey: "shippingCode",
    header: "Shipping Code",
  },
];

export default function BulkAddPortals() {
  const [allPortals, setAllPortals] = useState<IPortal[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  const showAlert = useAlert();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse<IPortalCSV>(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const cleanedData: Partial<IPortal>[] = results.data.map(p => ({
          zohoRecordId: p.zohoRecordId,
          name: p.name,
          energyType: p.energyType,
          portalType: p.portalType,
          address: p.address,
          website: p.website,
          shippingCode: p.shippingCode,
          location: {
            type: "Point",
            coordinates: [p.latitude, p.longitude],
          },
        }));
        showAlert("Success", "Portals loaded successfuly from csv.");
        setAllPortals(cleanedData as IPortal[]);
        setTotalCount(results.data.length);
        setPagination({ pageIndex: 0, pageSize: 20 });
      },
      error: err => {
        console.error("CSV parse error:", err);
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const response = (await portalService.bulkUploadPortals(
        allPortals as IPortal[]
      )) as { message: string };
      showAlert(
        "success",
        `portals added successfully, ${response["message"]}`
      );
      setAllPortals([]);
      setFileName(null);
      router.push("/portals");
    } catch (err) {
      console.error(err);
      showAlert("error", "Error adding portals");
    }
  };

  const handleRowClick = (row: IPortal) => {
    console.log("Row clicked:", row);
  };

  const handlePaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPagination(newPagination);
  };

  const currentPageData = allPortals.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize
  );

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bulk Add Portals</h1>
          <Link href="/portals">
            <Button variant="outline">Back to Portals</Button>
          </Link>
        </div>

        <input type="file" accept=".csv" onChange={handleFileUpload} />
        {fileName && <p>Selected file: {fileName}</p>}

        {allPortals.length > 0 && (
          <>
            <DataTable
              columns={columns}
              data={currentPageData}
              onRowClick={handleRowClick}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              pageCount={Math.ceil(totalCount / pagination.pageSize)}
            />
            <Button className="mt-4" onClick={handleSubmit}>
              Add Portals
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
}
