import { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CartItem } from "./Menu";

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table");
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>(location.state?.cart || []);
  const [customerMessage, setCustomerMessage] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["restaurant-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_settings")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const totalPriceEUR = cart.reduce(
        (sum, item) => sum + item.price_eur * item.quantity,
        0
      );

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          table_number: tableNumber,
          customer_message: customerMessage.trim() || null,
          status: "pending",
          total_price: totalPriceEUR,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        dish_id: item.dishId,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Commande envoyée avec succès !");
      navigate(`/order-status/${order.id}?table=${encodeURIComponent(tableNumber || "")}`);
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi de la commande");
    },
  });

  const updateQuantity = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.dishId === dishId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.dishId !== dishId));
    toast.success("Article retiré du panier");
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const getCurrencySymbol = () => {
    if (!settings) return "€";
    switch (settings.currency) {
      case "DJF":
        return "Fdj";
      case "USD":
        return "$";
      default:
        return "€";
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Panier vide</h2>
          <p className="text-muted-foreground">
            Ajoutez des plats depuis le menu
          </p>
          <Button
            onClick={() =>
              navigate(`/menu?table=${encodeURIComponent(tableNumber || "")}`)
            }
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Retour au menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-card">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Panier</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Cart Items */}
        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.dishId}
              className="bg-card rounded-lg p-4 shadow-card border border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-muted-foreground">
                    {item.price.toFixed(2)} {getCurrencySymbol()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.dishId, -1)}
                    className="h-8 w-8 border-border"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold w-8 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.dishId, 1)}
                    className="h-8 w-8 border-border"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.dishId)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Message */}
        <div className="bg-card rounded-lg p-4 shadow-card border border-border space-y-2">
          <label className="text-sm font-medium">
            Message pour la cuisine (optionnel)
          </label>
          <Textarea
            placeholder="Ex: pas de piment, sans oignon, extra sauce..."
            value={customerMessage}
            onChange={(e) => setCustomerMessage(e.target.value)}
            className="bg-input border-border text-foreground resize-none"
            rows={3}
          />
        </div>

        {/* Total */}
        <div className="bg-card rounded-lg p-6 shadow-card border border-border">
          <div className="flex items-center justify-between text-2xl font-bold">
            <span>Total</span>
            <span>
              {cartTotal.toFixed(2)} {getCurrencySymbol()}
            </span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
        <div className="container max-w-2xl mx-auto">
          <Button
            onClick={() => createOrderMutation.mutate()}
            disabled={createOrderMutation.isPending}
            className="w-full h-16 text-lg font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-elegant"
          >
            {createOrderMutation.isPending
              ? "Envoi en cours..."
              : "Valider la commande"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;