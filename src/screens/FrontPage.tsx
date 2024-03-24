import React, { FC, useEffect, useRef } from "react"
import GobyView from "../components/gobyView"
import { loginToGoby } from "../store/walletSlice"
import { useAppDispatch, useAppSelector } from "../hooks"
import { ImageBackground, View } from "react-native"
import { Send } from "../components/send"
import { SoundButton } from "../components/soundButton"
import { MoonView } from "../components/moon"
const FrontPage: FC = () => {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(loginToGoby(true))
  }, [])

  const loggedIn = useAppSelector((state) => !!state.wallet.syntheticPubKey)

  return (
    <ImageBackground
      source={require("../../assets/spacecat.jpg")}
      style={{
        height: "100%",
        width: "100%",
      }}
      resizeMode="repeat"
    >
      <View
        style={{
          flexDirection: "row",
          alignSelf: "flex-end",
          margin: 16,
          gap: 16,
        }}
      >
        {loggedIn ? <MoonView /> : null}
        <GobyView />
      </View>
      {loggedIn ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Send />
        </View>
      ) : null}
      <SoundButton />
    </ImageBackground>
  )
}

export default FrontPage
