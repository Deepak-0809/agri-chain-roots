import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  farmer: string;
  price: number;
  available: number;
}

const initialProducts: Product[] = [
  { id: 1, name: "Organic Tomatoes", farmer: "Jack", price: 2.5, available: 120 },
  { id: 2, name: "Fresh Lettuce", farmer: "GreenFields Co.", price: 1.2, available: 200 },
  { id: 3, name: "Free-range Eggs (dozen)", farmer: "Sunny Farm", price: 3.0, available: 80 },
];

const VendorDashboard = () => {
  const [products] = useState<Product[]>(initialProducts);

  useEffect(() => {
    document.title = "Vendor Dashboard | AgriChain";
  }, []);

  const handlePurchase = (product: Product) => {
    toast.success(`Requested purchase: ${product.name}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Vendor Dashboard — FreshMart</h1>
          <p className="mt-2 text-muted-foreground">Browse available products from farmers. This is demo data for testing.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Farmer:</span> {p.farmer}</p>
                  <p><span className="text-muted-foreground">Price:</span> ${p.price.toFixed(2)}</p>
                  <p><span className="text-muted-foreground">Available:</span> {p.available} units</p>
                </div>
                <Button onClick={() => handlePurchase(p)} className="mt-4 w-full">Purchase</Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
};

export default VendorDashboard;
