/**
 * Storefront — Public-facing product listing with hosted Stripe Checkout.
 *
 * Payment flow:
 * 1. Page loads all active platform_products from the database.
 * 2. Each product shows its name, price, seller info, and a "Buy" button.
 * 3. Clicking "Buy" calls the stripe-checkout edge function.
 * 4. The edge function creates a Checkout Session with destination charges
 *    (platform keeps a fee, rest goes to the connected operator account).
 * 5. User is redirected to Stripe's hosted checkout page.
 * 6. On success, user returns here with ?status=success.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ShoppingCart,
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  User,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

/* ── Types ── */
interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  pricing_type: string;
  stripe_product_id: string;
  stripe_price_id: string | null;
  connected_account_id: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export default function Storefront() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  // ── Check for return-from-checkout status in URL ──
  const checkoutStatus = searchParams.get("status");

  // ── Fetch all active products ──
  const { data: products = [], isLoading } = useQuery<StorefrontProduct[]>({
    queryKey: ["storefront-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StorefrontProduct[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            Service Storefront
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and purchase agricultural services from verified operators.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── Checkout return banners ── */}
        {checkoutStatus === "success" && (
          <div className="flex items-center gap-3 rounded border border-green-600/30 bg-green-950/20 px-4 py-3 text-sm">
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Payment successful!</p>
              <p className="text-muted-foreground">
                Your purchase is confirmed. The operator will be notified.
              </p>
            </div>
          </div>
        )}
        {checkoutStatus === "cancelled" && (
          <div className="flex items-center gap-3 rounded border border-yellow-600/30 bg-yellow-950/20 px-4 py-3 text-sm">
            <XCircle size={16} className="text-yellow-500 shrink-0" />
            <p className="text-muted-foreground">
              Checkout was cancelled. No charge was made.
            </p>
          </div>
        )}

        {/* ── Product grid ── */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package size={24} />}
            title="No services available"
            description="Check back soon — operators are adding services."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({
  product,
  isAuthenticated,
}: {
  product: StorefrontProduct;
  isAuthenticated: boolean;
}) {
  const [loading, setLoading] = useState(false);

  /**
   * handleBuy — initiates the Stripe Checkout flow.
   *
   * 1. Calls stripe-checkout edge function with the product ID.
   * 2. Receives a Stripe Checkout Session URL.
   * 3. Redirects the browser to Stripe's hosted page.
   *
   * The edge function configures destination charges so:
   * - Customer pays the full price on the platform.
   * - Platform keeps the application_fee_amount (commission).
   * - Remaining amount is auto-transferred to the operator's connected account.
   */
  const handleBuy = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to purchase services.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-checkout",
        { body: { product_id: product.id } }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Redirect to Stripe's hosted checkout page
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded border bg-card flex flex-col">
      {/* Card body */}
      <div className="p-4 flex-1 space-y-2">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>

        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Seller badge */}
        {product.connected_account_id && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <User size={10} />
            <span className="truncate max-w-[140px]">
              Operator {product.connected_account_id.slice(0, 12)}…
            </span>
          </div>
        )}

        {/* Pricing type badge */}
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground">
          {product.pricing_type === "recurring" ? "Monthly" : "One-time"}
        </span>
      </div>

      {/* Card footer — price + buy */}
      <div className="border-t px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold tabular-nums">
            {formatCurrency(product.amount_cents / 100)}
          </span>
          {product.pricing_type === "recurring" && (
            <span className="text-xs text-muted-foreground">/mo</span>
          )}
        </div>

        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={handleBuy}
          disabled={loading || !product.connected_account_id}
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Processing…
            </>
          ) : !product.connected_account_id ? (
            "Seller not onboarded"
          ) : (
            <>
              <ExternalLink size={12} /> Buy Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
