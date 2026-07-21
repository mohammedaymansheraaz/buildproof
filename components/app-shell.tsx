"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Aperture,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  ChevronDown,
  Command,
  FileCheck2,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings2,
  ShieldAlert,
  Sparkles,
  Waypoints,
  X,
} from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { WorkspaceUserControl } from "@/components/auth-controls";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, match: (path: string) => path === "/dashboard" },
  { href: "/audits/new", label: "Audits", icon: Waypoints, match: (path: string) => path.startsWith("/audits") },
  { href: "/findings", label: "Findings", icon: ShieldAlert, match: (path: string) => path.startsWith("/findings") },
  { href: "/fix-center", label: "Fix Center", icon: Sparkles, match: (path: string) => path.startsWith("/fix-center") },
  { href: "/reports", label: "Reports", icon: FileCheck2, match: (path: string) => path.startsWith("/reports") },
  { href: "/models", label: "AI Models", icon: BrainCircuit, match: (path: string) => path.startsWith("/models") },
  { href: "/integrations", label: "Integrations", icon: Bot, match: (path: string) => path.startsWith("/integrations") },
];

const quickLinks = [
  { href: "/audits/new", label: "Start a new audit", hint: "A" },
  { href: "/findings", label: "Investigate findings", hint: "F" },
  { href: "/fix-center", label: "Open Fix Center", hint: "X" },
  { href: "/reports", label: "View release report", hint: "R" },
  { href: "/models", label: "Manage AI models", hint: "M" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { runs, hydrated } = useAudit();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => {
          if (open) setPaletteQuery("");
          return !open;
        });
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setPaletteQuery("");
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const activeRun = runs[0];
  const projectName = activeRun?.projectName ?? "Release workspace";
  const visibleQuickLinks = quickLinks.filter((link) => link.label.toLowerCase().includes(paletteQuery.trim().toLowerCase()));

  const closePalette = () => {
    setPaletteOpen(false);
    setPaletteQuery("");
  };

  return (
    <div className={cn("app-frame", railOpen && "app-frame--rail-open")}>
      <aside className={cn("navigation-rail", railOpen && "navigation-rail--open")}>
        <div className="brand-lockup">
          <Link href="/dashboard" className="brand-mark" aria-label="BuildProof overview">
            <Aperture size={22} strokeWidth={1.55} />
          </Link>
          <span className="brand-name">BuildProof</span>
          <button
            className="rail-toggle"
            onClick={() => setRailOpen((open) => !open)}
            aria-label={railOpen ? "Collapse navigation" : "Keep navigation expanded"}
            aria-expanded={railOpen}
            title={railOpen ? "Collapse navigation" : "Keep navigation expanded"}
          >
            {railOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>

        <nav className="navigation-rail__links" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-link", active && "nav-link--active")}
                aria-label={item.label}
                title={item.label}
              >
                <Icon size={19} strokeWidth={1.65} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="navigation-rail__bottom">
          <Link
            href="/settings"
            className={cn("nav-link", pathname.startsWith("/settings") && "nav-link--active")}
            aria-label="Settings"
            title="Settings"
          >
            <Settings2 size={19} strokeWidth={1.65} />
            <span>Settings</span>
          </Link>
          <div className="operator-card">
            <span className="operator-avatar">AY</span>
            <span className="operator-info">
              <strong>Release owner</strong>
              <small>demo workspace</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="app-stage">
        <header className="topbar">
          <button className="project-switcher" type="button" onClick={() => setPaletteOpen(true)} aria-label="Open release workspace menu" title="Open release workspace menu">
            <span className="project-switcher__dot" />
            <span className="project-switcher__copy">
              <small>{hydrated ? "Current release" : "Loading workspace"}</small>
              <strong>{projectName}</strong>
            </span>
            <ChevronDown size={15} />
          </button>

          <div className="topbar__actions">
            <button className="command-trigger" type="button" onClick={() => setPaletteOpen(true)}>
              <Command size={15} />
              <span>Command</span>
              <kbd>⌘ K</kbd>
            </button>
            <Link className="button button--primary topbar-new-audit" href="/audits/new">
              <Plus size={16} />
              New audit
            </Link>
            <WorkspaceUserControl />
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>

      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("mobile-nav-link", item.match(pathname) && "mobile-nav-link--active")}>
              <Icon size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {paletteOpen ? (
        <div className="command-palette-backdrop" role="presentation" onMouseDown={closePalette}>
          <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command menu" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-palette__header">
              <Command size={18} />
              <input
                autoFocus
                value={paletteQuery}
                onChange={(event) => setPaletteQuery(event.target.value)}
                placeholder="Jump to a workspace…"
                aria-label="Search commands"
              />
              <button type="button" onClick={closePalette} aria-label="Close command menu">
                <X size={16} />
              </button>
            </div>
            <div className="command-palette__label">Workspace</div>
            <div className="command-palette__list">
              {visibleQuickLinks.map((link) => (
                <button
                  type="button"
                  key={link.href}
                  onClick={() => {
                    router.push(link.href);
                    closePalette();
                  }}
                >
                  <span>{link.label}</span>
                  <span className="command-palette__shortcut">{link.hint}</span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
              {!visibleQuickLinks.length ? <p className="command-palette__empty">No workspace action matches “{paletteQuery}”.</p> : null}
            </div>
            <div className="command-palette__footer">Demo workspace · all audit evidence is simulated and scoped.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
