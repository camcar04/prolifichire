/**
 * ProductManager — UI for creating and listing platform-level Stripe products.
 * Products are created on the platform account with a mapping to the user's connected account.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/format";
import {
  Package, Plus, Loader2, CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface PlatformProduct {
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
}

export function ProductManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // ── Fetch user's products from the database ──
  const { data: products = [], isLoading } = useQuery<PlatformProduct[]>({
    queryKey: ["platform-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_products")
        .select("*")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PlatformProduct[];
    },
  });

  // ── Create product mutation ──
  const createProduct = useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      amount_cents: number;
      pricing_type: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "stripe-create-product",
        { body: params }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-products"] });
      setShowForm(false);
      toast.success("Product created successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create product");
    },
  });

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Package size={14} /> Products
        </h2>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowForm(true)}
          >
            <Plus size={11} /> New Product
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <CreateProductForm
          onSubmit={(params) => createProduct.mutate(params)}
          onCancel={() => setShowForm(false)}
          isSubmitting={createProduct.isPending}
        />
      )}

      {/* Product list */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : products.length === 0 && !showForm ? (
        <EmptyState
          icon={<Package size={20} />}
          title="No products yet"
          description="Create a product to start accepting payments for your services."
          action={{ label: "Create Product", onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="rounded border bg-card divide-y">
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Create Product Form ── */
function CreateProductForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (params: {
    name: string;
    description: string;
    amount_cents: number;
    pricing_type: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [pricingType, setPricingType] = useState("one_time");

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const isValid = name.trim().length > 0 && amountCents >= 50;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      amount_cents: amountCents,
      pricing_type: pricingType,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border bg-card p-4 space-y-3"
    >
      <div className="space-y-1.5">
        <Label className="text-xs">
          Product Name <span className="text-destructive">*</span>
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spray Service — 100ac"
          className="h-8 text-sm"
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="h-8 text-sm"
          maxLength={500}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">
            Price (USD) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-8 text-sm pl-6"
              min="0.50"
              step="0.01"
            />
          </div>
          {amount && amountCents < 50 && (
            <p className="text-[10px] text-destructive flex items-center gap-1">
              <AlertTriangle size={9} /> Minimum $0.50
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Pricing Type</Label>
          <Select value={pricingType} onValueChange={setPricingType}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">One-time</SelectItem>
              <SelectItem value="recurring">Recurring (monthly)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          className="h-8 text-xs gap-1"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Creating…
            </>
          ) : (
            <>
              <CheckCircle2 size={12} /> Create Product
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ── Product Row ── */
function ProductRow({ product }: { product: PlatformProduct }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{product.name}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{product.pricing_type === "recurring" ? "Monthly" : "One-time"}</span>
          {product.connected_account_id && (
            <>
              <span>·</span>
              <span className="truncate max-w-[120px]" title={product.connected_account_id}>
                {product.connected_account_id.slice(0, 12)}…
              </span>
            </>
          )}
          {product.description && (
            <>
              <span>·</span>
              <span className="truncate max-w-[200px]">{product.description}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-sm font-medium tabular">
          {formatCurrency(product.amount_cents / 100)}
          {product.pricing_type === "recurring" && (
            <span className="text-[10px] text-muted-foreground">/mo</span>
          )}
        </p>
        {product.is_active ? (
          <span className="text-[10px] text-success flex items-center gap-0.5">
            <CheckCircle2 size={9} /> Active
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <XCircle size={9} /> Archived
          </span>
        )}
      </div>
    </div>
  );
}
