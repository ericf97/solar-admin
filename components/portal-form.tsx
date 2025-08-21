"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnergyBadge } from "@/components/energy-badge";
import dynamic from "next/dynamic";
import { IPortal } from "@/types/portal";
import { EEnergyType } from "@/types/energy";
import { EPortalType } from "@/types/portal";
import { SliderInput } from "./slider-input";
import { PortalMediaForm } from "./portal-media-form";

const MapWithNoSSR = dynamic(() => import("@/components/map"), {
  ssr: false,
});

const portalSchema = z.object({
  zohoRecordId: z.string(),
  name: z.string().min(1, "Name is required"),
  energyType: z.nativeEnum(EEnergyType),
  portalType: z.nativeEnum(EPortalType),
  location: z.object({
    type: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  shippingCode: z.string().optional(),
  rewards: z.object({
    energy: z.number().min(0).optional(),
    sap: z.number().min(0).optional(),
    exp: z.number().min(0).optional(),
  }),
  cardImage: z.string().url().optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        url: z.string().url().optional().or(z.literal("")).nullable(),
        image: z.string().url().nullable(),
      })
    )
    .optional(),
});

export type PortalFormData = z.infer<typeof portalSchema>;

interface PortalFormProps {
  initialData?: IPortal;
  onSubmit: (data: PortalFormData) => Promise<void>;
  onCancel: () => void;
}

const removeEmptyValues = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues).filter(v => v != null);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, removeEmptyValues(v)])
        .filter(([, v]) => v != null && v !== "")
    );
  }
  return obj;
};

export function PortalForm({
  initialData,
  onSubmit,
  onCancel,
}: PortalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const form = useForm<PortalFormData>({
    resolver: zodResolver(portalSchema),
    defaultValues: initialData || {
      zohoRecordId: "",
      name: "",
      energyType: EEnergyType.WATER,
      portalType: EPortalType.WATER,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      address: "",
      website: "",
      shippingCode: "",
      rewards: { energy: 0, sap: 0, exp: 0 },
      cardImage: "",
      items: [{ url: "", image: "" }],
    },
  });

  const { control } = form;
  useFieldArray({
    control,
    name: "items",
  });

  const handleSubmit = async (data: PortalFormData) => {
    setIsSubmitting(true);
    try {
      const filteredData = removeEmptyValues(data) as PortalFormData;
      await onSubmit(filteredData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lat = form.watch("location.coordinates.0");
  const lng = form.watch("location.coordinates.1");

  useEffect(() => {
    if (lat && lng) {
      setShowMap(false);
      const timer = setTimeout(() => {
        setShowMap(true);
      }, 500); // 500ms delay
      return () => clearTimeout(timer);
    } else {
      setShowMap(false);
    }
  }, [form, lat, lng]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details of the portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="zohoRecordId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zoho Record ID</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} readOnly />
                      </FormControl>
                      <FormDescription>
                        This is the unique identifier in Zoho CRM.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="energyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Energy Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select energy type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(EEnergyType).map(type => (
                            <SelectItem key={type} value={type}>
                              <EnergyBadge type={type as EEnergyType} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="portalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portal Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select portal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(EPortalType).map(type => {
                            const formattedType = type
                              .replace("_", " ")
                              .toUpperCase();
                            return (
                              <SelectItem key={type} value={type}>
                                <Badge className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5">
                                  {formattedType}
                                </Badge>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>
                  Enter the location details of the portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location.coordinates.0"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="any"
                            value={field.value ?? ""}
                            onChange={e =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : ""
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location.coordinates.1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="any"
                            value={field.value ?? ""}
                            onChange={e =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : ""
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("location.coordinates.0") &&
                form.watch("location.coordinates.1") ? (
                  <div className="h-[300px] mt-4">
                    {showMap ? (
                      <MapWithNoSSR
                        center={[
                          form.watch("location.coordinates.1"),
                          form.watch("location.coordinates.0"),
                        ]}
                        zoom={13}
                        onMapClick={() => {}}
                        energyType={form.watch("energyType")}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground">
                          Cargando mapa...
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[300px] mt-4 flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">
                      Ingrese latitud y longitud para mostrar el mapa
                    </p>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shippingCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Code</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Rewards</CardTitle>
                <CardDescription>
                  Set the rewards for this portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SliderInput
                  label="Energy Reward"
                  name="rewards.energy"
                  control={form.control}
                  min={0}
                  max={500}
                  step={1}
                  isInteger
                />
                <SliderInput
                  label="Sap Reward"
                  name="rewards.sap"
                  control={form.control}
                  min={0}
                  max={500}
                  step={1}
                  isInteger
                />
                <SliderInput
                  label="Exp Reward"
                  name="rewards.exp"
                  control={form.control}
                  min={0}
                  max={500}
                  step={1}
                  isInteger
                />
              </CardContent>
            </Card>

            {/* <PortalMediaForm cardImage={true} control={form.control} /> */}
            <PortalMediaForm control={form.control} />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Submitting..."
              : initialData
              ? "Update Portal"
              : "Create Portal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

