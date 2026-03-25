"use client";

import { Button, Card, CardContent } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleCheck = async () => {
    const res = await fetch("/api/auth/check-approval");
    const { approved } = await res.json();

    if (approved) {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--sw-bg) p-4">
      <Card className="w-full max-w-md border border-(--sw-border) text-center">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <Clock className="size-12 text-(--sw-primary)" />
          <h1 className="text-2xl font-bold text-(--sw-text)">
            Awaiting Approval
          </h1>
          <p className="text-sm text-(--sw-text-muted)">
            Your account is pending admin approval. You&apos;ll be able to
            access the dashboard once approved.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onPress={handleCheck}>
              Check Again
            </Button>
            <Button variant="danger" onPress={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
