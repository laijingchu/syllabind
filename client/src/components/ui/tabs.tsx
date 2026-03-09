import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement>(null)
  const indicatorRef = React.useRef<HTMLDivElement>(null)

  // Merge forwarded ref with internal ref
  React.useImperativeHandle(ref, () => listRef.current!)

  const updateIndicator = React.useCallback(() => {
    const list = listRef.current
    const indicator = indicatorRef.current
    if (!list || !indicator) return

    const active = list.querySelector<HTMLElement>('[data-state="active"]')
    if (!active) {
      indicator.style.opacity = "0"
      return
    }

    const listRect = list.getBoundingClientRect()
    const activeRect = active.getBoundingClientRect()

    indicator.style.opacity = "1"
    indicator.style.width = `${activeRect.width}px`
    indicator.style.transform = `translateX(${activeRect.left - listRect.left - list.clientLeft}px)`
  }, [])

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return

    // Initial position (no transition on mount)
    const indicator = indicatorRef.current
    if (indicator) indicator.style.transitionDuration = "0s"
    updateIndicator()
    // Re-enable transition after paint
    requestAnimationFrame(() => {
      if (indicator) indicator.style.transitionDuration = ""
    })

    // Watch for data-state changes on children
    const observer = new MutationObserver(updateIndicator)
    observer.observe(list, {
      attributes: true,
      attributeFilter: ["data-state"],
      subtree: true,
    })

    window.addEventListener("resize", updateIndicator)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateIndicator)
    }
  }, [updateIndicator])

  return (
    <TabsPrimitive.List
      ref={listRef}
      className={cn(
        "relative inline-flex h-9 items-center justify-center rounded-lg bg-highlight p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      <div
        ref={indicatorRef}
        aria-hidden
        className="absolute left-0 top-1 bottom-1 rounded-md bg-background transition-[transform,width] duration-200 ease-out opacity-0"
      />
      {children}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
