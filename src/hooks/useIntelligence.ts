import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PricingEstimate {
  low_estimate: number;
  recommended_estimate: number;
  high_estimate: number;
  base_rate: number;
  travel_cost: number;
  urgency_adjustment: number;
  clustering_discount: number;
  fill_likelihood: "high" | "medium" | "low";
  reasoning: string;
  per_acre: { low: number; recommended: number; high: number };
}

export function usePricingEngine() {
  const [estimate, setEstimate] = useState<PricingEstimate | null>(null);
  const [loading, setLoading] = useState(false);

  const getEstimate = async (params: {
    operation_type: string;
    acreage: number;
    travel_distance?: number;
    urgency?: string;
    crop?: string;
    route_clustered?: boolean;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pricing-engine", {
        body: {
          ...params,
          historical_avg: "38-45",
          field_complexity: "standard",
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return null;
      }
      setEstimate(data as PricingEstimate);
      return data as PricingEstimate;
    } catch (e: any) {
      toast.error(e.message || "Failed to get pricing estimate");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { estimate, loading, getEstimate };
}

export interface JobRecommendation {
  job_id: string;
  score: number;
  reasons: string[];
  job: {
    id: string;
    display_id: string;
    title: string;
    operation_type: string;
    total_acres: number;
    urgency: string;
    estimated_total: number;
    deadline: string;
    field_name: string;
    distance_miles: number | null;
  };
}

export function useJobRecommendations() {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async (params: {
    user_id: string;
    mode: "operator";
    operator_lat: number;
    operator_lng: number;
    service_types: string[];
    max_distance?: number;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-jobs", { body: params });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setRecommendations(data.recommendations || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading, fetchRecommendations };
}
