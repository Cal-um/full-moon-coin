import React, { FC, useState } from "react"
import { ActivityIndicator, Pressable } from "react-native"
import GobyInnerView from "./gobyInnerView"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { loginToGoby } from "../../store/walletSlice"

const ConnectToGobyButton: FC = () => {
  const [hover, setHover] = useState(false)
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector((state) => state.wallet.loggingIn)
  return (
    <Pressable
      style={{
        height: 65,
        backgroundColor: "#f0f0f0",
        padding: 8,
        opacity: isLoading ? 0.5 : hover ? 0.8 : 1,
        borderRadius: 65 / 2,
        justifyContent: "center",
        alignItems: "center",
        borderColor: "black",
        borderWidth: 1,
      }}
      disabled={isLoading}
      onPress={() => dispatch(loginToGoby(false))}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
    >
      <GobyInnerView text={"Connect to Goby"} />
      <ActivityIndicator
        style={{ position: "absolute" }}
        animating={isLoading}
        hidesWhenStopped={true}
      />
    </Pressable>
  )
}

export default ConnectToGobyButton
