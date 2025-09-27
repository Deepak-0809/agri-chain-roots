import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Package, DollarSign, Wheat, QrCode } from "lucide-react";
import EditProductDialog from "./EditProductDialog";
import ProductQRDialog from "./ProductQRDialog";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  quantity_available: number;
  unit: string;
  price_per_unit: number;
  status: string;
  harvest_date?: string | null;
  created_at?: string;
  farmer_id: string;
}

interface ProductDetailsDialogProps {
  product: Product;
  trigger: React.ReactNode;
  isOwner?: boolean;
  onProductUpdated?: () => void;
}

const ProductDetailsDialog = ({ product, trigger, isOwner = false, onProductUpdated }: ProductDetailsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success text-success-foreground";
      case "sold":
        return "bg-primary text-primary-foreground";
      case "in_transit":
        return "bg-warning text-warning-foreground";
      case "out_of_stock":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {product.name}
          </DialogTitle>
          <DialogDescription>
            Detailed information about this product
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge className={getStatusColor(product.status)}>
              {product.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Description */}
          {product.description && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Package className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-lg font-semibold text-foreground">{product.quantity_available}</p>
                <p className="text-xs text-muted-foreground">{product.unit} available</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 text-center">
                <DollarSign className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-lg font-semibold text-foreground">${product.price_per_unit.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">per {product.unit}</p>
              </CardContent>
            </Card>

            {product.harvest_date && (
              <Card>
                <CardContent className="pt-4 text-center">
                  <CalendarDays className="h-6 w-6 text-accent mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">{formatDate(product.harvest_date)}</p>
                  <p className="text-xs text-muted-foreground">Harvest Date</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-4 text-center">
                <Wheat className="h-6 w-6 text-warning mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">{formatDate(product.created_at)}</p>
                <p className="text-xs text-muted-foreground">Listed On</p>
              </CardContent>
            </Card>
          </div>

          {/* Total Value */}
          <Card className="bg-gradient-card">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Inventory Value</p>
              <p className="text-2xl font-bold text-primary">
                ${(product.quantity_available * product.price_per_unit).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            
            {/* QR Code Button - Always visible */}
            <ProductQRDialog 
              product={product}
              trigger={
                <Button variant="outline" className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              }
            />
            
            {isOwner && (
              <EditProductDialog 
                product={product}
                onProductUpdated={onProductUpdated || (() => {})}
                trigger={
                  <Button variant="hero" className="flex-1">
                    Edit Product
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;