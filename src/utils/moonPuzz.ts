import { Program } from "clvm-lib"
import { puzzles } from "./puzzles"
import { stripHexPrefix } from "./hex"

export const catPuzzHash = (syntheticPubKey: string) => {
  return puzzles.cat
    .curry([
      Program.fromBytes(puzzles.cat.hash()),
      Program.fromHex(
        "9c5172650fd0b9d69ecc4beccc15b656c35e9e855b4cb5233b87dcaca2e2715b"
      ),
      puzzles.moonLayer.curry([
        Program.fromBytes(puzzles.moonLayer.hash()),
        puzzles.payToDelegatedOrHidden.curry([
          Program.fromHex(stripHexPrefix(syntheticPubKey)),
        ]),
      ]),
    ])
    .hashHex()
}
