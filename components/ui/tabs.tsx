import * as React from "react"
import { cn } from "@/lib/utils"

type TabsChildProps = {
  current?: string
  onChange?: (val: string) => void
}

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, value, onValueChange, children, ...props }, ref) => {
  const [current, setCurrent] = React.useState(value)

  const handleChange = (val: string) => {
    setCurrent(val)
    onValueChange?.(val)
  }

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child as React.ReactElement<TabsChildProps>, {
          current,
          onChange: handleChange,
        })
      })}
    </div>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    current?: string
    onChange?: (value: string) => void
  }
>(({ className, children, current, onChange, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn("inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground", className)}
    {...props}
  >
    {React.Children.map(children, child => {
      if (!React.isValidElement(child)) return child
      return React.cloneElement(child as React.ReactElement<TabsChildProps>, { current, onChange })
    })}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
    current?: string
    onChange?: (value: string) => void
  }
>(({ className, value, current, onChange, children, ...props }, ref) => {
  const isActive = current === value
  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      onClick={() => onChange?.(value)}
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-sm transition-all",
        isActive
          ? "bg-background text-foreground shadow"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

export { Tabs, TabsList, TabsTrigger }
