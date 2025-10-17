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
import { PortalFormProps } from "@/types/portal";
import { EEnergyType } from "@/types/energy";
import { EPortalType } from "@/types/portal";
import { SliderInput } from "./slider-input";
import { PortalMediaForm } from "./portal-media-form";
import { EPortalState } from "@/types/state";
import {
  Zap,
  MapPin,
  Award,
  Globe,
  Package,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { DefaultImages } from "@/lib/default-images";

const MapWithNoSSR = dynamic(() => import("@/components/map"), {
  ssr: false,
});

const portalSchema = z.object({
  zohoRecordId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  energyType: z.nativeEnum(EEnergyType),
  portalType: z.nativeEnum(EPortalType),
  state: z.nativeEnum(EPortalState),
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
  hideActions,
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
      state: EPortalState.DRAFT,
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
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowMap(false);
    }
  }, [form, lat, lng]);

  useEffect(() => {
    if (!initialData) return;
    form.reset({
      zohoRecordId: initialData.zohoRecordId ?? "",
      name: initialData.name ?? "",
      energyType: initialData.energyType,
      portalType: initialData.portalType,
      //state: (initialData as IPortal).state ?? form.getValues("state"),
      location: initialData.location ?? { type: "Point", coordinates: [0, 0] },
      address: initialData.address ?? "",
      website: initialData.website ?? "",
      shippingCode: initialData.shippingCode ?? "",
      rewards: initialData.rewards ?? { energy: 0, sap: 0, exp: 0 },
      cardImage: initialData.cardImage ?? "",
      items:
        initialData.items && initialData.items.length > 0
          ? initialData.items.map(i => ({
              url: i.url ?? "",
              image: i.image ?? "",
            }))
          : [{ url: "", image: "" }],
    });
  }, [initialData, form]);

  const watchedName = form.watch("name") || "Untitled Portal";
  const watchedEnergyType = form.watch("energyType");
  const watchedPortalType = form.watch("portalType");
  const watchedCardImage = form.watch("cardImage");

  const isOverviewVisible = Boolean(initialData?.id);
  const watchedItems = form.watch("items") || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const carouselItems =
    Array.isArray(watchedItems) && watchedItems.length > 0
      ? watchedItems.filter(it => Boolean(it?.image))
      : [];
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const hasCarouselItems = carouselItems.length > 0;
  const currentItem = hasCarouselItems ? carouselItems[currentItemIndex] : null;

  const nextItem = () => {
    if (!hasCarouselItems) return;
    setCurrentItemIndex(prev =>
      prev + 1 >= carouselItems.length ? 0 : prev + 1
    );
  };
  const prevItem = () => {
    if (!hasCarouselItems) return;
    setCurrentItemIndex(prev =>
      prev - 1 < 0 ? carouselItems.length - 1 : prev - 1
    );
  };
  useEffect(() => {
    if (currentItemIndex >= carouselItems.length) setCurrentItemIndex(0);
  }, [carouselItems, currentItemIndex]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {isOverviewVisible && (
          <Card className="overflow-hidden border-primary/20">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="truncate">Overview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                <Image
                  src={
                    watchedCardImage ||
                    (watchedPortalType
                      ? DefaultImages[
                          watchedPortalType as keyof typeof DefaultImages
                        ]
                      : "") ||
                    ""
                  }
                  alt={watchedName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                {hasCarouselItems && currentItem?.image && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-black/30 backdrop-blur-sm">
                      {currentItem.url ? (
                        <a
                          href={currentItem.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full"
                          title={currentItem.url || ""}
                        >
                          <Image
                            src={currentItem.image || ""}
                            alt={`Item ${currentItemIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute top-2 right-2 bg-black/60 rounded-sm p-1 text-white">
                            <ExternalLink className="h-4 w-4" />
                          </span>
                        </a>
                      ) : (
                        <Image
                          src={currentItem.image || ""}
                          alt={`Item ${currentItemIndex + 1}`}
                          fill
                          className="object-cover"
                        />
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/55 text-white hover:bg-black/75 shadow-lg"
                        onClick={prevItem}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/55 text-white hover:bg-black/75 shadow-lg"
                        onClick={nextItem}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {hasCarouselItems && carouselItems.length > 1 && (
                  <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-sm ring-1 ring-white/10 shadow-xl">
                    {carouselItems.map((_: unknown, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentItemIndex(i)}
                        className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                          i === currentItemIndex
                            ? "bg-white"
                            : "bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Go to item ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold truncate text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">
                      {watchedName}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {watchedEnergyType && (
                        <div className="drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">
                          <EnergyBadge type={watchedEnergyType} />
                        </div>
                      )}
                      {watchedPortalType && (
                        <Badge
                          variant="secondary"
                          className="text-xs normal-case drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]"
                        >
                          {String(watchedPortalType)
                            .replace("_", " ")
                            .toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Basic Information</CardTitle>
                </div>
                <CardDescription>
                  Enter the basic details of the portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="zohoRecordId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Zoho Record ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          readOnly
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
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
                      <FormLabel className="text-xs font-semibold">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="font-medium"
                        />
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
                      <FormLabel className="text-xs font-semibold">
                        Energy Type
                      </FormLabel>
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
                      <FormLabel className="text-xs font-semibold">
                        Portal Type
                      </FormLabel>
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
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Portal State
                      </FormLabel>
                      <Select
                        disabled={!initialData?.id}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(EPortalState).map(type => (
                            <SelectItem key={type} value={type}>
                              <Badge className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5">
                                {type}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <CardTitle>Location Information</CardTitle>
                </div>
                <CardDescription>
                  Enter the location details of the portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location.coordinates.0"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Latitude
                        </FormLabel>
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
                            className="bg-background"
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
                        <FormLabel className="text-xs font-semibold">
                          Longitude
                        </FormLabel>
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
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("location.coordinates.0") &&
                form.watch("location.coordinates.1") ? (
                  <div className="h-[300px] mt-4 rounded-lg overflow-hidden border">
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
                  <div className="h-[300px] mt-4 flex items-center justify-center bg-muted rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground text-sm">
                      Ingrese latitud y longitud para mostrar el mapa
                    </p>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Address
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          className="resize-none"
                          rows={3}
                        />
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
                      <FormLabel className="text-xs font-semibold flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          value={field.value ?? ""}
                          placeholder="https://example.com"
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
                      <FormLabel className="text-xs font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Shipping Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="font-mono"
                        />
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
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <CardTitle>Rewards</CardTitle>
                </div>
                <CardDescription>
                  Set the rewards for this portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-4 p-4 bg-muted/50 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs normal-case bg-white dark:bg-gray-900"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Energy
                    </Badge>
                  </div>
                  <SliderInput
                    label="Energy Reward"
                    name="rewards.energy"
                    control={form.control}
                    min={0}
                    max={500}
                    step={1}
                    isInteger
                  />
                </div>

                <div className="space-y-4 p-4 bg-muted/50 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs normal-case bg-white dark:bg-gray-900"
                    >
                      Sap
                    </Badge>
                  </div>
                  <SliderInput
                    label="Sap Reward"
                    name="rewards.sap"
                    control={form.control}
                    min={0}
                    max={500}
                    step={1}
                    isInteger
                  />
                </div>

                <div className="space-y-4 p-4 bg-muted/50 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs normal-case bg-white dark:bg-gray-900"
                    >
                      Experience
                    </Badge>
                  </div>
                  <SliderInput
                    label="Exp Reward"
                    name="rewards.exp"
                    control={form.control}
                    min={0}
                    max={500}
                    step={1}
                    isInteger
                  />
                </div>
              </CardContent>
            </Card>

            <PortalMediaForm cardImage={true} control={form.control} />
            <PortalMediaForm control={form.control} />
          </div>
        </div>

        {!hideActions && (
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
        )}
      </form>
    </Form>
  );
}
