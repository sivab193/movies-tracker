"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
    title: React.ReactNode
    description?: React.ReactNode
    headerActions?: React.ReactNode
    defaultOpen?: boolean
    className?: string
    contentClassName?: string
    children: React.ReactNode
}

export function CollapsibleSection({
    title,
    description,
    headerActions,
    defaultOpen = false,
    className,
    contentClassName,
    children,
}: CollapsibleSectionProps) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <Card className={className}>
            <Collapsible open={open} onOpenChange={setOpen}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4 pb-4">
                    <CollapsibleTrigger className="flex flex-1 items-center gap-3 text-left min-w-0 cursor-pointer group">
                        <ChevronRight
                            className={cn(
                                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                open && "rotate-90"
                            )}
                        />
                        <div className="min-w-0">
                            <CardTitle className="flex items-center gap-2">{title}</CardTitle>
                            {description && <CardDescription>{description}</CardDescription>}
                        </div>
                    </CollapsibleTrigger>
                    {headerActions && (
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            {headerActions}
                        </div>
                    )}
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className={contentClassName}>{children}</CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    )
}
