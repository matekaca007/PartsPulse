import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient bg */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99, 102, 241, 0.3) 0%, transparent 70%), " +
              "radial-gradient(ellipse 40% 40% at 80% 20%, rgba(6, 182, 212, 0.2) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 animate-fade-in"
              style={{
                background: "var(--accent-glow)",
                color: "var(--accent-hover)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
              Every part. One catalog.
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in"
              style={{ animationDelay: "100ms", color: "var(--foreground)" }}
            >
              Every part.{" "}
              <span
                style={{
                  background: "var(--gradient-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                One catalog.
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl animate-fade-in"
              style={{ animationDelay: "200ms", color: "var(--foreground-muted)" }}
            >
              Browse thousands of UTV, ATV, and powersports parts and find what you need
            </p>

            <div
              className="flex flex-wrap gap-4 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <Link href="/products" className="btn-primary text-base px-8 py-3">
                Browse Catalog
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" style={{ background: "var(--background-secondary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
              How It Works
            </h2>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>

            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                ),
                title: "Multi-Source Sync",
                desc: "",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                ),
                title: "Search & Filter",
                desc: "Filter by source, category, price range. Search across all products.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                ),
                title: "Shop at Source",
                desc: "Found what you need?",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="card p-6 text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{
                    background: "var(--accent-glow)",
                    color: "var(--accent-hover)",
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="relative rounded-2xl p-10 sm:p-14 overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                Ready to find your parts?
              </h2>
              <p className="text-sm mb-8 max-w-xl mx-auto" style={{ color: "var(--foreground-muted)" }}>
                Start browsing our catalog of powersports parts and find what you need.
              </p>
              <Link href="/products" className="btn-primary text-base px-8 py-3">
                Explore the Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
