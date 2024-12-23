address  0x381909e7b424111da9b8626a84bd6ce581c5efd8eeec2accefe085e4bd335908 {
module NFTMarketplace {
    use 0x1::signer;
    use 0x1::vector; 
    use 0x1::coin;
    use 0x1::option;
    use 0x1::timestamp;
    use 0x1::aptos_coin;
    use 0x1::string;
    

    const E_NOT_OWNER: u64 = 100;
    const E_AUCTION_ALREADY_STARTED: u64 = 101;
    const E_NO_AUCTION_EXISTS: u64 = 200;
    const E_BID_TOO_LOW: u64 = 201;
    const E_AUCTION_NOT_ENDED: u64 = 202;
    const E_AUCTION_EXPIRED: u64 = 203;
    const E_CALLER_NOT_OWNER: u64 = 300;
    const E_TRANSFER_TO_SAME_OWNER: u64 = 301;
    const E_INVALID_PRICE: u64 = 400;
    const E_NFT_NOT_FOR_SALE: u64 = 401;
    const E_INSUFFICIENT_PAYMENT: u64 = 402;
    const E_NFT_FOR_SALE: u64 = 403;
    const E_INSUFFICIENT_FUNDS: u64 = 501;
    const E_INVALID_AMOUNT: u64 = 502;
    const E_UNAUTHORIZED_CHAT_ACCESS: u64 = 600;
    const E_CHAT_DOES_NOT_EXIST: u64 = 601;
    const E_CHAT_ALREADY_EXISTS_BETWEEN_USERS: u64 = 602;
    const E_CHAT_SENDER_SAME_AS_RECIPIENT: u64 = 603;
     const E_CHAT_RECIPIENT_HAS_NOT_TURNED_ON_THEIR_CHAT: u64 = 604;

    const MARKETPLACE_FEE_PERCENT: u64 = 2; // 2% fee

    struct NFT has store, key, copy {
        id: u64,
        owner: address, 
        name: vector<u8>,
        description: vector<u8>,
        uri: vector<u8>,
        price: u64,
        for_sale: bool,
        rarity: u8,
        auction: option::Option<Auction>,
    }

    struct ListedNFT has store {
        id: u64,
        price: u64,
        rarity: u8,
    }

    struct Marketplace has key {
        nfts: vector<NFT>,
        listed_nfts: vector<ListedNFT>,
    }

    struct Auction has store, key, copy, drop {
        nft_id: u64,
        starting_price: u64,
        end_time: u64,
        highest_bid: u64,
        highest_bidder: address,
    }

    struct SalesVolumeEntry has store, copy, drop {
        time: u64,     // Timestamp for the time period (e.g., today)
        volume: u64,   // Total sales volume for that time period
    }

    struct Analytics has key, store {
        total_nfts_sold: u64,
        total_trading_volume: u64,
        trending_nfts: vector<u64>,
        active_users: vector<address>,
        sales_volume_over_time: vector<SalesVolumeEntry>,
    }

       struct Chat has key, store, copy, drop {
        id: u64,
        participants: vector<address>,
        messages: vector<Message>,
        last_message_id: u64,
    }

    struct Message has store, copy, drop {
        id: u64,
        sender: address,
        content: string::String,
        timestamp: u64,
    }

    // Shared global resource for chats
    struct SharedChats has key {
        chats: vector<Chat>,
    }

    // Initialize the shared chats resource
    public entry fun initialize_shared_chats(account: &signer) {
        let owner = signer::address_of(account);
        assert!(!exists<SharedChats>(owner), E_CHAT_DOES_NOT_EXIST);
        move_to(account, SharedChats { chats: vector::empty() });
    }

    #[view]
    public fun is_user_initialized(user_address: address): bool {
        exists<SharedChats>(user_address)
    }

    // Initialize Marketplace
    public entry fun initialize(account: &signer) {
        let marketplace = Marketplace {
            nfts: vector::empty<NFT>(),
            listed_nfts: vector::empty<ListedNFT>(),
        };
        move_to(account, marketplace);
    
        

        // Call the `initialize_analytics` function to initialize analytics
        initialize_analytics(account);
    }

    // Initialize Analytics
    public entry fun initialize_analytics(account: &signer) {
        let analytics = Analytics {
            total_nfts_sold: 0,
            total_trading_volume: 0,
            trending_nfts: vector::empty<u64>(),
            active_users: vector::empty<address>(),
            sales_volume_over_time: vector::empty<SalesVolumeEntry>(),
        };
        move_to(account, analytics);
    }

      // Check if Marketplace is initialized
    #[view]
    public fun is_marketplace_initialized(marketplace_addr: address): bool {
        exists<Marketplace>(marketplace_addr)
    }
  // View Analytics
    #[view]
    public fun get_analytics(marketplace_addr: address): (u64, u64, vector<u64>, vector<address>, vector<SalesVolumeEntry>) acquires Analytics {
        let analytics = borrow_global<Analytics>(marketplace_addr);
        (
            analytics.total_nfts_sold,
            analytics.total_trading_volume,
            analytics.trending_nfts,
            analytics.active_users,
            analytics.sales_volume_over_time
        )
    }
    // Mint New NFT
    public entry fun mint_nft(account: &signer, name: vector<u8>, description: vector<u8>, uri: vector<u8>, rarity: u8) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(signer::address_of(account));
        let nft_id = vector::length(&marketplace.nfts);

        let new_nft = NFT {
            id: nft_id,
            owner: signer::address_of(account),
            name,
            description,
            uri,
            price: 0,
            for_sale: false,
            rarity,
            auction: option::none<Auction>(),
        };

        vector::push_back(&mut marketplace.nfts, new_nft);
    }


    // Start Auction
    public entry fun start_auction(account: &signer, marketplace_addr: address, nft_id: u64, starting_price: u64, duration: u64) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

        assert!(nft_ref.owner == signer::address_of(account), E_NOT_OWNER);
        assert!(&nft_ref.auction == &option::none<Auction>(), E_AUCTION_ALREADY_STARTED);

        let auction = Auction {
            nft_id,
            starting_price,
            end_time: timestamp::now_seconds() + duration,
            highest_bid: starting_price,
            highest_bidder: signer::address_of(account),
        };

        nft_ref.auction = option::some(auction);
        nft_ref.for_sale = true;
    }

    // Place Bid
    public entry fun place_bid(account: &signer, marketplace_addr: address, nft_id: u64, bid_amount: u64) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

        let auction_opt = &mut nft_ref.auction;
        assert!(option::is_some(auction_opt), E_NO_AUCTION_EXISTS);

        let auction = option::borrow_mut(auction_opt);

    // Check if the auction has expired
       let current_time = timestamp::now_seconds();
        assert!(current_time < auction.end_time, E_AUCTION_EXPIRED);
        
        assert!(bid_amount > auction.highest_bid, E_BID_TOO_LOW);


        // Refund the previous highest bidder
        if(auction.highest_bidder != signer::address_of(account)){
           coin::transfer<aptos_coin::AptosCoin>(account, auction.highest_bidder, auction.highest_bid);
       };
       
        coin::transfer<aptos_coin::AptosCoin>(account, marketplace_addr, bid_amount);

        auction.highest_bid = bid_amount;
        auction.highest_bidder = signer::address_of(account);

        let fee = (auction.highest_bid * MARKETPLACE_FEE_PERCENT) / 100;
        let seller_revenue = auction.highest_bid - fee;

        coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.owner, seller_revenue);
        coin::transfer<aptos_coin::AptosCoin>(account, marketplace_addr, fee);
    }

    // End Auction and Transfer NFT
    public entry fun end_auction(account: &signer, marketplace_addr: address, nft_id: u64) acquires Marketplace, Analytics {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);
        let analytics = borrow_global_mut<Analytics>(marketplace_addr);

        let auction_opt = &mut nft_ref.auction;
        assert!(option::is_some(auction_opt), E_NO_AUCTION_EXISTS);
        let auction = option::extract(auction_opt);

        let current_time = timestamp::now_seconds();

        assert!(auction.end_time <= current_time, E_AUCTION_NOT_ENDED);

    // Transfer NFT ownership to the highest bidder
        nft_ref.owner = auction.highest_bidder;
        nft_ref.for_sale = false;
         *auction_opt = option::none<Auction>();

        // Calculate fees and seller revenue
        let fee = (auction.highest_bid * MARKETPLACE_FEE_PERCENT) / 100;
        let seller_revenue = auction.highest_bid - fee;

        // Transfer funds to seller and platform
        coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.owner, seller_revenue);
        coin::transfer<aptos_coin::AptosCoin>(account, signer::address_of(account), fee);

        // Update Analytics
        analytics.total_nfts_sold = analytics.total_nfts_sold + 1;
        analytics.total_trading_volume = analytics.total_trading_volume + auction.highest_bid;

        // Add to trending NFTs
        if (!vector::contains(&analytics.trending_nfts, &nft_id)) {
            vector::push_back(&mut analytics.trending_nfts, nft_id);
        };

        // Add to active users
        let user_address = auction.highest_bidder;
        if (!vector::contains(&analytics.active_users, &user_address)) {
            vector::push_back(&mut analytics.active_users, user_address);
        };
        
        // Update sales volume over time (using a daily key).
        let current_time = timestamp::now_seconds();
        let day_start_timestamp = current_time - (current_time % 86400);

        let volume_found = false;
        let entries_len = vector::length(&analytics.sales_volume_over_time);
        let i = 0;

        while(i < entries_len){
            let entry = *vector::borrow(&analytics.sales_volume_over_time, i);

            if(entry.time == day_start_timestamp){
                // Update the existing entry
                let updated_volume = entry.volume + auction.highest_bid;
                let updated_entry = SalesVolumeEntry {
                    time: day_start_timestamp,
                    volume: updated_volume,
                };
                vector::remove(&mut analytics.sales_volume_over_time, i);
                vector::push_back(&mut analytics.sales_volume_over_time, updated_entry);
            
                volume_found = true;
                break
            };

            i = i + 1;
        };

        if (!volume_found) {
            // Add a new entry if not found
            let new_entry = SalesVolumeEntry {
                time: day_start_timestamp,
                volume: auction.highest_bid,
            };
            vector::push_back(&mut analytics.sales_volume_over_time, new_entry);
        };
    }

    #[view]
    public fun get_active_auctions(marketplace_addr: address, limit: u64, offset: u64): vector<Auction> acquires Marketplace {
        // Borrow the global Marketplace mutably
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);  // Use borrow_global_mut for mutable reference

        let active_auctions = vector::empty<Auction>();

        let nfts_len = vector::length(&marketplace.nfts);
        let end = min(offset + limit, nfts_len);
        let mut_i = offset;

        while (mut_i < end) {
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, mut_i);  // Borrow mutable reference to nft
            if (option::is_some(&nft_ref.auction)) {
                let auction = option::borrow(&nft_ref.auction);  // Borrow the auction
                vector::push_back(&mut active_auctions, *auction);  // Dereference to push the value
            };
            mut_i = mut_i + 1;
        };

        active_auctions
    }

    // Transfer NFT Ownership
    public entry fun transfer_ownership(account: &signer, marketplace_addr: address, nft_id: u64, new_owner: address) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

        assert!(nft_ref.owner == signer::address_of(account), E_CALLER_NOT_OWNER);
        assert!(nft_ref.owner != new_owner, E_TRANSFER_TO_SAME_OWNER);

        nft_ref.owner = new_owner;
        nft_ref.for_sale = false;
        nft_ref.price = 0;
    }

    // Set NFT Price
    public entry fun set_price(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

        assert!(nft_ref.owner == signer::address_of(account), E_CALLER_NOT_OWNER);
        assert!(price > 0, E_INVALID_PRICE);

        nft_ref.price = price;
    }

     // Purchase NFT
    public entry fun purchase_nft(
        account: &signer,
        marketplace_addr: address,
        nft_id: u64,
        payment: u64
    ) acquires Marketplace, Analytics {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);
        let analytics = borrow_global_mut<Analytics>(marketplace_addr);


        assert!(nft_ref.for_sale, E_NFT_NOT_FOR_SALE);
        assert!(payment >= nft_ref.price, E_INSUFFICIENT_PAYMENT);

        let fee = (nft_ref.price * MARKETPLACE_FEE_PERCENT) / 100;
        let seller_revenue = payment - fee;

        coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.owner, seller_revenue);
        coin::transfer<aptos_coin::AptosCoin>(account, marketplace_addr, fee);
      
        nft_ref.owner = signer::address_of(account);
        nft_ref.for_sale = false;
        nft_ref.price = 0;

        // Update Analytics
        analytics.total_nfts_sold = analytics.total_nfts_sold + 1;
        analytics.total_trading_volume = analytics.total_trading_volume + payment;

        // Add to trending NFTs
        if (!vector::contains(&analytics.trending_nfts, &nft_id)) {
            vector::push_back(&mut analytics.trending_nfts, nft_id);
        };

        // Add to active users
        let user_address = signer::address_of(account);
        if (!vector::contains(&analytics.active_users, &user_address)) {
            vector::push_back(&mut analytics.active_users, user_address);
        };
        
        // Update sales volume over time 
        let current_time = timestamp::now_seconds();
        let day_start_timestamp = current_time - (current_time % 86400);

        let volume_found = false;
        let entries_len = vector::length(&analytics.sales_volume_over_time);
        let i = 0;

        while (i < entries_len) {
            let entry = *vector::borrow(&analytics.sales_volume_over_time, i);

            if (entry.time == day_start_timestamp) {
                // If an entry exists for the current day, update its volume
                let updated_volume = entry.volume + payment;
                let updated_entry = SalesVolumeEntry {
                    time: day_start_timestamp,
                    volume: updated_volume,
                };
                vector::remove(&mut analytics.sales_volume_over_time, i);
                vector::push_back(&mut analytics.sales_volume_over_time, updated_entry);

                volume_found = true;
                break
            };

            i = i + 1;
        };

        if (!volume_found) {
            // If no entry exists for today, add a new one
            let new_entry = SalesVolumeEntry {
                time: day_start_timestamp,
                volume: payment,
            };
            vector::push_back(&mut analytics.sales_volume_over_time, new_entry);
        };
    }

   // Get NFT Owner
    #[view]
    public fun get_owner(marketplace_addr: address, nft_id: u64): address acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(marketplace_addr);
        let nft = vector::borrow(&marketplace.nfts, nft_id);
        nft.owner
    }

    // Retrieve NFTs for Sale for a specific owner
    #[view]
    public fun get_all_nfts_for_owner(marketplace_addr: address, owner_addr: address, limit: u64, offset: u64): vector<u64> acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(marketplace_addr);
        let nft_ids = vector::empty<u64>();

        let nfts_len = vector::length(&marketplace.nfts);
        let end = min(offset + limit, nfts_len);
        let mut_i = offset;
        while (mut_i < end) {
            let nft = vector::borrow(&marketplace.nfts, mut_i);
            if (nft.owner == owner_addr) {
                vector::push_back(&mut nft_ids, nft.id);
            };
            mut_i = mut_i + 1;
        };

        nft_ids
    }

    // Get all NFTs for sale (Paginated)
    #[view]
    public fun get_all_nfts_for_sale(marketplace_addr: address, limit: u64, offset: u64): vector<ListedNFT> acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(marketplace_addr);
        let nfts_for_sale = vector::empty<ListedNFT>();

        let nfts_len = vector::length(&marketplace.nfts);
        let end = min(offset + limit, nfts_len);
        let mut_i = offset;
        while (mut_i < end) {
            let nft = vector::borrow(&marketplace.nfts, mut_i);
            if (nft.for_sale) {
                let listed_nft = ListedNFT {
                    id: nft.id,
                    price: nft.price,
                    rarity: nft.rarity,
                };
                vector::push_back(&mut nfts_for_sale, listed_nft);
            };
            mut_i = mut_i + 1;
        };

        nfts_for_sale
    }

    // Get NFTs by rarity
    #[view]
    public fun get_nfts_by_rarity(marketplace_addr: address, rarity: u8): vector<u64> acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(marketplace_addr);
        let nft_ids = vector::empty<u64>();

        let nfts_len = vector::length(&marketplace.nfts);
        let mut_i = 0;
        while (mut_i < nfts_len) {
            let nft = vector::borrow(&marketplace.nfts, mut_i);
            if (nft.rarity == rarity) {
                vector::push_back(&mut nft_ids, nft.id);
            };
            mut_i = mut_i + 1;
        };

        nft_ids
    }

  // Get NFT Details
    #[view]
    public fun get_nft_details(
        marketplace_addr: address, 
        nft_id: u64
    ): (u64, address, vector<u8>, vector<u8>, vector<u8>, u64, bool, u8, option::Option<Auction>) acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(marketplace_addr);
        let nft = vector::borrow(&marketplace.nfts, nft_id);

        // Return the NFT details along with the auction (if available)
        (nft.id, nft.owner, nft.name, nft.description, nft.uri, nft.price, nft.for_sale, nft.rarity, nft.auction)
    }
 

    // List NFT for Sale
    public entry fun list_for_sale(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

        assert!(nft_ref.owner == signer::address_of(account), E_CALLER_NOT_OWNER);
        assert!(!nft_ref.for_sale, E_NFT_NOT_FOR_SALE);
        assert!(price > 0, E_INVALID_PRICE);

        nft_ref.for_sale = true;
        nft_ref.price = price;
    }

    // End Sale for Listed NFT
    public entry fun end_sale(account: &signer, marketplace_addr: address, nft_id: u64) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

        // Ensure the caller is the owner of the NFT
        assert!(nft_ref.owner == signer::address_of(account), E_CALLER_NOT_OWNER);

        // Ensure the NFT is currently listed for sale
        assert!(nft_ref.for_sale, E_NFT_NOT_FOR_SALE);

        // Set the `for_sale` flag to false
        nft_ref.for_sale = false;
        nft_ref.price = 0;
    }


 

 // Entry function to transfer APT
    public entry fun transfer_apt(
        sender: &signer, 
        recipient: address, 
        amount: u64
    )  {
        // Ensure the transfer amount is positive
        assert!(amount > 0, E_INVALID_AMOUNT); //   Invalid amount

        // Check if sender has enough APT balance
        let sender_balance = coin::balance<aptos_coin::AptosCoin>(signer::address_of(sender));
        assert!(sender_balance >= amount, E_INSUFFICIENT_FUNDS); //  Insufficient funds

        // Proceed with the transfer
        coin::transfer<aptos_coin::AptosCoin>(sender, recipient, amount);
    }

    // Transfer NFT Ownership
    public entry fun transfer_nft(account: &signer, marketplace_addr: address, nft_id: u64, new_owner: address) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
        let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

        assert!(nft_ref.owner == signer::address_of(account), E_CALLER_NOT_OWNER);
        assert!(nft_ref.owner != new_owner, E_TRANSFER_TO_SAME_OWNER);
        assert!(!nft_ref.for_sale, E_NFT_FOR_SALE); // Ensure NFT is not for sale

        nft_ref.owner = new_owner;
        nft_ref.for_sale = false;
        nft_ref.price = 0;
        nft_ref.auction = option::none<Auction>();
    }
    
   public fun min(a: u64, b: u64): u64 {
        if (a < b) { a } else { b }
    }
  

    // New Helper function to convert to lowercase
    fun vector_to_lower(input: &vector<u8>): vector<u8> {
        let result = vector::empty<u8>();
        let i = 0;
        let input_len = vector::length<u8>(input);
        while (i < input_len) {
            let char = *vector::borrow<u8>(input, i);
             if (char >= 65 && char <= 90) {
                vector::push_back(&mut result, char + 32); // Convert to lowercase
            } else {
                vector::push_back(&mut result, char); // Keep the same character
            };
            i = i + 1;
        };
        result
    }

   // Helper function to check if one vector contains another
    fun vector_contains(haystack: &vector<u8>, needle: &vector<u8>): bool {
        let haystack_lower = vector_to_lower(haystack);
        let needle_lower = vector_to_lower(needle);
        let haystack_len = vector::length<u8>(&haystack_lower);
        let needle_len = vector::length<u8>(&needle_lower);

        if (needle_len == 0) {
            return true
        }; // Empty needle matches any string
        if (needle_len > haystack_len) {
            return false
        }; // Needle longer than haystack, impossible

        let  i = 0;
        while (i <= haystack_len - needle_len) {
            let  j = 0;
            while (j < needle_len) {
                if (*vector::borrow<u8>(&haystack_lower, i + j) != *vector::borrow<u8>(&needle_lower, j)) {
                    break
                };
                j = j + 1;
            };
            if (j == needle_len) {
                return true
            }; // Full needle found
            i = i + 1;
        };

        false // Needle not found
    }

   // Get NFTs by Name
    #[view]
    public fun search_nfts_by_name(
        marketplace_addr: address,
        search_term: vector<u8>
    ): vector<u64> acquires Marketplace {
        let marketplace = borrow_global<Marketplace>(marketplace_addr);
        let nft_ids = vector::empty<u64>();

        let nfts_len = vector::length(&marketplace.nfts);
        let mut_i = 0;
        while (mut_i < nfts_len) {
            let nft = vector::borrow(&marketplace.nfts, mut_i);
             if (vector_contains(&nft.name, &search_term)) {
                vector::push_back(&mut nft_ids, nft.id);
            };
            mut_i = mut_i + 1;
        };

        nft_ids
    }


  //Check if a chat already exist between sender and recipient and returns bool
  fun get_chat_id_bool(user_address: address, recipient_address: address): bool acquires SharedChats {
        assert!(exists<SharedChats>(user_address), E_CHAT_DOES_NOT_EXIST);

        let shared_chats = borrow_global<SharedChats>(user_address);
        let chats = &shared_chats.chats;

        let i = 0;
          while (i < vector::length(chats)) {
            let chat = vector::borrow(chats, i);
             if (is_participant(chat, user_address) && is_participant(chat, recipient_address)) {
               return true
            };
           i = i + 1;
        };
        return false
    }
      // Create a new chat between two users
public entry fun create_chat(
    account: &signer,
    recipient: address
) acquires SharedChats {
    let sender = signer::address_of(account);
    let chat_id = timestamp::now_seconds();

    // Ensure the shared chats resource exists for account
    if (!exists<SharedChats>(sender)) {
        initialize_shared_chats(account);
    };

 // Ensure the shared chats resource exists for recipient
        assert!(exists<SharedChats>(recipient), E_CHAT_RECIPIENT_HAS_NOT_TURNED_ON_THEIR_CHAT);

    // Check that sender is not recipient
        assert!(sender != recipient, E_CHAT_SENDER_SAME_AS_RECIPIENT);

    // Check if a chat between sender and recipient already exists
    let chat_exists  = get_chat_id_bool(sender, recipient);
    assert!(!chat_exists, E_CHAT_ALREADY_EXISTS_BETWEEN_USERS);

    let participants = vector::empty<address>();
    vector::push_back(&mut participants, sender);
    vector::push_back(&mut participants, recipient);

    let new_chat = Chat {
        id: chat_id,
        participants,
        messages: vector::empty(),
        last_message_id: 0,
    };

    let shared_chats_sender = borrow_global_mut<SharedChats>(sender);
    vector::push_back(&mut shared_chats_sender.chats, copy new_chat);

    let shared_chats_recipient = borrow_global_mut<SharedChats>(recipient);
    vector::push_back(&mut shared_chats_recipient.chats, copy new_chat);
}


    // Helper function to check if a user is a participant
    fun is_participant(chat: &Chat, user: address): bool {
        let i = 0;
        let found = false;
        while (i < vector::length(&chat.participants)) {
            if (vector::borrow(&chat.participants, i) == &user) {
                found = true;
                break
            };
            i = i + 1;
        };
        return found
    }

    // Send a message to a specific chat
public entry fun send_message(
    account: &signer,
    chat_id: u64,
    content: string::String
) acquires SharedChats {
    let sender = signer::address_of(account);
    let shared_chats = borrow_global_mut<SharedChats>(sender);
    let chats = &mut shared_chats.chats;

    let found = false;
    let i = 0;
    while (i < vector::length(chats)) {
        let chat = vector::borrow_mut(chats, i);
        if (chat.id == chat_id) {
            assert!(is_participant(chat, sender), E_UNAUTHORIZED_CHAT_ACCESS);

            let message_id = chat.last_message_id + 1;
            let new_message = Message {
                id: message_id,
                sender,
                content,
                timestamp: timestamp::now_seconds(),
            };

            vector::push_back(&mut chat.messages, copy new_message);
            chat.last_message_id = message_id;
            
            // Get the other participant
            let recipient = get_other_participant(chat, sender);

            // Ensure recipient's SharedChats exists
            assert!(exists<SharedChats>(recipient), E_CHAT_DOES_NOT_EXIST);

            let recipient_chats = borrow_global_mut<SharedChats>(recipient);
            let j = 0;
            while (j < vector::length(&recipient_chats.chats)) {
                let recipient_chat = vector::borrow_mut(&mut recipient_chats.chats, j);
                if (recipient_chat.id == chat_id) {
                    vector::push_back(&mut recipient_chat.messages, copy new_message);
                    recipient_chat.last_message_id = message_id;
                    break
                };
                j = j + 1;
            };
            found = true;
            break
        };
        i = i + 1;
    };
    assert!(found, E_CHAT_DOES_NOT_EXIST);
}



    // Get all messages in a chat
    #[view]
    public fun get_chat_messages(
        user_address: address,
        chat_id: u64
    ): vector<Message> acquires SharedChats {
        let shared_chats = borrow_global<SharedChats>(user_address);
        let chats = &shared_chats.chats;

        let messages = vector::empty<Message>();
        let found = false;
        let i = 0;
        while (i < vector::length(chats)) {
            let chat = vector::borrow(chats, i);
            if (chat.id == chat_id) {
                let j = 0;
                while (j < vector::length(&chat.messages)) {
                    vector::push_back(&mut messages, *vector::borrow(&chat.messages, j));
                    j = j + 1;
                };
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, E_CHAT_DOES_NOT_EXIST);
        return messages
    }

    #[view]
public fun get_user_chats_view(
    user_address: address
): vector<Chat> acquires SharedChats {
    assert!(exists<SharedChats>(user_address), E_CHAT_DOES_NOT_EXIST);

    let shared_chats = borrow_global<SharedChats>(user_address);
    let all_chats = &shared_chats.chats;

    let user_chats = vector::empty<Chat>();
    let i = 0;

    // Filter chats to include only those where the user is a participant
    while (i < vector::length(all_chats)) {
        let chat = vector::borrow(all_chats, i);
        if (is_participant(chat, user_address)) {
            vector::push_back(&mut user_chats, *chat); // Copy chat to user's chat list
        };
        i = i + 1;
    };

    return user_chats
}

fun get_other_participant(chat: &Chat, current_user: address): address {
    let participants = &chat.participants;
    let i = 0;
    while (i < vector::length(participants)) {
        let participant = *vector::borrow(participants, i);
        if (participant != current_user) {
            return participant
        };
        i = i + 1;
    };
    // If no other participant is found (this shouldn't happen in a valid chat), return the current user
    return current_user
}

    //Check if a chat already exist betwen sender and recipient and return chat id if found
    #[view]
    public fun get_chat_id(user_address: address, recipient_address: address): option::Option<u64> acquires SharedChats {
        assert!(exists<SharedChats>(user_address), E_CHAT_DOES_NOT_EXIST);

         let shared_chats = borrow_global<SharedChats>(user_address);
        let chats = &shared_chats.chats;
    
        let i = 0;
          while (i < vector::length(chats)) {
            let chat = vector::borrow(chats, i);
             if (is_participant(chat, user_address) && is_participant(chat, recipient_address)) {
               return option::some(chat.id)
            };
           i = i + 1;
        };
        return option::none()
    }

 

}
}