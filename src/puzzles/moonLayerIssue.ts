import { encodeInt } from "chia-bls"
import { buildMerkleTree } from "../utils/merkleTree"
import { Program } from "clvm-lib"
import { puzzles } from "../utils/puzzles"

export const getFullMoonForIssueSolution = (
  fullMoonDate: number,
  moons: any[],
  innerSolution: Program = Program.nil
) => {
  const [root, proofs] = buildMerkleTree(moons.map((x: any) => encodeInt(x)))
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
