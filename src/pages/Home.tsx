import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [tableNumber, setTableNumber] = useState("");
  const navigate = useNavigate();

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

  const handleContinue = () => {
    if (tableNumber.trim()) {
      navigate(`/menu?table=${encodeURIComponent(tableNumber.trim())}`);
    }
  };

  const handleSystemAccess = () => {
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <UtensilsCrossed className="w-20 h-20 mx-auto text-foreground" />
          <h1 className="text-4xl font-bold tracking-tight">
            {settings?.name || "Mon Restaurant"}
          </h1>
          <p className="text-lg text-muted-foreground">
            Bienvenue ! Commandez facilement depuis votre table
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-elegant space-y-6">
          <div className="space-y-2">
            <label htmlFor="table" className="text-sm font-medium">
              Numéro de table
            </label>
            <Input
              id="table"
              type="text"
              placeholder="Ex: 12, VIP1, Terrasse..."
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleContinue()}
              className="h-14 text-lg bg-input border-border text-foreground"
            />
          </div>

          <Button
            onClick={handleContinue}
            disabled={!tableNumber.trim()}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Continuer
          </Button>

          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleSystemAccess}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted"
            >
              Système (Administration)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;