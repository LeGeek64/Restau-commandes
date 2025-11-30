import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const CategoryFilter = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) => {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 p-4">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => onSelectCategory(null)}
          className={
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "border-border text-foreground hover:bg-muted"
          }
        >
          Tout
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => onSelectCategory(category.id)}
            className={
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "border-border text-foreground hover:bg-muted"
            }
          >
            {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default CategoryFilter;