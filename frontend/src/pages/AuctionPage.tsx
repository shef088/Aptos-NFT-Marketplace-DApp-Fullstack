import React, { useState, useEffect, useCallback } from "react";
import { Typography, Card, Row, Col, Button, Pagination, message, Modal, Input, Form, Spin, Tag } from "antd";
import { AptosClient } from "aptos";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import Meta from "antd/es/card/Meta";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
const { Title } = Typography;
import { useNavigate } from "react-router-dom";
import PlaceBidModal from "../components/PlaceBidModal";
import { rarityColors, rarityLabels, truncateAddress } from "../utils/rarityUtils";
import { Auction } from "../types/nftType";
import { fetchNFTDataUtil } from "../utils/fetchNFTData";
import { client } from "../utils/aptoClientUtil";
 
const AuctionsPage = () => {
  const { account } = useWallet();
  const [nftAuctions, setNftAuctions] = useState<any[]>([]);
  const [totalAuctions, setTotalAuctions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<any| null>(null);
  const [isBidModalVisible, setIsBidModalVisible] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
  
  const navigate = useNavigate();
 
  const pageSize = 8;
  
  const fetchAuctions = useCallback(async () => {
    if (!account) return;
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
        setNftAuctions([]);
        return;
      }

      const auctionPromises = auctionsList.map(async (auction: any) => {
        const { nft_id, starting_price, highest_bid, highest_bidder, end_time } = auction;

        const nftMetadata = await fetchNFTDataUtil(nft_id, account.address, client) 
      
        console.log("details::", nftMetadata)
        return nftMetadata;
      });

      const auctionsWithMetadata = await Promise.all(auctionPromises);
      setNftAuctions(auctionsWithMetadata);
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
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>

      <Title level={2} style={{ marginBottom: "20px", textAlign: "center" }}>Ongoing Auctions</Title>
       <Row
              gutter={[24, 24]}
              style={{
                marginTop: 20,
                width: "100%",
                display: "flex",
                justifyContent: "center", // Center row content
                flexWrap: "wrap",
              }}
            >
        {nftAuctions.map((nft) => (
          
            <Col
                       key={nft.id}
                        xs={24} sm={12} md={8} lg={6} xl={6}
                        style={{
                          display: "flex",
                          justifyContent: "center", // Center the single card horizontally
                         
                        }}
                      > 
            <Card
              hoverable
              style={{
                width: "100%", // Make the card responsive
                maxWidth: "240px", // Limit the card width on larger screens
                margin: "0 auto",
              }}
              extra={<Tag
                color={rarityColors[nft.rarity]}
                style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "10px" }}
              >
                {rarityLabels[nft.rarity]}
              </Tag>}
              cover={<img alt={nft.name} src={nft.uri} />}
              actions={[
                nft.owner === account?.address ? (
                   <Button type="link" onClick={() => showModal(nft)}disabled={nft.auction.isExpired} >
                    Self Bid
                   </Button>
                   ) : (
                      <Button type="link" onClick={() => showModal(nft)} disabled={nft.auction.isExpired}>
                        Place Bid
                      </Button>
                   )
                   ,
                 nft.owner === account?.address && (
                     <Button
                     disabled={!nft.auction.isExpired}
                       type="link"
                       danger
                       onClick={() => handleEndAuction(nft.id)}
                     >
                       End Auction
                     </Button>
                 )
              ]}
            >
           
              <div onClick={() => navigate(`/nft-detail/${nft.id}`)}>
                <h4>Auction Details:</h4>
                <p>Auction End Time: {nft.auction.end_time }</p>
                <p>Starting Bid: {nft.auction.starting_bid} APT</p>
                <p>Highest Bid: {nft.auction.highest_bid} APT</p>
              </div>
              <div onClick={() => navigate(`/nft-detail/${nft.id}`)}>
                <hr />
                <h4>{nft.name}</h4>
                <p>{nft.description}</p>
         
                <p style={{fontSize:"12px"}}>Owner: {nft.owner === account?.address && "You | "}{truncateAddress(nft.owner)}</p> 
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
