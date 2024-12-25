import React, { useState, useEffect } from "react";
import { Typography, Radio, message, Card, Row, Col, Pagination, Tag, Button, Modal, Spin } from "antd";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import { useNavigate } from "react-router-dom";
import ConfirmPurchaseModal from "../components/ConfirmPurchaseModal";
import { rarityColors, rarityLabels, truncateAddress } from "../utils/rarityUtils";  
import { client } from "../utils/aptoClientUtil";

const { Title, Text } = Typography;
const { Meta } = Card;

 

type NFT = {
  id: number;
  owner: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: boolean;
  rarity: number;
  auction: any;  // Include auction data structure
};

 

 


const MarketView: React.FC  = ( ) => {
    const { account } = useWallet();
   const [loading, setLoading] = useState<boolean>(true);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
const navigate= useNavigate()
  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

  useEffect(() => {
    handleFetchNfts(undefined);
  }, []);

  const handleFetchNfts = async (selectedRarity: number | undefined) => {
    try {
      if(!selectedRarity) setLoading(true);
     
        const response = await client.getAccountResource(
            MARKET_PLACE_ADDRESS,
            `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::Marketplace`
        );
        console.log("Result::", response);
        const nftList = (response.data as { nfts: NFT[] }).nfts;
        console.log("nftlist::", nftList);
        
        const hexToUint8Array = (hexString: string): Uint8Array => {
            const bytes = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
                bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
            }
            return bytes;
        };

        const decodedNfts = nftList.map((nft) => {
          console.log("h:", nft);
          // Extract auction details
          const auc = nft.auction;  // Assuming nftDetails contains auction data
          const auc_2 = auc ? auc['vec'] : [];  // Extract the 'vec' array which holds auction details
          const auction = auc_2.length ? auc_2[0] : null;  // Get the first auction if available
          
           
          
          // Decode NFT details and include auction information
          return {
            ...nft,
            owner: nft.owner.startsWith('0x')
              ? (nft.owner.length === 66 ? nft.owner : `0x0${nft.owner.substring(2)}`)
              : (nft.owner.length === 63 ? `0x0${nft.owner}` : `0x${nft.owner}`),
            name: new TextDecoder().decode(hexToUint8Array(nft.name.slice(2))),
            description: new TextDecoder().decode(hexToUint8Array(nft.description.slice(2))),
            uri: new TextDecoder().decode(hexToUint8Array(nft.uri.slice(2))),
            price: nft.price / 100000000,
            auction: auction ? {
              end_time: auction.end_time,
              highest_bid: auction.highest_bid,
              highest_bidder: auction.highest_bidder,
              starting_price: auction.starting_price,
            } : null,  // Include auction info if available, otherwise null
          };
        });
        
        console.log("Decoded NFTs:", decodedNfts);

        const filteredNfts = decodedNfts.filter((nft) => 
          (nft.for_sale || nft.auction) && (selectedRarity === undefined || nft.rarity === selectedRarity)
        );
        
        setNfts(filteredNfts);
        setCurrentPage(1);
    } catch (error) {
        console.error("Error fetching NFTs by rarity:", error);
        message.error("Failed to fetch NFTs.");
    }finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsBuyModalVisible(true);
  };

 
 
  const paginatedNfts = nfts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  if (loading) {
    return (
      <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
      }}
    >
      {/* Title at the top */}
      <div  >
        <Title level={2}>Marketplace</Title>
      </div>
    
      {/* Centered spinner */}
      <div
        style={{
          flex: 1,  
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    </div>
    
    
    );
  }
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Title level={2} style={{ marginBottom: "20px" }}>Marketplace</Title>
 
      {/* Filter Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <Radio.Group
          value={rarity}
          onChange={(e) => {
            const selectedRarity = e.target.value;
            setRarity(selectedRarity);
            handleFetchNfts(selectedRarity === 'all' ? undefined : selectedRarity);
          }}
          buttonStyle="solid"
        >
          <Radio.Button value="all">All</Radio.Button>
          <Radio.Button value={1}>Common</Radio.Button>
          <Radio.Button value={2}>Uncommon</Radio.Button>
          <Radio.Button value={3}>Rare</Radio.Button>
          <Radio.Button value={4}>Super Rare</Radio.Button>
        </Radio.Group>
      </div>

      {/* Card Grid */}
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
        {paginatedNfts.map((nft) => (
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
                nft.auction ? (
                  <Button 
                  type="primary"  
                    onClick={() => navigate(`/nft-detail/${nft.id}`)}
                  >
                    Ongoing Auction
                  </Button>
                ) : (
                  nft.owner === account?.address ? (
                    <Button 
                      type="primary" 
                      danger
                      onClick={() => navigate(`/nft-detail/${nft.id}`)}
                    >
                      End Sale
                    </Button>
                  ) : (
                    <Button 
                      type="primary" 
                      onClick={() => handleBuyClick(nft)}
                    >
                      Buy
                    </Button>
                  )
                ),
              ]}
              
              
            >
              <div
                onClick={() => navigate(`/nft-detail/${nft.id}`)}
                >
           
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
              <div
        style={{
          flexGrow: 1, // Allow description to take available space
          overflow: "hidden", // Hide overflow
          textOverflow: "ellipsis", // Truncate text with ellipsis
          WebkitLineClamp: 2, // Limit description to 2 lines
          WebkitBoxOrient: "vertical", // Ensure truncation works
          display: "-webkit-box",
           marginTop:"4px" 
        }}
      >
        {nft.description}
      </div>
              <p>ID: {nft.id}</p>
              <p style={{fontSize:"12px"}}>Owner: { nft.owner === account?.address && "You | "}{truncateAddress(nft.owner)}</p>              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={nfts.length}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: "flex", justifyContent: "center" }}
        />
      </div>

      {/* Buy Modal */}
      <ConfirmPurchaseModal
  isVisible={isBuyModalVisible}
  onClose={() => setIsBuyModalVisible(false)}
  nftDetails={selectedNft}
  onRefresh={() => handleFetchNfts(undefined)}
/>

    </div>
  );
};

export default MarketView;
