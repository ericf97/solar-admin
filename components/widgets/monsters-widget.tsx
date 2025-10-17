"use client";

import { useEffect, useState } from "react";
import { IMonster } from "@/types/monster";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { monsterService } from "@/services/monsters-service";
import { ChevronRight, Skull, Heart, Zap } from "lucide-react";

export function MonstersWidget() {
  const [monsters, setMonsters] = useState<IMonster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMonsters() {
      setIsLoading(true);
      try {
        const response = await monsterService.getMonsters();
        setMonsters(response.data.slice(0, 5));
      } catch (err) {
        console.error("Error loading monsters:", err);
        setError("Failed to load monsters");
      } finally {
        setIsLoading(false);
      }
    }
    loadMonsters();
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

  if (monsters.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3">
          <Skull className="h-8 w-8 text-primary" />
        </div>
        <p className="mb-4">No monsters found.</p>
        <Link href="/monsters/add">
          <Button
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Create your first monster
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {monsters.map(monster => (
        <Link href={`/monsters`} key={monster.id}>
          <Card className="overflow-hidden transition-all hover:shadow-md border border-white dark:border-border hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer mb-3">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <Skull className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-semibold truncate text-gray-900 dark:text-white">
                      {monster.name}
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                        <Progress
                          value={(monster.health / 5000) * 100}
                          max={100}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground">
                          {monster.health}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Skull className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            DMG {monster.damage}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Speed {monster.speed[0]}-{monster.speed[1]}
                          </span>
                        </div>
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
        <Link href="/monsters">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View all monsters
          </Button>
        </Link>
      </div>
    </div>
  );
}
