import React, { useState, useEffect } from "react";
import { Modal, Button, message, Spin, Card, Progress, Typography } from "antd";
import { AptosClient } from "aptos";
import { MARKET_PLACE_ADDRESS, MARKET_PLACE_NAME } from "../Constants";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { motion } from "framer-motion"; // Animation library
import { fetchNFTDataUtil } from "../utils/fetchNFTData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"; // Adding BarChart
import { client } from "../utils/aptoClientUtil";

const { Meta } = Card;
const { Text } = Typography;

const decodeSalesVolume = (encoded: any, aptToUsdRate: number) => {
    const time = encoded.time;
    const volume = encoded.volume / 100000000;
    
    return {
        time: new Date(time * 1000).toLocaleDateString(),
        volume: (volume * aptToUsdRate).toFixed(2),
    };
};

const Analytics = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [trendingNFTDetails, setTrendingNFTDetails] = useState<any[]>([]);
    const [aptToUsdRate, setAptToUsdRate] = useState<number>(0);
    const { account } = useWallet();

     useEffect(() => {
        // Use an API to get APT to USD exchange rate
        const fetchAptPrice = async () => {
        try {
             // Replace with your API to fetch the conversion rate
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd');
           
            if (response.ok) {
                const data = await response.json();
                console.log("response::", data.aptos.usd)
                setAptToUsdRate(data.aptos.usd);
            } else {
              console.error('Failed to fetch APT to USD conversion rate');
              setAptToUsdRate(0);
            }
        } catch (error) {
             console.error('Failed to fetch APT to USD conversion rate', error);
               setAptToUsdRate(0);
        }
        };
        fetchAptPrice();
    }, []);
    useEffect(() => {
      const fetchAnalytics = async () => {
        try {
          setLoading(true);
          const data = await client.view({
            function: `${MARKET_PLACE_ADDRESS}::${MARKET_PLACE_NAME}::get_analytics`,
            arguments: [MARKET_PLACE_ADDRESS],
            type_arguments: [],
          }) as any;
          console.log("data::", data);
      
           const transformedAnalytics = {
            total_nfts_sold: parseInt(data[0], 10),
            total_trading_volume: (parseInt(data[1], 10) / 100000000), // Convert to APT
            trending_nfts: data[2], // Array of NFT IDs
            active_users: data[3],
             sales_volume_over_time: data[4], // Array of SalesVolumeEntry
          };

          console.log("transformedAnalytics::", transformedAnalytics);
        // Decode sales_volume_over_time into a readable format
        const salesVolumeOverTime =  transformedAnalytics.sales_volume_over_time.map((encoded:any) => {
          return decodeSalesVolume(encoded, aptToUsdRate); // Decode each SalesVolumeEntry
        });

    const analytics ={
      ...transformedAnalytics,
      salesVolumeOverTime,
  }
  console.log("data::", analytics)
           setAnalytics(analytics);
      
          // Fetch details for trending NFTs
          if (transformedAnalytics.trending_nfts?.length > 0) {
            const nftDetails = await Promise.all(
              transformedAnalytics.trending_nfts.map((tokenId: string) =>
                fetchNFTDataUtil(tokenId, account?.address, client)
              )
            );
            setTrendingNFTDetails(nftDetails.filter((nft) => nft)); // Filter out null values
          }
        } catch (error) {
          console.error("Error fetching analytics:", error);
          message.error("Failed to fetch analytics.");
        } finally {
          setLoading(false);
        }
      };
      

      if (account && aptToUsdRate !== 0 ) {
        fetchAnalytics();
      }
    }, [account, aptToUsdRate]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div style={{ textAlign: "center", paddingTop: "50px" }}>
                <h3>No Analytics Available</h3>
            </div>
        );
    }


    return (
        <div style={{ margin: "50px auto", maxWidth: "1200px" }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
            >
                <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#1890ff" }}>
                    Marketplace Analytics
                </h2>

                <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap" }}>
                    {/* Total NFTs Sold */}
                    <Card
                        hoverable
                        style={{ width: 300, marginBottom: 20 }}
                        cover={<img alt="total-nfts" src="https://img.icons8.com/ios/452/empty-box.png" style={{ width: "100%", height: "200px", objectFit: "contain" }} />}
                    >
                        <Meta title="Total NFTs Sold" description={analytics.total_nfts_sold} />
                    </Card>

                    {/* Total Trading Volume */}
                    <Card
                        hoverable
                        style={{ width: 300, marginBottom: 20 }}
                        cover={<img alt="total-volume" src="https://img.icons8.com/ios/452/graph.png" style={{ width: "100%", height: "200px", objectFit: "contain" }} />}
                    >
                        <Meta title="Total Trading Volume" description={<Text>${(analytics.total_trading_volume * aptToUsdRate).toFixed(2)}</Text>} />
                    </Card>

                    {/* Active Users */}
                    <Card
                        hoverable
                        style={{ width: 300, marginBottom: 20 }}
                        cover={<img alt="active-users" src="https://img.icons8.com/ios/452/user-group-man-man.png" style={{ width: "100%", height: "200px", objectFit: "contain" }} />}
                    >
                        <Meta title="Active Users" description={analytics.active_users.length} />
                    </Card>
                </div>

                {/* Bar Chart for Sales Volume Over Time */}
                <div style={{ marginTop: "30px", textAlign: "center" }}>
                    <h3>Sales Volume Over Time</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analytics.salesVolumeOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value}`}/>
                            <Legend />
                            <Bar dataKey="volume" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Circular Progress for Active Users */}
                <div style={{ marginTop: "30px", textAlign: "center" }}>
                    <h3>Active Users Progress</h3>
                    <Progress
                        type="circle"
                        percent={(analytics.active_users.length / 1000) * 100} // Example: Assuming 1000 users is the max
                        format={(percent) => `${analytics.active_users.length} users`}
                        width={120}
                    />
                </div>

                <div style={{ marginTop: "30px" }}>
                    <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Trending NFTs</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px" }}>
                        {trendingNFTDetails.map((nft) => (
                            <Card
                                key={nft.id}
                                hoverable
                                style={{ width: 300 }}
                                cover={<img alt={nft.name} src={nft.uri} style={{ height: 200, width: "100%", objectFit: "cover" }} />}
                            >
                                 <Meta title={<Text style={{fontWeight: "500"}}>{nft.name}</Text>} description={<Text type="secondary">Price: ${ (nft.price * aptToUsdRate).toFixed(2)}</Text>} />
                            </Card>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Analytics;