import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const RoleSelect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Select Role | AgriChain";
  }, []);

  const handleFarmer = () => {
    toast.success("Continuing as Jack (Farmer)");
    navigate("/farmer-dashboard");
  };

  const handleVendor = () => {
    toast.success("Continuing as FreshMart (Vendor)");
    navigate("/vendor-dashboard");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Select role for testing</h1>
          <p className="mt-2 text-muted-foreground">No login required. Choose a test profile to continue.</p>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Farmer (Jack)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Manage crops, products, and supplies.</p>
              <Button onClick={handleFarmer} className="w-full">Continue as Jack</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Vendor (FreshMart)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Browse and purchase from farmers.</p>
              <Button variant="secondary" onClick={handleVendor} className="w-full">Continue as FreshMart</Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default RoleSelect;
