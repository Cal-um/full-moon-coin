import { concatBytes, encodeInt, fromHex, hash256 } from "chia-bls"
import { stripHexPrefix } from "./hex"
import { Coin } from "../../globals"

export function toCoinId(coin: Coin): Uint8Array {
  return hash256(
    concatBytes(
      fromHex(stripHexPrefix(coin.parent_coin_info)),
      fromHex(stripHexPrefix(coin.puzzle_hash)),
      encodeInt(coin.amount)
    )
  )
}
