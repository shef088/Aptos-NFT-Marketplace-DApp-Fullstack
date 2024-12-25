import React, { useState } from "react";
import { Button, Input, Select, message } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import { client } from "../utils/aptoClientUtil";

const { Option } = Select;

 

const Transfer = () => {
  const { account } = useWallet();
  const [transferType, setTransferType] = useState<string>("APT");
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");  
  const [loading, setLoading] = useState<boolean>(false);

  const handleTransfer = async () => {
    if (!account) {
      message.error("Wallet not connected!");
      return;
    }

    if (!recipient) {
      message.error("Recipient address is required.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      message.error("Amount must be greater than 0.");
      return;
    }

    try {
      setLoading(true);

      const precision = 100000000; // 1 APT = 10^8 Octas
      const octasAmount = BigInt(Math.ceil(parseFloat(amount) * precision)); // Convert to Octas

      // Construct payload for APT transfer
      const entryFunctionPayload = {
        type: "entry_function_payload",
        function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::transfer_apt`,
        arguments: [recipient, octasAmount.toString()],
        type_arguments: [],
      };

      // Sign and submit the transaction
      const response = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      await client.waitForTransaction(response.hash);

      message.success("APT transfer successful!");

      // Clear input fields after success
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
      message.error("Transfer failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Transfer APT</h2>

      <Select
        value={transferType}
        onChange={(value) => setTransferType(value)}
        style={{ width: "100%", marginBottom: "20px" }}
      >
        <Option value="APT">APT Transfer</Option>
      </Select>

      <Input
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        style={{ marginBottom: "20px" }}
      />

      <Input
        placeholder="Amount in APT (e.g., 0.0003)"
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ marginBottom: "20px" }}
      />

      <Button
        type="primary"
        onClick={handleTransfer}
        loading={loading}
      >
        Transfer APT
      </Button>
    </div>
  );
};

export default Transfer;
