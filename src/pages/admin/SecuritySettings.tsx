import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SecuritySettings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [adminPinForm, setAdminPinForm] = useState({ current: "", newPin: "", confirm: "" });
  const [securityPinForm, setSecurityPinForm] = useState({ current: "", newPin: "", confirm: "" });

  useEffect(() => {
    if (!sessionStorage.getItem("admin_authenticated")) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const { data: settings } = useQuery({
    queryKey: ["restaurant-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurant_settings").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  const createPinUpdateMutation = (pinType: "admin_pin" | "security_pin", formState: any, setFormState: any) => {
    return useMutation({
      mutationFn: async () => {
        if (!settings) throw new Error("Paramètres non chargés.");
        if (formState.current !== settings[pinType]) throw new Error("Code PIN actuel incorrect.");
        if (formState.newPin !== formState.confirm) throw new Error("Les nouveaux codes PIN ne correspondent pas.");
        if (formState.newPin.length < 4) throw new Error("Le PIN doit contenir au moins 4 caractères.");

        const { error } = await supabase.from("restaurant_settings").update({ [pinType]: formState.newPin }).eq("id", settings.id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["restaurant-settings"] });
        toast.success("Code PIN modifié avec succès");
        setFormState({ current: "", newPin: "", confirm: "" });
      },
      onError: (error: Error) => {
        toast.error(error.message);
      },
    });
  };

  const updateAdminPinMutation = createPinUpdateMutation("admin_pin", adminPinForm, setAdminPinForm);
  const updateSecurityPinMutation = createPinUpdateMutation("security_pin", securityPinForm, setSecurityPinForm);

  const PinForm = ({ title, description, formState, setFormState, mutation }: any) => (
    <Card className="p-6 shadow-elegant border-border space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Code PIN actuel</Label>
          <Input type="password" inputMode="numeric" value={formState.current} onChange={(e) => setFormState({ ...formState, current: e.target.value })} placeholder="••••" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-2">
          <Label>Nouveau code PIN</Label>
          <Input type="password" inputMode="numeric" value={formState.newPin} onChange={(e) => setFormState({ ...formState, newPin: e.target.value })} placeholder="••••" className="bg-input border-border text-foreground" />
        </div>
        <div className="space-y-2">
          <Label>Confirmer le nouveau PIN</Label>
          <Input type="password" inputMode="numeric" value={formState.confirm} onChange={(e) => setFormState({ ...formState, confirm: e.target.value })} placeholder="••••" className="bg-input border-border text-foreground" />
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!formState.current || !formState.newPin || !formState.confirm || mutation.isPending} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
        {mutation.isPending ? "Modification..." : "Modifier le code PIN"}
      </Button>
    </Card>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="container max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="text-foreground">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </Button>

        <div className="flex items-center gap-4">
          <div className="bg-card p-4 rounded-full shadow-elegant">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Sécurité</h1>
        </div>

        <PinForm
          title="Modifier le code PIN du Panneau d'Administration"
          description="Ce code PIN protège l'accès à la page de connexion de l'administration."
          formState={adminPinForm}
          setFormState={setAdminPinForm}
          mutation={updateAdminPinMutation}
        />

        <PinForm
          title="Modifier le code PIN de la section Sécurité"
          description="Ce code PIN protège l'accès à cette page de configuration de la sécurité."
          formState={securityPinForm}
          setFormState={setSecurityPinForm}
          mutation={updateSecurityPinMutation}
        />
      </div>
    </div>
  );
};

export default SecuritySettings;