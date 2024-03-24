import { Program } from "clvm-lib"
import { CoinSpend } from "../../globals"
import {
  getStandardSolution,
  getStandardTransaction,
} from "../puzzles/standardTransaction"
import selectCoins from "./selectCoins"
import { getXCHCoins } from "../store/selectors/getBalance"
import { RootState } from "../store/store"

export const sendFee = (fee: number, rootState: RootState): CoinSpend[] => {
  const { syntheticPubKey } = rootState.wallet
  const selectedCoins = selectCoins(fee, getXCHCoins(rootState))
  const spendAmount = selectedCoins.reduce((acc, coin) => acc + coin.amount, 0)
  if (syntheticPubKey == undefined) throw new Error("not logged in")
  const coinSpends: CoinSpend[] = selectedCoins.map((coin, index) => {
    const standardTransaction = getStandardTransaction(syntheticPubKey)
    const changeCondition =
      index == 0
        ? getChangeConditions(standardTransaction.hash(), fee, spendAmount)
        : []
    const solution = getStandardSolution(changeCondition)
    return {
      coin: coin,
      puzzle_reveal: standardTransaction.serializeHex(),
      solution: solution.serializeHex(),
    }
  })

  return coinSpends
}

const getChangeConditions = (
  puzzHash: Uint8Array,
  fee: number,
  spendAmount: number
): Program[] => {
  if (spendAmount > fee) {
    return [
      Program.fromList([
        Program.fromInt(51),
        Program.fromBytes(puzzHash),
        Program.fromInt(spendAmount - fee),
      ]),
    ]
  } else {
    return []
  }
}
