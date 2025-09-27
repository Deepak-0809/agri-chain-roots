// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AgricultureMarketplace {
    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 pricePerUnit;
        string unit;
        uint256 quantityAvailable;
        address farmer;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Transaction {
        uint256 id;
        uint256 productId;
        address farmer;
        address buyer;
        uint256 quantity;
        uint256 totalPrice;
        uint256 pricePerUnit;
        uint256 timestamp;
        string transactionHash;
        bool isCompleted;
    }
    
    struct PriceHistory {
        uint256 productId;
        uint256 pricePerUnit;
        uint256 timestamp;
        address updatedBy;
    }
    
    mapping(uint256 => Product) public products;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => PriceHistory[]) public priceHistory;
    mapping(address => uint256[]) public farmerProducts;
    mapping(address => uint256[]) public buyerTransactions;
    
    uint256 public productCounter;
    uint256 public transactionCounter;
    
    event ProductAdded(uint256 indexed productId, address indexed farmer, string name, uint256 pricePerUnit);
    event ProductUpdated(uint256 indexed productId, uint256 newPrice);
    event TransactionCreated(uint256 indexed transactionId, uint256 indexed productId, address indexed buyer, uint256 totalPrice);
    event TransactionCompleted(uint256 indexed transactionId);
    event PriceUpdated(uint256 indexed productId, uint256 oldPrice, uint256 newPrice, address updatedBy);
    
    function addProduct(
        string memory _name,
        string memory _description,
        uint256 _pricePerUnit,
        string memory _unit,
        uint256 _quantityAvailable
    ) external returns (uint256) {
        productCounter++;
        
        products[productCounter] = Product({
            id: productCounter,
            name: _name,
            description: _description,
            pricePerUnit: _pricePerUnit,
            unit: _unit,
            quantityAvailable: _quantityAvailable,
            farmer: msg.sender,
            isActive: true,
            createdAt: block.timestamp
        });
        
        farmerProducts[msg.sender].push(productCounter);
        
        // Record initial price in history
        priceHistory[productCounter].push(PriceHistory({
            productId: productCounter,
            pricePerUnit: _pricePerUnit,
            timestamp: block.timestamp,
            updatedBy: msg.sender
        }));
        
        emit ProductAdded(productCounter, msg.sender, _name, _pricePerUnit);
        return productCounter;
    }
    
    function updateProductPrice(uint256 _productId, uint256 _newPrice) external {
        require(products[_productId].farmer == msg.sender, "Only farmer can update price");
        require(products[_productId].isActive, "Product not active");
        
        uint256 oldPrice = products[_productId].pricePerUnit;
        products[_productId].pricePerUnit = _newPrice;
        
        // Record price change in history
        priceHistory[_productId].push(PriceHistory({
            productId: _productId,
            pricePerUnit: _newPrice,
            timestamp: block.timestamp,
            updatedBy: msg.sender
        }));
        
        emit ProductUpdated(_productId, _newPrice);
        emit PriceUpdated(_productId, oldPrice, _newPrice, msg.sender);
    }
    
    function createTransaction(
        uint256 _productId,
        uint256 _quantity,
        string memory _transactionHash
    ) external returns (uint256) {
        require(products[_productId].isActive, "Product not active");
        require(products[_productId].quantityAvailable >= _quantity, "Insufficient quantity");
        
        transactionCounter++;
        uint256 totalPrice = products[_productId].pricePerUnit * _quantity;
        
        transactions[transactionCounter] = Transaction({
            id: transactionCounter,
            productId: _productId,
            farmer: products[_productId].farmer,
            buyer: msg.sender,
            quantity: _quantity,
            totalPrice: totalPrice,
            pricePerUnit: products[_productId].pricePerUnit,
            timestamp: block.timestamp,
            transactionHash: _transactionHash,
            isCompleted: false
        });
        
        buyerTransactions[msg.sender].push(transactionCounter);
        
        emit TransactionCreated(transactionCounter, _productId, msg.sender, totalPrice);
        return transactionCounter;
    }
    
    function completeTransaction(uint256 _transactionId) external {
        Transaction storage txn = transactions[_transactionId];
        require(txn.farmer == msg.sender, "Only farmer can complete transaction");
        require(!txn.isCompleted, "Transaction already completed");
        
        // Update product quantity
        products[txn.productId].quantityAvailable -= txn.quantity;
        txn.isCompleted = true;
        
        emit TransactionCompleted(_transactionId);
    }
    
    function getProductPriceHistory(uint256 _productId) external view returns (PriceHistory[] memory) {
        return priceHistory[_productId];
    }
    
    function getFarmerProducts(address _farmer) external view returns (uint256[] memory) {
        return farmerProducts[_farmer];
    }
    
    function getBuyerTransactions(address _buyer) external view returns (uint256[] memory) {
        return buyerTransactions[_buyer];
    }
    
    function getProduct(uint256 _productId) external view returns (Product memory) {
        return products[_productId];
    }
    
    function getTransaction(uint256 _transactionId) external view returns (Transaction memory) {
        return transactions[_transactionId];
    }
}