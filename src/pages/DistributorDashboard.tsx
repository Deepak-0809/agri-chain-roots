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

interface DistributorInventoryItem {
  id: string;
  product_name: string;
  description?: string | null;
  farmer_id: string;
  farmer_name: string;
  price_per_unit: number;
  quantity_available: number;
  unit: string;
  status: string;
  received_date?: string | null;
  expiry_date?: string | null;
  created_at?: string;
  original_product_id: string;
  distributor_id: string;
}

const DistributorDashboard = () => {
  const [inventory, setInventory] = useState<DistributorInventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<DistributorInventoryItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Distributor Dashboard | AgriChain";
    
    // Check authentication and role
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      // Check if user has distributor role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile?.role !== 'distributor') {
        // Redirect to correct dashboard based on role
        switch (profile?.role) {
          case 'farmer':
            navigate('/farmer-dashboard');
            break;
          case 'consumer':
            navigate('/consumer-dashboard');
            break;
          default:
            navigate('/login');
        }
        return;
      }
      
      setUser(session.user);
      await loadInventory();
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

  const loadInventory = async () => {
    try {
      if (!user) return;
      
      const { data: inventoryData, error } = await supabase
        .from('distributor_inventory')
        .select('*')
        .eq('distributor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading inventory:', error);
        toast({ title: "Error", description: "Failed to load inventory", variant: "destructive" });
      } else {
        setInventory(inventoryData || []);
        setFilteredInventory(inventoryData || []);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({ title: "Error", description: "Failed to load inventory", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(item =>
        item.product_name.toLowerCase().includes(query.toLowerCase()) ||
        item.farmer_name.toLowerCase().includes(query.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(query.toLowerCase())
      );
      setFilteredInventory(filtered);
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
          <h1 className="text-3xl font-semibold tracking-tight">Distributor Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your inventory and track product distribution.</p>
          
          <div className="mt-6">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search your inventory..."
              className="max-w-md"
            />
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {filteredInventory.length === 0 && inventory.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No inventory items</h3>
              <p className="text-muted-foreground">Your distributor inventory is empty. Purchase products from farmers to start distributing.</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No items found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredInventory.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{item.product_name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Farmer:</span> {item.farmer_name}</p>
                    <p><span className="text-muted-foreground">Price:</span> ₹{item.price_per_unit.toFixed(2)}/{item.unit}</p>
                    <p><span className="text-muted-foreground">Available:</span> {item.quantity_available} {item.unit}</p>
                    <p><span className="text-muted-foreground">Status:</span> <span className={`inline-block px-2 py-1 rounded-full text-xs ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.status}</span></p>
                    <p><span className="text-muted-foreground">Received:</span> {item.received_date ? new Date(item.received_date).toLocaleDateString() : 'N/A'}</p>
                    {item.expiry_date && (
                      <p><span className="text-muted-foreground">Expires:</span> {new Date(item.expiry_date).toLocaleDateString()}</p>
                    )}
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-2">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1">
                      Manage Stock
                    </Button>
                    <Button variant="outline" size="sm">
                      Details
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

export default DistributorDashboard;