"use client";

import { useEffect, useState } from "react";
import { ISkill } from "@/types/skill";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EnergyBadge } from "@/components/energy-badge";
import { Zap, ChevronRight, Swords, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { skillService } from "@/services/skill-service";

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
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <p className="mb-4">No skills found.</p>
        <Link href="/skills/add">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-600 hover:bg-amber-50"
          >
            Create your first skill
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skills.map(skill => (
        <Link href={`/skills`} key={skill.id}>
          <Card className="overflow-hidden transition-all hover:shadow-md border border-white dark:border-border hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer mb-3">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold truncate text-gray-900 dark:text-white">
                        {skill.name}
                      </h3>
                      <EnergyBadge type={skill.energy} />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {skill.type} • DMG {skill.damage}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {skill.cooldown}s cooldown
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      <div className="flex justify-center pt-2">
        <Link href="/skills">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View all skills
          </Button>
        </Link>
      </div>
    </div>
  );
}
