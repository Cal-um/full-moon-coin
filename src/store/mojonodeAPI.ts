import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query"
import { Coin, CoinSpend } from "../../globals"

interface CoinRecord {
  coin: Coin
  confirmed_block_index: number
  spent_block_index: number
  coinbase: boolean
  timestamp: number
  spent: boolean
}

interface GetCoinsByPuzzhashResponse {
  success: boolean
  coin_records: CoinRecord[]
}

const mojoNodeAPI = createApi({
  reducerPath: "mojoNodeAPI",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.mojonode.com/",
  }),
  endpoints: (builder) => ({
    getCoinsByPuzzhash: builder.query<GetCoinsByPuzzhashResponse, string>({
      query: (puzzle_hash) => ({
        url: "get_coin_records_by_puzzle_hash",
        method: "POST",
        body: {
          network: "mainnet",
          start_height: 0,
          include_spent_coins: false,
          page: 1,
          puzzle_hash,
        },
      }),
    }),
    getParentSpends: builder.query<GetCoinByPuzzleAndSolution[], Coin[]>({
      async queryFn(coins, _api, _extraOptions, baseQuery) {
        const promises = coins.map((coin) => {
          return baseQuery(getCoinsPuzzleAndSolution(coin.parent_coin_info))
        })
        const responses = await Promise.all(promises)
          .then((values) => {
            return {
              data: values.map((value, index) => {
                const data = value.data as Get_Puzzle_Solution_Response
                if (!data) throw new Error(value.error?.status as string)
                return {
                  coin: coins[index],
                  parentCoinSpend: data.coin_solution,
                }
              }),
            }
          })
          .catch(() => {
            throw new Error("Failed to get parent spends")
          })
        return responses
      },
    }),
  }),
})

interface Get_Puzzle_Solution_Response {
  success: boolean
  coin_solution: CoinSpend
}

export interface GetCoinByPuzzleAndSolution {
  coin: Coin
  parentCoinSpend: CoinSpend
}

const getCoinsPuzzleAndSolution = (coin_id: string) => ({
  url: "get_puzzle_and_solution",
  method: "POST",
  body: {
    network: "mainnet",
    coin_id,
  },
})

export default mojoNodeAPI
