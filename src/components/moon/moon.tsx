import React, { useEffect, useState } from "react"
import { findClosestFullMoon } from "../../astronomy/nearestFullMoon"
import { MoonPhase } from "../../astronomy/astronomy"
import { View, Text, Image } from "react-native"
import { useAppSelector } from "../../hooks"
import { getFLMBalance } from "../../store/selectors"

export const MoonView = () => {
  const [countdown, setCountdown] = useState("")

  // unix timestamp of next full moon.
  const nextFullMoon = findClosestFullMoon(Date.now() / 1000)!
  console.log(nextFullMoon)
  // Calculate the moon phase
  const moonPhase = MoonPhase(new Date())
  const x = Math.trunc(moonPhase * 2 + 502)
  const z = String(x).padStart(4, "0")
  const imageUrl = `https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005048/frames/216x216_1x1_30p/moon.${z}.jpg`

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() / 1000
      console.log({ now })
      const difference = nextFullMoon - now
      console.log({ difference })

      // Check if the next full moon is within the next 12 hours or has occurred within the past 12 hours
      const isWithin12hoursOr12hoursAfter = Math.abs(difference) <= 12 * 3600

      if (isWithin12hoursOr12hoursAfter) {
        setCountdown("F00L M00N")
      } else {
        const days = Math.floor(difference / (60 * 60 * 24))
        const hours = Math.floor((difference / (60 * 60)) % 24)
        const minutes = Math.floor((difference / 60) % 60)
        const seconds = Math.floor(difference % 60)
        console.log(seconds)
        setCountdown(
          `Full moon in ${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`
        )
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const flmBalance = useAppSelector((state) => getFLMBalance(state))

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "white",
        flexDirection: "row",
        height: 65,
        borderRadius: 65 / 2,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000000",
        paddingHorizontal: 16,
      }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ height: 65 - 16, width: 65 - 16 }}
      />
      <Text style={{ marginLeft: 16, fontSize: 32, color: "white" }}>
        {flmBalance + " FLM"}
      </Text>
    </View>
  )
}
