"use server";

import { createAdminClient } from "../../utils/supabase/admin";

export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string,
  role: "tutor" | "paciente" | "especialista"
) {
  const supabase = createAdminClient();

  const { error: profileError } = await supabase.from("profiles").insert({
    id:        userId,
    role,
    email,
    full_name: fullName,
  });
  if (profileError) throw new Error(profileError.message);

  if (role === "paciente") {
    const { error } = await supabase
      .from("patients")
      .insert({ id: userId, status: "active" });
    if (error) throw new Error(error.message);
  } else if (role === "especialista") {
    const { error } = await supabase.from("specialists").insert({
      id:          userId,
      specialty:   "Psicología General",
      rating:      0,
      hourly_rate: 0,
    });
    if (error) throw new Error(error.message);
  }
}
