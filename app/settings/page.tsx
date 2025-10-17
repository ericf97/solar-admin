"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout";
import { ISettings } from "@/types/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { settingsService } from "@/services/settings-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SliderInput } from "@/components/slider-input";

const settingsSchema = z.object({
  portals: z.object({
    checkIn: z.object({
      rewards: z.object({
        energy: z.number().int(),
        sap: z.number().int(),
        exp: z.number().int(),
      }),
      checkInInterval: z.number().int(),
    }),
  }),
  rifts: z.object({
    amountPerTile: z.number().int(),
    expirationTime: z.number(),
  }),
  skills: z.object({
    base: z.object({
      energy: z.number().int(),
      sap: z.number().int(),
    }),
    costs: z.object({
      basic: z.number(),
      longPress: z.number(),
      ultimate: z.number(),
    }),
    growthRate: z.object({
      energy: z.number(),
      sap: z.number(),
    }),
  }),
  validations: z.object({
    maxAllowedMovementSpeed: z.number(),
  }),
});

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ISettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {} as ISettings,
  });

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const settings = await settingsService.getSettings();
        form.reset(settings);
      } catch (error) {
        console.error("Failed to load settings:", error);
        setError("Failed to load settings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [form]);

  const onSubmit = async (data: ISettings) => {
    setIsLoading(true);
    setError(null);
    try {
      await settingsService.updateSettings(data);
    } catch (error) {
      console.error("Failed to update settings:", error);
      setError("Failed to update settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-10">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-5">Settings</h1>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Portals</CardTitle>
                  <CardDescription>Configure portal settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SliderInput
                    label="Check-in Energy Reward"
                    name="portals.checkIn.rewards.energy"
                    control={form.control}
                    min={0}
                    max={1000}
                    step={1}
                    isInteger={true}
                  />
                  <SliderInput
                    label="Check-in Sap Reward"
                    name="portals.checkIn.rewards.sap"
                    control={form.control}
                    min={0}
                    max={1000}
                    step={1}
                    isInteger={true}
                  />
                  <SliderInput
                    label="Check-in Exp Reward"
                    name="portals.checkIn.rewards.exp"
                    control={form.control}
                    min={0}
                    max={1000}
                    step={1}
                    isInteger={true}
                  />
                  <SliderInput
                    label="Check-in Interval (minutes)"
                    name="portals.checkIn.checkInInterval"
                    control={form.control}
                    min={0}
                    max={1000}
                    step={1}
                    isInteger={true}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rifts</CardTitle>
                  <CardDescription>Configure rift settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SliderInput
                    label="Max rift per tile"
                    name="rifts.amountPerTile"
                    control={form.control}
                    min={0}
                    max={100}
                    step={1}
                    isInteger={true}
                  />
                  <SliderInput
                    label="Expiration time"
                    name="rifts.expirationTime"
                    control={form.control}
                    min={0}
                    max={1000}
                    step={0.1}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>Configure skill settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SliderInput
                    label="Base Energy"
                    name="skills.base.energy"
                    control={form.control}
                    min={0}
                    max={1000}
                    step={1}
                    isInteger={true}
                  />
                  <SliderInput
                    label="Base Sap"
                    name="skills.base.sap"
                    control={form.control}
                    min={0}
                    max={1000}
                    step={1}
                    isInteger={true}
                  />
                  <SliderInput
                    label="Basic Skill Cost"
                    name="skills.costs.basic"
                    control={form.control}
                    min={0}
                    max={100}
                    step={0.01}
                  />
                  <SliderInput
                    label="Long Press Skill Cost"
                    name="skills.costs.longPress"
                    control={form.control}
                    min={0}
                    max={100}
                    step={0.01}
                  />
                  <SliderInput
                    label="Ultimate Skill Cost"
                    name="skills.costs.ultimate"
                    control={form.control}
                    min={0}
                    max={100}
                    step={0.01}
                  />
                  <SliderInput
                    label="Energy Growth Rate"
                    name="skills.growthRate.energy"
                    control={form.control}
                    min={0}
                    max={1}
                    step={0.001}
                  />
                  <SliderInput
                    label="Sap Growth Rate"
                    name="skills.growthRate.sap"
                    control={form.control}
                    min={0}
                    max={1}
                    step={0.001}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Validations</CardTitle>
                  <CardDescription>
                    Configure validation settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SliderInput
                    label="Max Allowed Movement Speed"
                    name="validations.maxAllowedMovementSpeed"
                    control={form.control}
                    min={0}
                    max={1000}
                    step={1}
                    isInteger={true}
                  />
                </CardContent>
              </Card>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
}

