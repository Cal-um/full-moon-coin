import { StatusBar } from "expo-status-bar"
import { Image } from "expo-image"
import { FC, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import {
  connectToGobyWallet,
  fetchXCHBalance,
  getAddress,
  intitialConnect,
  isConnectedToGobyWallet,
} from "./src/gobiWallet"

export default function App() {
  const [isConnected, setIsConnected] = useState(isConnectedToGobyWallet())
  const [isConnectionLoading, setIsConnectionLoading] = useState(false)
  const [xchBalance, setXCHBalance] = useState(0)

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
    console.log({ xchBalance })
    setXCHBalance(xchBalance)
  }
  return (
    <View style={styles.container}>
      {isConnected ? (
        <ConnectedToGobyAddress address={getAddress()} />
      ) : (
        <ConnectToGobyButton
          onPress={onConnectToGobyPress}
          isLoading={isConnectionLoading}
        />
      )}
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
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
        source={require("./assets/Goby-symbol.png")}
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
