"use client";

import { useEffect, useState } from "react";
import { ISkill } from "@/types/skill";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EnergyBadge } from "@/components/energy-badge";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { skillService } from "@/services/skillService";

export function SkillsWidget() {
  const [skills, setSkills] = useState<ISkill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSkills() {
      setIsLoading(true);
      try {
        const response = await skillService.getSkills();
        setSkills(response.data.slice(0, 5));
      } catch (err) {
        console.error("Error loading skills:", err);
        setError("Failed to load skills");
      } finally {
        setIsLoading(false);
      }
    }
    loadSkills();
  }, []);

  if (isLoading) {
    return <p>Loading skills...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="space-y-4">
      {skills.map(skill => (
        <Card key={skill.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                {skill.name}
              </h3>
              <EnergyBadge type={skill.energy} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                {skill.type}
              </div>
              <div>
                <span className="text-muted-foreground">Damage:</span>{" "}
                {skill.damage}
              </div>
              <div>
                <span className="text-muted-foreground">Cooldown:</span>{" "}
                {skill.cooldown}s
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-center mt-4">
        <Link href="/skills">
          <Button variant="outline" size="sm">
            View all skills
          </Button>
        </Link>
      </div>
    </div>
  );
}

