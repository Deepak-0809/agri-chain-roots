import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, User, Calendar, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupplyChainRecord {
  id: string;
  from_user_id: string;
  to_user_id: string;
  transaction_type: string;
  quantity: number;
  price_per_unit: number;
  transaction_date: string;
  status: string;
  notes?: string;
  blockchain_hash?: string;
  from_profile?: {
    display_name: string;
    role: string;
  };
  to_profile?: {
    display_name: string;
    role: string;
  };
}

interface SupplyChainDialogProps {
  productId: string;
  productName: string;
  trigger: React.ReactNode;
}

const SupplyChainDialog = ({ productId, productName, trigger }: SupplyChainDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [supplyChain, setSupplyChain] = useState<SupplyChainRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSupplyChain();
    }
  }, [isOpen, productId]);

  const loadSupplyChain = async () => {
    setIsLoading(true);
    try {
      // First get supply chain records
      const { data: supplyChainData, error: supplyChainError } = await supabase
        .from('supply_chain_tracking')
        .select('*')
        .eq('product_id', productId)
        .order('transaction_date', { ascending: true });

      if (supplyChainError) {
        console.error('Error loading supply chain:', supplyChainError);
        toast({
          title: "Error",
          description: "Failed to load supply chain data",
          variant: "destructive",
        });
        return;
      }

      if (!supplyChainData || supplyChainData.length === 0) {
        setSupplyChain([]);
        return;
      }

      // Get unique user IDs for profile lookup
      const userIds = [...new Set([
        ...supplyChainData.map(record => record.from_user_id),
        ...supplyChainData.map(record => record.to_user_id)
      ])];

      // Get profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, role')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
      }

      // Create a map for quick profile lookup
      const profileMap = new Map(
        (profiles || []).map(profile => [profile.user_id, profile])
      );

      // Combine supply chain data with profiles
      const enrichedData = supplyChainData.map(record => ({
        ...record,
        from_profile: profileMap.get(record.from_user_id) || { display_name: 'Unknown', role: 'unknown' },
        to_profile: profileMap.get(record.to_user_id) || { display_name: 'Unknown', role: 'unknown' }
      }));

      setSupplyChain(enrichedData);
    } catch (error) {
      console.error('Error loading supply chain:', error);
      toast({
        title: "Error",
        description: "Failed to load supply chain data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'farmer_to_distributor':
        return 'Farmer → Distributor';
      case 'distributor_to_consumer':
        return 'Distributor → Consumer';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Supply Chain Tracking: {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading supply chain data...</p>
            </div>
          ) : supplyChain.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tracking data available</h3>
              <p className="text-muted-foreground">Supply chain tracking information will appear here when transactions are recorded.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {supplyChain.map((record, index) => (
                <Card key={record.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                          <Badge variant="secondary">
                            {getTransactionTypeLabel(record.transaction_type)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">From:</p>
                            <p className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {record.from_profile?.display_name || 'Unknown'}
                              <span className="text-xs text-muted-foreground">
                                ({record.from_profile?.role})
                              </span>
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">To:</p>
                            <p className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {record.to_profile?.display_name || 'Unknown'}
                              <span className="text-xs text-muted-foreground">
                                ({record.to_profile?.role})
                              </span>
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Quantity:</p>
                            <p className="font-medium">{record.quantity} units</p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Price:</p>
                            <p className="font-medium">₹{record.price_per_unit.toFixed(2)}/unit</p>
                          </div>
                          
                          <div className="col-span-2">
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Transaction Date:
                            </p>
                            <p className="font-medium">
                              {new Date(record.transaction_date).toLocaleString()}
                            </p>
                          </div>
                          
                          {record.notes && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Notes:</p>
                              <p className="text-sm">{record.notes}</p>
                            </div>
                          )}
                          
                          {record.blockchain_hash && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Blockchain Hash:</p>
                              <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                                {record.blockchain_hash}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {index < supplyChain.length - 1 && (
                      <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2">
                        <div className="h-4 w-0.5 bg-border"></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplyChainDialog;