import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddProductDialogProps {
  onProductAdded: () => void;
  userId: string;
}

const AddProductDialog = ({ onProductAdded, userId }: AddProductDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity_available: "",
    unit: "kg",
    price_per_unit: "",
    harvest_date: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          farmer_id: userId,
          name: formData.name,
          description: formData.description || null,
          quantity_available: parseInt(formData.quantity_available),
          unit: formData.unit,
          price_per_unit: parseFloat(formData.price_per_unit),
          harvest_date: formData.harvest_date || null,
          status: 'available'
        });

      if (error) {
        console.error('Error adding product:', error);
        toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Product added successfully!" });
        setFormData({
          name: "",
          description: "",
          quantity_available: "",
          unit: "kg",
          price_per_unit: "",
          harvest_date: ""
        });
        setIsOpen(false);
        onProductAdded();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            List a new product for sale to vendors and retailers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Organic Tomatoes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your product"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Available *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity_available}
                onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
                placeholder="100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="dozen">Dozen</SelectItem>
                  <SelectItem value="boxes">Boxes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per {formData.unit} *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price_per_unit}
              onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
              placeholder="2.50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="harvest_date">Harvest Date</Label>
            <Input
              id="harvest_date"
              type="date"
              value={formData.harvest_date}
              onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;