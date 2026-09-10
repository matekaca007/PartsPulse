"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logout } from "@/app/auth/actions";

export function Navbar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Catalog" },
    { href: "/wishlist", label: "Wishlist" },
  ];

  return (
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              Parts<span style={{ color: "var(--accent)" }}>Pulse</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--accent-hover)" : "var(--foreground-muted)",
                    background: isActive ? "var(--accent-glow)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden sm:flex items-center gap-4">
            {userEmail ? (
              <div className="flex items-center gap-4">
                <span className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                  {userEmail}
                </span>
                <form action={logout}>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ background: "var(--surface-border)", color: "var(--foreground)" }}
                  >
                    გასვლა / Logout
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--brand)", color: "white" }}
              >
                შესვლა / Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 rounded-lg"
            style={{ color: "var(--foreground-muted)" }}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="sm:hidden pb-4 flex flex-col gap-1 border-t mt-2 pt-2" style={{ borderColor: "var(--surface-border)" }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--accent-hover)" : "var(--foreground-muted)",
                    background: isActive ? "var(--accent-glow)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            
            <div className="mt-2 pt-2 border-t px-2" style={{ borderColor: "var(--surface-border)" }}>
              {userEmail ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm px-2" style={{ color: "var(--foreground-muted)" }}>
                    {userEmail}
                  </span>
                  <form action={logout}>
                    <button
                      type="submit"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-left px-2 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ color: "var(--foreground)" }}
                    >
                      გასვლა / Logout
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
                  style={{ background: "var(--brand)", color: "white" }}
                >
                  შესვლა / Login
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
