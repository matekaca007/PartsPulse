import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="mt-auto border-t"
      style={{
        background: "var(--background-secondary)",
        borderColor: "var(--surface-border)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <svg
                  width="16"
                  height="16"
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
              <span className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                Parts<span style={{ color: "var(--accent)" }}>Pulse</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
              Your one-stop shop for powersports parts. Find exactly what you need for your UTV or ATV.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "All Products" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>



          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              About
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
              We provide high quality parts for all your powersports needs.
            </p>
          </div>
        </div>

        <div
          className="mt-10 pt-6 border-t text-center text-xs"
          style={{
            borderColor: "var(--surface-border)",
            color: "var(--foreground-subtle)",
          }}
        >
          © {new Date().getFullYear()} PartsPulse. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
