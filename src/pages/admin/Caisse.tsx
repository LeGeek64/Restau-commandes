import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Landmark, Wallet, Receipt, Clock, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Caisse = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getTodayDateRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const { data: settings } = useQuery({
    queryKey: ["restaurant-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurant_settings").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  const { data: todayOrders } = useQuery({
    queryKey: ["caisse-orders", getTodayDateRange().start.toISOString().slice(0, 10)],
    queryFn: async () => {
      const { start, end } = getTodayDateRange();
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, dishes(name))")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  const markAsPaidMutation = useMutation({
    mutationFn: async (orderId: string) => {
        const { error } = await supabase.from("orders").update({ is_paid: true }).eq("id", orderId);
        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["caisse-orders"] });
        toast.success("Commande marquée comme payée !");
    },
    onError: () => toast.error("Erreur lors de la mise à jour.")
  });

  const clearPaidOrdersMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orders")
        .update({ is_archived: true })
        .eq("is_paid", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-orders"] });
      toast.success("Commandes payées archivées");
    },
    onError: () => toast.error("Erreur lors de l'archivage."),
  });

  const { paidOrders, toPayOrders, activeOrders } = useMemo(() => {
    const paid = todayOrders?.filter(o => o.is_paid) || [];
    const toPay = todayOrders?.filter(o => o.status === 'completed' && !o.is_paid) || [];
    const active = todayOrders?.filter(o => ['pending', 'preparing', 'ready'].includes(o.status) && !o.is_paid) || [];
    return { paidOrders: paid, toPayOrders: toPay, activeOrders: active };
  }, [todayOrders]);

  const dailyStats = useMemo(() => {
    const totalRevenueEUR = paidOrders.reduce((sum, order) => sum + order.total_price, 0);
    return {
      orderCount: paidOrders.length,
      totalRevenue: totalRevenueEUR,
    };
  }, [paidOrders]);

  const getCurrency = () => {
    if (!settings) return { symbol: "€", rate: 1 };
    switch (settings.currency) {
      case "DJF": return { symbol: "Fdj", rate: settings.eur_to_djf };
      case "USD": return { symbol: "$", rate: settings.eur_to_usd };
      default: return { symbol: "€", rate: 1 };
    }
  };

  const convertFromEUR = (price: number) => price * getCurrency().rate;

  const getStatusLabel = (status: string) => ({'pending': 'En attente', 'preparing': 'En préparation', 'ready': 'Prête', 'completed': 'Servie'}[status] || status);
  const getStatusColor = (status: string) => ({'pending': 'bg-red-500', 'preparing': 'bg-yellow-500', 'ready': 'bg-blue-500', 'completed': 'bg-green-500'}[status] || 'bg-gray-500');

  const OrderList = ({ orders, showClearButton = false }: { orders: any[], showClearButton?: boolean }) => (
    <div className="space-y-4">
      {showClearButton && orders.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => clearPaidOrdersMutation.mutate()}
            disabled={clearPaidOrdersMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Vider les commandes payées
          </Button>
        </div>
      )}
      {orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Aucune commande dans cette catégorie.</p>
      ) : (
        orders.map(order => (
          <Card key={order.id} className="p-4 border-border shadow-card">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">Table {order.table_number} <span className="font-light text-sm text-muted-foreground">#{order.id.slice(0, 4)}</span></h4>
                <p className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> {new Date(order.created_at).toLocaleTimeString()}</p>
                <Badge className={`${getStatusColor(order.status)} text-white mt-2`}>{getStatusLabel(order.status)}</Badge>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{convertFromEUR(order.total_price).toFixed(2)} {getCurrency().symbol}</p>
                {order.status === 'completed' && !order.is_paid && (
                  <Button size="sm" className="mt-2" onClick={() => markAsPaidMutation.mutate(order.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Marquer comme Payée
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-6">
      <div className="container max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="text-foreground">
          <ArrowLeft className="mr-2 h-5 w-5" /> Retour
        </Button>
        <div className="flex items-center gap-4">
          <div className="bg-card p-4 rounded-full shadow-elegant"><Landmark className="h-8 w-8 text-primary" /></div>
          <h1 className="text-3xl font-bold">Interface Caisse</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'affaires (Aujourd'hui)</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{convertFromEUR(dailyStats.totalRevenue).toFixed(2)} {getCurrency().symbol}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes Payées (Aujourd'hui)</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyStats.orderCount}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="toPay">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="toPay">À Payer ({toPayOrders.length})</TabsTrigger>
            <TabsTrigger value="active">En Cours ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="paid">Payées ({paidOrders.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="toPay"><OrderList orders={toPayOrders} /></TabsContent>
          <TabsContent value="active"><OrderList orders={activeOrders} /></TabsContent>
          <TabsContent value="paid"><OrderList orders={paidOrders} showClearButton={true} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Caisse;
