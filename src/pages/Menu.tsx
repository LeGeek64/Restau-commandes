import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import DishCard from "@/components/DishCard";
import CategoryFilter from "@/components/CategoryFilter";

export interface CartItem {
  dishId: string;
  name: string;
  price: number;
  price_eur: number;
  quantity: number;
  notes?: string;
}

const Menu = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNumber = searchParams.get("table");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!tableNumber) {
      navigate("/");
    }
  }, [tableNumber, navigate]);

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

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: dishes } = useQuery({
    queryKey: ["dishes", selectedCategory],
    queryFn: async () => {
      let query = supabase.from("dishes").select("*, categories(name)");
      
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const addToCart = (dishId: string, name: string, price: number, price_eur: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dishId === dishId);
      if (existing) {
        return prev.map((item) =>
          item.dishId === dishId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { dishId, name, price, price_eur, quantity: 1 }];
    });
    toast.success(`${name} ajouté au panier`);
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const convertPrice = (priceEur: number) => {
    if (!settings) return priceEur;
    
    switch (settings.currency) {
      case "DJF":
        return priceEur * settings.eur_to_djf;
      case "USD":
        return priceEur * settings.eur_to_usd;
      default:
        return priceEur;
    }
  };

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

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border shadow-card">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold">{settings?.name || "Menu"}</h1>
              <p className="text-sm text-muted-foreground">Table: {tableNumber}</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="sticky top-[73px] z-10 bg-background border-b border-border">
        <CategoryFilter
          categories={categories || []}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Menu Items */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dishes?.map((dish) => (
            <DishCard
              key={dish.id}
              dish={{
                ...dish,
                price: convertPrice(dish.price_eur),
                currency: getCurrencySymbol(),
              }}
              onAddToCart={() =>
                addToCart(
                  dish.id,
                  dish.name,
                  convertPrice(dish.price_eur),
                  dish.price_eur
                )
              }
            />
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
          <div className="container max-w-2xl mx-auto">
            <Button
              onClick={() =>
                navigate(`/cart?table=${encodeURIComponent(tableNumber || "")}`, {
                  state: { cart },
                })
              }
              className="w-full h-16 text-lg font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-elegant relative"
            >
              <ShoppingCart className="mr-2 h-6 w-6" />
              Voir le panier ({cartItemCount})
              <Badge className="ml-auto bg-secondary-foreground text-secondary">
                {cartTotal.toFixed(2)} {getCurrencySymbol()}
              </Badge>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;