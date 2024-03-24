import { Program } from "clvm-lib"
import { buildMerkleTree } from "../utils/merkleTree"
import { encodeInt } from "chia-bls"
import fullMoons from "../astronomy/fullMoons.json"
import { puzzles } from "../utils/puzzles"
import { getStandardTransaction } from "./standardTransaction"

export const getFullMoonTransaction = (syntheticPubKey: string) => {
  return puzzles.moonLayer.curry([
    Program.fromBytes(puzzles.moonLayer.hash()),
    getStandardTransaction(syntheticPubKey),
  ])
}

export const getFullMoonSolution = (
  fullMoonDate: number,
  innerSolution: Program = Program.nil
) => {
  const [root, proofs] = buildMerkleTree(
    fullMoons.map((x: any) => encodeInt(x))
  )
  console.log(Program.fromBytes(root).toString())
  const [bitNumber, hashes] = proofs[fullMoonDate]

  return Program.fromList([
    Program.fromInt(fullMoonDate),
    Program.fromList([
      Program.fromInt(bitNumber),
      ...hashes.map(Program.fromBytes),
    ]),
    innerSolution,
  ])
}
