import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import PaymentDialog from "@/components/PaymentDialog";
import { Package, QrCode, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface DistributorProduct {
  id: string;
  product_name: string;
  description?: string | null;
  distributor_id: string;
  farmer_id: string;
  farmer_name: string;
  price_per_unit: number;
  quantity_available: number;
  unit: string;
  status: string;
  received_date?: string | null;
  expiry_date?: string | null;
  original_product_id: string;
  created_at?: string;
}

const ConsumerDashboard = () => {
  const [products, setProducts] = useState<DistributorProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DistributorProduct[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Consumer Dashboard | AgriChain";
    
    // Check authentication and role
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      // Check if user has consumer role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile?.role !== 'consumer') {
        // Redirect to correct dashboard based on role
        switch (profile?.role) {
          case 'farmer':
            navigate('/farmer-dashboard');
            break;
          case 'distributor':
            navigate('/distributor-dashboard');
            break;
          default:
            navigate('/login');
        }
        return;
      }
      
      setUser(session.user);
      await loadDistributorProducts();
    };

    checkAuth();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDistributorProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('distributor_inventory')
        .select('*')
        .eq('status', 'available')
        .gt('quantity_available', 0)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading distributor products:', error);
        toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
      } else {
        setProducts(productsData || []);
        setFilteredProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error loading distributor products:', error);
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
        product.product_name.toLowerCase().includes(query.toLowerCase()) ||
        product.farmer_name.toLowerCase().includes(query.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const handleScanQR = (productId: string) => {
    // Open QR scanner or navigate to QR scanner page
    toast({
      title: "QR Scanner",
      description: "QR code scanner functionality would be implemented here",
    });
  };

  const handleViewSupplyChain = async (originalProductId: string) => {
    try {
      const { data: supplyChain, error } = await supabase
        .from('supply_chain_tracking')
        .select('*')
        .eq('product_id', originalProductId)
        .order('transaction_date', { ascending: true });

      if (error) {
        console.error('Error loading supply chain:', error);
        toast({ title: "Error", description: "Failed to load supply chain data", variant: "destructive" });
        return;
      }

      // Display supply chain information
      toast({
        title: "Supply Chain Tracking",
        description: `Found ${supplyChain?.length || 0} tracking records for this product`,
      });
    } catch (error) {
      console.error('Error loading supply chain:', error);
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
          <h1 className="text-3xl font-semibold tracking-tight">Consumer Dashboard — FreshMart</h1>
          <p className="mt-2 text-muted-foreground">Browse available products from distributors. Track the complete supply chain journey.</p>
          
          <div className="mt-6">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search products, farmers, or distributors..."
              className="max-w-md"
            />
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {filteredProducts.length === 0 && products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No products available</h3>
              <p className="text-muted-foreground">No distributors have listed products yet. Products will appear here when distributors add them.</p>
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
                  <CardTitle className="text-xl">{p.product_name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Farmer:</span> {p.farmer_name}</p>
                    <p><span className="text-muted-foreground">Price:</span> ₹{p.price_per_unit.toFixed(2)}/{p.unit}</p>
                    <p><span className="text-muted-foreground">Available:</span> {p.quantity_available} {p.unit}</p>
                    <p><span className="text-muted-foreground">Received:</span> {p.received_date ? new Date(p.received_date).toLocaleDateString() : 'N/A'}</p>
                    {p.expiry_date && (
                      <p><span className="text-muted-foreground">Expires:</span> {new Date(p.expiry_date).toLocaleDateString()}</p>
                    )}
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-2">{p.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <PaymentDialog
                      product={{
                        id: p.original_product_id,
                        name: p.product_name,
                        price_per_unit: p.price_per_unit,
                        quantity_available: p.quantity_available,
                        unit: p.unit,
                        farmer_id: p.farmer_id
                      }}
                      trigger={
                        <Button variant="hero" className="flex-1">
                          Purchase
                        </Button>
                      }
                      onPaymentComplete={loadDistributorProducts}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewSupplyChain(p.original_product_id)}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Track
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleScanQR(p.original_product_id)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
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

export default ConsumerDashboard;