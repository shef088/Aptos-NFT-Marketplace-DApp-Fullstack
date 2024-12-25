import React, { useState } from 'react';
import { Modal, Input, Form, message, Button } from 'antd';
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import { client } from '../utils/aptoClientUtil';
 

interface TransferNFTModalProps {
    isVisible: boolean;
    onClose: () => void;
    nftDetails: any;
    onRefresh: () => void;
}


const TransferNFTModal: React.FC<TransferNFTModalProps> = ({
    isVisible,
    onClose,
    nftDetails,
    onRefresh,
}) => {
    const [newOwnerAddress, setNewOwnerAddress] = useState('');
    const [loading, setLoading] = useState(false);
     const { account } = useWallet();
    const modalStyle = {
         borderRadius: '12px'
   };
      
       const buttonStyle = {
          height: '40px',
         fontSize: '14px',
        borderRadius: '8px',
       border:'none',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
   };


    const handleTransfer = async () => {
        if (!account) return;
         if (!newOwnerAddress) {
            message.error("Please enter a new owner address.");
             return;
       }
      setLoading(true);
        try {
            const entryFunctionPayload = {
               type: "entry_function_payload",
                function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::transfer_nft`,
               type_arguments: [],
               arguments: [MARKET_PLACE_ADDRESS, nftDetails.id.toString(), newOwnerAddress],
           };

            const response = await (
               window as any
            ).aptos.signAndSubmitTransaction(entryFunctionPayload);
            await client.waitForTransaction(response.hash);
           message.success("NFT transferred successfully!");
            onClose();
            await onRefresh();

       } catch (error) {
            console.error("Failed to transfer NFT:", error);
            message.error("Failed to transfer NFT.");
       } finally {
            setLoading(false);
       }
  };

    return (
        <Modal
            title="Transfer NFT"
            open={isVisible}
            onCancel={onClose}
            style={modalStyle}
            footer={[
                <Button key="cancel" onClick={onClose}>
                   Cancel
              </Button>,
                 <Button key="transfer" type="primary" onClick={handleTransfer} loading={loading} style={buttonStyle}>
                     Transfer
              </Button>,
            ]}
        >
            <Form layout="vertical"  >
               <Form.Item label="New Owner Address">
                     <Input
                         placeholder="Enter new owner address"
                         value={newOwnerAddress}
                       onChange={(e) => setNewOwnerAddress(e.target.value)}
                    />
               </Form.Item>
            </Form>
        </Modal>
   );
};
export default TransferNFTModal;