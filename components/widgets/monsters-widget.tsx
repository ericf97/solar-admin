"use client";

import { useEffect, useState } from "react";
import { IMonster } from "@/types/monster";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { monsterService } from "@/services/monsterService";

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
    return <p>Loading monsters...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="space-y-4">
      {monsters.map(monster => (
        <Card key={monster.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{monster.name}</h3>
              <span className="text-sm text-muted-foreground">
                DMG: {monster.damage}
              </span>
            </div>
            <Progress
              value={(monster.health / 5000) * 100}
              max={100}
              className="h-2 mb-2"
            />
            <div className="flex justify-between text-sm">
              <span>HP: {monster.health}/5000</span>
              <span>
                Speed: {monster.speed[0]}-{monster.speed[1]}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-center mt-4">
        <Link href="/monsters">
          <Button variant="outline" size="sm">
            View all monsters
          </Button>
        </Link>
      </div>
    </div>
  );
}

