// src/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:          AsyncStorage,
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});

// ─── Auth helpers ─────────────────────────────────────────────────────
export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google' });

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signOut = () => supabase.auth.signOut();

export const deleteAccount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Deletar dados das tabelas públicas (Cascade costuma estar ativo, mas garantimos aqui)
  // Nota: Deletar o usuário do AUTH requer uma Edge Function ou chave Service Role.
  // Para conformidade com a Play Store, deletar os dados do perfil e deslogar é o primeiro passo essencial.
  await supabase.from('profiles').delete().eq('id', user.id);
  
  return signOut();
};

export const getCurrentUser = () => supabase.auth.getUser();
