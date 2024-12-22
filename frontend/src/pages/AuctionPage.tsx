import React, { useState, useEffect, useCallback } from "react";
import { Typography, Card, Row, Col, Button, Pagination, message, Modal, Input, Form, Spin } from "antd";
import { AptosClient } from "aptos";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import Meta from "antd/es/card/Meta";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
const { Title } = Typography;
import { useNavigate } from "react-router-dom";
import PlaceBidModal from "../components/PlaceBidModal";
import { rarityLabels } from "../utils/rarityUtils";
import { Auction } from "../types/nftType";

const truncateAddress = (address: string, start = 6, end = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

const AuctionsPage = () => {
  const { account } = useWallet();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [totalAuctions, setTotalAuctions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [isBidModalVisible, setIsBidModalVisible] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
  
  const navigate = useNavigate();
  const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");
  const pageSize = 8;
  const fetchNFTDetails = async (id: number) => {
    try {
      const nftDetails = await client.view({
        function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::get_nft_details`,
        arguments: [MARKET_PLACE_ADDRESS, id],
        type_arguments: [],
      });
      console.log("raw::", nftDetails )
      const [nft_id, owner, name, description, uri, price, for_sale, rarity] = nftDetails as [
        number,
        string,
        string,
        string,
        string,
        number,
        boolean,
        number
      ];

      const hexToUint8Array = (hexString: string): Uint8Array => {
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }
        return bytes;
      };

      const nft_details= {
        id: nft_id,
        name: new TextDecoder().decode(hexToUint8Array(name.slice(2))),
        description: new TextDecoder().decode(hexToUint8Array(description.slice(2))),
        uri: new TextDecoder().decode(hexToUint8Array(uri.slice(2))),
        rarity,
        price: price / 100000000,
        for_sale,
        owner,
      };
      console.log("nft::", nftDetails)
      return nft_details;
    } catch (error) {
      console.error("Error fetching NFT details:", error);
      return null;
    }
  };
  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      const offset = ((currentPage - 1) * pageSize).toString();
      const limit = pageSize.toString();

      const auctionDataResponse = await client.view({
        function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::get_active_auctions`,
        arguments: [MARKET_PLACE_ADDRESS, limit, offset],
        type_arguments: [],
      });

      const auctionsList = Array.isArray(auctionDataResponse[0]) ? auctionDataResponse[0] : [];
      setTotalAuctions(auctionsList.length);

      if (auctionsList.length === 0) {
        setAuctions([]);
        return;
      }

      const auctionPromises = auctionsList.map(async (auction: any) => {
        const { nft_id, starting_price, highest_bid, highest_bidder, end_time } = auction;

        const nftMetadata = await fetchNFTDetails(nft_id);
        const details = {
          id: nft_id,
          starting_bid: starting_price / 100000000,
          highest_bid: highest_bid / 100000000,
          end_time: new Date(parseInt(end_time, 10) * 1000).toLocaleString(),
          nftMetadata: nftMetadata || {
            
            name: "Unknown",
            uri: "",
            description: "No description",
            rarity: 0,
            price: 0,
            for_sale: false,
            owner: "",
          },
        };
        console.log("details::", details)
        return details;
      });

      const auctionsWithMetadata = await Promise.all(auctionPromises);
      setAuctions(auctionsWithMetadata);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      message.error("Failed to fetch auctions.");
    }finally {
      setLoading(false);
    }
  }, [currentPage, account]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions, currentPage]);

  const showModal = (auction: Auction) => {
    setSelectedAuction(auction);
    console.log("selected::", auction)
    setIsBidModalVisible(true);
  };

  const handleEndAuction = async (nftId: number) => {
    if (!account) return;

    try {
      const entryFunctionPayload = {
        function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::end_auction`,
        type_arguments: [],
        arguments: [MARKET_PLACE_ADDRESS, nftId],
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(entryFunctionPayload);
      console.log("Transaction Response:", txnResponse);
      await client.waitForTransaction(txnResponse.hash);
      message.success(`Auction ended successfully!`);
      fetchAuctions();
    } catch (error) {
      console.error("Error ending auction:", error);
      message.error("Failed to end auction!");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />

      </div>
    );
  }
  return (
    <div  style={{
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <Title level={2} style={{ marginBottom: "20px", textAlign: "center" }}>Ongoing Auctions</Title>
      <Row     gutter={[24, 24]}
        style={{
          marginTop: 20,
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
        {auctions.map((auction) => (
          <Col   key={auction.id}
          xs={24} sm={12} md={8} lg={8} xl={6}
          style={{
            display: "flex",
            justifyContent: "center",
          }}>
            <Card
              hoverable
              style={{
                width: "100%",
                maxWidth: "240px",
                margin: "0 auto",
              }}
              actions={[
                <Button type="link" onClick={() => showModal(auction)}>
                  Place Bid
                </Button>,
                auction.nftMetadata.owner === account?.address && (
                  <Button
                    type="link"
                    danger
                    onClick={() => handleEndAuction(auction.id)}
                  >
                    End Auction
                  </Button>
                ),
              ]}
            >
              {auction.nftMetadata.uri && (
                <img
                  src={auction.nftMetadata.uri}
                  alt={auction.nftMetadata.name}
                  style={{ width: "100%", height: "auto" }}
                />
              )}
              <div onClick={() => navigate(`/nft-detail/${auction.id}`)}>
                <h4>Auction Details:</h4>
                <p>Auction End Time: {auction.end_time }</p>
                <p>Starting Bid: {auction.starting_bid} APT</p>
                <p>Highest Bid: {auction.highest_bid} APT</p>
              </div>
              <div onClick={() => navigate(`/nft-detail/${auction.id}`)}>
                <hr />
                <h4>{auction.nftMetadata.name}</h4>
                <p>{auction.nftMetadata.description}</p>
                <p>Rarity: {rarityLabels[auction.nftMetadata.rarity]}</p>
                <p style={{fontSize:"12px"}}>Owner: { auction.nftMetadata.owner === account?.address && "You | "}{truncateAddress(auction.nftMetadata.owner)}</p> 
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalAuctions}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>

      <PlaceBidModal
        isVisible={isBidModalVisible}
        onClose={() => setIsBidModalVisible(false)}
        nftDetails={selectedAuction?.nftMetadata || {}}
        auction={selectedAuction}
        onRefresh={fetchAuctions}
      />
    </div>
  );
};

export default AuctionsPage;
