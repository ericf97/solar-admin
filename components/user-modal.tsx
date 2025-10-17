"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  User as UserIcon,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Key,
  Save,
  X,
} from "lucide-react";
import { User, AuthClaims } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { usersService } from "@/services/users-service";
import { authService } from "@/services/auth-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface UserModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserModal({ userId, isOpen, onClose }: UserModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const [editedClaims, setEditedClaims] = useState<AuthClaims>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);
  const [isEditingClaims, setIsEditingClaims] = useState(false);
  const [isSavingClaims, setIsSavingClaims] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      if (userId && isOpen) {
        setIsLoading(true);
        setIsLoadingClaims(true);
        try {
          const userData = await usersService.getUser(userId);
          setUser(userData);

          try {
            const claimsData = await authService.getUserClaims(userId);
            setClaims(claimsData);
            setEditedClaims(claimsData);
          } catch (error) {
            console.error("Error loading claims:", error);
            setClaims({});
            setEditedClaims({});
          } finally {
            setIsLoadingClaims(false);
          }
        } catch (error) {
          console.error("Error loading user:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadUserData();
  }, [userId, isOpen]);

  const handleClaimToggle = (claimKey: keyof AuthClaims) => {
    setEditedClaims(prev => ({
      ...prev,
      [claimKey]: !prev[claimKey],
    }));
  };

  const handleSaveClaims = async () => {
    if (!userId) return;

    setIsSavingClaims(true);
    try {
      const updatedClaims = await authService.setUserClaims(
        userId,
        editedClaims
      );
      setClaims(updatedClaims);
      setIsEditingClaims(false);
    } catch (error) {
      console.error("Error saving claims:", error);
    } finally {
      setIsSavingClaims(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedClaims(claims || {});
    setIsEditingClaims(false);
  };

  if (!userId || !isOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-32" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User not found</DialogTitle>
          </DialogHeader>
          <p>Unable to load user details.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const claimsArray = claims
    ? Object.entries(claims).filter(([, value]) => value === true)
    : [];
  const claimLabels: Record<keyof AuthClaims, string> = {
    admin: "Administrator",
    game_developer: "Game Developer",
    game_designer: "Game Designer",
    partners_manager: "Partners Manager",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto pt-10">
        <DialogHeader className="flex flex-row justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-primary" />
              <DialogTitle className="text-2xl font-bold">
                User Details
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              User account information
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Account Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    User ID
                  </p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {user.id}
                  </code>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Email Address
                  </p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <CardTitle>Authentication Providers</CardTitle>
              </div>
              <CardDescription>
                Connected authentication methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Firebase UID</span>
                    <Badge variant="secondary" className="text-xs normal-case">
                      {user.providers.firebase.uid}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-500" />
                  <div>
                    <CardTitle>Permissions & Claims</CardTitle>
                    <CardDescription>
                      User access rights and permissions
                    </CardDescription>
                  </div>
                </div>
                {!isEditingClaims ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingClaims(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isSavingClaims}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveClaims}
                      disabled={isSavingClaims}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSavingClaims ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingClaims ? (
                <div className="space-y-2">
                  <Skeleton className="w-full h-10" />
                  <Skeleton className="w-full h-10" />
                </div>
              ) : isEditingClaims ? (
                <div className="space-y-4">
                  {(Object.keys(claimLabels) as Array<keyof AuthClaims>).map(
                    claimKey => (
                      <div
                        key={claimKey}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg border"
                      >
                        <Label
                          htmlFor={claimKey}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {claimLabels[claimKey]}
                        </Label>
                        <Switch
                          id={claimKey}
                          checked={editedClaims[claimKey] || false}
                          onCheckedChange={() => handleClaimToggle(claimKey)}
                          disabled={isSavingClaims}
                        />
                      </div>
                    )
                  )}
                </div>
              ) : claimsArray.length > 0 ? (
                <div className="space-y-2">
                  {claimsArray.map(([key]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-lg"
                    >
                      <span className="text-sm font-medium">
                        {claimLabels[key as keyof AuthClaims]}
                      </span>
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No permissions assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {user.hasAcceptedTerms ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <CardTitle>Terms & Conditions</CardTitle>
              </div>
              <CardDescription>User agreement status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={user.hasAcceptedTerms ? "default" : "destructive"}
                  >
                    {user.hasAcceptedTerms ? "Accepted" : "Not Accepted"}
                  </Badge>
                </div>
                {user.hasAcceptedTerms && user.acceptedTermsAt && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Accepted At</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.acceptedTermsAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
              <CardDescription>Account creation information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

