import {Address, BigInt} from "@graphprotocol/graph-ts";

import {IERC721Metadata} from "../../generated/IERC721/IERC721Metadata";

import {Collection, Token} from "../../generated/schema";

import {constants} from "../graphprotocol-utils";

export function fetchRegistry(address: Address): Collection {
  let erc721 = IERC721Metadata.bind(address);
  let collectionEntity = Collection.load(address.toHexString());

  if (!collectionEntity) {
    collectionEntity = new Collection(address.toHexString());

    //contract calls
    let try_name = erc721.try_name();
    let try_symbol = erc721.try_symbol();

    collectionEntity.name = try_name.reverted ? "" : try_name.value;
    collectionEntity.symbol = try_symbol.reverted ? "" : try_symbol.value;
    collectionEntity.save()
  }
  return collectionEntity as Collection;
}

export function fetchToken(collection: Collection, id: BigInt): Token {
  let tokenid = constants.NETWORK + "/" + collection.id + "/" + id.toString();
  let tokenEntity = Token.load(tokenid);
  if (tokenEntity == null) {
    tokenEntity = new Token(tokenid);
    tokenEntity.collection = collection.id;
    tokenEntity.identifier = id;
    tokenEntity.totalSupply = constants.BIGINT_ZERO;
    tokenEntity.save()
  }
  return tokenEntity as Token;
}
