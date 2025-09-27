import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, ShoppingCart, TrendingUp, Wheat, Sprout, QrCode } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import AddProductDialog from "@/components/AddProductDialog";
import ProductDetailsDialog from "@/components/ProductDetailsDialog";
import ProductQRDialog from "@/components/ProductQRDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface Product {
  id: string;
  name: string;
  quantity_available: number;
  unit: string;
  price_per_unit: number;
  status: string;
  harvest_date?: string;
  farmer_id: string;
  description?: string | null;
}

interface Supply {
  id: string;
  name: string;
  supplier_name: string;
  price: number;
  unit: string;
  category: string;
  quantity_available: number;
}

const FarmerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [filteredSupplies, setFilteredSupplies] = useState<Supply[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    monthlySales: 0,
    activeCrops: 0,
    pendingOrders: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      await loadUserData(session.user.id);
    };

    checkAuth();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId?: string) => {
    if (!userId) return;
    try {
      // Load farmer's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', userId)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error loading products:', productsError);
        toast.error('Failed to load products');
      } else {
        setProducts(productsData || []);
        setFilteredProducts(productsData || []);
      }

      // Load supplies
      const { data: suppliesData, error: suppliesError } = await supabase
        .from('supplies')
        .select('*')
        .order('name');

      if (suppliesError) {
        console.error('Error loading supplies:', suppliesError);
        toast.error('Failed to load supplies');
      } else {
        setSupplies(suppliesData || []);
        setFilteredSupplies(suppliesData || []);
      }

      // Calculate stats
      const totalProducts = productsData?.length || 0;
      const activeCrops = productsData?.filter(p => p.status === 'available').length || 0;
      
      // Load orders for stats
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_price, status')
        .eq('seller_id', userId);

      const monthlySales = ordersData?.reduce((sum, order) => sum + (parseFloat(order.total_price.toString()) || 0), 0) || 0;
      const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;

      setStats({
        totalProducts,
        monthlySales,
        activeCrops,
        pendingOrders
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseSupply = async (supply: Supply) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          supply_id: supply.id,
          order_type: 'supply',
          quantity: 1,
          total_price: supply.price
        });

      if (error) {
        console.error('Error creating order:', error);
        toast.error('Failed to place order');
      } else {
        toast.success(`Order placed for ${supply.name}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    }
  };

  const handleSearchProducts = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.status.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  };

  const handleSearchSupplies = (query: string) => {
    if (!query.trim()) {
      setFilteredSupplies(supplies);
    } else {
      const filtered = supplies.filter(supply =>
        supply.name.toLowerCase().includes(query.toLowerCase()) ||
        supply.supplier_name.toLowerCase().includes(query.toLowerCase()) ||
        supply.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSupplies(filtered);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success";
      case "sold":
        return "bg-primary";
      case "in_transit":
        return "bg-warning";
      case "out_of_stock":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-secondary/10 p-4 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Farmer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your crops, track sales, and purchase farming supplies
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card border-border shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Sales</p>
                  <p className="text-2xl font-bold text-foreground">${stats.monthlySales.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Crops</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeCrops}</p>
                </div>
                <Wheat className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2 bg-muted">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Products
            </TabsTrigger>
            <TabsTrigger value="supplies" className="flex items-center gap-2">
              <Sprout className="h-4 w-4" />
              Buy Supplies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card className="bg-gradient-card border-border shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">My Products</CardTitle>
                    <CardDescription>
                      Manage your agricultural products and track their journey
                    </CardDescription>
                  </div>
                  <AddProductDialog 
                    onProductAdded={() => loadUserData(user?.id || '')} 
                    userId={user?.id || ''} 
                  />
                </div>
                
                <div className="mt-4">
                  <SearchBar 
                    onSearch={handleSearchProducts}
                    placeholder="Search your products..."
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProducts.length === 0 && products.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No products listed yet</p>
                      <p className="text-sm text-muted-foreground">Click "Add Product" to get started</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No products match your search</p>
                      <p className="text-sm text-muted-foreground">Try different search terms</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                      >
                        <div className="space-y-1">
                          <h3 className="font-semibold text-foreground">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {product.quantity_available} {product.unit} • 
                            {product.harvest_date && ` Harvested: ${product.harvest_date}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right flex-1">
                            <p className="font-semibold text-foreground">${product.price_per_unit.toFixed(2)}/{product.unit}</p>
                            <Badge className={getStatusColor(product.status)}>
                              {product.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <ProductQRDialog 
                              product={product}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <ProductDetailsDialog 
                              product={product}
                              trigger={
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              }
                              isOwner={true}
                              onProductUpdated={() => loadUserData(user?.id)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-6">
            <Card className="bg-gradient-card border-border shadow-medium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Agricultural Supplies</CardTitle>
                    <CardDescription>
                      Purchase seeds, fertilizers, and other farming essentials
                    </CardDescription>
                  </div>
                  <Button variant="outline">
                    View All Suppliers
                  </Button>
                </div>
                
                <div className="mt-4">
                  <SearchBar 
                    onSearch={handleSearchSupplies}
                    placeholder="Search supplies..."
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSupplies.length === 0 && supplies.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No supplies available</p>
                    </div>
                  ) : filteredSupplies.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No supplies match your search</p>
                    </div>
                  ) : (
                    filteredSupplies.map((supply) => (
                      <div
                        key={supply.id}
                        className="p-4 bg-background rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                      >
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{supply.name}</h3>
                            <p className="text-sm text-muted-foreground">{supply.supplier_name}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{supply.category}</Badge>
                            <p className="font-semibold text-foreground">${supply.price.toFixed(2)}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Available: {supply.quantity_available} {supply.unit}
                          </p>
                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => handlePurchaseSupply(supply)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Purchase
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FarmerDashboard;