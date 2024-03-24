export interface SpendableCoin {
  coin: Coin
  coinName: string
  puzzle: string
  confirmedBlockIndex: number
  locked: boolean
  lineageProof?: {
    parentName?: string
    innerPuzzleHash?: string
    amount?: number
  }
}
export interface Coin {
  parent_coin_info: string
  puzzle_hash: string
  amount: number
}
export interface AssetBalanceResp {
  confirmed: string
  spendable: string
  spendableCoinCount: number
}
export interface getAssetCoinsParams {
  type: string | null
  assetId?: string | null
  includedLocked?: boolean
  offset?: number
  limit?: number
}
export enum MempoolInclusionStatus {
  SUCCESS = 1, // Transaction added to mempool
  PENDING = 2, // Transaction not yet added to mempool
  FAILED = 3, // Transaction was invalid and dropped
}
export interface TransactionResp {
  status: MempoolInclusionStatus
  error?: string
}
