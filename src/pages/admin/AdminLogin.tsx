import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
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

  const handleSubmit = () => {
    if (!settings) return;

    if (pin === settings.admin_pin) {
      sessionStorage.setItem("admin_authenticated", "true");
      navigate("/admin");
      toast.success("Accès autorisé");
    } else {
      setAttempts((prev) => prev + 1);
      toast.error("Code PIN incorrect");
      setPin("");

      if (attempts >= 2) {
        toast.error("Trop de tentatives. Veuillez réessayer plus tard.");
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-foreground"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </Button>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-card p-6 rounded-full shadow-elegant">
              <Lock className="w-12 h-12 text-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground">
            Entrez le code PIN pour accéder au système
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-elegant space-y-6">
          <div className="space-y-2">
            <label htmlFor="pin" className="text-sm font-medium">
              Code PIN
            </label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              className="h-14 text-2xl text-center tracking-widest bg-input border-border text-foreground"
              maxLength={6}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={pin.length === 0}
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Valider
          </Button>

          {attempts > 0 && (
            <p className="text-sm text-center text-destructive">
              Tentatives restantes: {3 - attempts}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;