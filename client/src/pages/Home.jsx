import Button from "../components/Button";
import { Link } from "react-router-dom";

function Step({ n, title, desc }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-hlgreen-700 font-bold">
        {n}
      </div>
      <h3 className="text-base font-semibold text-hlblack">{title}</h3>
      <p className="mt-2 text-sm text-black/70">{desc}</p>
    </div>
  );
}

function ServiceCard({ title, desc, price }) {
  return (
    <div className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-hlblack">{title}</h3>
        {price ? (
          <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-hlblack">
            {price}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-black/70">{desc}</p>

      <div className="mt-5">
        <Link to="/book" className="inline-block">
          <span className="text-sm font-semibold text-hlgreen-700 group-hover:underline">
            Book this →
          </span>
        </Link>
      </div>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-hlblack">{title}</h3>
      <p className="mt-2 text-sm text-black/70">{desc}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-24">
      {/* HERO / WELCOME */}
      <section className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-cream-100 to-cream-200">
        <div className="relative z-10 mx-auto max-w-4xl px-10 py-24 text-center">
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-hlblack">
            Welcome to <span className="text-hlgreen-600">HairLuxe</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-black/70">
            Book your hair appointment easily. Choose your service, stylist, and
            time — we’ll take care of the rest.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/book">
              <Button variant="primary" size="lg">
                Book Appointment
              </Button>
            </Link>

            <Link to="/services">
              <Button variant="secondary" size="lg">
                View Services
              </Button>
            </Link>
          </div>
        </div>

        {/* decorative background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(46,125,50,0.12),transparent_60%)]" />
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-16">
        <div className="rounded-3xl border border-black/5 bg-white/60 p-10 backdrop-blur">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-hlblack">How booking works</h2>
            <p className="mt-3 text-black/70">
              In four quick steps, you’ll lock your slot and we’ll handle the rest.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <Step
              n="1"
              title="Pick a service"
              desc="Haircut, coloring, styling — choose what you need."
            />
            <Step
              n="2"
              title="Choose a stylist"
              desc="Select your preferred expert (or go with ‘Any’)."
            />
            <Step
              n="3"
              title="Select a time"
              desc="See available slots and pick what works for you."
            />
            <Step
              n="4"
              title="Confirm booking"
              desc="Done. You’ll see it in ‘My Appointments’."
            />
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/book">
              <Button variant="primary" size="lg">
                Start Booking
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-hlblack">Our Signature Services</h2>
          <p className="mx-auto mt-3 max-w-2xl text-black/70">
            A curated selection of what clients book the most. Full list is in Services.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <ServiceCard
            title="Classic Haircut"
            desc="Precision cut with a clean finish, tailored to your face shape."
            price="from $25"
          />
          <ServiceCard
            title="Color & Tone"
            desc="Rich color, glossy finish, and a tone that suits your skin tone."
            price="from $60"
          />
          <ServiceCard
            title="Blowout & Styling"
            desc="Smooth, volume, and polish for events—or just because."
            price="from $30"
          />
        </div>

        <div className="mt-10 flex justify-center">
          <Link to="/services">
            <Button variant="secondary" size="lg">
              Explore All Services
            </Button>
          </Link>
        </div>
      </section>

      {/* ABOUT / VALUE */}
      <section className="mt-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-hlblack">Luxury without the hassle</h2>
            <p className="mt-4 text-black/70">
              HairLuxe is built around consistency, comfort, and craft. You book fast,
              we run on time, and you leave looking expensive.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/book">
                <Button variant="primary" size="lg">
                  Book Now
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="secondary" size="lg">
                  See Services
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Feature
              title="Expert stylists"
              desc="Skilled team with modern techniques and real consultation."
            />
            <Feature
              title="On-time slots"
              desc="Clear scheduling so your day doesn’t get hijacked."
            />
            <Feature
              title="Clean, calm space"
              desc="Aesthetic, minimal, and comfortable—no chaos."
            />
            <Feature
              title="Easy rebooking"
              desc="Repeat your favorite service in seconds next time."
            />
          </div>
        </div>
      </section>

      {/* CONTACT / FOOT CTA */}
      <section className="mt-20">
        <div className="rounded-3xl border border-black/5 bg-cream-100 p-10 text-center">
          <h2 className="text-3xl font-bold text-hlblack">
            Ready for your next appointment?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-black/70">
            Book in under a minute. If you have questions, reach us anytime.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/book">
              <Button variant="primary" size="lg">
                Book Appointment
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="secondary" size="lg">
                View Services
              </Button>
            </Link>
          </div>

          {/* Optional contact line (no backend needed) */}
          <p className="mt-6 text-sm text-black/60">
            Contact:{" "}
            <span className="font-semibold text-hlblack">+389 70 000 000</span>{" "}
            ·{" "}
            <span className="font-semibold text-hlblack">
              hairluxe@example.com
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
