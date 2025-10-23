"use client";

import { ReactNode } from "react";

interface FormHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function FormHeader({ title, description, actions }: FormHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

