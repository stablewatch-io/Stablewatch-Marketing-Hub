"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--sw-bg) p-4">
      <Card className="w-full max-w-md border border-(--sw-border)">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <CardTitle className="text-2xl font-bold text-(--sw-primary)">
            Stablewatch AI
          </CardTitle>
          <p className="text-sm text-(--sw-text-muted)">
            Sign in to your account
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
              Sign In
            </Button>
            <p className="text-sm text-center text-(--sw-text-muted)">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-(--sw-primary) font-semibold"
              >
                Register
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
