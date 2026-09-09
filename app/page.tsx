import Link from "next/link";
import { createAnonSupabaseClient } from "@/lib/supabase/server";

// Vehicle icon SVG paths for each slug
const vehicleIconPaths: Record<string, React.ReactNode> = {
  default: (
    // Generic off-road vehicle silhouette
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
    </svg>
  ),
  "utv-atv": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M5 14V9l3-5h8l3 5v5" />
      <path d="M8 9h8" />
    </svg>
  ),
  "universal-fit": (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
};

function getVehicleIcon(slug: string) {
  return vehicleIconPaths[slug] ?? vehicleIconPaths["default"];
}

// Color accent per vehicle (accent from our CSS palette)
function getVehicleAccent(index: number) {
  const accents = [
    { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", icon: "var(--accent-hover)" },
    { bg: "rgba(6,182,212,0.12)",  border: "rgba(6,182,212,0.25)",  icon: "var(--accent-secondary)" },
    { bg: "rgba(34,197,94,0.10)",  border: "rgba(34,197,94,0.25)",  icon: "#4ade80" },
    { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", icon: "#fbbf24" },
    { bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)",  icon: "#f87171" },
  ];
  return accents[index % accents.length];
}

export default async function HomePage() {
  // Fetch vehicles — gracefully handle if migration hasn't run yet
  let vehicles: { slug: string; name_en: string; is_universal: boolean; sort_order: number }[] = [];
  try {
    const supabase = createAnonSupabaseClient();
    const { data } = await supabase
      .from("vehicles")
      .select("slug, name_en, is_universal, sort_order")
      .order("sort_order");
    vehicles = data ?? [];
  } catch {
    // vehicles table not yet migrated — show page without the section
  }

  const regularVehicles = vehicles.filter((v) => !v.is_universal);
  const universalVehicle = vehicles.find((v) => v.is_universal);

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

      {/* Shop by Vehicle */}
      {regularVehicles.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                Shop by Vehicle
              </h2>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Find parts built specifically for your rig.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {regularVehicles.map((vehicle, i) => {
                const accent = getVehicleAccent(i);
                return (
                  <Link
                    key={vehicle.slug}
                    href={`/products?vehicle=${vehicle.slug}`}
                    className="group relative rounded-xl p-5 flex flex-col items-center text-center gap-3 transition-all duration-300"
                    style={{
                      background: accent.bg,
                      border: `1px solid ${accent.border}`,
                    }}
                    id={`vehicle-card-${vehicle.slug}`}
                  >
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ color: accent.icon }}
                    >
                      {getVehicleIcon(vehicle.slug)}
                    </div>

                    {/* Name */}
                    <span
                      className="text-sm font-semibold leading-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {vehicle.name_en}
                    </span>

                    {/* Arrow on hover */}
                    <span
                      className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium"
                      style={{ color: accent.icon }}
                    >
                      →
                    </span>
                  </Link>
                );
              })}

              {/* Universal Fit — full-width card at the end */}
              {universalVehicle && (
                <Link
                  href={`/products?vehicle=${universalVehicle.slug}`}
                  className="group col-span-2 sm:col-span-3 lg:col-span-4 xl:col-span-5 rounded-xl p-5 flex items-center gap-4 transition-all duration-300"
                  style={{
                    background: "rgba(99,102,241,0.07)",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                  id="vehicle-card-universal"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ color: "var(--accent-hover)" }}
                  >
                    {getVehicleIcon("universal-fit")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      🌐 Universal Fit Parts
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                      Model-agnostic parts that work across many vehicles
                    </p>
                  </div>
                  <span
                    className="ml-auto text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--accent-hover)" }}
                  >
                    Browse →
                  </span>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20" style={{ background: "var(--background-secondary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
                    <rect x="9" y="11" width="14" height="10" rx="2" />
                    <circle cx="12" cy="16" r="1" />
                  </svg>
                ),
                title: "Pick Your Vehicle",
                desc: "Select your rig from our list and instantly see parts built for it.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                ),
                title: "Search & Filter",
                desc: "Filter by category, price range, or search across the full catalog.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                  </svg>
                ),
                title: "Find Your Part",
                desc: "Compare specs and variants and get exactly the part you need.",
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
