import React from "react";
import { Modal, Button, message } from "antd";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { client } from "../utils/aptoClientUtil";


interface ConfirmPurchaseModalProps {
  isVisible: boolean;
  onClose: () => void;
  nftDetails: any;
  onRefresh: () => Promise<void>;
}

const ConfirmPurchaseModal: React.FC<ConfirmPurchaseModalProps> = ({ isVisible, onClose, nftDetails, onRefresh }) => {
  const { account } = useWallet();

  const handleConfirmPurchase = async () => {
    if(!account) {
            message.error("No account detected.Connect you wallet!")
        }
    try {
       
        const precision = 100000000; // This assumes 8 decimals for the token
        // Step 2: Scale the   amount to avoid floating point precision issues
       const priceInOctas = BigInt(Math.ceil(parseFloat(nftDetails.price) * precision));
       
        const entryFunctionPayload = {
          type: "entry_function_payload",
          function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::purchase_nft`,
          type_arguments: [],
          arguments: [MARKET_PLACE_ADDRESS, nftDetails.id.toString(), priceInOctas.toString()],
        };
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);

      message.success("NFT purchased successfully!");
      onClose();
      await onRefresh();
    } catch (error) {
      console.error("Error confirming purchase:", error);
      message.error("Failed to purchase NFT. Please try again.");
    }
  };

  return (
    <Modal
      title="Confirm Purchase"
     open={isVisible}
      onCancel={onClose}
      footer={null}
    >
      <p>
        Are you sure you want to purchase <strong>{nftDetails?.name}</strong> for <strong>{nftDetails?.price} APT</strong>?
      </p>
      <Button type="primary" block onClick={handleConfirmPurchase}>
        Confirm Purchase
      </Button>
      <Button type="default" block onClick={onClose} style={{ marginTop: "10px" }}>
        Cancel
      </Button>
    </Modal>
  );
};

export default ConfirmPurchaseModal;
