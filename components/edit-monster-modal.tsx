"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IMonster } from "@/types/monster";
import { monsterService } from "@/services/monsters-service";
import { SliderInput } from "@/components/slider-input";
import { Form } from "@/components/ui/form";

interface EditMonsterModalProps {
  monsterId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMonster: Partial<IMonster>) => Promise<void>;
}

interface MonsterFormData {
  name: string;
  health: number;
  damage: number;
  speedMin: number;
  speedMax: number;
  cooldown: number;
}

export function EditMonsterModal({
  monsterId,
  isOpen,
  onClose,
  onSave,
}: EditMonsterModalProps) {
  const [monster, setMonster] = useState<IMonster | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MonsterFormData>({
    defaultValues: {
      name: "",
      health: 0,
      damage: 0,
      speedMin: 0,
      speedMax: 0,
      cooldown: 0,
    },
  });

  useEffect(() => {
    if (isOpen && monsterId) {
      setIsLoading(true);
      setError(null);
      monsterService
        .getMonster(monsterId)
        .then(fetchedMonster => {
          setMonster(fetchedMonster);
          form.reset({
            name: fetchedMonster.name,
            health: fetchedMonster.health,
            damage: fetchedMonster.damage,
            speedMin: fetchedMonster.speed[0],
            speedMax: fetchedMonster.speed[1],
            cooldown: fetchedMonster.cooldown,
          });
        })
        .catch(err => {
          console.error("Error fetching monster:", err);
          setError("Failed to load monster data");
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, monsterId, form]);

  const handleSubmit = async (data: MonsterFormData) => {
    if (!monster) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: monster.id,
        name: data.name,
        health: data.health,
        damage: data.damage,
        speed: [data.speedMin, data.speedMax],
        cooldown: data.cooldown,
      });
      onClose();
    } catch (error) {
      console.error("Error updating monster:", error);
      setError("Failed to update monster");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!monster) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Monster</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  className="col-span-3"
                />
              </div>
              <SliderInput
                label="Health"
                name="health"
                control={form.control}
                min={0}
                max={5000}
                step={1}
                isInteger
              />
              <SliderInput
                label="Damage"
                name="damage"
                control={form.control}
                min={0}
                max={1000}
                step={1}
                isInteger
              />
              <SliderInput
                label="Min Speed"
                name="speedMin"
                control={form.control}
                min={0}
                max={100}
                step={0.1}
              />
              <SliderInput
                label="Max Speed"
                name="speedMax"
                control={form.control}
                min={0}
                max={100}
                step={0.1}
              />
              <SliderInput
                label="Cooldown"
                name="cooldown"
                control={form.control}
                min={0}
                max={60}
                step={0.1}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
