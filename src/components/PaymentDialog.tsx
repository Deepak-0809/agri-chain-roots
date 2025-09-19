import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Smartphone, CreditCard, Copy, CheckCircle, Loader2 } from "lucide-react";
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
  const [upiId, setUpiId] = useState("agrichain@paytm");
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");

  const totalAmount = (product.price_per_unit * quantity).toFixed(2);
  
  // Generate QR code when payment method is selected
  useEffect(() => {
    if (paymentMethod === 'qr') {
      generateQRCode();
    }
  }, [paymentMethod, totalAmount, product.name]);

  const generateQRCode = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: {
          upiId: upiId,
          amount: parseFloat(totalAmount),
          productName: product.name,
          merchantName: "AgriChain"
        }
      });

      if (error) throw error;
      
      if (data.success) {
        setQrCodeImage(data.qrCode);
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast({ title: "Error", description: "Failed to generate QR code", variant: "destructive" });
    }
  };

  const handleCopyUPI = () => {
    const upiLink = `upi://pay?pa=${upiId}&pn=AgriChain&am=${totalAmount}&cu=INR&tn=Payment%20for%20${encodeURIComponent(product.name)}`;
    navigator.clipboard.writeText(upiLink);
    toast({ title: "Copied!", description: "UPI link copied to clipboard" });
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Error", description: "Please log in to complete purchase", variant: "destructive" });
        return;
      }

      // Call payment processing API
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          productId: product.id,
          quantity: quantity,
          paymentMethod: paymentMethod,
          transactionId: transactionId || undefined
        }
      });

      if (error) {
        console.error('Payment API error:', error);
        throw new Error(error.message || 'Payment processing failed');
      }

      if (data.success) {
        setPaymentCompleted(true);
        toast({ title: "Success!", description: "Payment completed successfully!" });
        
        setTimeout(() => {
          setIsOpen(false);
          onPaymentComplete();
          // Reset state
          setPaymentCompleted(false);
          setPaymentMethod(null);
          setQuantity(1);
          setTransactionId("");
          setQrCodeImage(null);
        }, 2000);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({ title: "Error", description: error.message || "Payment failed", variant: "destructive" });
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
                        onClick={() => {
                          const upiLink = `upi://pay?pa=${upiId}&pn=AgriChain&am=${totalAmount}&cu=INR&tn=Payment%20for%20${encodeURIComponent(product.name)}`;
                          window.open(upiLink, '_blank');
                        }}
                      >
                        Pay with UPI App
                      </Button>
                      <div className="space-y-2">
                        <Label>Transaction ID (Optional):</Label>
                        <Input
                          placeholder="Enter transaction ID after payment"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                        />
                      </div>
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
                      {qrCodeImage ? (
                        <img 
                          src={qrCodeImage} 
                          alt="QR Code for Payment" 
                          className="w-40 h-40 rounded"
                        />
                      ) : (
                        <div className="w-40 h-40 bg-black/10 rounded flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan with any UPI app to pay ₹{totalAmount}
                    </p>
                    <div className="text-xs text-muted-foreground mb-4">
                      UPI ID: {upiId}
                    </div>
                    <div className="space-y-2">
                      <Label>Transaction ID (after payment):</Label>
                      <Input
                        placeholder="Enter transaction ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
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