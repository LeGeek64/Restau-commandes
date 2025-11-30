import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UtensilsCrossed,
  ListOrdered,
  Settings,
  ChefHat,
  LogOut,
  Home,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");

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
        .select("admin_pin, security_pin")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    navigate("/");
  };

  const handleSecurityClick = () => {
    setIsPinDialogOpen(true);
  };

  const handlePinSubmit = () => {
    if (settings && pinInput === settings.security_pin) {
      setPinInput("");
      setIsPinDialogOpen(false);
      navigate("/admin/security");
    } else {
      toast.error("Code PIN incorrect");
      setPinInput("");
    }
  };

  const menuItems = [
    {
      title: "Gestion du Restaurant",
      icon: UtensilsCrossed,
      path: "/admin/restaurant",
      description: "Nom, devise, taux de conversion",
    },
    {
      title: "Gestion du Menu",
      icon: ListOrdered,
      path: "/admin/menu",
      description: "Plats, catégories, prix",
    },
    {
      title: "Interface Cuisine",
      icon: ChefHat,
      path: "/kitchen",
      description: "Voir les commandes en temps réel",
    },
    {
      title: "Caisse",
      icon: Landmark,
      path: "/admin/caisse",
      description: "Voir les commandes et les rapports",
    },
    {
      title: "Sécurité",
      icon: Settings,
      path: "/admin/security",
      description: "Changer le code PIN",
      action: handleSecurityClick,
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="container max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Panneau d'Administration</h1>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Accueil
              </Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Déconnexion
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const CardContent = (
              <Card className="p-6 hover-scale cursor-pointer bg-card border-border shadow-card h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            );

            if (item.action) {
              return (
                <div key={item.path} onClick={item.action}>
                  {CardContent}
                </div>
              );
            }

            return (
              <Link key={item.path} to={item.path}>
                {CardContent}
              </Link>
            );
          })}
        </div>
      </div>

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Accès sécurisé</DialogTitle>
            <DialogDescription>
              Veuillez entrer le code PIN pour accéder aux paramètres de
              sécurité.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Code PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="••••"
                className="bg-input border-border text-foreground"
                autoFocus
              />
            </div>
            <Button onClick={handlePinSubmit} className="w-full">
              Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;