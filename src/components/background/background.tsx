import { View, Text, ImageBackground } from "react-native"
import { Image } from "expo-image"
import { findClosestFullMoon } from "../../astronomy/nearestFullMoon"
import { MoonPhase } from "../../astronomy/astronomy"
import { useEffect, useState } from "react"

export const Background = () => {
  return (
    <View>
      <ImageBackground
        source={require("../../../assets/spacecat.jpg")}
        style={{ height: 400, width: 500 }}
        resizeMode="repeat"
      />
      {/* <MoonView /> */}
    </View>
  )
}
