import React, { useState } from "react";
import { Modal, Input, Button, message } from "antd";
import { AptosClient } from "aptos";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { client } from '../utils/aptoClientUtil';
 

interface PlaceBidModalProps {
  isVisible: boolean;
  onClose: () => void;
  nftDetails: any;
  auction: any;
  onRefresh: () => Promise<void>;
}

const PlaceBidModal: React.FC<PlaceBidModalProps> = ({ isVisible, onClose, nftDetails, auction, onRefresh }) => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const { account, signAndSubmitTransaction } = useWallet();

  const handlePlaceBid = async () => {
    if(!account) {
        message.error("No account detected.Connect you wallet!")
    }
    if (!bidAmount) return;
    if (bidAmount <=  auction.highest_bid) {
        message.error("Bid amount must be higher than the current highest bid.");
        return;
      }
    try {
      
      const precision = 100000000; // This assumes 8 decimals for the token
      // Step 2: Scale the   amount to avoid floating point precision issues
     const bidInOctas = BigInt(Math.ceil(parseFloat(bidAmount) * precision));
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::place_bid`,
        type_arguments: [],
        arguments: [MARKET_PLACE_ADDRESS, nftDetails.id.toString(), bidInOctas.toString()],
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);

      message.success("Bid placed successfully!");
      setBidAmount("");
      onClose();
      await onRefresh();
    } catch (error) {
      console.error("Error placing bid:", error);
      message.error("Failed to place bid. Please try again.");
    }
  };

  return (
    <Modal
      title="Place a Bid"
      open={isVisible}
      onCancel={onClose}
      footer={null}
    >
      <Input
        placeholder="Enter bid amount (in APT)"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        type="number"
        style={{ marginBottom: "20px" }}
      />
      <Button type="primary" block onClick={handlePlaceBid}>
        Place Bid
      </Button>
    </Modal>
  );
};

export default PlaceBidModal;
