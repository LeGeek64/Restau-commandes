import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

const CategoriesTab = () => {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      const maxOrder =
        categories?.reduce((max, cat) => Math.max(max, cat.display_order), 0) || 0;

      const { error } = await supabase.from("categories").insert({
        name: newCategoryName.trim(),
        display_order: maxOrder + 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategoryName("");
      toast.success("Catégorie ajoutée");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("categories")
        .update({ name: name.trim() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
      toast.success("Catégorie modifiée");
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Catégorie supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = (id: string) => {
    updateCategoryMutation.mutate({ id, name: editingName });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-elegant border-border">
        <h3 className="text-xl font-semibold mb-4">Ajouter une catégorie</h3>
        <div className="flex gap-3">
          <Input
            placeholder="Nom de la catégorie"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" &&
              newCategoryName.trim() &&
              addCategoryMutation.mutate()
            }
            className="bg-input border-border text-foreground"
          />
          <Button
            onClick={() => addCategoryMutation.mutate()}
            disabled={!newCategoryName.trim() || addCategoryMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      <div className="grid gap-4">
        {categories?.map((category) => (
          <Card
            key={category.id}
            className="p-4 shadow-card border-border hover-scale"
          >
            <div className="flex items-center justify-between gap-4">
              {editingId === category.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 bg-input border-border text-foreground"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      onClick={() => saveEdit(category.id)}
                      className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={cancelEdit}
                      className="border-border"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-lg font-medium flex-1">
                    {category.name}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => startEdit(category.id, category.name)}
                      className="border-border"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => deleteCategoryMutation.mutate(category.id)}
                      className="border-border text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoriesTab;