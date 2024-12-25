
# Aptos NFT Marketplace DApp


A comprehensive decentralized marketplace built on the Aptos blockchain, enabling users to seamlessly trade, auction, chat and discover unique digital assets. This platform integrates advanced NFT functionalities, robust analytics, and a messaging system to create a vibrant and interactive community for creators and collectors.

## Video Demonstration

📺 Watch a demo of the App:  
**[Watch App Demo] 👉 (https://youtu.be/azyIL0cpwoQ)**

---
## My Deployed Smart Contract Address (testnet)
**Smart Contract Address:** 👉  (https://explorer.aptoslabs.com/account/0x381909e7b424111da9b8626a84bd6ce581c5efd8eeec2accefe085e4bd335908/modules/code/NFTMarketplace/initialize?network=testnet)  


---
## Features

*   **Minting NFTs**: Allows owner of smart contract to create their own unique NFTs with customized names, descriptions, and URIs.

*   **Direct Messaging/Chat:** Enables users to chat with other users on the platform. Messages are encrypted using a secret key before being sent.

*   **Direct Sales**: Enables users to list NFTs for sale at fixed prices, facilitating direct peer-to-peer trading.

*   **Buying NFTs**: Securely purchase listed NFTs directly from other users.

*   **NFT Auctions**: Users can place bids on NFTs up for auction.

*   **Transfer APT:** Transfer APT coins between any two accounts.

*   **Transfer NFT:** Transfer NFTs between any two accounts.

*   **Search NFTs**: Ability to search NFTs by their name.

*   **Analytics and Insights:** The platform tracks the sales volume over time ,trending NFTs based on sales, NFTs that have been sold and total trading volume. 

*  **Browsing Marketplace:** Provides a full range of filter and search features to explore, allowing you to filter and browse through all available NFTs.

*  **Address Normalization:** Consistent address formatting for reliable address comparisons in frontend. (Some Aptos addresses can begin with a single `0` after `0x`, while others might not)

*   **Responsive UI:** User interface adapts smoothly to various screen sizes, ensuring a consistent user experience.
 


### Underlying Technologies
*  **Aptos Blockchain:** Leverages the speed and security of the Aptos blockchain.
*   **Move Smart Contracts:** Implements secure and efficient smart contracts for core functionalities.
* **React Frontend:** A full React app for the entire user experience.
* **FNM** Uses the Fast Node Manager for smooth dev environment setup
* **Aptos CLI:** The Aptos CLI is used for smart contract deployment.



## 1. Clone the Repository
- For codespaces makesure .devcontainer folder exists at the root directory and file devcontainer.json exists in the folder with content of :
```{
    "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
    "features": {
    }
  }
```
- Clone the repo:
```bash
git clone https://github.com/Im-in123/Aptos-NFT-Marketplace-DApp-Fullstack 
cd  Aptos-NFT-Marketplace-DApp-Fullstack 
```

## 2. Backend Setup
- Go back to the root of the  project and navigate to backend/contracts
```bash
cd backend/contracts
```
- Open your Petra Wallet, copy your account address. Open Move.toml and replace the adress with your own wallet address.

- Open NFTMarketplace and also replace with your account address. Like this NFTMarketplace="your-account-address"

- Run this command:
```bash
aptos init
```
- Select the Network (testnet) 

- Enter your Private Key: You’ll be prompted to your private key. This has to be the private key for the account address that you used as the marketplace address.

- Compile the contract
```bash
aptos move compile
```
- Publish the contract 
```bash
aptos move publish
```
- Approve the Transaction: Type yes when prompted to pay for gas.

- Go to Aptos Explorer:
https://explorer.aptoslabs.com/?network=testnet
- And ensure the network is set to testnet. In the search bar, enter your NFT marketplace address (the address where you deployed the contract) to locate your smart contract.
- Once your address loads, look for the Module tab on the dashboard. This tab lists all smart contracts (modules) published under the specified address.
- Find NFTMarketplace in the module list. This confirms that your contract was published successfully and is now accessible on the blockchain.
- Click on the Run sub-tab within the NFTMarketplace module.
- Connect Your Wallet: On the module section of your NFTMarketplace, click the Run sub-tab, then from the function list click on initialize. Then, click on the Connect Wallet button.
- When prompted, approve the connection in Petra to allow the Aptos Explorer to interact with your wallet.
- Run the Initialize Function: Click Run and approve the transaction in wallet when prompted.

## 3. Frontend Setup

- Install petra wallet from the Chrome Web Store or preferred browser store:
- From root directory navigate to frontend folder
```bash
cd frontend
```
 - Run the following command to install required dependencies:
```bash
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install --lts
```
- Configure constants.js:

  - Navigate to src/ and open constants.js. Ensure the following fields are populated:
javascript
```bash
 const MARKET_PLACE_ADDRESS="0x381909e7b424111da9b8626a84bd6ce581c5efd8eeec2accefe085e4bd335908" #replace with yours
export const MARKET_PLACE_NAME="NFTMarketplace" #replace with yours
```
- Run the following command to start the frontend server:
```bash
npm start
```
- Get testnet coins here
https://aptos.dev/en/network/faucet
 

 