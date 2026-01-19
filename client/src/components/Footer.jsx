import { Link } from "react-router-dom";

export default function Footer() {
  // Same strategy as Header:
  // mobile = full width, md+ = exactly 80vw (matches admin shell)
  const containerClass =
    "mx-auto w-full px-6 md:w-[80vw] md:max-w-[80vw] md:min-w-[80vw]";

  return (
    <footer className="mt-8 bg-hlgreen-700 text-white">
      <div className={`${containerClass} py-14`}>
        {/* TOP */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* BRAND */}
          <div className="md:col-span-1">
            <div className="text-2xl font-extrabold tracking-tight">
              Hair<span className="text-white/80">Luxe</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/80">
              Premium hair services with effortless online booking. Look sharp.
              Feel expensive.
            </p>
          </div>

          {/* MENU */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/90">
              Menu
            </h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-white">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/90">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>📍 Bitola, North Macedonia</li>
              <li>📞 +389 70 000 000</li>
              <li>✉️ hairluxe@gmail.com</li>
            </ul>
          </div>

          {/* MAP / LOCATION */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/90">
              Find us
            </h4>
            <div className="overflow-hidden rounded-xl border border-white/20">
              <iframe
                title="HairLuxe location"
                src="https://maps.google.com/maps?q=Bitola&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="h-40 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-6 text-sm text-white/70 sm:flex-row">
          <div>© {new Date().getFullYear()} HairLuxe. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
