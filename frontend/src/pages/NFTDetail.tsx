import React, { useState, useEffect } from "react";
import {
    Button,
    Card,
    Spin,
    message,
    Row,
    Col,
    Typography,
    Tag,
    Tooltip,
    Avatar
} from "antd";
import { AptosClient } from "aptos";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import {
    DollarCircleOutlined,
    ClockCircleOutlined,
    UserOutlined,
    SendOutlined
} from "@ant-design/icons";
import ConfirmPurchaseModal from "../components/ConfirmPurchaseModal";
import PlaceBidModal from "../components/PlaceBidModal";
import StartAuctionModal from "../components/StartAuctionModal";
import ListForSaleModal from "../components/ListForSaleModal";
import TransferNFTModal from "../components/TransferNFTModal";
import { fetchNFTDataUtil } from "../utils/fetchNFTData";
import { rarityColors, rarityLabels } from "../utils/rarityUtils";
import { client } from "../utils/aptoClientUtil";

const { Title, Paragraph, Text } = Typography;
 


const NFTDetail: React.FC = () => {
    const navigate = useNavigate();
    const { tokenId } = useParams<{ tokenId: string }>();
    const [nftDetails, setNftDetails] = useState<any>(null);
    const [auctionData, setAuctionData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { account } = useWallet();
    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
    const [isListModalVisible, setIsListModalVisible] = useState(false);
    const [isAuctionModalVisible, setIsAuctionModalVisible] = useState(false);
    const [isBidModalVisible, setIsBidModalVisible] = useState(false);
    const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
    const [countdown, setCountdown] = useState<string>("");

    const cardStyle = {
        maxWidth: '800px',
        width: '100%',
        margin: '20px auto',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        padding: '24px !important',
    };

   

    const tagStyle = {
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '15px',
        padding: '5px 10px',
        borderRadius: '8px',
    };

     const paragraphStyle = {
         margin: "5px 0",
          fontSize: "16px",
          lineHeight: 1.5,
      };

    const buttonStyle = {
          height: '40px',
          fontSize: '14px',
          borderRadius: '8px',
       border:'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
    };
     const smallAvatarStyle = {
        backgroundColor:  '#f0f0f0',
        color:'gray',
        marginLeft: '5px' ,
        fontSize: '14px',

       }

    useEffect(() => {
        fetchNFTData();
    }, [tokenId, account]);


    useEffect(() => {
        if (auctionData?.end_time) {
            const interval = setInterval(() => {
                const now = new Date().getTime();
                const endTime = auctionData.end_time * 1000;
                const timeLeft = endTime - now;

                if (timeLeft <= 0) {
                    clearInterval(interval);
                    setCountdown("Auction expired");
                } else {
                    const hours = Math.floor(
                        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                    );
                    const minutes = Math.floor(
                        (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
                    );
                   const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                    setCountdown(`${hours}h ${minutes}m ${seconds}s`);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [auctionData]);

    const fetchNFTData = async () => {
        if (!tokenId) return;
        if (!account) return;
        setLoading(true);
        const data = await fetchNFTDataUtil(tokenId, account?.address, client);
        if (data) {
            setNftDetails(data);
            setAuctionData(data.auction);
        } else {
            message.error("Error fetching NFT details.");
        }
        setLoading(false);
    };

    const handleEndSale = async () => {
        if (!account) return;
        try {
            const entryFunctionPayload = {
                type: "entry_function_payload",
                function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::end_sale`,
                type_arguments: [],
                arguments: [MARKET_PLACE_ADDRESS, nftDetails.id.toString()],
            };

            const response = await (
                window as any
            ).aptos.signAndSubmitTransaction(entryFunctionPayload);
            await client.waitForTransaction(response.hash);

            message.success("NFT sale ended successfully!");
            setNftDetails(null);

            await fetchNFTData();
        } catch (error) {
            console.error("Error ending NFT sale:", error);
            message.error("Failed to end auction.");
        }
    };

    const handleEndAuction = async (nftId: number) => {
        if (!account) return;
        try {
            const entryFunctionPayload = {
                function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::end_auction`,
                type_arguments: [],
                arguments: [MARKET_PLACE_ADDRESS, nftId],
            };

            const txnResponse = await (
                window as any
            ).aptos.signAndSubmitTransaction(entryFunctionPayload);
            console.log("Transaction Response:", txnResponse);
            await client.waitForTransaction(txnResponse.hash);
            message.success(`Auction ended successfully!`);
            setAuctionData(null);
            await fetchNFTData();
        } catch (error) {
            console.error("Error ending auction:", error);
            message.error("Failed to end auction.");
        }
    };


    const handleTransferClick = () => {
        setIsTransferModalVisible(true);
    };

    const handleMessageOwnerClick = () => {
        if (!account) return;
        navigate(`/chat`, { state: { recipient: nftDetails.owner, initialChat: true } });
    };


      const handleBuyClick = () => {
         setIsBuyModalVisible(true);
     };

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div
             style={{
                padding: '20px',
                display: "flex",
               flexDirection: "column",
               alignItems: "center",
                 justifyContent: "center"
            }}
        >
            <Title level={2} style={{ marginBottom: "20px", textAlign: "center" }}>
                NFT Details
            </Title>
            {nftDetails && (
                <Card style={cardStyle}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={10} md={8}>
                            <img alt={nftDetails.name} src={nftDetails.uri} style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                                objectFit: 'cover',
                                borderRadius: '12px 0 0 12px',
                            }} />
                        </Col>

                        <Col xs={24} sm={14} md={16} style={{ paddingLeft: '20px' }}>
                            <Title level={3} style={{ marginBottom: '10px' }}>{nftDetails.name}</Title>
                            <Tag
                                color={rarityColors[nftDetails.rarity]}
                                style={tagStyle}
                            >
                                {rarityLabels[nftDetails.rarity]}
                           </Tag>
                           <Paragraph style={paragraphStyle}>
                                <Text strong>NFT ID:</Text> {nftDetails.id}
                            </Paragraph>
                           <Paragraph style={paragraphStyle}>
                                <Text strong>Price:</Text>{" "}
                                {auctionData ? `Auction` : `${nftDetails.price} APT`}
                            </Paragraph>
                            <Paragraph style={paragraphStyle}>
                                <Text strong>Rarity:</Text> {rarityLabels[nftDetails.rarity]}
                            </Paragraph>
                           <Paragraph style={paragraphStyle}>
                                <Text strong>For Sale:</Text> {nftDetails.for_sale ? "Yes" : "No"}
                            </Paragraph>
                           <Paragraph
                               style={{ marginTop: "15px", fontSize: "16px", lineHeight: 1.5 }}
                           >
                                <Text strong>Description:</Text> {nftDetails.description}
                            </Paragraph>
                         <Paragraph style={{ marginTop: '10px', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                            <Text strong>Owner:  </Text>
                           <Tooltip title={nftDetails.owner}>
                                <Text
                                    style={{
                                       overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                       display: 'inline-block',
                                         maxWidth: '400px', // Or any other value for max width
                                         marginLeft: "5px"
                                    }}
                                >
                                    {nftDetails.owner === account?.address ? "You | " : ""}
                                    <UserOutlined style={{ marginRight: '5px', fontSize: '14px' }} />{nftDetails.owner}
                                 </Text>
                             </Tooltip>
                          </Paragraph>

                            {auctionData && (
                                <>
                                    <hr style={{ margin: '15px 0' }} />
                                  <Title level={4} style={{ marginBottom: '10px' }}>Auction Information</Title>
                                  <Paragraph style={paragraphStyle}>
                                       <Text strong>Auction End Time:</Text>{" "}
                                        {new Date(auctionData.end_time * 1000).toLocaleString()}
                                     </Paragraph>
                                   <Paragraph style={paragraphStyle}>
                                      <Text strong>End Countdown:</Text>{" "}
                                        <span style={{ color: "red" }}>{countdown}</span>
                                    </Paragraph>
                                   <Paragraph style={paragraphStyle}>
                                      <Text strong>Starting Bid:</Text> {auctionData.starting_price} APT
                                     </Paragraph>
                                   <Paragraph style={paragraphStyle}>
                                      <Text strong>Highest Bid:</Text> {auctionData.highest_bid} APT
                                     </Paragraph>
                                </>
                            )}
                         <Row gutter={16} style={{ marginTop: "20px" }}>
                             <Col span={8}>
                                     {auctionData ? (
                                          nftDetails.owner === account?.address ? (
                                                <Button
                                                    type="primary"
                                                    danger
                                                    block
                                                    disabled={!auctionData.isExpired}
                                                   style={buttonStyle}
                                                    onClick={() => handleEndAuction(nftDetails.id)}
                                                   icon={<ClockCircleOutlined />}
                                                >
                                                      End Auction 
                                               </Button>
                                           ) : (
                                             <Button
                                                   disabled={auctionData.isExpired}
                                                  type="primary"
                                                   block
                                                     style={buttonStyle}
                                                    onClick={() => setIsBidModalVisible(true)}
                                                  icon={<DollarCircleOutlined />}
                                                 >
                                                  Place Bid
                                             </Button>
                                            )
                                      ) : nftDetails.for_sale ? (
                                           nftDetails.owner === account?.address ? (
                                                 <Button
                                                      type="primary"
                                                    danger
                                                      block
                                                     style={buttonStyle}
                                                   onClick={handleEndSale}
                                                     icon={<DollarCircleOutlined />}
                                                 >
                                                     End Sale
                                               </Button>
                                          ) : (
                                              <Button type="primary" block onClick={() => handleBuyClick()} style={buttonStyle} >
                                                   Buy
                                               </Button>
                                            )
                                      ) : (
                                          nftDetails.owner === account?.address && (
                                              <Button
                                                    type="primary"
                                                     block
                                                      style={buttonStyle}
                                                    onClick={() => setIsListModalVisible(true)}
                                                   icon={<DollarCircleOutlined />}
                                               >
                                                   List for Sale
                                               </Button>
                                            )
                                      )}
                                   </Col>
                                   <Col span={8}>
                                        {!auctionData ? (
                                           nftDetails.owner === account?.address && (
                                               <Button
                                                  type="primary"
                                                   block
                                                 style={buttonStyle}
                                                  onClick={() => setIsAuctionModalVisible(true)}
                                                    icon={<ClockCircleOutlined />}
                                                  disabled={nftDetails.for_sale}
                                                 >
                                                   Start Auction
                                                </Button>
                                             )
                                           ) :
                                       
                                            nftDetails.owner === account?.address && (
                                              <Button
                                                   disabled={auctionData.isExpired}
                                                  type="primary"
                                                   block
                                                     style={buttonStyle}
                                                    onClick={() => setIsBidModalVisible(true)}
                                                  icon={<DollarCircleOutlined />}
                                                 >
                                                  Self Bid
                                             </Button>
                                            )
                                          }
                                   </Col>
                                 <Col span={8} style={{ display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                     {nftDetails.owner === account?.address ? (
                                           <Button
                                                type="primary"
                                                block
                                                  style={buttonStyle}
                                                onClick={() => handleTransferClick()}
                                                icon={<UserOutlined />}
                                                disabled={nftDetails.for_sale}
                                            >
                                               Transfer NFT
                                          </Button>
                                           ) : (
                                              <Button
                                                type="primary"
                                                  block
                                                    style={buttonStyle}
                                                  onClick={handleMessageOwnerClick}
                                                    icon={<SendOutlined />}
                                                >
                                                    Message Owner
                                               </Button>
                                           )}
                                </Col>
                            </Row>
                      </Col>
                   </Row>
               </Card>
           )}

            <ListForSaleModal
                isVisible={isListModalVisible}
                onClose={() => setIsListModalVisible(false)}
                nftDetails={nftDetails}
                onRefresh={fetchNFTData}
            />
            <StartAuctionModal
                isVisible={isAuctionModalVisible}
                onClose={() => setIsAuctionModalVisible(false)}
               nftDetails={nftDetails}
                onRefresh={fetchNFTData}
            />
            <PlaceBidModal
               isVisible={isBidModalVisible}
                onClose={() => setIsBidModalVisible(false)}
              nftDetails={nftDetails}
               auction={auctionData}
               onRefresh={fetchNFTData}
            />
           <ConfirmPurchaseModal
               isVisible={isBuyModalVisible}
               onClose={() => setIsBuyModalVisible(false)}
             nftDetails={nftDetails}
               onRefresh={fetchNFTData}
           />
            <TransferNFTModal
                isVisible={isTransferModalVisible}
                onClose={() => setIsTransferModalVisible(false)}
               nftDetails={nftDetails}
              onRefresh={fetchNFTData}
            />
       </div>
    );
};

export default NFTDetail;