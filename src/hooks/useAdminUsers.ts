import useSWR from "swr";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  is_approved: boolean;
  created_at: string;
}

export function useAdminUsers() {
  const { data, error, isLoading, mutate } = useSWR<Profile[]>(
    "/api/admin/users",
    fetcher,
    { revalidateOnFocus: false }
  );

  const updateUser = async (
    userId: string,
    action: { type: string; role?: string }
  ) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action }),
    });

    if (!res.ok) {
      toast.error("Action failed");
      return;
    }

    toast.success("User updated");
    mutate();
  };

  return {
    users: data ?? [],
    error,
    isLoading,
    mutate,
    updateUser,
  };
}
