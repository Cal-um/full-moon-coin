import { bech32m } from "bech32"
import { fromHex, stripHexPrefix } from "../utils/hex"
import { AssetBalanceResp, SpendableCoin, TransactionResp } from "./types"
import { CoinSpend, SpendBundle } from "../../globals"
import { Program } from "clvm-lib"
import { puzzles } from "../utils/puzzles"

export const connectToGobyWallet = async (): Promise<boolean> => {
  const { chia } = window
  if (Boolean(chia && chia.isGoby)) {
    try {
      const response = await chia.request({
        method: "connect",
      })
      registerEvents()
      return true
    } catch (err) {
      console.log(err)
      // { code: 4001, message: 'User rejected the request.' }
    }
  }
  return false
}

export const intitialConnect = async (): Promise<boolean> => {
  const { chia } = window

  if (Boolean(chia && chia.isGoby)) {
    try {
      const isConnected = await chia.request({
        method: "connect",
        params: { eager: true },
      })
      if (isConnected) {
        registerEvents()
        return true
      }
      return isConnected
    } catch (err) {
      console.log(err)
      return false
    }
  }
  return false
}

export const connectToGoby = async (eager: boolean): Promise<boolean> => {
  const connected = await gobyRequest<boolean>("connect", { eager })
  if (connected) {
    registerEvents()
  }
  return connected
}

export const isConnectedToGobyWallet = (): boolean => {
  const { chia } = window
  return Boolean(chia && chia.isGoby && chia.isConnected())
}

export const fetchXCHBalance = async () => {
  return gobyRequest<AssetBalanceResp>("getAssetBalance", {
    type: null,
    assetId: null,
  })
}

const gobyRequest = async <T>(method: string, params: any) => {
  const { chia } = window
  if (Boolean(chia && chia.isGoby)) {
    const resp = await chia.request({
      method: method,
      params: params,
    })
    return resp as T
  } else {
    throw new Error("Goby not connected")
  }
}

export const fetchSyntheticPubKeys = async () => {
  return gobyRequest<string[]>("getPublicKeys", {})
}

export const fetchXCHCoins = async () => {
  return gobyRequest<SpendableCoin[]>("getAssetCoins", {
    type: null,
  })
}

export const signCoinSpends = async (coinSpends: CoinSpend[]) => {
  return gobyRequest<string>("signCoinSpends", {
    coinSpends,
  })
}

export const sendTransaction = async (spendBundle: SpendBundle) => {
  return gobyRequest<TransactionResp[]>("sendTransaction", {
    spendBundle: spendBundle,
  })
}

const registerEvents = () => {
  const { chia } = window as any
  chia.on("chainChanged", () => window.location.reload())
  chia.on("accountChanged", () => window.location.reload())
}

export const getAddress = (): String => {
  const { chia } = window
  if (Boolean(chia && chia.isGoby)) {
    const currentPuzHash = window.chia.selectedAddress
    const address = bech32mEncode(
      currentPuzHash,
      getChainPrefix(chia.currentChain)
    )
    const shortAdd = address.slice(0, 7) + "..." + address.slice(-4)
    return shortAdd
  }
  return ""
}

const getChainPrefix = (chainId: string): string => {
  return chainId === "0x01" ? "XCH" : "TXCH"
}

const bech32mEncode = (data: string, prefix: string) => {
  return bech32m.encode(prefix, bech32m.toWords(fromHex(data)))
}

export const bech23Decode = (address: string) => {
  const f = bech32m.decodeUnsafe(address)
  return f
}

export const decodeAddress = (address: string) => {
  const decoded = bech32m.decode(address)
  return Uint8Array.from(bech32m.fromWords(decoded.words))
}

const encodeAddressFrom = (pubkey: string) => {
  const puzzle = puzzles.payToDelegatedOrHidden.curry([
    Program.fromHex(stripHexPrefix(pubkey)),
  ])
  const puzzleHash = puzzle.hashHex()
  return bech32mEncode(puzzleHash, "XCH")
}

const createShortReadableAddress = (address: string) => {
  return address.slice(0, 7) + "..." + address.slice(-4)
}

export const getShortAddress = (pubKey: string) =>
  createShortReadableAddress(encodeAddressFrom(pubKey))
