import  { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../state/auth";
import Button from "../components/Button";
import InputField from "../components/InputField";
import { Card, CardBody } from "../components/Card";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await register(name, email, password);
      toast.success("Account created successfully");
      navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.message || "Register failed";
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
          <h2 className="text-2xl font-bold text-hlblack">Register</h2>
          <p className="mt-1 text-sm text-black/60">
            Create your HairLuxe client account
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <InputField
              label="Full name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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
              placeholder="Minimum 6 characters"
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
              Register
            </Button>
          </form>

          <div className="mt-4 text-sm text-black/60">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-hlgreen-700 hover:underline"
            >
              Login
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
