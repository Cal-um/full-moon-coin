import { Program } from "clvm-lib"
import { puzzles } from "../utils/puzzles"
import { stripHexPrefix } from "../utils/hex"

export const getStandardTransaction = (syntheticPubKey: string): Program => {
  return puzzles.payToDelegatedOrHidden.curry([
    Program.fromHex(stripHexPrefix(syntheticPubKey)),
  ])
}

export const getStandardSolution = (conditions: Program[]): Program => {
  const delegatedPuzzle = puzzles.payToConditions.run(
    Program.fromList([Program.fromList(conditions)])
  ).value

  return Program.fromList([Program.nil, delegatedPuzzle, Program.nil])
}
