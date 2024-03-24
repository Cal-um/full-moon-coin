import { Image } from "expo-image"
import { FC, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Button,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import {
  connectToGobyWallet,
  fetchXCHBalance,
  fetchXCHCoins,
  getAddress,
  intitialConnect,
  isConnectedToGobyWallet,
  sendTransaction,
  signCoinSpends,
} from "../goby/gobyWallet"
import { AssetBalanceResp } from "../goby/types"
import { CoinSpend } from "../../globals"
import { AssetToken } from "../puzzles/AssetToken"
import { Program } from "clvm-lib"
import { puzzles } from "../utils/puzzles"
import { toCoinId } from "../utils/hash"
import { stripHexPrefix } from "../utils/hex"
import { getStandardSolution } from "../puzzles/standardTransaction"

const Issue: FC = () => {
  const [isConnected, setIsConnected] = useState(isConnectedToGobyWallet())
  const [isConnectionLoading, setIsConnectionLoading] = useState(false)
  const [xchBalance, setXCHBalance] = useState<null | AssetBalanceResp>(null)
  const [xchCoins, setXCHCoins] = useState<null | CoinSpend[]>(null)

  useEffect(() => {
    initialLoad()
  }, [])

  const initialLoad = async () => {
    const isConnected = await intitialConnect()
    setIsConnected(isConnected)
  }

  useEffect(() => {
    if (isConnected) {
      getXCHBalance()
      getXCHCoins()
    }
  }, [isConnected])

  const onConnectToGobyPress = async () => {
    setIsConnectionLoading(true)
    connectToGobyWallet()
      .then((connected) => {
        setIsConnected(connected)
        if (!connected) {
          // If not connected, reject the promise
          // return Promise.reject(
          //   new Error("Connection to Goby Wallet failed. Please install Goby.")
          // )
        }
      })
      .then(() => {
        // Connected successfully, handle success case
      })
      .catch((err: any) => {
        console.log("hellos")
        if (err.message) {
          console.log(err.message)
          // Show error to user
        }
      })
      .finally(() => {
        setIsConnectionLoading(false) // Ensure loading state is reset whether promise is resolved or rejected
      })
  }

  const getXCHBalance = async () => {
    const xchBalance = await fetchXCHBalance()
    setXCHBalance(xchBalance)
  }

  const getXCHCoins = async () => {
    const coins = await fetchXCHCoins()
    console.log(coins)
    if (coins && coins[0]) {
      const coin = coins[0]
      const parent = coin.coin
      const tail = puzzles.genesisByIdTail.curry([
        Program.fromBytes(toCoinId(parent)),
      ])
      // assetid c848a412e4b8fb5342511885f9091f83360c3277ecdc22690612cda64454bb85
      // mainet asset id 9c5172650fd0b9d69ecc4beccc15b656c35e9e855b4cb5233b87dcaca2e2715b
      const evepuzzlehash = AssetToken.calculatePuzzle(
        tail,
        Program.nil,
        Program.fromHex(stripHexPrefix(parent.puzzle_hash)).toBytes(),
        coin.coin.amount
      ).hash()
      const coinspend: CoinSpend = {
        coin: parent,
        puzzle_reveal: coin.puzzle,
        solution: getStandardSolution([
          Program.fromList([
            Program.fromInt(51),
            Program.fromBytes(evepuzzlehash),
            Program.fromInt(parent.amount),
          ]),
        ]).serializeHex(),
      }
      console.log("puzzle", coin)

      console.log("tail", tail.hashHex())
      const issue = AssetToken.issue(
        coinspend,
        tail,
        Program.nil,
        Program.fromHex(stripHexPrefix(parent.puzzle_hash)).toBytes(),
        coin.coin.amount
      )
    }
    const spendOne = AssetToken.doIt()

    setXCHCoins([spendOne])
  }

  const signAndSend = async () => {
    console.log(xchCoins)
    if (xchCoins) {
      const sign = await signCoinSpends(xchCoins)
      console.log({ sign })
      if (sign) {
        const spendBundle = {
          coin_spends: xchCoins,
          aggregated_signature: sign,
        }
        console.log(spendBundle)
        const sendTransactionResp = await sendTransaction(spendBundle)
        console.log({ sendTransactionResp })
      }
    }
  }

  return (
    <View style={styles.container}>
      {isConnected ? (
        <View>
          <ConnectedToGobyAddress address={getAddress()} />
          <Text>{xchBalance?.spendable}</Text>
          <Button title="sign bundle" onPress={signAndSend}></Button>
        </View>
      ) : (
        <ConnectToGobyButton
          onPress={onConnectToGobyPress}
          isLoading={isConnectionLoading}
        />
      )}
    </View>
  )
}

const ConnectedToGobyAddress: FC<{ address: String }> = ({ address }) => (
  <View
    style={{
      backgroundColor: "#f0f0f0",
      padding: 8,
      borderRadius: 5,
    }}
  >
    <GobyButtonInner text={address} />
  </View>
)

const ConnectToGobyButton: FC<{ onPress: () => void; isLoading: boolean }> = ({
  onPress,
  isLoading,
}) => {
  const [hover, setHover] = useState(false)
  return (
    <Pressable
      style={{
        backgroundColor: "#f0f0f0",
        padding: 8,
        opacity: isLoading ? 0.5 : hover ? 0.8 : 1,
        borderRadius: 5,
      }}
      disabled={isLoading}
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
    >
      <GobyButtonInner text={"Connect to Goby"} />
      <ActivityIndicator
        style={{ position: "absolute" }}
        animating={isLoading}
        hidesWhenStopped={true}
      />
    </Pressable>
  )
}

const GobyButtonInner: FC<{ text: String }> = ({ text }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        style={{ width: 50, height: 50 }}
        source={require("../../assets/Goby-symbol.png")}
        contentFit="contain"
      />
      <Text style={{ paddingLeft: 8, paddingRight: 8 }}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
})

export default Issue
