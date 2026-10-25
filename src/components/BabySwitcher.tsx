import { Link } from "@tanstack/react-router";
import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Baby } from "@/lib/babies";

export function BabySwitcher({ babies, current, onSelect }: { babies: Baby[]; current: Baby; onSelect: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm shadow-soft">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-soft text-xs font-semibold">
          {current.first_name[0]?.toUpperCase()}
        </span>
        {current.first_name}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-2xl">
        {babies.map((b) => (
          <DropdownMenuItem key={b.id} onSelect={() => onSelect(b.id)} className="rounded-xl py-2.5">
            {b.first_name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl py-2.5">
          <Link to="/profil"><Plus className="h-4 w-4" /> Ajouter un bébé</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
