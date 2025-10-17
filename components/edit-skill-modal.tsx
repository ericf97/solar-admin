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
import { ISkill } from "@/types/skill";
import { EnergyBadge } from "@/components/energy-badge";
import { Badge } from "@/components/ui/badge";
import { skillService } from "@/services/skill-service";
import { SliderInput } from "@/components/slider-input";
import { Form } from "@/components/ui/form";

interface EditSkillModalProps {
  skillId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSkill: Partial<ISkill>) => Promise<void>;
}

interface SkillFormData {
  name: string;
  damage: number;
  cooldown: number;
  castSpeed: number;
}

export function EditSkillModal({
  skillId,
  isOpen,
  onClose,
  onSave,
}: EditSkillModalProps) {
  const [skill, setSkill] = useState<ISkill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SkillFormData>({
    defaultValues: {
      name: "",
      damage: 0,
      cooldown: 0,
      castSpeed: 0,
    },
  });

  useEffect(() => {
    if (isOpen && skillId) {
      setIsLoading(true);
      setError(null);
      skillService
        .getSkill(skillId)
        .then(fetchedSkill => {
          setSkill(fetchedSkill);
          form.reset({
            name: fetchedSkill.name,
            damage: fetchedSkill.damage,
            cooldown: fetchedSkill.cooldown,
            castSpeed: fetchedSkill.castSpeed,
          });
        })
        .catch(err => {
          console.error("Error fetching skill:", err);
          setError("Failed to load skill data");
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, skillId, form]);

  const handleSubmit = async (data: SkillFormData) => {
    if (!skill) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: skill.id,
        ...data,
      });
      onClose();
    } catch (error) {
      console.error("Error updating skill:", error);
      setError("Failed to update skill");
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

  if (!skill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Skill</DialogTitle>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Energy</Label>
                <div className="col-span-3">
                  <EnergyBadge type={skill.energy} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <div className="col-span-3">
                  <Badge variant="outline">
                    {skill.type.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
              <SliderInput
                label="Damage"
                name="damage"
                control={form.control}
                min={0}
                max={500}
                step={1}
                isInteger
              />
              <SliderInput
                label="Cooldown"
                name="cooldown"
                control={form.control}
                min={0}
                max={60}
                step={0.1}
              />
              <SliderInput
                label="Cast Speed"
                name="castSpeed"
                control={form.control}
                min={0}
                max={10}
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
