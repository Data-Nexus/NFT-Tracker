import {Transfer, Holding, CollectionHolding} from "../../generated/schema";

import {TransferSingle as TransferEvent, TransferBatch as TransferBatchEvent} from "../../generated/IERC1155/Contract1155";

import {fetchRegistry, fetchToken} from "../utils/erc1155";

import {constants} from "../graphprotocol-utils";

import {store, BigInt, ethereum, Address, Bytes} from "@graphprotocol/graph-ts";
import {getOrCreateAccount} from "../utils/entity-factory";

export function handleTransferSingle(event: TransferEvent): void {
  transfer(
    event.address,
    event.params.from,
    event.params.to,
    event.params.value,
    event.params.id,
    event.block,
    event.logIndex,
    event.transaction.hash,
    0
  );
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  for (let index = 0; index < event.params.ids.length; index++) {
    transfer(
      event.address,
      event.params.from,
      event.params.to,
      event.params.values[index],
      event.params.ids[index],
      event.block,
      event.logIndex,
      event.transaction.hash,
      index
    );
  }
}

function transfer(
  address: Address,
  from: Address,
  to: Address,
  value: BigInt,
  id: BigInt,
  block: ethereum.Block,
  logIndex: BigInt,
  hash: Bytes,
  index: i32
): void {
  let collection = fetchRegistry(address);

  //Get the NFT
  let token = fetchToken(collection, id);

  // Get Sender and Receiver
  let senderAddress = getOrCreateAccount(from.toHexString());
  let receiverAddress = getOrCreateAccount(to.toHexString());

  //decrement token holdings for sender
  let senderHolding = Holding.load(senderAddress.id + "-" + token.id);
  if (senderHolding && senderAddress.id != "0x0000000000000000000000000000000000000000") {
    let senderTokenCountNew = senderHolding.balance.minus(value);
    senderHolding.balance = senderTokenCountNew;
    senderHolding.save();

    if (senderHolding.balance == BigInt.fromI32(0)) {
      store.remove("Holding", senderAddress.id + "-" + collection.id);
    }
  }

  //decrement collecting holdings for sender
  let senderCollectionHolding = CollectionHolding.load(collection.id + "-" + senderAddress.id);
  if (senderCollectionHolding && senderAddress.id != "0x0000000000000000000000000000000000000000") {
    let senderTokenCountNew = senderCollectionHolding.balance.minus(value);
    senderCollectionHolding.balance = senderTokenCountNew;
    senderCollectionHolding.save();

    if (senderCollectionHolding.balance == BigInt.fromI32(0)) {
      store.remove("CollectionHolding", collection.id + "-" + senderAddress.id);
    }
  }

  //increment token holdings for receiver (if it doesn't exist create it)
  let receiverHolding = Holding.load(receiverAddress.id + "-" + collection.id);
  if (receiverHolding && receiverAddress.id != constants.ADDRESS_ZERO) {
    let receiverTokenCountNew = receiverHolding.balance.plus(value);

    receiverHolding.balance = receiverTokenCountNew;
    receiverHolding.save();
  }
  if (!receiverHolding && receiverAddress.id != constants.ADDRESS_ZERO) {
    receiverHolding = new Holding(receiverAddress.id + "-" + token.id);
    receiverHolding.account = receiverAddress.id;
    receiverHolding.token = token.id;
    receiverHolding.balance = value;

    receiverHolding.save();
  }

  //increment collection holdings for receiver (if it doesn't exist create it)
  let receiverCollectionHolding = CollectionHolding.load(collection.id + "-" + senderAddress.id);
  if (receiverCollectionHolding && receiverAddress.id != constants.ADDRESS_ZERO) {
    let receiverTokenCountNew = receiverCollectionHolding.balance.plus(value);

    receiverCollectionHolding.balance = receiverTokenCountNew;
    receiverCollectionHolding.save();
  }
  if (!receiverCollectionHolding && receiverAddress.id != constants.ADDRESS_ZERO) {
    receiverCollectionHolding = new CollectionHolding(receiverAddress.id + "-" + token.id);
    receiverCollectionHolding.account = receiverAddress.id;
    receiverCollectionHolding.collection = collection.id;
    receiverCollectionHolding.balance = value;

    receiverCollectionHolding.save();
  }

  //update token's total supply on mints & burns
  if (senderAddress.id == constants.ADDRESS_ZERO) token.totalSupply = token.totalSupply.plus(value);
  if (receiverAddress.id == constants.ADDRESS_ZERO) token.totalSupply = token.totalSupply.minus(value);

  collection.save();
  token.save();

  let transferEntity = new Transfer(block.number.toString() + "-" + logIndex.toString() + "-" + index.toString());
  transferEntity.transaction = hash;
  transferEntity.token = token.id;
  transferEntity.collection = collection.id;
  transferEntity.senderAddress = senderAddress.id;
  transferEntity.receiverAddress = receiverAddress.id;
  transferEntity.blockNumber = block.number;
  transferEntity.timestamp = block.timestamp;
  transferEntity.save();
}
