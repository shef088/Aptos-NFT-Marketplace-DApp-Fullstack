import React, { useEffect, useState, useCallback } from "react";
import { Typography, Card, Row, Col, Pagination, message, Button, Input, Modal, Tag, Spin } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
const { Title, Text } = Typography;
const { Meta } = Card;
import { useNavigate } from "react-router-dom";
import StartAuctionModal from "../components/StartAuctionModal";
import ListForSaleModal from "../components/ListForSaleModal";
import { fetchNFTDataUtil } from "../utils/fetchNFTData";  
import { rarityColors, rarityLabels } from "../utils/rarityUtils";  
import { NFT } from "../types/nftType";
import { client } from "../utils/aptoClientUtil";
 
 
const truncateAddress = (address: string, start = 6, end = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};
const MyNFTs: React.FC = () => {
  const pageSize = 8;
     const [loading, setLoading] = useState<boolean>(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [totalNFTs, setTotalNFTs] = useState(0);
  const { account, signAndSubmitTransaction } = useWallet();
  const navigate= useNavigate()
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAuctionModalVisible, setIsAuctionModalVisible] = useState(false); // Auction modal
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  

  const fetchUserNFTs = useCallback(async () => {
    if (!account) return;

    try {
      setLoading(true);
      console.log("Fetching NFT IDs for owner:", account.address);

      const nftIdsResponse = await client.view({
        function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::get_all_nfts_for_owner`,
        arguments: [MARKET_PLACE_ADDRESS, account.address, "100", "0"],
        type_arguments: [],
      });
  
      const nftIds = Array.isArray(nftIdsResponse[0]) ? nftIdsResponse[0] : nftIdsResponse;
      setTotalNFTs(nftIds.length);

      if (nftIds.length === 0) {
        console.log("No NFTs found for the owner.");
        setNfts([]);
        return;
      }

      console.log("Fetching details for each NFT ID:", nftIds);

      const userNFTs = (await Promise.all(
        nftIds.map(async (id) => {
         return await fetchNFTDataUtil(id, account.address, client);
        })
      )).filter((nft): nft is NFT => nft !== null);

      console.log("User NFTs:", userNFTs);
      setNfts(userNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      message.error("Failed to fetch your NFTs.");
    }finally {
      setLoading(false);
    }
  }, [account, MARKET_PLACE_ADDRESS]);

   

  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs, currentPage]);

  const handleSellClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsModalVisible(true);
  };

  const handleAuctionClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsAuctionModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedNft(null);
  };
  const handleAuctionModalClose = () => {
    setIsAuctionModalVisible(false);
    setSelectedNft(null);
  };
  const paginatedNFTs = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }
  return (
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Title level={2} style={{ marginBottom: "20px" }}>My Collection</Title>
      <p>Your personal collection of NFTs.</p>
  
      {/* Card Grid */}
      <Row
        gutter={[24, 24]}
        style={{
          marginTop: 20,
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {paginatedNFTs.map((nft) => (
          <Col
            key={nft.id}
            xs={24} sm={12} md={8} lg={8} xl={6}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Card
              hoverable
              style={{
                width: "100%",
                maxWidth: "280px",
                minWidth: "220px",
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
                <div style={{ display: 'flex',  alignItems:"center", justifyContent:"space-evenly" }}>
                  {nft.auction ? (
                      <Button type="primary"  disabled={nft.auction?.isExpired} onClick={() => navigate(`/nft-detail/${nft.id}`)}>
                          {nft.auction?.isExpired ? "Expired Auction": "Ongoing Auction"}
                      </Button>
                  ) : nft.for_sale ? (
                      <Button type="primary" danger onClick={() => navigate(`/nft-detail/${nft.id}`)}>
                          End Sale
                      </Button>
                      ) : (
                          <>
                              <Button 
                               style={{width:"40%"}}
                              type="primary"
                              onClick={() => handleSellClick(nft)}>
                                  Sell
                              </Button>
                              <Button 
                              type="primary"
                              style={{width:"40%"}}
                               onClick={() => handleAuctionClick(nft)}>
                                  Auction
                              </Button>
                          </>
                      )
                    }
                </div>
                ]}
              
            >
              <div onClick={() => navigate(`/nft-detail/${nft.id}`)}>
              <Meta 
    title={<Text style={{ fontWeight: "500"}}>{nft.name}</Text>} 
    description={
       nft.auction ? (
          <Text type="secondary">Price: Auction</Text>
       ) : (
          <Text type="secondary">Price: {nft.price} APT</Text>
         )
       }
  />
              <p>ID: {nft.id}</p>
              <div
        style={{
          flexGrow: 1,  
          overflow: "hidden",  
          textOverflow: "ellipsis", 
          WebkitLineClamp: 2,  
          WebkitBoxOrient: "vertical", 
          display: "-webkit-box",
        }}
      >
        {nft.description}
      </div>
      <p style={{fontSize:"12px"}}>Owner: { nft.owner === account?.address && "You | "}{truncateAddress(nft.owner)}</p> 
              {nft.auction ?(
                  <p style={{ margin: "10px 0" }}>For Sale: Auction</p>
              ):(
                <p style={{ margin: "10px 0" }}>For Sale: {nft.for_sale? "Yes" : "No"}</p>
              )}
               {nft.auction && <p>Auction Ending: {new Date(nft.auction.end_time * 1000).toLocaleString()}</p>}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
  
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalNFTs}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>
  
      {selectedNft && (
        <ListForSaleModal
          isVisible={isModalVisible}
          onClose={handleModalClose}
          nftDetails={selectedNft}
          onRefresh={fetchUserNFTs}
        />
      )}
      {selectedNft && (
        <StartAuctionModal
          isVisible={isAuctionModalVisible}
          onClose={handleAuctionModalClose}
          nftDetails={selectedNft}
          onRefresh={fetchUserNFTs}
        />
      )}
    </div>
  );
};

export default MyNFTs;
