import React, { FC } from "react"
import ConnectToGobyButton from "./connectToGobyButton"
import { useAppSelector } from "../../hooks"
import ConnectedToGobyView from "./connectedToGoby"

const GobyView: FC = () => {
  const pubKey = useAppSelector((state) => state.wallet.syntheticPubKey)
  const isLoggedIn = !!pubKey
  if (isLoggedIn) {
    return <ConnectedToGobyView pubKey={pubKey} />
  }
  return <ConnectToGobyButton />
}

export default GobyView
