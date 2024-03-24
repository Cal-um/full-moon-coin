import React, { FC } from "react"
import { View, Text } from "react-native"
import { Image } from "expo-image"

const GobyInnerView: FC<{ text: String }> = ({ text }) => {
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
        source={require("../../../assets/Goby-symbol.png")}
        contentFit="contain"
      />
      <Text style={{ paddingLeft: 8, paddingRight: 8 }}>{text}</Text>
    </View>
  )
}

export default GobyInnerView
