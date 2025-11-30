import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const RestaurantSettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<"EUR" | "DJF" | "USD">("EUR");
  const [eurToDjf, setEurToDjf] = useState("200.00");
  const [eurToUsd, setEurToUsd] = useState("1.10");

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated");
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [navigate]);

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

  useEffect(() => {
    if (settings) {
      setName(settings.name || "Mon Restaurant");
      setCurrency(settings.currency || "EUR");
      setEurToDjf(settings.eur_to_djf?.toString() ?? "200.00");
      setEurToUsd(settings.eur_to_usd?.toString() ?? "1.10");
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;

      const { error } = await supabase
        .from("restaurant_settings")
        .update({
          name: name.trim(),
          currency,
          eur_to_djf: parseFloat(eurToDjf),
          eur_to_usd: parseFloat(eurToUsd),
        })
        .eq("id", settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-settings"] });
      toast.success("Paramètres mis à jour avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  return (
    <div className="min-h-screen p-6">
      <div className="container max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="text-foreground"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </Button>

        <h1 className="text-3xl font-bold">Gestion du Restaurant</h1>

        <Card className="p-6 shadow-elegant border-border space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du restaurant</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon Restaurant"
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="DJF">Franc Djiboutien (Fdj)</SelectItem>
                <SelectItem value="USD">Dollar ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Taux de conversion</h3>
            
            <div className="space-y-2">
              <Label htmlFor="djf">1 EUR = ... Fdj</Label>
              <Input
                id="djf"
                type="number"
                step="0.01"
                value={eurToDjf}
                onChange={(e) => setEurToDjf(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usd">1 EUR = ... USD</Label>
              <Input
                id="usd"
                type="number"
                step="0.01"
                value={eurToUsd}
                onChange={(e) => setEurToUsd(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>

          <Button
            onClick={() => updateSettingsMutation.mutate()}
            disabled={updateSettingsMutation.isPending}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            {updateSettingsMutation.isPending
              ? "Sauvegarde..."
              : "Sauvegarder les modifications"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantSettings;