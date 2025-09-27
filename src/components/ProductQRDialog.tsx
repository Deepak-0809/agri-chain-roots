import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Download, Share2, Copy, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface ProductQRDialogProps {
  product: Product;
  trigger: React.ReactNode;
}

const ProductQRDialog = ({ product, trigger }: ProductQRDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(product);
  const { toast } = useToast();

  // Real-time sync: Update product data when it changes in the database
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${product.id}`
        },
        (payload) => {
          console.log('Product updated:', payload);
          if (payload.new) {
            setCurrentProduct(payload.new as Product);
            // Regenerate QR code with updated data
            if (qrCode) {
              generateQRCode();
            }
            toast({
              title: "Product Updated",
              description: "Product information has been updated and QR code refreshed.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, product.id, qrCode]);

  // Sync current product with prop changes
  useEffect(() => {
    setCurrentProduct(product);
  }, [product]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      console.log('🔍 Generating QR code for product:', currentProduct.id, currentProduct.name);
      
      const { data, error } = await supabase.functions.invoke('generate-product-qr', {
        body: { productId: currentProduct.id }
      });

      console.log('📡 QR generation response:', { data, error });

      if (error) {
        console.error('QR generation error:', error);
        throw error;
      }

      if (data.success) {
        console.log('✅ QR code generated successfully:', data.qrCode ? 'QR code received' : 'No QR code');
        setQRCode(data.qrCode);
        setProductUrl(data.productUrl);
        toast({
          title: "QR Code Generated",
          description: "Product QR code created successfully!",
        });
      } else {
        console.error('❌ QR generation failed:', data.error);
        throw new Error(data.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('💥 Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (productUrl) {
      try {
        await navigator.clipboard.writeText(productUrl);
        toast({
          title: "URL Copied",
          description: "Product URL copied to clipboard!",
        });
      } catch (error) {
        console.error('Failed to copy URL:', error);
        toast({
          title: "Error",
          description: "Failed to copy URL to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `${product.name}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded",
        description: "QR code saved to your device!",
      });
    }
  };

  const handleShare = async () => {
    if (productUrl && navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} - Product Details`,
          text: `Check out this product from AgriChain: ${product.name}`,
          url: productUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copy URL
        handleCopyUrl();
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl();
    }
  };

  const handleRefreshQR = async () => {
    // Fetch latest product data and regenerate QR code
    try {
      const { data: latestProduct, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();

      if (error) throw error;
      
      if (latestProduct) {
        setCurrentProduct(latestProduct);
        await generateQRCode();
        toast({
          title: "QR Code Refreshed",
          description: "QR code updated with latest product information.",
        });
      }
    } catch (error) {
      console.error('Error refreshing product data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh product data.",
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    if (!qrCode) {
      generateQRCode();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleOpenDialog}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Product QR Code
          </DialogTitle>
          <DialogDescription>
            Generate and share a QR code for {currentProduct.name}
            <br />
            <span className="text-xs text-muted-foreground">
              QR code automatically updates when product information changes
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Info */}
          <Card className="bg-gradient-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{currentProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${currentProduct.price_per_unit.toFixed(2)} per {currentProduct.unit} • {currentProduct.quantity_available} {currentProduct.unit} available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: <span className="capitalize">{currentProduct.status.replace('_', ' ')}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshQR}
                  className="ml-2"
                  disabled={isGenerating}
                >
                  <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          {isGenerating ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Generating QR code...</p>
              </CardContent>
            </Card>
          ) : qrCode ? (
            <Card>
              <CardContent className="pt-4 text-center">
                <img 
                  src={qrCode} 
                  alt="Product QR Code" 
                  className="w-48 h-48 mx-auto mb-4 border-2 border-border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mb-4">
                  Scan this QR code to view real-time product information
                  <br />
                  <span className="text-xs font-medium text-primary">
                    Always shows current data • Last updated: {new Date().toLocaleTimeString()}
                  </span>
                </p>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadQR}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShare}
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyUrl}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a QR code to share product details
                </p>
                <Button onClick={generateQRCode} variant="hero">
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Box */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <h4 className="font-medium text-foreground mb-2">Why use QR codes?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Instant access to product details</li>
                <li>• Real-time inventory updates</li>
                <li>• Blockchain-verified transparency</li>
                <li>• Works on any smartphone</li>
              </ul>
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQRDialog;