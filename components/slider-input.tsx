import React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control } from "react-hook-form";

interface SliderInputProps {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  min: number;
  max: number;
  step: number;
  isInteger?: boolean;
}

export function SliderInput({
  label,
  name,
  control,
  min,
  max,
  step,
  isInteger = false,
}: SliderInputProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2">
              <Slider
                value={[field.value]}
                onValueChange={values => {
                  const value = isInteger ? Math.round(values[0]) : values[0];
                  field.onChange(value);
                }}
                min={min}
                max={max}
                step={step}
                className="flex-grow"
              />
              <Input
                type="number"
                {...field}
                onChange={e => {
                  const value = isInteger
                    ? parseInt(e.target.value, 10)
                    : parseFloat(e.target.value);
                  field.onChange(isNaN(value) ? "" : value);
                }}
                onBlur={e => {
                  let value = isInteger
                    ? parseInt(e.target.value, 10)
                    : parseFloat(e.target.value);
                  if (isNaN(value)) {
                    value = min;
                  } else {
                    value = Math.max(min, Math.min(max, value));
                  }
                  field.onChange(value);
                  e.target.value = value.toString();
                }}
                step={isInteger ? 1 : step}
                className="w-20"
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

