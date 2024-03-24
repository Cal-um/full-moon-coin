import { Coin } from "../goby/types"

const selectCoins = (amount: number, coins: Coin[]): Coin[] => {
  const selectedCoins = coins
    // sort largest first
    .sort((a, b) => b.amount - a.amount)
    // reduce until amount is reached
    .reduce((acc, coin) => {
      const currentAmount = acc.reduce((acc, coin) => acc + coin.amount, 0)
      if (currentAmount < amount) {
        return [...acc, coin]
      }
      return acc
    }, [] as Coin[])

  const total = selectedCoins.reduce((acc, coin) => acc + coin.amount, 0)

  if (total >= amount) {
    return selectedCoins
  }

  throw new Error("Insufficient funds")
}

export default selectCoins
