import { Coin } from "../../goby/types"
import { RootState } from "../store"
import { CoinsStatus } from "../walletSlice"

const getFLMBalance = (state: RootState) =>
  convertMojosToCat(getBalance(state.wallet.moonCoins))

const getXCHBalance = (state: RootState) =>
  convertMojosToXCH(getBalance(state.wallet.xchCoins))

const convertMojosToCat = (mojos: number) => mojos / 1000
const convertMojosToXCH = (mojos: number) => mojos / 1000000000000

const convertXCHtoMojos = (xch: number) => xch * 1000000000000
const convertCattoMojos = (flm: number) => flm * 1000
const getXCHCoins = (state: RootState) =>
  state.wallet.xchCoins?.type === "success" ? state.wallet.xchCoins.coins : []
const getFLMCoins = (state: RootState) =>
  state.wallet.moonCoins?.type == "success" ? state.wallet.moonCoins.coins : []

const getBalance = (coinsStatus?: CoinsStatus) => {
  if (!coinsStatus) return 0
  const coins = coinsStatus.type === "success" ? coinsStatus.coins : []
  return coins.reduce((acc, coin) => acc + coin.amount, 0)
}

export {
  getFLMBalance,
  getXCHBalance,
  getXCHCoins,
  getFLMCoins,
  convertMojosToCat,
  convertMojosToXCH,
  convertXCHtoMojos,
  convertCattoMojos,
}
