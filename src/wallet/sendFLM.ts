import { Program } from "clvm-lib"
import { CoinSpend } from "../../globals"
import { WalletState } from "../store/walletSlice"
import { puzzles } from "../utils/puzzles"
import selectCoins from "./selectCoins"
import { stripHexPrefix } from "../utils/hex"
import { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit"
import mojoNodeAPI, { GetCoinByPuzzleAndSolution } from "../store/mojonodeAPI"
import { decodeAddress } from "../goby/gobyWallet"
import {
  getFullMoonSolution,
  getFullMoonTransaction,
} from "../puzzles/fullMoon"
import { getStandardSolution } from "../puzzles/standardTransaction"
import { findClosestFullMoon } from "../astronomy/nearestFullMoon"
import { SpendableAssetCoin } from "../coins/SpendableAssetCoin"
import { AssetToken } from "../puzzles/AssetToken"
import { getFLMCoins } from "../store/selectors/getBalance"
import { RootState } from "../store/store"

interface Args {
  amount: number
  sendAddress: string
  dispatch: ThunkDispatch<unknown, unknown, UnknownAction>
  rootState: RootState
}

type SendFLM = (args: Args) => Promise<CoinSpend[]>
export const sendFLM: SendFLM = async ({
  amount,
  dispatch,
  rootState,
  sendAddress,
}) => {
  const { syntheticPubKey } = rootState.wallet
  const sendPuzzHash = decodeAddress(sendAddress)
  const selectedCoins = selectCoins(amount, getFLMCoins(rootState))
  const spendAmount = selectedCoins.reduce((acc, coin) => acc + coin.amount, 0)

  if (syntheticPubKey == undefined) throw new Error("not logged in")

  const changePuzzleHash = puzzles.payToDelegatedOrHidden
    .curry([Program.fromHex(stripHexPrefix(syntheticPubKey))])
    .hash()

  const { data, error } = await dispatch(
    mojoNodeAPI.endpoints.getParentSpends.initiate(selectedCoins)
  )

  if (error || data == undefined) throw new Error("failed to get parent spends")

  return AssetToken.spend(
    data.map(
      mapToSpendableAssetToken(
        amount,
        spendAmount,
        sendPuzzHash,
        changePuzzleHash,
        syntheticPubKey
      )
    )
  )
}

function mapToSpendableAssetToken(
  amount: number,
  spendAmount: number,
  sendPuzzHash: Uint8Array,
  changePuzzleHash: Uint8Array,
  syntheticPubKey: string
): (value: GetCoinByPuzzleAndSolution, index: number) => SpendableAssetCoin {
  return ({ parentCoinSpend, coin }, index) => {
    const conditions =
      index == 0
        ? getConditions(amount, spendAmount, sendPuzzHash, changePuzzleHash)
        : []
    const innerPuzzle = getFullMoonTransaction(syntheticPubKey)
    const innerPuzzleSolution = getFullMoonSolution(
      findClosestFullMoon(Date.now() / 1000)!,
      getStandardSolution(conditions)
    )
    return new SpendableAssetCoin(
      parentCoinSpend,
      coin,
      innerPuzzle,
      innerPuzzleSolution
    )
  }
}

const getConditions = (
  amount: number,
  spendAmount: number,
  sendPuzzHash: Uint8Array,
  changePuzzleHash: Uint8Array
): Program[] => {
  return [
    ...getChangeCondition(amount, spendAmount, changePuzzleHash),
    ...getSpendCondition(amount, sendPuzzHash),
  ]
}

const getChangeCondition = (
  amount: number,
  spendAmount: number,
  changePuzzleHash: Uint8Array
): Program[] => {
  if (spendAmount > amount) {
    return [
      Program.fromList([
        Program.fromInt(51),
        Program.fromBytes(changePuzzleHash),
        Program.fromInt(spendAmount - amount),
        Program.fromList([Program.fromBytes(changePuzzleHash)]),
      ]),
    ]
  }
  return []
}
const getSpendCondition = (
  amount: number,
  sendPuzzHash: Uint8Array
): Program[] => {
  return [
    Program.fromList([
      Program.fromInt(51),
      Program.fromBytes(sendPuzzHash),
      Program.fromInt(amount),
      Program.fromList([Program.fromBytes(sendPuzzHash)]),
    ]),
  ]
}
