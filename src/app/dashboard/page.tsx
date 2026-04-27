"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";
import { ROLE_ROUTES, resolveUserRole } from "../../lib/auth/role";

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

      const role = await resolveUserRole(supabase, user);
      const destination = role ? ROLE_ROUTES[role] : "/dashboard";
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
