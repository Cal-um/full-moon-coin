import { Program } from "clvm-lib"
import PayToDelegatedOrHidden from "../../puzzles/pay_to_delegated_or_hidden.clvm.hex.json"
import Cat from "../../puzzles/cat.clvm.hex.json"
import DefaultHidden from "../../puzzles/default_hidden.clvm.hex.json"
import PayToConditions from "../../puzzles/pay_to_conditions.clvm.hex.json"
import MoonLayer from "../../puzzles/moon_layer.clvm.hex.json"

export const puzzles = {
  cat: Program.deserializeHex(Cat.hex),
  defaultHidden: Program.deserializeHex(DefaultHidden.hex),
  payToConditions: Program.deserializeHex(PayToConditions.hex),
  payToDelegatedOrHidden: Program.deserializeHex(PayToDelegatedOrHidden.hex),
  moonLayer: Program.deserializeHex(MoonLayer.hex),
}
