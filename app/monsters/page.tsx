"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { monsterService } from "@/services/monsterService";
import { IMonster } from "@/types/monster";
import { Layout } from "@/components/layout";
import { EditMonsterModal } from "@/components/edit-monster-modal";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const columns: ColumnDef<IMonster>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "health",
    header: "Health",
    cell: ({ row }) => {
      const health = row.getValue("health") as number;
      return (
        <div className="w-full">
          <Progress
            value={(health / 5000) * 100}
            max={100}
            className="w-full h-2"
          />
          <span className="text-sm text-gray-500">{health}/500</span>
        </div>
      );
    },
  },
  {
    accessorKey: "damage",
    header: "Damage",
  },
  {
    accessorKey: "speed",
    header: "Speed",
    cell: ({ row }) => {
      const speed = row.getValue("speed") as [number, number];
      return (
        <Badge variant="outline" className="whitespace-nowrap">
          {speed[0]} - {speed[1]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "cooldown",
    header: "Cooldown",
    cell: ({ row }) => {
      const cooldown = row.getValue("cooldown") as number;
      return `${cooldown}s`;
    },
  },
];

export default function MonstersPage() {
  const [monsters, setMonsters] = useState<IMonster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadMonsters() {
      setIsLoading(true);
      try {
        const response = await monsterService.getMonsters();
        if (response.data) {
          setMonsters(response.data);
        }
      } catch (error) {
        console.error("Error loading monsters:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMonsters();
  }, []);

  const handleEditMonster = (monsterId: string) => {
    setSelectedMonsterId(monsterId);
    setIsModalOpen(true);
  };

  const handleSaveMonster = async (updatedMonster: Partial<IMonster>) => {
    try {
      await monsterService.updateMonster(updatedMonster.id!, updatedMonster);
      setMonsters(
        monsters.map(monster =>
          monster.id === updatedMonster.id
            ? { ...monster, ...updatedMonster }
            : monster
        )
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating monster:", error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-4 sm:py-6 md:py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-5">
          Monsters
        </h1>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={monsters}
              onRowClick={monster => handleEditMonster(monster.id)}
            />
          </div>
        )}
        <EditMonsterModal
          monsterId={selectedMonsterId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMonsterId(null);
          }}
          onSave={handleSaveMonster}
        />
      </div>
    </Layout>
  );
}

