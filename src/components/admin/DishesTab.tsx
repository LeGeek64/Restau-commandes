import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DishesTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    isAvailable: true,
  });

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
    queryKey: ["admin-dishes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dishes")
        .select("*, categories(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const getCurrency = () => {
    if (!settings) return { symbol: "€", name: "EUR", rate: 1 };
    switch (settings.currency) {
      case "DJF":
        return { symbol: "Fdj", name: "DJF", rate: settings.eur_to_djf };
      case "USD":
        return { symbol: "$", name: "USD", rate: settings.eur_to_usd };
      default:
        return { symbol: "€", name: "EUR", rate: 1 };
    }
  };

  const convertFromEUR = (price: number) => {
    return price * getCurrency().rate;
  };

  const convertToEUR = (price: number) => {
    return price / getCurrency().rate;
  };

  const saveDishMutation = useMutation({
    mutationFn: async () => {
      const priceInEUR = convertToEUR(parseFloat(formData.price));

      const dishData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price_eur: priceInEUR,
        category_id: formData.categoryId,
        image_url: formData.imageUrl.trim() || null,
        is_available: formData.isAvailable,
      };

      if (editingDish) {
        const { error } = await supabase
          .from("dishes")
          .update(dishData)
          .eq("id", editingDish.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dishes").insert(dishData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dishes"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingDish ? "Plat modifié" : "Plat ajouté");
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  const deleteDishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dishes"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Plat supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      imageUrl: "",
      isAvailable: true,
    });
    setEditingDish(null);
  };

  const openEditDialog = (dish: any) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      description: dish.description || "",
      price: convertFromEUR(dish.price_eur).toFixed(2),
      categoryId: dish.category_id,
      imageUrl: dish.image_url || "",
      isAvailable: dish.is_available,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">Plats</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewDialog}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un plat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {editingDish ? "Modifier le plat" : "Nouveau plat"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom du plat *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Pizza Margherita"
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description du plat..."
                  className="bg-input border-border text-foreground resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prix ({getCurrency().name}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="12.50"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL de l'image</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="bg-input border-border text-foreground"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Disponible</Label>
                <Switch
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isAvailable: checked })
                  }
                />
              </div>

              <Button
                onClick={() => saveDishMutation.mutate()}
                disabled={
                  !formData.name.trim() ||
                  !formData.price ||
                  !formData.categoryId ||
                  saveDishMutation.isPending
                }
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                {saveDishMutation.isPending
                  ? "Sauvegarde..."
                  : editingDish
                  ? "Modifier"
                  : "Ajouter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dishes?.map((dish: any) => (
          <Card
            key={dish.id}
            className="overflow-hidden shadow-card border-border hover-scale"
          >
            {dish.image_url && (
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-lg">{dish.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {dish.categories?.name}
                  </p>
                </div>
                {!dish.is_available && (
                  <Badge variant="destructive">Rupture</Badge>
                )}
              </div>

              {dish.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {dish.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xl font-bold">
                  {convertFromEUR(dish.price_eur).toFixed(2)} {getCurrency().symbol}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => openEditDialog(dish)}
                    className="border-border h-9 w-9"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => deleteDishMutation.mutate(dish.id)}
                    className="border-border text-destructive hover:bg-destructive/10 h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DishesTab;