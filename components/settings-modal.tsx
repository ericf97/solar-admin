"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiStore } from "@/store/api-store";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { baseUrl, setBaseUrl } = useApiStore();
  const [environment, setEnvironment] = useState<"local" | "dev" | "prod">(
    "local"
  );
  const [localUrl, setLocalUrl] = useState("http://localhost:3000");

  useEffect(() => {
    const storedEnv = localStorage.getItem("environment");
    if (storedEnv === "local" || storedEnv === "dev" || storedEnv === "prod") {
      setEnvironment(storedEnv);
      switch (storedEnv) {
        case "local":
          setBaseUrl(localStorage.getItem("localUrl") || localUrl);
          break;
        case "dev":
          setBaseUrl("https://apiDev.kykuyo.com");
          break;
        case "prod":
          setBaseUrl("https://apiProd.kykuyo.com");
          break;
      }
    } else {
      if (baseUrl.includes("localhost")) {
        setEnvironment("local");
        setLocalUrl(baseUrl);
      } else if (baseUrl.includes("apiDev")) {
        setEnvironment("dev");
      } else if (baseUrl.includes("apiProd")) {
        setEnvironment("prod");
      }
    }
    localStorage.setItem("localUrl", localUrl);
  }, []);

  useEffect(() => {
    localStorage.setItem("environment", environment);
  }, [environment]);

  const handleEnvironmentChange = (value: "local" | "dev" | "prod") => {
    setEnvironment(value);
    switch (value) {
      case "local":
        setBaseUrl(localUrl);
        localStorage.setItem("localUrl", localUrl);
        break;
      case "dev":
        setBaseUrl("https://apiDev.kykuyo.com");
        break;
      case "prod":
        setBaseUrl("https://apiProd.kykuyo.com");
        break;
    }
  };

  const handleLocalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalUrl(e.target.value);
    if (environment === "local") {
      setBaseUrl(e.target.value);
      localStorage.setItem("localUrl", e.target.value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="environment">Environment</Label>
            <Select
              value={environment}
              onValueChange={(value: "local" | "dev" | "prod") =>
                handleEnvironmentChange(value)
              }
            >
              <SelectTrigger id="environment">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="dev">Development</SelectItem>
                <SelectItem value="prod">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {environment === "local" && (
            <div className="grid gap-2">
              <Label htmlFor="localUrl">Local URL</Label>
              <Input
                id="localUrl"
                value={localUrl}
                onChange={handleLocalUrlChange}
                placeholder="http://localhost:8080"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Current API URL</Label>
            <span className="text-sm text-muted-foreground break-all">
              {baseUrl}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
