clone repo
for codespaces makesure .devcontainer folder exists at the root directory and file devcontainer.json exists in the folde with content of :```{
    "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
    "features": {
    }
  }```


Open a new terminal. Run the following command to install the Aptos CLI:
cd backend
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

aptos info


Open your Petra Wallet, copy your account address, and insert it in place of your-marketplace-address-here in:

NFTMarketplace = "your-marketplace-address-here"

cd contracts

aptos init
 Select the Network (Devnet): Devnet allows you to test your contract’s functionality in a simulated environment similar to the main network. To select Devnet, enter the following when prompted:

devnet

Enter your Private Key: You’ll be prompted to your private key. This has to be the private key for the account address that you used as the marketplace address.

aptos move publish

Approve the Transaction: Type yes when prompted to pay for gas.

Go to Aptos Explorer 
https://explorer.aptoslabs.com/?network=devnet
and ensure the network is set to Devnet. In the search bar, enter your NFT marketplace address (the address where you deployed the contract) to locate your smart contract.

Once your address loads, look for the Module tab on the dashboard. This tab lists all smart contracts (modules) published under the specified address.

Find NFTMarketplace in the module list. This confirms that your contract was published successfully and is now accessible on the blockchain.

Click on the Run sub-tab within the NFTMarketplace module.

Connect Your Wallet: On the module section of your NFTMarketplace, click the Run sub-tab, then from the function list click on initialize. Then, click on the Connect Wallet button.

When prompted, approve the connection in Petra to allow the Aptos Explorer to interact with your wallet.

Run the Initialize Function: Click Run and approve the transaction in wallet when prompted.


frontendv#####
cd frontend
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install --lts

npm install
npm start



###

git add -A
git commit -m "changes"
git push
 