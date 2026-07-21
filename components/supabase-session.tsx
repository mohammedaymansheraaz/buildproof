"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSupabaseConfig } from "@/components/supabase-config-provider";

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const config = useSupabaseConfig();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient(config);
    if (!supabase) {
      setLoading(false);
      return;
    }

    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [config]);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabaseClient(config);
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, [config]);

  return { user, loading, signOut };
}
