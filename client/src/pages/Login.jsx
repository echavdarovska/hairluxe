import  { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../state/auth";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { Card, CardBody } from "../components/Card";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await login(email, password);
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
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardBody>
          <h2 className="text-2xl font-bold text-hlblack">Login</h2>
          <p className="mt-1 text-sm text-black/60">
            Access your HairLuxe account
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <InputField
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <InputField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              state={error ? "error" : "default"}
              error={error}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={busy}
            >
              Login
            </Button>
          </form>

          <div className="mt-4 text-sm text-black/60">
            No account?{" "}
            <Link
              to="/register"
              className="font-semibold text-hlgreen-700 hover:underline"
            >
              Register
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
