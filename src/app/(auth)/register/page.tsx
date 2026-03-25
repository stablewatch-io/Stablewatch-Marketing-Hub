"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/pending-approval");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--sw-bg) p-4">
      <Card className="w-full max-w-md border border-(--sw-border)">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <CardTitle className="text-2xl font-bold text-(--sw-primary)">
            Create Account
          </CardTitle>
          <p className="text-sm text-(--sw-text-muted)">
            Register for Stablewatch AI
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-(--sw-text)">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-lg border border-(--sw-border) bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--sw-primary)/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-(--sw-text)">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-(--sw-border) bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--sw-primary)/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-(--sw-text)">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-(--sw-border) bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--sw-primary)/30"
              />
            </div>
            <Button
              type="submit"
              isDisabled={loading}
              className="bg-(--sw-primary) text-white font-bold"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Register
            </Button>
            <p className="text-sm text-center text-(--sw-text-muted)">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-(--sw-primary) font-semibold"
              >
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
