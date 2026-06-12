import { supabase } from "./supabase.client";

export const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return token ? `Bearer ${token}` : "";
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const signIn = async (formData: { email: string; password: string }) => {
  return await supabase.auth.signInWithPassword(formData);
};

export const updateEmail = async (formData: { email: string }) => {
  return await supabase.auth.updateUser(formData);
};

export const updatePassword = async (formData: {
  newPassword: string;
  currentPassword: string;
}) => {
  return await supabase.auth.updateUser({
    password: formData.newPassword,
    current_password: formData.currentPassword,
  });
};
