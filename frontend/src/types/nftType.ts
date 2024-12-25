 export type NFT = {
    id: number;
    name: string;
    description: string;
    uri: string;
    rarity: number;
    price: number;
    for_sale: boolean;
    owner: string;
    auction: { 
      starting_bid: number; 
      duration: number; 
      end_time: number;
      isExpired: boolean;
    } | null;
  };


  export type Auction = {
    id: number;
    starting_bid: number;
    highest_bid: number;
    end_time: string;
    isExpired: boolean;
    nftMetadata: {
      name: string;
      uri: string;
      description: string;
      rarity: number;
      price: number;
      for_sale: boolean;
      owner: string;  
    };
  };