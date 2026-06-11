import { supabase } from "./supabase.client";

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};
