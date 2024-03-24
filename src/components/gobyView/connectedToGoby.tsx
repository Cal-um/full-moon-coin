import React, { FC } from "react"
import { View } from "react-native"
import GobyInnerView from "./gobyInnerView"
import { getShortAddress } from "../../goby/gobyWallet"

const ConnectedToGobyView: FC<{ pubKey: string }> = ({ pubKey }) => {
  return (
    <View
      style={{
        height: 65,
        backgroundColor: "#f0f0f0",
        padding: 8,
        borderRadius: 65 / 2,
        borderColor: "black",
        borderWidth: 1,
      }}
    >
      <GobyInnerView text={getShortAddress(pubKey)} />
    </View>
  )
}

export default ConnectedToGobyView
