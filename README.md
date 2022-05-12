# NFT Sales
Subgraph to index all 721 NFT transfers, then attempt to match NFT Marketplace's sale events to the transfer.

The intent is that we can graft new marketplace contracts to include sale history as their contracts are deployed and mapped.

Key Assumption made in this logic is that every marketplace calls an NFT contract's transfer event BEFORE they emit their sale event (OrdersMatched, TakerBid, TakerAsk etc.). Upon the contracts transfer event, we handleTransfer, then upon the marketplace's sale event we handleSale (which updates the transfer entity).


# TODO:

Map OpenSea Atomic Match to update currency and metrics as applicable

Inspect Coinbase NFT Marketplace transactions to include into sale entities.


# OpenSea

Various Transaction Type examples:

[Opensea Transaction](https://etherscan.io/tx/0xd5998f56b9f1d0308d572a4b15e4ef6348ebb26a7f37d88c82c20ada769bda39) 

[Opensea Bundle](https://etherscan.io/tx/0x9b16c3448cf2c7db57169d2bda94add45c2cb12cd9c36d385ee86803d5e42964)

[Opensea APE Purchase](https://etherscan.io/tx/0x672d9d065d9a86e0e083d069a5809b7aacc53a46d0f4e67547495ade6ea0730c)

# LooksRare:

Various Transaction Type examples:

[TakerBid](https://etherscan.io/tx/0xcb84b421d0e355f02e4beace7ec54edaa57cdcd68ca4c1e2b69af6636c33fe5d)

[TakerAsk](https://etherscan.io/tx/0xf76051068ae86d602265feeb835677cff7105a718d010de6fd412e57dec87af4)



# Gem.xyz

Interesting transaction with cross platform sales noting to ensure it indexes as intended.

[multicontract transaction](https://etherscan.io/tx/0x692af20c5e84c896984034d8636da698e40fae72e973fc090fc46ad0dda06f52) 

[multicontract transaction](https://etherscan.io/tx/0xa3ac2b2af60fa2a5af4d724e7bfb3d0cdcf4056a524bea40e40987d92cf527f3)


# Contracts

OpenSea v1 - 0x7be8076f4ea4a4ad08075c2508e481d6c946d12b (start block 5774644)

Opensea V2 - 0x7f268357a8c2552623316e2562d90e642bb538e5 (start block 14120913)

LooksRare - 0x59728544B08AB483533076417FbBB2fD0B17CE3a (start block 13885625)