import React, { useState, useEffect } from "react";
import { Input, Card, Spin, Row, Col, Typography, Pagination, message, Space } from "antd";
import { AptosClient } from "aptos";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import { useNavigate } from "react-router-dom";
import { fetchNFTDataUtil } from "../utils/fetchNFTData";
import { rarityColors, rarityLabels } from "../utils/rarityUtils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { client } from "../utils/aptoClientUtil";

const { Search } = Input;
const { Title, Paragraph, Text } = Typography;
 

const SearchNFT: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [pageLoading, setPageLoading] = useState<boolean>(true); // Initial page load
    const [fetchLoading, setFetchLoading] = useState<boolean>(false); // Loading for fetching after
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(6);
    const [totalResults, setTotalResults] = useState<number>(0);
    const { account } = useWallet();

    useEffect(() => {
          if (searchTerm) {
            searchNFTs();
        } else {
            setSearchResults([]);
            setPageLoading(false);
        }
     
    }, [searchTerm, currentPage, pageSize]);

    const searchNFTs = async () => {
      if (!searchTerm) return;
      setFetchLoading(true);
      try {
          console.log("search_term::", searchTerm)
          const search_term = new TextEncoder().encode(searchTerm);
           const hex_string = "0x" +  Array.from(search_term)
              .map(byte => byte.toString(16).padStart(2, '0'))
             .join('')
          console.log("hexstring::", hex_string)
          const response = await client.view({
              function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::search_nfts_by_name`,
              arguments: [MARKET_PLACE_ADDRESS,  hex_string],
              type_arguments: [],
          }) as any;
           console.log("response::", response)
          let processedResponse = response;
         if (Array.isArray(response)) {
              processedResponse =  response[0];
          };
          console.log("processedResponse::", processedResponse)
          if (processedResponse && processedResponse.length > 0) {
              const nftPromises = processedResponse.map(async (nftId: any) => {
                console.log
                  return fetchNFTDataUtil(nftId[0], account?.address, client)
              })
              const nfts = await Promise.all(nftPromises);
              setTotalResults(nfts.length);
              const startIndex = (currentPage - 1) * pageSize;
              const endIndex = startIndex + pageSize;
              const paginatedResults = nfts.slice(startIndex, endIndex);
              setSearchResults(paginatedResults.filter(Boolean));

          } else {
              setSearchResults([]);
          }
      } catch (error) {
          console.error("Error searching NFTs:", error);
          message.error("Failed to search for NFTs.");
          setSearchResults([])
      }
        setFetchLoading(false);
  };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };
    const onPageChange = (page: number, pageSize: number) => {
        setCurrentPage(page);
        setPageSize(pageSize);
    };

    const handleCardClick = (nftId: number) => {
        navigate(`/nft-detail/${nftId}`);
    };
    
   useEffect(() => {
        setPageLoading(false)
    }, [])


    if (pageLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }
    return (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Title level={2} style={{ marginBottom: "20px", textAlign: "center" }}>Search NFTs</Title>
            <Search
                placeholder="Search NFT by name"
                value={searchTerm}
                onChange={handleSearchChange}
                style={{ marginBottom: "20px", maxWidth: "600px", }}
                size="large"
                loading={fetchLoading} // Use fetchLoading for search input
            />
             {fetchLoading ?  (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", marginBottom: 20}}>
                  <Spin size="large" />
            </div>
                ) : (

                searchResults && searchResults.length > 0 ? (
                    <Row gutter={[24, 24]} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                        {searchResults.map((nft, index) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={index} style={{ display: "flex", justifyContent: "center" }}>
                                <Card
                                    hoverable
                                    onClick={() => handleCardClick(nft.id)}
                                    style={{
                                        width: "100%",
                                        maxWidth: "280px",
                                        margin: "0 auto",
                                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                        transition: "transform 0.2s",
                                    }}
                                    cover={
                                        <img
                                            alt={nft.name}
                                            src={nft.uri}
                                            style={{ height: "200px", objectFit: "cover", borderBottom: "1px solid #f0f0f0" }}
                                        />
                                    }
                                >
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <Title level={5} style={{ marginBottom: "5px", fontWeight: "500" }}>
                                            {nft.name}
                                        </Title>
                                        <Space style={{ width: "100%", justifyContent: "space-between", alignItems: "center" }} >
                                            <Paragraph style={{ margin: '0px' }}>
                                            </Paragraph>
                                            <Typography.Text
                                                style={{ fontSize: '12px', fontWeight: 'bold', margin: '5px' }}
                                                type="secondary"

                                            >
                                                <span style={{ color: rarityColors[nft.rarity] }}>{rarityLabels[nft.rarity]}</span>
                                            </Typography.Text>
                                        </Space>


                                    </div>

                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    searchTerm &&  (
                        <div style={{ textAlign: "center", marginTop: "20px" }}>
                            <Text type="secondary">No results found.</Text>
                        </div>
                    )
                )
                )}
            {searchResults && searchResults.length > 0 && (
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalResults}
                    onChange={onPageChange}
                    style={{ marginTop: "20px", textAlign: "center" }}
                />
            )}
        </div>
    );
};

export default SearchNFT;