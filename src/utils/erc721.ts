import {
	Address,
    BigInt,
} from '@graphprotocol/graph-ts'

import {
	IERC721Metadata,
} from '../../generated/IERC721/IERC721Metadata'

import {
	Account,
	TokenRegistry,
    Contract,
	Token,
} from '../../generated/schema'

import {
	supportsInterface,
} from './erc165'

import {
	constants,
} from '../../src/graphprotocol-utils'

export function fetchRegistry(address: Address): TokenRegistry {
	let erc721   = IERC721Metadata.bind(address)
	let contract = Contract.load(address.toHex())

	if (contract == null) {
		contract = new Contract(address.toHex())
		let introspection_01ffc9a7 = supportsInterface(erc721, '01ffc9a7') // ERC165
		let introspection_80ac58cd = supportsInterface(erc721, '80ac58cd') // ERC721
		let introspection_00000000 = supportsInterface(erc721, '00000000', false)
		let isERC721               = introspection_01ffc9a7 && introspection_80ac58cd && introspection_00000000
		contract.asERC721          = isERC721 ? contract.id : null
		contract.save()
	}

	//if (contract.asERC721 != null)
	//{
		let registry = TokenRegistry.load(contract.id)
		if (registry == null) {
			registry = new TokenRegistry(contract.id)
			let try_name              = erc721.try_name()
			let try_symbol            = erc721.try_symbol()
			registry.name             = try_name.reverted   ? '' : try_name.value
			registry.symbol           = try_symbol.reverted ? '' : try_symbol.value
			registry.supportsMetadata = supportsInterface(erc721, '5b5e139f') // ERC721Metadata
		}
		return registry as TokenRegistry
	//}

	//return null as TokenRegistry
}

export function fetchToken(registry: TokenRegistry, id: BigInt): Token {
	let tokenid = registry.id.concat('-').concat(id.toHex())
	let token = Token.load(tokenid)
	if (token == null) {
		let account_zero = new Account(constants.ADDRESS_ZERO)
		account_zero.save()

		token            = new Token(tokenid)
		token.registry   = registry.id
		token.identifier = id

		if (registry.supportsMetadata) {
			let erc721       = IERC721Metadata.bind(Address.fromString(registry.id))
			let try_tokenURI = erc721.try_tokenURI(id)
			token.uri        = try_tokenURI.reverted ? '' : try_tokenURI.value
		}
	}
	return token as Token
}