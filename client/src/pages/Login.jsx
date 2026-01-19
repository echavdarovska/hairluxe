import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Mail, ArrowRight } from "lucide-react";

import { useAuth } from "../state/auth";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { Card, CardBody } from "../components/Card";

import { loginSchema } from "../../../server/src/validators/auth.validators.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);

  // banner / server error
  const [error, setError] = useState(null);

  // field-level errors
  const [fieldErrors, setFieldErrors] = useState({
    email: null,
    password: null,
  });

  const containerClass =
    "mx-auto w-full px-4 sm:px-6 md:w-[80vw] md:max-w-[80vw] md:min-w-[80vw]";

  const showError = useMemo(() => {
    return typeof error === "string" && error.trim().length > 0;
  }, [error]);

  const hasFieldErrors = useMemo(() => {
    return Boolean(fieldErrors.email || fieldErrors.password);
  }, [fieldErrors]);

  function clearFieldError(name) {
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // reset field errors each submit
    setFieldErrors({ email: null, password: null });

    // ✅ validate locally first (fast feedback, fewer failed requests)
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const next = { email: null, password: null };

      for (const issue of parsed.error.issues) {
        const key = issue.path?.[0];
        if (key && next[key] == null) next[key] = issue.message;
      }

      setFieldErrors(next);
      setBusy(false);
      return;
    }

    // ✅ use normalized values from schema (email lowercased)
    const { email: cleanEmail, password: cleanPassword } = parsed.data;

    try {
      await login(cleanEmail, cleanPassword);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(46,125,50,0.14),transparent_60%)]" />
        <div className={`${containerClass} py-12 sm:py-16`}>
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold text-black/70 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-hlgreen-600" />
                Secure sign-in
                <span className="text-black/30">•</span>
                Client portal
              </div>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-hlblack">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-black/60">
                Log in to manage your bookings and get updates.
              </p>
            </div>

            <Card className="mt-8 overflow-hidden rounded-3xl border border-black/5 shadow-sm">
              <CardBody className="p-6 sm:p-7">
                {showError ? (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <div className="font-semibold">Login failed</div>
                    <div className="mt-1 text-red-700/90">{error}</div>
                  </div>
                ) : null}

                <form className="space-y-4" onSubmit={onSubmit} noValidate>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-[38px] z-10 text-black/40">
                      <Mail className="h-4 w-4" />
                    </div>

                    <InputField
                      label="Email"
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError("email");
                        // also clear banner error on interaction
                        if (error) setError(null);
                      }}
                      required
                      className="pl-10"
                      state={fieldErrors.email ? "error" : "default"}
                      error={fieldErrors.email || null}
                    />
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-[38px] z-10 text-black/40">
                      <Lock className="h-4 w-4" />
                    </div>

                    <InputField
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError("password");
                        if (error) setError(null);
                      }}
                      required
                      className="pl-10"
                      state={fieldErrors.password ? "error" : "default"}
                      error={fieldErrors.password || null}
                    />

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-black/50">Keep your account safe.</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full rounded-2xl"
                    loading={busy}
                    disabled={busy}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Login <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>

                  {/* Optional: one-line nudge if fields are wrong but no banner */}
                  {!showError && hasFieldErrors ? (
                    <div className="text-xs text-red-700/80">
                      Please fix the highlighted fields.
                    </div>
                  ) : null}
                </form>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-black/10" />
                  <div className="text-xs font-semibold text-black/40">OR</div>
                  <div className="h-px flex-1 bg-black/10" />
                </div>

                <div className="mt-5 text-center text-sm text-black/60">
                  No account?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-hlgreen-700 hover:underline"
                  >
                    Create one
                  </Link>
                </div>
              </CardBody>
            </Card>

            <div className="mt-6 text-center text-xs text-black/45">
              By logging in, you’ll be able to track statuses like{" "}
              <span className="font-semibold text-black/60">pending</span>,{" "}
              <span className="font-semibold text-black/60">confirmed</span>, and{" "}
              <span className="font-semibold text-black/60">proposed</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
