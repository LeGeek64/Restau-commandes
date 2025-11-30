import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, ChefHat, Home } from "lucide-react";
import { toast } from "sonner";

const OrderStatus = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNumber = searchParams.get("table");
  const queryClient = useQueryClient();
  const [additionalMessage, setAdditionalMessage] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(
            *,
            dishes(name, price_eur)
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
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

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orders")
        .update({ additional_message: additionalMessage.trim() })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message envoyé à la cuisine");
      setAdditionalMessage("");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du message");
    },
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "En attente",
          icon: Clock,
          color: "bg-destructive text-destructive-foreground",
        };
      case "preparing":
        return {
          label: "En préparation",
          icon: ChefHat,
          color: "bg-accent text-accent-foreground",
        };
      case "ready":
        return {
          label: "Prête",
          icon: CheckCircle2,
          color: "bg-secondary text-secondary-foreground",
        };
      default:
        return {
          label: status,
          icon: Clock,
          color: "bg-muted text-muted-foreground",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Commande introuvable</h2>
          <Button
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen pb-6">
      <header className="bg-card border-b border-border shadow-card">
        <div className="container max-w-2xl mx-auto px-4 py-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Suivi de commande</h1>
          <p className="text-muted-foreground">
            Table {order.table_number} • Commande #{order.id.slice(0, 8)}
          </p>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <Card className="p-6 text-center shadow-elegant border-border">
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full ${statusInfo.color}`}>
              <StatusIcon className="h-12 w-12" />
            </div>
            <div>
              <Badge className={`text-lg px-4 py-2 ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Commande passée à{" "}
                {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-6 shadow-card border-border">
          <h2 className="font-semibold text-lg mb-4">Détails de la commande</h2>
          <div className="space-y-3">
            {order.order_items?.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">{item.dishes.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantité: {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {order.customer_message && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-1">Votre message:</p>
              <p className="text-sm text-muted-foreground">
                {order.customer_message}
              </p>
            </div>
          )}
          {order.additional_message && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-1">Message supplémentaire:</p>
              <p className="text-sm text-muted-foreground">
                {order.additional_message}
              </p>
            </div>
          )}
        </Card>

        {/* Send Additional Message */}
        {order.status !== "ready" && (
          <Card className="p-6 shadow-card border-border">
            <h2 className="font-semibold text-lg mb-4">
              Envoyer un message à la cuisine
            </h2>
            <Textarea
              placeholder="Ex: modifier quelque chose, ajouter une demande..."
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              className="bg-input border-border text-foreground resize-none mb-4"
              rows={3}
            />
            <Button
              onClick={() => sendMessageMutation.mutate()}
              disabled={
                !additionalMessage.trim() || sendMessageMutation.isPending
              }
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {sendMessageMutation.isPending ? "Envoi..." : "Envoyer"}
            </Button>
          </Card>
        )}

        {/* Home Button */}
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="w-full border-border text-foreground hover:bg-muted"
        >
          <Home className="mr-2 h-5 w-5" />
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default OrderStatus;