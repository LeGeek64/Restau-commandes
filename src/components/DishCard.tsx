import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface DishCardProps {
  dish: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    image_url: string | null;
    is_available: boolean;
  };
  onAddToCart: () => void;
}

const DishCard = ({ dish, onAddToCart }: DishCardProps) => {
  return (
    <Card className="overflow-hidden bg-card border-border shadow-card hover-scale">
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
          <h3 className="font-semibold text-lg leading-tight">{dish.name}</h3>
          {!dish.is_available && (
            <Badge variant="destructive" className="shrink-0">
              Rupture
            </Badge>
          )}
        </div>
        
        {dish.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {dish.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-bold">
            {dish.price.toFixed(2)} {dish.currency}
          </span>
          <Button
            onClick={onAddToCart}
            disabled={!dish.is_available}
            size="icon"
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DishCard;