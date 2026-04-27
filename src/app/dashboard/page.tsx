"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";

const ROLE_ROUTES: Record<string, string> = {
  paciente: "/paciente",
  especialista: "/especialista",
  tutor: "/tutor",
  admin: "/admin",
};

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const destination = ROLE_ROUTES[profile?.role ?? ""] ?? "/login";
      router.replace(destination);
    };

    redirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="h-8 w-8 rounded-full border-4 border-[#136dec] border-t-transparent animate-spin" />
    </div>
  );
}
