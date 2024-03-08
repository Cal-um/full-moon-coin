import { Program } from "clvm-lib"
import { bech32m } from "bech32"
import { puzzles } from "./utils/puzzles"
import { fromHex } from "./utils/hex"

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

export const isConnectedToGobyWallet = (): boolean => {
  const { chia } = window
  return Boolean(chia && chia.isGoby && chia.isConnected())
}

export const fetchXCHBalance = async (): Promise<number> => {
  console.log(window.chia)
  const { chia } = window
  if (Boolean(chia && chia.isGoby)) {
    try {
      const balance = await chia.request({
        method: "getAssetBalance",
        params: { type: null, assetId: null },
      })
      const keys = await chia.request({ method: "getPublicKeys" })
      console.log(keys)

      return balance
    } catch (err) {
      console.log(err)
      return 0
    }
  }
  return 0
}

const registerEvents = () => {
  const { chia } = window as any
  chia.on("chainChanged", () => window.location.reload())
  chia.on("accountChanged", () => window.location.reload())
}

export const getAddress = (): String => {
  const { chia } = window
  if (Boolean(chia && chia.isGoby)) {
    //   const puzzle = puzzles.payToDelegatedOrHidden.curry([
    //     Program.fromHex(stripHexPrefix(window.chia.selectedAddress)),
    //   ])

    //   const puzzleHash = puzzle.hashHex()

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
bech32m.decode(
  "txch1whdxkh7x5qh2lnaatjpy3u6axrwks0r82edx4y70skv6e4xa7vdsrsdhmg"
)
