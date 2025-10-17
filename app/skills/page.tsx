"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { skillService } from "@/services/skill-service";
import { ISkill } from "@/types/skill";
import { Layout } from "@/components/layout";
import { EditSkillModal } from "@/components/edit-skill-modal";
import { EnergyBadge } from "@/components/energy-badge";
import { Badge } from "@/components/ui/badge";
import { EEnergyType } from "@/types/energy";

const columns: ColumnDef<ISkill>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <div className="min-w-[120px] sm:min-w-[150px] md:min-w-[180px]">
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "energy",
    header: "Energy",
    cell: ({ row }) => {
      const energy = row.getValue("energy") as EEnergyType;
      return (
        <div className="flex justify-center">
          <EnergyBadge type={energy} />
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant="outline" className="whitespace-nowrap">
          {type.replace("_", " ").toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "damage",
    header: "Damage",
  },
  {
    accessorKey: "cooldown",
    header: "Cooldown",
    cell: ({ row }) => {
      const cooldown = row.getValue("cooldown") as number;
      return `${cooldown}s`;
    },
  },
  {
    accessorKey: "castSpeed",
    header: "Cast Speed",
    cell: ({ row }) => {
      const castSpeed = row.getValue("castSpeed") as number;
      return `${castSpeed}s`;
    },
  },
];

export default function SkillsPage() {
  const [skills, setSkills] = useState<ISkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSkills() {
      setIsLoading(true);
      try {
        const response = await skillService.getSkills();
        if (response.data) {
          const sortedSkills = [...response.data].sort((a, b) => {
            const energyOrder: Record<EEnergyType, number> = {
              [EEnergyType.WATER]: 0,
              [EEnergyType.VITA]: 1,
              [EEnergyType.FIRE]: 2,
              [EEnergyType.BIO]: 3,
              [EEnergyType.AIR]: 4,
              [EEnergyType.HEART]: 5,
              [EEnergyType.MIND]: 6,
              [EEnergyType.SAND]: 7,
            };
            return (
              energyOrder[a.energy as EEnergyType] -
              energyOrder[b.energy as EEnergyType]
            );
          });
          setSkills(sortedSkills);
        }
      } catch (error) {
        console.error("Error loading skills:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSkills();
  }, []);

  const handleEditSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    setIsModalOpen(true);
  };

  const handleSaveSkill = async (updatedSkill: Partial<ISkill>) => {
    try {
      await skillService.updateSkill(updatedSkill.id!, updatedSkill);
      setSkills(
        skills.map(skill =>
          skill.id === updatedSkill.id ? { ...skill, ...updatedSkill } : skill
        )
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating skill:", error);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-5">Skills</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={skills}
            onRowClick={skill => handleEditSkill(skill.id)}
          />
        </div>
      )}
      <EditSkillModal
        skillId={selectedSkillId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSkillId(null);
        }}
        onSave={handleSaveSkill}
      />
    </Layout>
  );
}
