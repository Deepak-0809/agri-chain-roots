import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  farmer_profile?: {
    display_name: string;
  };
  price_per_unit: number;
  quantity_available: number;
  unit: string;
  status: string;
}

const VendorDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Vendor Dashboard | AgriChain";
    
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      await loadProducts();
    };

    checkAuth();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        loadProducts();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_per_unit,
          quantity_available,
          unit,
          status,
          farmer_profile:profiles!farmer_id(display_name)
        `)
        .eq('status', 'available')
        .gt('quantity_available', 0)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } else {
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (product: Product) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          product_id: product.id,
          order_type: 'product',
          quantity: 1,
          total_price: product.price_per_unit
        });

      if (error) {
        console.error('Error creating order:', error);
        toast.error('Failed to place order');
      } else {
        toast.success(`Order placed for ${product.name}`);
        // Reload products to update availability
        loadProducts();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Vendor Dashboard — FreshMart</h1>
          <p className="mt-2 text-muted-foreground">Browse available products from farmers. Place orders directly from producers.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No products available</h3>
              <p className="text-muted-foreground">Check back later for fresh products from farmers</p>
            </div>
          ) : (
            products.map((p) => (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Farmer:</span> {p.farmer_profile?.display_name || 'Unknown'}</p>
                    <p><span className="text-muted-foreground">Price:</span> ${p.price_per_unit.toFixed(2)}/{p.unit}</p>
                    <p><span className="text-muted-foreground">Available:</span> {p.quantity_available} {p.unit}</p>
                  </div>
                  <Button onClick={() => handlePurchase(p)} className="mt-4 w-full">
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default VendorDashboard;
