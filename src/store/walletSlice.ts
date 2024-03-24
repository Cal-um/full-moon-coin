import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { Coin, MempoolInclusionStatus } from "../goby/types"
import {
  connectToGoby,
  fetchSyntheticPubKeys,
  fetchXCHCoins,
  sendTransaction,
  signCoinSpends,
} from "../goby/gobyWallet"
import mojoNodeAPI from "./mojonodeAPI"
import { catPuzzHash } from "../utils/moonPuzz"
import { formatHex } from "../utils/hex"
import { CoinSpend } from "../../globals"
import { RootState } from "./store"
import { sendFLM } from "../wallet/sendFLM"
import { sendFee } from "../wallet/sendFee"

export type CoinsStatus = CoinsError | CoinsSuccess
interface CoinsError {
  type: "error"
  errorMessage: string
}
interface CoinsSuccess {
  type: "success"
  coins: Coin[]
}

export type TransactionOutcome = TransactionSuccess | TransactionError

interface TransactionSuccess {
  type: "success"
  message: string
}

interface TransactionError {
  type: "error"
  message: string
}

export interface WalletState {
  loggingIn: boolean
  syntheticPubKey?: string
  xchCoins?: CoinsStatus
  moonCoins?: CoinsStatus
  transaction?: Transaction
}

export interface Transaction {
  transactionParms: MakeTransactionParams
  coinSpends?: CoinSpend[]
  outcome?: TransactionOutcome
}

const initialState: WalletState = {
  loggingIn: false,
}

const getLatestXCHCoins = createAsyncThunk(
  "wallet/getLatestXCHCoins",
  async (_, { rejectWithValue }) => {
    try {
      const coins = await fetchXCHCoins()
      return { coins }
    } catch {
      return rejectWithValue("Failed to fetch XCH coins")
    }
  }
)

const getErrorMessage = (
  error: unknown,
  fallBackMessage: string = "Unknown Error"
) => {
  if (error instanceof Error) {
    return error.message
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const errorMessage = (error as { message: unknown }).message

    if (typeof errorMessage === "string") {
      return errorMessage
    }
  }
  return fallBackMessage
}

const loginToGoby = createAsyncThunk(
  "wallet/loginToGoby",
  async (eager: boolean, { dispatch, rejectWithValue }) => {
    try {
      const connected = await connectToGoby(eager)
      if (!connected) throw new Error("Failed to connect to Goby")

      const pubKeys = await fetchSyntheticPubKeys()
      if (!pubKeys?.length) throw new Error("Failed to get pubkeys")

      const pubKey = pubKeys[0]
      dispatch(
        mojoNodeAPI.endpoints.getCoinsByPuzzhash.initiate(
          formatHex(catPuzzHash(pubKey))
        )
      )
      dispatch(getLatestXCHCoins())
      return { pubKey }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

interface MakeTransactionParams {
  address: string
  amount: number
  fee: number
}
const makeTransaction = createAsyncThunk(
  "wallet/makeTransaction",
  async (
    args: MakeTransactionParams,
    { getState, rejectWithValue, dispatch }
  ) => {
    const rootState = getState() as RootState
    try {
      if (args.address == "") throw new Error("Please enter a send address")
      if (args.amount == 0) throw new Error("Amount must be greater than 0")
      const flmSpends = await sendFLM({
        amount: args.amount,
        dispatch,
        rootState,
        sendAddress: args.address,
      })
      const feeSpends = sendFee(args.fee, rootState)
      return { coinSpends: [...flmSpends, ...feeSpends] }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const requestSignTransactionThenSend = createAsyncThunk(
  "wallet/requestSignTransaction",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { wallet } = getState() as RootState
      const coin_spends = wallet.transaction?.coinSpends
      if (coin_spends == undefined) throw new Error("No coins to spend")

      const aggregated_signature = await signCoinSpends(coin_spends)
      const sendResp = await sendTransaction({
        aggregated_signature,
        coin_spends,
      })
      const firstResponse = sendResp[0]
      console.log(firstResponse)
      if (firstResponse.status === MempoolInclusionStatus.FAILED)
        throw new Error("Transaction failed " + firstResponse.error)
      return {
        type: "success",
        message:
          firstResponse.status === MempoolInclusionStatus.SUCCESS
            ? "Transaction added to mempool"
            : "Transaction not yet added to mempool",
      } as TransactionSuccess
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

const walletSlice = createSlice({
  name: "wallet",
  initialState: initialState,
  reducers: {
    closeTransaction: (state) => {
      state.transaction = undefined
    },
  },
  extraReducers(builder) {
    builder.addCase(loginToGoby.fulfilled, (state, action) => {
      state.syntheticPubKey = action.payload.pubKey
      state.loggingIn = false
    })
    builder.addCase(loginToGoby.pending, (state) => {
      state.loggingIn = true
    })
    builder.addCase(loginToGoby.rejected, (state) => {
      state.loggingIn = false
    })
    builder.addCase(getLatestXCHCoins.fulfilled, (state, action) => {
      state.xchCoins = {
        type: "success",
        coins: action.payload.coins.map((sD) => sD.coin),
      }
    })
    builder.addCase(getLatestXCHCoins.rejected, (state, action) => {
      state.xchCoins = {
        type: "error",
        errorMessage: action.payload as string,
      }
    })
    builder.addCase(makeTransaction.pending, (state, action) => {
      state.transaction = {
        transactionParms: action.meta.arg,
      }
    })
    builder.addCase(makeTransaction.fulfilled, (state, action) => {
      state.transaction = {
        ...state.transaction!,
        coinSpends: action.payload.coinSpends,
      }
    })
    builder.addCase(makeTransaction.rejected, (state, action) => {
      const errorMessage = action.payload as string
      state.transaction = {
        ...state.transaction!,
        outcome: {
          type: "error",
          message: errorMessage,
        },
      }
    })
    builder.addCase(
      requestSignTransactionThenSend.fulfilled,
      (state, action) => {
        state.transaction = {
          ...state.transaction!,
          outcome: action.payload,
        }
      }
    )
    builder.addCase(
      requestSignTransactionThenSend.rejected,
      (state, action) => {
        state.transaction = {
          ...state.transaction!,
          outcome: {
            type: "error",
            message: action.payload as string,
          },
        }
      }
    )
    builder.addMatcher(
      mojoNodeAPI.endpoints.getCoinsByPuzzhash.matchFulfilled,
      (state, action) => {
        state.moonCoins = {
          type: "success",
          coins: action.payload.coin_records.map((cr) => cr.coin),
        }
      }
    )
    builder.addMatcher(
      mojoNodeAPI.endpoints.getCoinsByPuzzhash.matchRejected,
      (state, _) => {
        state.moonCoins = {
          type: "error",
          errorMessage: "Failed to fetch moon balance",
        }
      }
    )
  },
})

export default walletSlice.reducer

export { loginToGoby, makeTransaction }
export const { closeTransaction } = walletSlice.actions
