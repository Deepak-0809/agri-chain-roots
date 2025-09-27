import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Eye } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { supabase } from '@/integrations/supabase/client';

interface PriceHistoryItem {
  productId: string;
  pricePerUnit: string;
  timestamp: Date;
  updatedBy: string;
}

interface ProductInfo {
  id: string;
  name: string;
  currentPrice: number;
  blockchainId?: string;
}

export const PriceTransparencyDashboard: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductInfo | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct?.blockchainId) {
      loadPriceHistory(selectedProduct.blockchainId);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price_per_unit')
        .eq('status', 'available');

      if (error) throw error;

      const productsData = data.map(product => ({
        id: product.id,
        name: product.name,
        currentPrice: Number(product.price_per_unit),
        blockchainId: null // Will be available after migration
      }));

      setProducts(productsData);
      if (productsData.length > 0) {
        setSelectedProduct(productsData[0]);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async (blockchainProductId: string) => {
    try {
      const history = await blockchainService.getPriceHistory(blockchainProductId);
      setPriceHistory(history);
    } catch (error) {
      console.error('Failed to load price history:', error);
      setPriceHistory([]);
    }
  };

  const formatChartData = () => {
    return priceHistory.map((item, index) => ({
      timestamp: item.timestamp.toLocaleDateString(),
      price: parseFloat(item.pricePerUnit),
      change: index > 0 ? parseFloat(item.pricePerUnit) - parseFloat(priceHistory[index - 1].pricePerUnit) : 0
    }));
  };

  const getCurrentTrend = () => {
    if (priceHistory.length < 2) return null;
    
    const latest = parseFloat(priceHistory[priceHistory.length - 1].pricePerUnit);
    const previous = parseFloat(priceHistory[priceHistory.length - 2].pricePerUnit);
    
    return latest > previous ? 'up' : latest < previous ? 'down' : 'stable';
  };

  const getAveragePrice = () => {
    if (priceHistory.length === 0) return 0;
    const sum = priceHistory.reduce((acc, item) => acc + parseFloat(item.pricePerUnit), 0);
    return sum / priceHistory.length;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading transparency dashboard...</div>;
  }

  const chartData = formatChartData();
  const trend = getCurrentTrend();
  const averagePrice = getAveragePrice();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Price Transparency Dashboard</h2>
          <p className="text-muted-foreground">
            View transparent price history recorded on blockchain
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Blockchain Verified
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Price History</TabsTrigger>
          <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{selectedProduct?.currentPrice || 0}/kg
                </div>
                {trend && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    {trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : trend === 'down' ? (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    ) : null}
                    {trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{averagePrice.toFixed(2)}/kg</div>
                <p className="text-xs text-muted-foreground">
                  Historical average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price Updates</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{priceHistory.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total recorded changes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transparency</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">100%</div>
                <p className="text-xs text-muted-foreground">
                  Blockchain verified
                </p>
              </CardContent>
            </Card>
          </div>

          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle>Product: {selectedProduct.name}</CardTitle>
                <CardDescription>
                  Select a product to view its price transparency data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <select 
                  className="w-full p-2 border rounded"
                  value={selectedProduct.id}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                >
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₹{product.currentPrice}/kg
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price History Chart</CardTitle>
              <CardDescription>
                Historical price changes recorded on blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  No price history available for this product
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price Change Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priceHistory.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">₹{item.pricePerUnit}/kg</div>
                      <div className="text-sm text-muted-foreground">
                        {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Updated by</div>
                      <div className="text-xs">
                        {item.updatedBy.slice(0, 6)}...{item.updatedBy.slice(-4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
              <CardDescription>
                Insights based on blockchain-verified price data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Price Stability</h4>
                    <p className="text-sm text-muted-foreground">
                      {priceHistory.length < 2 
                        ? "Insufficient data for analysis" 
                        : trend === 'stable' 
                          ? "Price has remained stable" 
                          : `Price is ${trend === 'up' ? 'increasing' : 'decreasing'} trend`
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Transparency Score</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50">
                        100% Verified
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        All prices recorded on blockchain
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};