import { AptosClient } from "aptos";
import { MARKET_PLACE_ADDRESS } from "../Constants";
 

// Utility function to fetch NFT details
export const fetchNFTDataUtil = async (tokenId: string, account: string | undefined, client: AptosClient) => {
  if (!tokenId || !account) return null;

  try {
    const nftDetails = await client.view({
      function: `${MARKET_PLACE_ADDRESS}::NFTMarketplace::get_nft_details`,
      arguments: [MARKET_PLACE_ADDRESS, tokenId],
      type_arguments: [],
    }) as any;

    const auc = nftDetails[8];
    const auc_2 = auc['vec'];
    const auction = auc_2[0];

    const [nftId, owner, name, description, uri, price, for_sale, rarity] = nftDetails as [
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

    const nft = {
      id: nftId,
      name: new TextDecoder().decode(hexToUint8Array(name.slice(2))),
      description: new TextDecoder().decode(hexToUint8Array(description.slice(2))),
      uri: new TextDecoder().decode(hexToUint8Array(uri.slice(2))),
      rarity,
      price: price / 100000000, // Convert octas to APT
      for_sale,
      owner: owner.startsWith('0x')
      ? (owner.length === 66 ? owner : `0x0${owner.substring(2)}`)
       : (owner.length === 63 ? `0x0${owner}` : `0x${owner}`),
      auction,
    };
    let auction_data =null;
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

    try {
    auction_data = {
      end_time: auction.end_time,
      highest_bid: auction.highest_bid / 100000000, // Convert octas to APT
      highest_bidder: auction.highest_bidder,
      nft_id: auction.nft_id,
      starting_price: auction.starting_price / 100000000, // Convert octas to APT
      isExpired: currentTime > auction.end_time, // Check if auction has expired

    };
    } catch (error) {
        console.error(`destructurng auction data error`, error);
        auction_data =null;
    }
    nft.auction= auction_data
    console.log("nft::", nft)
    return nft;
  } catch (error) {
    console.error(`Error fetching details for NFT ID ${tokenId}:`, error);
    return null;
  }
};
