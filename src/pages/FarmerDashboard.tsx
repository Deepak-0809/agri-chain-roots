import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, ShoppingCart, TrendingUp, Wheat, Sprout } from "lucide-react";

const FarmerDashboard = () => {
  const [products] = useState([
    {
      id: 1,
      name: "Organic Tomatoes",
      quantity: "500 kg",
      price: "$3.50/kg",
      status: "Available",
      harvestDate: "2024-09-10",
    },
    {
      id: 2,
      name: "Fresh Lettuce",
      quantity: "200 kg",
      price: "$2.80/kg",
      status: "Sold",
      harvestDate: "2024-09-08",
    },
    {
      id: 3,
      name: "Corn",
      quantity: "1000 kg",
      price: "$1.20/kg",
      status: "In Transit",
      harvestDate: "2024-09-05",
    },
  ]);

  const [supplies] = useState([
    {
      id: 1,
      name: "Tomato Seeds (Hybrid)",
      supplier: "Green Seeds Co.",
      price: "$45.00",
      quantity: "1 kg",
      category: "Seeds",
    },
    {
      id: 2,
      name: "Organic Fertilizer",
      supplier: "EcoGrow Solutions",
      price: "$28.50",
      quantity: "25 kg",
      category: "Fertilizer",
    },
    {
      id: 3,
      name: "Lettuce Seeds",
      supplier: "Fresh Start Seeds",
      price: "$32.00",
      quantity: "500g",
      category: "Seeds",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-success";
      case "Sold":
        return "bg-primary";
      case "In Transit":
        return "bg-warning";
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
                  <p className="text-2xl font-bold text-foreground">12</p>
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
                  <p className="text-2xl font-bold text-foreground">$3,240</p>
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
                  <p className="text-2xl font-bold text-foreground">8</p>
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
                  <p className="text-2xl font-bold text-foreground">5</p>
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
                  <Button variant="hero">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                    >
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {product.quantity} • Harvested: {product.harvestDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{product.price}</p>
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
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
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supplies.map((supply) => (
                    <div
                      key={supply.id}
                      className="p-4 bg-background rounded-lg border border-border hover:shadow-soft transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{supply.name}</h3>
                          <p className="text-sm text-muted-foreground">{supply.supplier}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{supply.category}</Badge>
                          <p className="font-semibold text-foreground">{supply.price}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">Quantity: {supply.quantity}</p>
                        <Button variant="success" className="w-full">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase
                        </Button>
                      </div>
                    </div>
                  ))}
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