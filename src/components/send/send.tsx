import React, { FC, useRef, useState } from "react"
import { View, Text, TextInput, Pressable } from "react-native"
import { useAppDispatch, useAppSelector } from "../../hooks"
import { getFLMBalance, getXCHBalance } from "../../store/selectors"
import { bech23Decode } from "../../goby/gobyWallet"
import TransactionModal from "./transactionModal"
import { makeTransaction } from "../../store/walletSlice"
import {
  convertCattoMojos,
  convertXCHtoMojos,
} from "../../store/selectors/getBalance"

interface InputState {
  value: string
  error?: string
}

const Send: FC = () => {
  const xchBalance = useAppSelector(getXCHBalance)
  const flmBalance = useAppSelector(getFLMBalance)
  const [address, setAddress] = useState<InputState>({ value: "" })
  const [flmAmount, setFLMAmount] = useState<InputState>({ value: "" })
  const [feeAmount, setFeeAmount] = useState<InputState>({ value: "0" })
  const dispatch = useAppDispatch()

  const checkForErrors = () => {
    setAddress((state) => ({
      ...state,
      error: checkAddressForError(state.value),
    }))
    setFLMAmount((state) => ({
      ...state,
      error: checkInputAmountForError(state.value, flmBalance),
    }))
    setFeeAmount((state) => ({
      ...state,
      error: checkInputAmountForError(state.value, xchBalance, true),
    }))
  }

  return (
    <View style={{ gap: 16, maxWidth: 600, padding: 16 }}>
      <InputField
        title="SEND ADDRESS"
        value={address.value}
        onChangeText={(text) =>
          setAddress((state) => ({
            ...state,
            value: text,
            error: checkAddressForError(text),
          }))
        }
        hideErrorOnFocus={true}
        inputEndText=""
        error={address.error}
        onBlur={() => {}}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          gap: 16,
        }}
      >
        <InputField
          title="AMOUNT"
          value={flmAmount.value}
          onChangeText={onChangeAmount(setFLMAmount, flmBalance)}
          hideErrorOnFocus={true}
          inputEndText="FLM"
          onBlur={() =>
            onChangeAmount(
              setFLMAmount,
              flmBalance
            )(Number(flmAmount.value).toString())
          }
          error={flmAmount.error}
        />
        <InputField
          title="FEE"
          value={feeAmount.value}
          onChangeText={onChangeAmount(setFeeAmount, xchBalance, true)}
          hideErrorOnFocus={true}
          inputEndText="XCH"
          onBlur={() =>
            onChangeAmount(
              setFeeAmount,
              xchBalance,
              true
            )(Number(feeAmount.value).toString())
          }
          error={feeAmount.error}
        />
      </View>
      <Pressable
        style={{
          height: 42,
          borderColor: "white",
          borderWidth: 1,
          padding: 16,
          borderRadius: 21,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#04AA6D",
        }}
        onPress={() => {
          checkForErrors()
          dispatch(
            makeTransaction({
              address: address.value,
              amount: convertCattoMojos(Number(flmAmount.value)),
              fee: convertXCHtoMojos(Number(feeAmount.value)),
            })
          )
        }}
      >
        <Text style={{ color: "white" }}>SIGN & SEND</Text>
      </Pressable>
      <TransactionModal />
    </View>
  )
}

const onChangeAmount =
  (
    handler: React.Dispatch<React.SetStateAction<InputState>>,
    balance: number,
    allowZero: boolean = false
  ) =>
  (text: string) => {
    if (text.match(/^\d*\.?\d*$/)) {
      handler({
        value: text,
        error: checkInputAmountForError(text, balance, allowZero),
      })
    }
  }

const checkAddressForError = (address: string): string | undefined => {
  if (address === "") {
    return "Please enter a send address"
  }

  if (!bech23Decode(address)?.words) {
    return "Invalid address"
  }

  return undefined
}

const checkInputAmountForError = (
  input: string,
  balance: number,
  allowZero: boolean = false
): string | undefined => {
  if (input === "") {
    return "This field is required"
  }

  const inputValue = Number(input)

  if (!allowZero && inputValue === 0) {
    return "Please enter amount"
  }

  // Check if the input is NaN or a negative value
  if (isNaN(inputValue) || inputValue < 0) {
    return "Invalid input"
  }

  if (inputValue > balance) {
    return "Insufficient balance"
  }

  return undefined
}

interface InputFieldProps {
  title: string
  value: string
  onChangeText: (text: string) => void
  onBlur: () => void
  hideErrorOnFocus: boolean
  inputEndText: string
  error?: string
}
const InputField: FC<InputFieldProps> = (props) => {
  const [isInFocus, setIsInFocus] = useState(false)
  const showError = props.error ? !(props.hideErrorOnFocus && isInFocus) : false
  const ref_input = useRef<TextInput | null>(null)

  return (
    <Pressable
      onPress={() => ref_input.current?.focus()}
      style={{
        flex: 1,
        backgroundColor: "#f7f7f7",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: showError ? "red" : isInFocus ? "blue" : "white",
      }}
    >
      <View
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}
      >
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Text style={{ color: isInFocus ? "blue" : "grey" }}>
              {props.title}
            </Text>
            {showError ? (
              <Text style={{ color: "red" }}>{props.error}</Text>
            ) : null}
          </View>

          <TextInput
            style={{
              ...outlineStyle,
              flex: 1,
            }}
            ref={ref_input}
            value={props.value}
            onChangeText={props.onChangeText}
            onBlur={() => {
              props.onBlur()
              setIsInFocus(false)
            }}
            onFocus={() => setIsInFocus(true)}
          />
        </View>
        <Text style={{ color: "grey" }}>{props.inputEndText}</Text>
      </View>
    </Pressable>
  )
}

const outlineStyle = { outlineStyle: "none" } as any

export { Send }
