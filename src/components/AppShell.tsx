import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BookOpen, Eye, Home, Leaf, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/accueil", label: "Accueil", icon: Home },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/aliments", label: "Aliments", icon: Leaf },
  { to: "/observations", label: "Observations", icon: Eye },
  { to: "/profil", label: "Profil", icon: User },
] as const;

export function AppShell({ children, showFab = true }: { children: ReactNode; showFab?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar md:px-5 md:py-8">
        <Link to="/accueil" className="mb-10 px-3 font-display text-2xl">
          BabyFood
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground font-medium" }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>
        {showFab && (
          <Button
            onClick={() => navigate({ to: "/journal", search: { add: true } })}
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-soft"
          >
            <Plus className="h-4 w-4" /> Ajouter un repas
          </Button>
        )}
      </aside>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-32 pt-6 md:px-10 md:pb-12 md:pt-10">
        {children}
      </main>

      {showFab && (
        <Button
          size="icon"
          onClick={() => navigate({ to: "/journal", search: { add: true } })}
          aria-label="Ajouter un repas"
          className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float md:hidden"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
                activeProps={{ className: "text-foreground font-semibold" }}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <Icon className={cn("h-5 w-5", isActive && "text-foreground")} strokeWidth={1.75} />
                    {label}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 break-words">
        {eyebrow && <p className="mb-1 text-sm capitalize text-muted-foreground">{eyebrow}</p>}
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed bg-card p-8 text-center shadow-soft">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
