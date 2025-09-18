import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Smartphone, CreditCard, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price_per_unit: number;
  unit: string;
  farmer_id: string;
  quantity_available: number;
}

interface PaymentDialogProps {
  product: Product;
  trigger: React.ReactNode;
  onPaymentComplete: () => void;
}

const PaymentDialog = ({ product, trigger, onPaymentComplete }: PaymentDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'qr' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [upiId, setUpiId] = useState("farmer@paytm"); // Demo UPI ID

  const totalAmount = (product.price_per_unit * quantity).toFixed(2);
  
  // Generate UPI payment link
  const upiLink = `upi://pay?pa=${upiId}&pn=FreshMart%20Farmer&am=${totalAmount}&cu=INR&tn=Payment%20for%20${encodeURIComponent(product.name)}`;
  
  // QR Code data (you would normally generate this with a library)
  const qrData = upiLink;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiLink);
    toast({ title: "Copied!", description: "UPI link copied to clipboard" });
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Please log in to complete purchase", variant: "destructive" });
        return;
      }

      // Create order in database
      const { error } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: product.farmer_id,
          product_id: product.id,
          quantity: quantity,
          total_price: parseFloat(totalAmount),
          order_type: 'product',
          status: 'completed',
          notes: `Payment via ${paymentMethod?.toUpperCase()}`
        });

      if (error) {
        console.error('Error creating order:', error);
        toast({ title: "Error", description: "Failed to process order", variant: "destructive" });
      } else {
        setPaymentCompleted(true);
        toast({ title: "Success!", description: "Payment completed successfully!" });
        
        // Update product quantity
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            quantity_available: product.quantity_available - quantity 
          })
          .eq('id', product.id);

        if (updateError) {
          console.error('Error updating product quantity:', updateError);
        }

        setTimeout(() => {
          setIsOpen(false);
          onPaymentComplete();
          // Reset state
          setPaymentCompleted(false);
          setPaymentMethod(null);
          setQuantity(1);
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({ title: "Error", description: "Payment failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Purchase</DialogTitle>
          <DialogDescription>
            Buy {product.name} from farmer
          </DialogDescription>
        </DialogHeader>

        {paymentCompleted ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">Your order has been placed successfully.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product:</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per {product.unit}:</span>
                    <span>₹{product.price_per_unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="quantity">Quantity:</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                    />
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-primary">₹{totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            {!paymentMethod && (
              <div className="space-y-4">
                <h3 className="font-semibold">Choose Payment Method:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <Smartphone className="h-6 w-6" />
                    <span>UPI Payment</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => setPaymentMethod('qr')}
                  >
                    <QrCode className="h-6 w-6" />
                    <span>QR Code</span>
                  </Button>
                </div>
              </div>
            )}

            {/* UPI Payment */}
            {paymentMethod === 'upi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">UPI Payment</h3>
                  <Badge variant="secondary">Secure</Badge>
                </div>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label>UPI ID:</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input value={upiId} readOnly className="font-mono" />
                          <Button size="sm" variant="outline" onClick={handleCopyUPI}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Amount: ₹{totalAmount}</Label>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => window.open(upiLink, '_blank')}
                      >
                        Pay with UPI App
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Button 
                  variant="hero" 
                  className="w-full" 
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Confirm Payment"}
                </Button>
              </div>
            )}

            {/* QR Code Payment */}
            {paymentMethod === 'qr' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">QR Code Payment</h3>
                  <Badge variant="secondary">Scan & Pay</Badge>
                </div>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <div className="w-40 h-40 bg-black/10 rounded flex items-center justify-center">
                        <QrCode className="h-20 w-20 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan with any UPI app to pay ₹{totalAmount}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      UPI ID: {upiId}
                    </div>
                  </CardContent>
                </Card>
                <Button 
                  variant="hero" 
                  className="w-full" 
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "I have paid"}
                </Button>
              </div>
            )}

            {/* Back Button */}
            {paymentMethod && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setPaymentMethod(null)}
              >
                Choose Different Method
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;