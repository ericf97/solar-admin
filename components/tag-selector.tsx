"use client";

import { useState } from "react";
import { Search, AlertCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormDescription } from "@/components/ui/form";

interface AvailableTag {
  tag: string;
  datasetName: string;
  datasetId: string;
}

interface TagSelectorProps {
  title: string;
  description: string;
  icon: React.ElementType;
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
  type: string;
  colorClass: string;
  availableTags: AvailableTag[];
  isLoadingTags: boolean;
  hasSelectedDatasets: boolean;
}

export function TagSelector({
  title,
  description,
  icon: Icon,
  selectedTags,
  onToggle,
  type,
  colorClass,
  availableTags,
  isLoadingTags,
  hasSelectedDatasets,
}: TagSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTags = availableTags.filter(t =>
    t.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableTagNames = new Set(availableTags.map(t => t.tag));
  const invalidTags = Array.from(selectedTags).filter(
    tag => !availableTagNames.has(tag)
  );

  const showInvalidTagsWarning =
    !isLoadingTags && hasSelectedDatasets && invalidTags.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!hasSelectedDatasets ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select at least one dataset first to see available tags
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {showInvalidTagsWarning && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        The following tags are not found in the selected
                        datasets:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {invalidTags.map(tag => (
                          <Badge
                            key={tag}
                            variant="destructive"
                            className="flex items-center gap-1"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => onToggle(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs">
                        Click the X to remove these invalid tags
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex items-center w-full bg-background border rounded-lg px-2">
                <Search className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
                <Input
                  className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search tags..."
                />
              </div>
              {isLoadingTags ? (
                <p className="text-sm text-muted-foreground">Loading tags...</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tags found in selected datasets
                    </p>
                  ) : (
                    filteredTags.map(tagInfo => (
                      <div
                        key={`${type}-${tagInfo.tag}-${tagInfo.datasetId}`}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          checked={selectedTags.has(tagInfo.tag)}
                          onCheckedChange={() => onToggle(tagInfo.tag)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{tagInfo.tag}</Badge>
                            <span className="text-xs text-muted-foreground">
                              from {tagInfo.datasetName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              <FormDescription>
                Selected: {selectedTags.size} tag(s)
                {showInvalidTagsWarning && (
                  <span className="text-destructive ml-1">
                    ({invalidTags.length} invalid)
                  </span>
                )}
              </FormDescription>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

