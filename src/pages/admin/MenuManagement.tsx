import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import CategoriesTab from "@/components/admin/CategoriesTab";
import DishesTab from "@/components/admin/DishesTab";

const MenuManagement = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated");
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen p-6">
      <div className="container max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="text-foreground"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </Button>

        <h1 className="text-3xl font-bold">Gestion du Menu</h1>

        <Tabs defaultValue="dishes" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="dishes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Plats
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Catégories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dishes">
            <DishesTab />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MenuManagement;