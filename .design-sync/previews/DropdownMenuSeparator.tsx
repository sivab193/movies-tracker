import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { Copy, Ellipsis, Link2, Share2, Trash2 } from 'lucide-react'

// Separators split the share menu into three intents: copy something, publish something,
// destroy something. The destructive item is always fenced off by its own rule.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Share RRR">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>RRR (2022)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Copy />
            Copy title-card time
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link2 />
            Copy short link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Share2 />
            Share to WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2 />
            Delete my log
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
