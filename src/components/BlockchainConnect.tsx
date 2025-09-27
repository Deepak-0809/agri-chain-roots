import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { useToast } from '@/hooks/use-toast';

interface BlockchainConnectProps {
  onConnectionChange?: (connected: boolean, address?: string) => void;
}

export const BlockchainConnect: React.FC<BlockchainConnectProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeBlockchain();
  }, []);

  const initializeBlockchain = async () => {
    try {
      await blockchainService.initialize();
      const connected = blockchainService.isConnected();
      setIsConnected(connected);
      
      if (connected) {
        const address = await blockchainService.getWalletAddress();
        setWalletAddress(address);
        onConnectionChange?.(true, address || undefined);
      }
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
      toast({
        title: "Blockchain Initialization Failed",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const address = await blockchainService.connectWallet();
      setIsConnected(true);
      setWalletAddress(address);
      onConnectionChange?.(true, address);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Blockchain Connection
        </CardTitle>
        <CardDescription>
          Connect your wallet to enable transparent transactions on the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="bg-green-50">
                Connected
              </Badge>
            </div>
            {walletAddress && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Address:</span> {formatAddress(walletAddress)}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              All your transactions will be recorded on the Ethereum blockchain for full transparency.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <Badge variant="outline" className="bg-yellow-50">
                Not Connected
              </Badge>
            </div>
            <Button 
              onClick={connectWallet} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
            <div className="text-xs text-muted-foreground">
              You'll need MetaMask or another Web3 wallet to enable blockchain features.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};