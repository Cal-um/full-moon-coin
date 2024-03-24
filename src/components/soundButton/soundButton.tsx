import React, { useState, useEffect, useRef } from "react"
import { Pressable } from "react-native"
import { Octicons } from "@expo/vector-icons"

const SoundButton = () => {
  const audioRef = useRef(
    new Audio(
      "https://users.content.ytmnd.com/8/c/a/8ca410dc1afec416874c2c861476538c.mp3"
    )
  )
  const [play, setPlay] = useState(false)
  const [isHovered, setIsHovered] = useState(false) // State to track hover

  useEffect(() => {
    audioRef.current.loop = true
    if (play) {
      audioRef.current
        .play()
        .catch((error) => console.log("Audio play error:", error))
    } else {
      audioRef.current.pause()
    }

    // Optional: Cleanup audio object on component unmount
    return () => {
      audioRef.current.pause()
    }
  }, [play]) // Depend on 'play' state

  return (
    <Pressable
      style={{
        position: "absolute",
        left: 20, // Adjust as needed for padding from the left edge
        bottom: 20, // Adjust as needed for padding from the bottom edge
        backgroundColor: isHovered ? "grey" : "black", // Change color on hover
        padding: 10, // Padding inside the Pressable
        borderRadius: 50, // Circular shape
        alignItems: "center",
        justifyContent: "center",
      }}
      onHoverIn={() => setIsHovered(true)} // Only works in React Native Web
      onHoverOut={() => setIsHovered(false)}
      onPress={() => setPlay((state) => !state)}
    >
      <Octicons name={play ? "mute" : "unmute"} size={32} color="white" />
    </Pressable>
  )
}

export { SoundButton }
