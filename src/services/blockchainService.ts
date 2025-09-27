import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';

// Global interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
      selectedAddress?: string;
      on?: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}

// Contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
  "function addProduct(string memory _name, string memory _description, uint256 _pricePerUnit, string memory _unit, uint256 _quantityAvailable) external returns (uint256)",
  "function updateProductPrice(uint256 _productId, uint256 _newPrice) external",
  "function createTransaction(uint256 _productId, uint256 _quantity, string memory _transactionHash) external returns (uint256)",
  "function completeTransaction(uint256 _transactionId) external",
  "function getProductPriceHistory(uint256 _productId) external view returns (tuple(uint256 productId, uint256 pricePerUnit, uint256 timestamp, address updatedBy)[])",
  "function getProduct(uint256 _productId) external view returns (tuple(uint256 id, string name, string description, uint256 pricePerUnit, string unit, uint256 quantityAvailable, address farmer, bool isActive, uint256 createdAt))",
  "function getTransaction(uint256 _transactionId) external view returns (tuple(uint256 id, uint256 productId, address farmer, address buyer, uint256 quantity, uint256 totalPrice, uint256 pricePerUnit, uint256 timestamp, string transactionHash, bool isCompleted))",
  "event ProductAdded(uint256 indexed productId, address indexed farmer, string name, uint256 pricePerUnit)",
  "event TransactionCreated(uint256 indexed transactionId, uint256 indexed productId, address indexed buyer, uint256 totalPrice)",
  "event PriceUpdated(uint256 indexed productId, uint256 oldPrice, uint256 newPrice, address updatedBy)"
];

// This will be deployed contract address - for now using placeholder
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  async initialize() {
    try {
      // Get RPC URL from Supabase secrets
      const { data: rpcUrl } = await supabase.functions.invoke('get-ethereum-rpc');
      
      if (!rpcUrl) {
        throw new Error('Ethereum RPC URL not configured');
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await web3Provider.getSigner();
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      } else {
        // Read-only access without signer
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
      }
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask to interact with blockchain.');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await web3Provider.getSigner();
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async addProductToBlockchain(product: {
    name: string;
    description: string;
    pricePerUnit: number;
    unit: string;
    quantityAvailable: number;
  }) {
    if (!this.contract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convert price to wei (assuming price is in ETH)
      const priceInWei = ethers.parseEther(product.pricePerUnit.toString());
      
      const tx = await this.contract.addProduct(
        product.name,
        product.description,
        priceInWei,
        product.unit,
        product.quantityAvailable
      );

      const receipt = await tx.wait();
      
      // Get the product ID from the event
      const event = receipt.logs.find((log: any) => {
        try {
          return this.contract!.interface.parseLog(log)?.name === 'ProductAdded';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = this.contract.interface.parseLog(event);
        return {
          blockchainId: parsedEvent?.args[0].toString(),
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber
        };
      }

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to add product to blockchain:', error);
      throw error;
    }
  }

  async createTransactionOnBlockchain(productId: string, quantity: number, supabaseTransactionId: string) {
    if (!this.contract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.contract.createTransaction(
        productId,
        quantity,
        supabaseTransactionId
      );

      const receipt = await tx.wait();
      
      return {
        blockchainTransactionId: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Failed to create transaction on blockchain:', error);
      throw error;
    }
  }

  async updateProductPrice(blockchainProductId: string, newPrice: number) {
    if (!this.contract || !this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const priceInWei = ethers.parseEther(newPrice.toString());
      const tx = await this.contract.updateProductPrice(blockchainProductId, priceInWei);
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Failed to update product price on blockchain:', error);
      throw error;
    }
  }

  async getPriceHistory(blockchainProductId: string) {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const history = await this.contract.getProductPriceHistory(blockchainProductId);
      return history.map((item: any) => ({
        productId: item.productId.toString(),
        pricePerUnit: ethers.formatEther(item.pricePerUnit),
        timestamp: new Date(Number(item.timestamp) * 1000),
        updatedBy: item.updatedBy
      }));
    } catch (error) {
      console.error('Failed to get price history:', error);
      throw error;
    }
  }

  async getBlockchainProduct(blockchainProductId: string) {
    if (!this.contract) {
      throw new Error('Blockchain service not initialized');
    }

    try {
      const product = await this.contract.getProduct(blockchainProductId);
      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        pricePerUnit: ethers.formatEther(product.pricePerUnit),
        unit: product.unit,
        quantityAvailable: product.quantityAvailable.toString(),
        farmer: product.farmer,
        isActive: product.isActive,
        createdAt: new Date(Number(product.createdAt) * 1000)
      };
    } catch (error) {
      console.error('Failed to get blockchain product:', error);
      throw error;
    }
  }

  async getWalletAddress() {
    if (!this.signer) {
      return null;
    }
    return await this.signer.getAddress();
  }

  isConnected() {
    return !!this.signer;
  }
}

export const blockchainService = new BlockchainService();