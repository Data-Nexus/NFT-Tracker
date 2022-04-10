# NFT Sales
Subgraph to index all 721 NFT transfers, then attempt to match NFT Marketplace's sale events to the transfer.

The intent is that we can graft new marketplace contracts to include sale history as their contracts are deployed and mapped.

Key Assumption made in this logic is that every marketplace calls an NFT contract's transfer event BEFORE they emit their sale event (OrdersMatched, TakerBid, TakerAsk etc.). Upon the contracts transfer event, we handleTransfer, then upon the marketplace's sale event we handleSale (which updates the transfer entity).


# TODO:

# Update handleTransfer

New schema has completely altered the mapping for handleTransfer. We should leverage existing logic produced by Amxx as much as possible and add in the necessary items that we need.

Possible issue with the transfer.amount as a nullable bigdecimal, resolve as necessary.

Check transfer.sale to ensure that we can load this id after the entity has been loaded without issue.

# Model handleSale event logic 

(Will be replicated for each marketplace, ideally we can call this as a utility function)

Handle sale should:

1. load transaction

2. nullcheck transaction entity (one should already exist for the transfer earlier in that) if it doesn't exist should we error or skip?

3. create new sale entity (id = tx hash - eventId)

4. Assign currency address, amount, txId and platform to sale entity

5. Assign sale.amount / transaction.unmatchedTransfersEventNum to variable transferAmount to pass into transfer entities (this is usually going to be 1, but in the event of a bundle sale there could be N+1 transfers for a single OrdersMatched)

6. Using unmatchedTransferEventId loop through the transfer entities and apply the transferAmount and assign saleId , reducing the unmatchedTransfersEventNum by 1 and removing the id from transaction.unmatchedTransferEventId. save transfer update on each loop.

7. Save sale and save transaction

8. Update daily/weekly/monthly metrics 

# Metrics 

Using the existing logic from [nft-sales-subgraph](https://github.com/Data-Nexus/nft-sales-subgraph/blob/3e1dab1478341f51377c88f538651dce78324a70/src/LooksRareSale.ts#L98) (lines 98-222), incorporate collection metrics and daily/weekly/monthly snapshots.

# OpenSea

Add handleOSSale in mapping

Various Transaction Type examples:

[Opensea Transaction](https://etherscan.io/tx/0xd5998f56b9f1d0308d572a4b15e4ef6348ebb26a7f37d88c82c20ada769bda39) 

[Opensea Bundle](https://etherscan.io/tx/0x9b16c3448cf2c7db57169d2bda94add45c2cb12cd9c36d385ee86803d5e42964)


# LooksRare:

Add handleLRTakerAsk sale event in mappings

Add handleLRTakerBid sale event in mappings


Various Transaction Type examples:

[TakerBid](https://etherscan.io/tx/0xcb84b421d0e355f02e4beace7ec54edaa57cdcd68ca4c1e2b69af6636c33fe5d)

[TakerAsk](https://etherscan.io/tx/0xf76051068ae86d602265feeb835677cff7105a718d010de6fd412e57dec87af4)



# Gem.xyz

Interesting transaction with cross platform sales noting to ensure it indexes as intended.

[multicontract transaction](https://etherscan.io/tx/0x692af20c5e84c896984034d8636da698e40fae72e973fc090fc46ad0dda06f52) 

