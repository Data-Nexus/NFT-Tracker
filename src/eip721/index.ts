import {account, transfer, holding} from "../../generated/schema";

import {Transfer as TransferEvent} from "../../generated/IERC721/IERC721";

import {fetchRegistry, fetchToken} from "../utils/erc721";

import {events} from "../../src/graphprotocol-utils";

import {store} from "@graphprotocol/graph-ts";

export function handleTransfer(event: TransferEvent): void {
  let collection = fetchRegistry(event.address);
  if (collection != null) {
    let token = fetchToken(collection, event.params.tokenId);

    let senderAddress = account.load(event.params.from.toHexString());
    if (!senderAddress) {
      senderAddress = new account(event.params.from.toHexString());
    }

    let receiverAddress = account.load(event.params.to.toHexString());
    if (!receiverAddress) {
      receiverAddress = new account(event.params.to.toHexString());
    }

    let senderholding = holding.load(senderAddress.id + "-" + collection.id);
    if (senderholding && senderAddress.id != "0x0000000000000000000000000000000000000000") {
      let senderTokenCountNew = senderholding.tokenCount - 1;
      senderholding.tokenCount = senderTokenCountNew;
      senderholding.save();

      if (senderholding.tokenCount == 0) {
        store.remove("holding", senderAddress.id + "-" + collection.id);
      }
    }

    let receiverholding = holding.load(receiverAddress.id + "-" + collection.id);
    if (receiverholding && receiverAddress.id != "0x0000000000000000000000000000000000000000") {
      let receiverTokenCountNew = receiverholding.tokenCount + 1;

      receiverholding.tokenCount = receiverTokenCountNew;
      receiverholding.save();
    }
    if (!receiverholding && receiverAddress.id != "0x0000000000000000000000000000000000000000") {
      receiverholding = new holding(receiverAddress.id + "-" + collection.id);
      receiverholding.account = receiverAddress.id;
      receiverholding.collection = collection.id;
      receiverholding.tokenCount = 1;

      receiverholding.save();
    }

    token.owner = receiverAddress.id;

    collection.save();
    token.save();
    senderAddress.save();
    receiverAddress.save();

    let transferEntity = new transfer(events.id(event));
    transferEntity.transaction = event.transaction.hash;
    transferEntity.token = token.id;
    transferEntity.collection = collection.id;
    transferEntity.senderAddress = senderAddress.id;
    transferEntity.receiverAddress = receiverAddress.id;
    transferEntity.blockNumber = event.block.number.toI32();
    transferEntity.timestamp = event.block.timestamp.toI32();
    transferEntity.save();
  }
}
