import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import PaymentDialog from "@/components/PaymentDialog";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  farmer_profile?: {
    display_name: string;
  };
  price_per_unit: number;
  quantity_available: number;
  unit: string;
  status: string;
  harvest_date?: string | null;
  created_at?: string;
  farmer_id: string;
}

const VendorDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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
          description,
          price_per_unit,
          quantity_available,
          unit,
          status,
          harvest_date,
          created_at,
          farmer_id,
          farmer_profile:profiles!farmer_id(display_name)
        `)
        .eq('status', 'available')
        .gt('quantity_available', 0)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
      } else {
        setProducts(productsData || []);
        setFilteredProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        (product.farmer_profile?.display_name || '').toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
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
          
          <div className="mt-6">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search products or farmers..."
              className="max-w-md"
            />
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {filteredProducts.length === 0 && products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No products available</h3>
              <p className="text-muted-foreground">No farmers have listed products yet. Products will appear here when farmers add them.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredProducts.map((p) => (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Farmer:</span> {p.farmer_profile?.display_name || 'Unknown'}</p>
                    <p><span className="text-muted-foreground">Price:</span> ₹{p.price_per_unit.toFixed(2)}/{p.unit}</p>
                    <p><span className="text-muted-foreground">Available:</span> {p.quantity_available} {p.unit}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-2">{p.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <PaymentDialog
                      product={p}
                      trigger={
                        <Button variant="hero" className="flex-1">
                          Purchase
                        </Button>
                      }
                      onPaymentComplete={loadProducts}
                    />
                    <ProductDetailsDialog 
                      product={p}
                      trigger={
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      }
                    />
                  </div>
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