import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PortalForm } from "./portal-form"
import { PortalFormProps } from "@/types/portal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useForm } from "react-hook-form"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"

export function ViewForm({
  initialData,
  onSubmit,
  onCancel,
}: PortalFormProps) {
  const [viewMode, setViewMode] = useState<"form" | "json">("form");

  const form = useForm({
    defaultValues: initialData || {},
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(form.getValues(), null, 2)
      )
      alert('copy to clipboard')
    } catch {
      alert('error copy to clipboard')
    }
  }

  return (
    <Tabs value={viewMode} onValueChange={v => setViewMode(v as any)} className="w-full">
      <TabsList>
        <TabsTrigger value="form">Form View</TabsTrigger>
        <TabsTrigger value="json">JSON View</TabsTrigger>
      </TabsList>

      {/* --- Form View --- */}
      {viewMode === "form" && (
        <PortalForm 
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onCancel}/>
      )}

      {/* --- JSON View --- */}
      {viewMode === "json" && (
        <div>
          <Textarea
            className="font-mono h-[400px]"
            value={JSON.stringify(form.getValues(), null, 2)}
            readOnly
          />
          <Button onClick={handleCopy} variant="outline" size="sm">
            Copy JSON
          </Button>
        </div>
      )}

    </Tabs>
  )
}
