import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFields() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["fields", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fields")
        .select(`
          *,
          farms!inner(name, county, state, total_acres, owner_id)
        `)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useField(fieldId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["field", fieldId],
    enabled: !!user && !!fieldId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fields")
        .select(`
          *,
          farms!inner(name, county, state, owner_id),
          field_access_instructions(*),
          field_requirements(*)
        `)
        .eq("id", fieldId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useFarms() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["farms", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farms")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}
