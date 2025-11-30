import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ChefHat, CheckCircle2, ArrowLeft, History, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Kitchen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch active orders (pending, preparing, ready)
  const { data: activeOrders } = useQuery({
    queryKey: ["kitchen-orders", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items(*, dishes(name))`)
        .in("status", ["pending", "preparing", "ready"])
        .eq("is_archived", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch history orders (completed)
  const { data: historyOrders } = useQuery({
    queryKey: ["kitchen-orders", "history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items(*, dishes(name))`)
        .eq("status", "completed")
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(50); // Limit history to last 50

      if (error) throw error;
      return data;
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("kitchen-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: "pending" | "preparing" | "ready" | "completed";
    }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Statut mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orders")
        .update({ is_archived: true })
        .eq("status", "completed");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Historique vidé");
    },
    onError: () => {
      toast.error("Erreur lors du vidage de l'historique");
    },
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-destructive text-destructive-foreground";
      case "preparing": return "bg-accent text-accent-foreground";
      case "ready": return "bg-secondary text-secondary-foreground";
      case "completed": return "bg-green-600 text-green-50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "preparing": return "En préparation";
      case "ready": return "Prête";
      case "completed": return "Servie";
      default: return status;
    }
  };

  const getTimeSince = (date: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours}h`;
  };

  const renderOrderCard = (order: any) => (
    <Card key={order.id} className="p-6 shadow-elegant border-border space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">Table {order.table_number}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            {getTimeSince(order.created_at)}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Commande #{order.id.slice(0, 8)}
        </p>
        <div className="space-y-1">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
              <span>{item.dishes.name}</span>
              <span className="font-semibold">×{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        {order.status === "pending" && (
          <Button onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "preparing" })}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
            <ChefHat className="mr-2 h-4 w-4" />
            En préparation
          </Button>
        )}
        {order.status === "preparing" && (
          <Button onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "ready" })}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Prête
          </Button>
        )}
        {order.status === "ready" && (
           <Button onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "completed" })}
            className="flex-1 bg-green-600 hover:bg-green-700 text-green-50">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Servie
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="container max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8" />
            Interface Cuisine
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ChefHat className="mr-2 h-4 w-4" />
              Commandes Actives ({activeOrders?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="mr-2 h-4 w-4" />
              Historique ({historyOrders?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {activeOrders && activeOrders.length === 0 && (
              <Card className="p-12 text-center shadow-elegant border-border">
                <p className="text-xl text-muted-foreground">
                  Aucune commande active
                </p>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrders?.map(renderOrderCard)}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="flex justify-end mb-4">
              <Button
                variant="destructive"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={!historyOrders || historyOrders.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Vider l'historique
              </Button>
            </div>
            {historyOrders && historyOrders.length === 0 && (
              <Card className="p-12 text-center shadow-elegant border-border">
                <p className="text-xl text-muted-foreground">
                  L'historique est vide
                </p>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {historyOrders?.map(renderOrderCard)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Kitchen;