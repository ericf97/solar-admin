"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usersService } from "@/services/users-service";

interface MetadataCardProps {
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export function MetadataCard({
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
}: MetadataCardProps) {
  const [createdByEmail, setCreatedByEmail] = useState<string | null>(null);
  const [updatedByEmail, setUpdatedByEmail] = useState<string | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);
  const [isLoadingUpdater, setIsLoadingUpdater] = useState(false);

  useEffect(() => {
    async function loadCreatorEmail() {
      if (createdBy) {
        setIsLoadingCreator(true);
        try {
          const createdUser = await usersService.getUser(createdBy);
          setCreatedByEmail(createdUser.email);
        } catch (error) {
          console.error("Error loading creator user:", error);
          setCreatedByEmail(null);
        } finally {
          setIsLoadingCreator(false);
        }
      }
    }

    loadCreatorEmail();
  }, [createdBy]);

  useEffect(() => {
    async function loadUpdaterEmail() {
      if (updatedBy) {
        if (updatedBy === createdBy && createdByEmail) {
          setUpdatedByEmail(createdByEmail);
        } else {
          setIsLoadingUpdater(true);
          try {
            const updatedUser = await usersService.getUser(updatedBy);
            setUpdatedByEmail(updatedUser.email);
          } catch (error) {
            console.error("Error loading updater user:", error);
            setUpdatedByEmail(null);
          } finally {
            setIsLoadingUpdater(false);
          }
        }
      }
    }

    loadUpdaterEmail();
  }, [updatedBy, createdBy, createdByEmail]);

  if (!createdAt && !updatedAt) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metadata</CardTitle>
        <CardDescription>Creation and update information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {createdAt && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {new Date(createdAt).toLocaleString()}
              </span>
            </div>
          )}
          {createdBy && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Created By</span>
              {isLoadingCreator ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <span className="font-medium text-primary">
                  {createdByEmail || createdBy}
                </span>
              )}
            </div>
          )}
          {updatedAt && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Updated</span>
              <span className="font-medium">
                {new Date(updatedAt).toLocaleString()}
              </span>
            </div>
          )}
          {updatedBy && (
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Updated By</span>
              {isLoadingUpdater ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <span className="font-medium text-primary">
                  {updatedByEmail || updatedBy}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

