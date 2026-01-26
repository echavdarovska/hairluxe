import Button from "../components/Button";
import { Link } from "react-router-dom";
import { Sparkles, CalendarCheck2, Scissors } from "lucide-react";

function Step({ n, title, desc }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/70 p-6 text-center shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-100 text-hlgreen-700 font-extrabold ring-1 ring-black/5">
        {n}
      </div>
      <h3 className="text-base font-semibold text-hlblack">{title}</h3>
      <p className="mt-2 text-sm text-black/70">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="group rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 ring-1 ring-black/5">
          <Icon className="h-5 w-5 text-hlgreen-700" />
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-semibold text-hlblack">{title}</h3>
          <p className="mt-1 text-sm text-black/70">{desc}</p>
        </div>
      </div>

      <div className="mt-5 h-px w-full bg-black/5" />
      <div className="mt-4 text-xs font-semibold text-black/50">
        Built for clarity • Zero chaos scheduling
      </div>
    </div>
  );
}

export default function Home() {
  // ✅ Standard responsive shell: fluid on mobile, capped on desktop
  const containerClass = "mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8";

  return (
    <div className="w-full">
      <div className={containerClass}>
        {/* HERO */}
        <section className="relative mt-6 sm:mt-10 overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-br from-cream-100 to-cream-200">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=2400&q=80"
              alt="Hair styling"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-white/65" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(46,125,50,0.16),transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/50" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 text-center sm:px-10 sm:py-20">
            {/* chips */}
            <div className="mx-auto inline-flex flex-wrap items-center justify-center gap-2 rounded-full px-2 py-2 text-[11px] sm:text-xs font-semibold text-black/70">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 backdrop-blur-md ring-1 ring-black/10">
                <span className="h-2 w-2 rounded-full bg-hlgreen-600" />
                Premium care
              </span>

              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 backdrop-blur-md ring-1 ring-black/10">
                <span className="h-2 w-2 rounded-full bg-hlgreen-600" />
                Fast booking
              </span>

              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 backdrop-blur-md ring-1 ring-black/10">
                <span className="h-2 w-2 rounded-full bg-hlgreen-600" />
                Admin-confirmed times
              </span>
            </div>

            <h1 className="mt-6 mb-5 text-3xl font-extrabold tracking-tight text-hlblack sm:text-5xl">
              Welcome to <span className="text-hlgreen-600">HairLuxe</span>
            </h1>

            <p className="mx-auto mb-7 max-w-2xl text-sm text-black/70 sm:mb-9 sm:text-lg">
              Book your hair appointment in seconds. Choose a service and time —
              we’ll confirm it, or propose the closest available slot.
            </p>

            {/* ✅ Better mobile CTA: full-width buttons, then inline on sm+ */}
            <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
              <Link to="/book" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Book Appointment
                </Button>
              </Link>

              <Link to="/services" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  View Services
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURE STRIP */}
        <section className="mt-8 sm:mt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={CalendarCheck2}
              title="Admin-confirmed schedule"
              desc="No double booking. If your slot isn’t available, you’ll get a clean proposal."
            />
            <FeatureCard
              icon={Scissors}
              title="Service-first booking"
              desc="Pick what you want, then we match the best staff and availability."
            />
            <FeatureCard
              icon={Sparkles}
              title="Clear status tracking"
              desc="Pending, confirmed, proposed — you always know what’s happening."
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-10 sm:mt-14">
          <div className="relative overflow-hidden rounded-3xl border border-black/5 p-0">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-hlgreen-100/45 via-white/30 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(46,125,50,0.18),transparent_65%)]" />

            <div className="relative rounded-3xl bg-white/60 p-6 backdrop-blur sm:p-10">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-2xl font-bold text-hlblack sm:text-3xl">
                  How booking works
                </h2>
                <p className="mt-3 text-sm text-black/70 sm:text-base">
                  You request a slot. Admin confirms — or proposes a better time.
                </p>
              </div>

              {/* ✅ Responsive steps: 1 col → 2 cols → 4 cols */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Step
                  n="1"
                  title="Request an appointment"
                  desc="Pick a service, select a time, and send the request."
                />
                <Step
                  n="2"
                  title="Wait for admin approval"
                  desc="Admin reviews availability and confirms or proposes a new time."
                />
                <Step
                  n="3"
                  title="Accept or book again"
                  desc="Accept the proposed time, or send a new request."
                />
                <Step
                  n="4"
                  title="Show up & shine"
                  desc="Track it in ‘My Appointments’ and arrive on time."
                />
              </div>

              <div className="mt-8 flex justify-center">
                <Link to="/book" className="w-full max-w-sm sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Start Booking
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOT CTA */}
        <section className="mt-12 mb-10 sm:mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-cream-100 p-6 text-center sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-hlgreen-100/40" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(46,125,50,0.12),transparent_65%)]" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-hlblack sm:text-3xl">
                Ready for your next appointment?
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm text-black/70 sm:text-base">
                Book in under a minute. If you have questions, reach us anytime.
              </p>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
                <Link to="/book" className="w-full max-w-sm sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Book Appointment
                  </Button>
                </Link>
                <Link to="/services" className="w-full max-w-sm sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    View Services
                  </Button>
                </Link>
              </div>

              <p className="mt-6 break-words text-sm text-black/60">
                Contact:{" "}
                <span className="font-semibold text-hlblack">+389 70 000 000</span>{" "}
                ·{" "}
                <span className="font-semibold text-hlblack">
                  hairluxe@gmail.com
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
