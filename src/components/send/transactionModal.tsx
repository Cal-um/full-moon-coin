import React, { FC, useEffect } from "react"
import { Modal, View, ActivityIndicator, Text, Pressable } from "react-native"
import { useAppDispatch, useAppSelector } from "../../hooks"
import {
  Transaction,
  closeTransaction,
  requestSignTransactionThenSend,
} from "../../store/walletSlice"
import {
  convertMojosToCat,
  convertMojosToXCH,
} from "../../store/selectors/getBalance"

const TransactionModal: React.FC = () => {
  const transaction = useAppSelector((state) => state.wallet.transaction)
  const CurrentComponent = getComponentForTransactionState(transaction)

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={!!transaction}
      onRequestClose={() => {
        console.log("Modal has been closed.")
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
        }}
      >
        <View
          style={{
            margin: 20,
            backgroundColor: "white",
            borderRadius: 20,
            padding: 35,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          {CurrentComponent}
        </View>
      </View>
    </Modal>
  )
}

const getComponentForTransactionState = (transaction?: Transaction) => {
  if (transaction?.outcome?.type === "error") {
    return <ErrorBox error={transaction.outcome.message} />
  }

  if (transaction?.outcome?.type === "success") {
    return <SuccessBox message={transaction.outcome.message} />
  }

  if (transaction?.coinSpends) {
    return <SignAndSend transaction={transaction} />
  }

  if (!!transaction) {
    return <ActivityIndicator size="large" color="#0000ff" />
  }
}

const ErrorBox: FC<{ error: string }> = ({ error }) => {
  const dispatch = useAppDispatch()
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Text style={{ alignSelf: "center", color: "red", fontSize: 22 }}>
        ERROR
      </Text>
      <Text>{error}</Text>
      <Pressable
        style={{
          width: "100%",
          height: 42,
          padding: 16,
          borderRadius: 21,
          justifyContent: "center",
          alignItems: "center",
          borderColor: "blue",
          borderWidth: 1,
        }}
        onPress={() => {
          dispatch(closeTransaction())
        }}
      >
        <Text style={{ color: "blue" }}>OK</Text>
      </Pressable>
    </View>
  )
}

const SuccessBox: FC<{ message: string }> = ({ message }) => {
  const dispatch = useAppDispatch()
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Text style={{ alignSelf: "center", color: "green", fontSize: 22 }}>
        SENT
      </Text>
      <Text style={{ alignSelf: "center" }}>follow transaction in Goby</Text>
      <Text>{message}</Text>
      <Pressable
        style={{
          width: "100%",
          height: 42,
          padding: 16,
          borderRadius: 21,
          justifyContent: "center",
          alignItems: "center",
          borderColor: "blue",
          borderWidth: 1,
        }}
        onPress={() => {
          dispatch(closeTransaction())
        }}
      >
        <Text style={{ color: "blue" }}>OK</Text>
      </Pressable>
    </View>
  )
}

const SignAndSend: FC<{ transaction: Transaction }> = ({ transaction }) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(requestSignTransactionThenSend())
  }, [])

  return (
    <View style={{ backgroundColor: "lightblue" }}>
      <Text style={{ alignSelf: "center" }}>Review & Sign Transaction</Text>
      <View style={{ flexDirection: "row" }}>
        <Text>To</Text>
        <Text>{transaction.transactionParms.address}</Text>
      </View>
      <View style={{ flexDirection: "row" }}>
        <Text>Amount</Text>
        <Text>{convertMojosToCat(transaction.transactionParms.amount)}</Text>
      </View>
      <View style={{ flexDirection: "row" }}>
        <Text>Fee</Text>
        <Text>{convertMojosToXCH(transaction.transactionParms.fee)}</Text>
      </View>
    </View>
  )
}

export default TransactionModal
