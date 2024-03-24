import { encodeInt } from "chia-bls"
import { Program } from "clvm-lib"
import { buildMerkleTree } from "../src/utils/merkleTree"
import fullMoons from "../src/astronomy/fullMoons.json"
import { puzzles } from "../src/utils/puzzles"
import { formatHex, stripHexPrefix } from "../src/utils/hex"
import MoonLayer from "../puzzles/moon_layer.clvm.hex.json"
import { Coin, CoinSpend } from "../globals"
import { toCoinId } from "../src/utils/hash"
import { AssetToken } from "../src/puzzles/AssetToken"
import { getStandardSolution } from "../src/puzzles/standardTransaction"
import { parseOutput } from "../src/utils/parsePuzzleOutput"

describe("moonLayer", () => {
  test("We get output if its a full moon date", () => {
    const sol = getFullMoonSolution(fullMoons[200], fullMoons)

    const result = moonLayerPuzz().run(sol)
    expect(result.value.isNull).toBe(false)
  })

  test("We raise an error if it's not a full moon date", () => {
    const sol = getFullMoonSolution(
      23455432212, // not a full moon date
      fullMoons,
      fullMoons[200]
    )

    expect(() => moonLayerPuzz().run(sol)).toThrow(
      `The error ("N0t F00L M00N!") was raised.`
    )
  })

  test("We will fail on a non moon merkle tree", () => {
    const sol = getFullMoonSolution(
      2071098049, // not a full moon date
      [2068540645, 2071098049, 2073651842, 2076201361]
    )

    expect(() => moonLayerPuzz().run(sol)).toThrow(
      `The error ("N0t F00L M00N!") was raised.`
    )
  })

  describe("Seconds before and after conditions", () => {
    const twelveHoursInSeconds = 43200

    describe("for condition code 81 (ASSERT_SECONDS_ABSOLUTE)", () => {
      test("when no inner conditions we expect it to be 12 hours before timestamp", () => {
        const timestamp = fullMoons[200]
        const sol = getFullMoonSolution(timestamp, fullMoons)

        const result = moonLayerPuzz().run(sol)
        const outputConditions = parseOutput(result.value.toString())
        const condition81 = outputConditions.find((x) => x[0] === "81")!
        const secondsInCondition81 = parseInt(condition81[1])

        expect(secondsInCondition81).toBe(timestamp - twelveHoursInSeconds)
      })

      describe("inner condition contains 81", () => {
        test("time is before the min timestamp then fail", () => {
          const timestamp = fullMoons[200]
          const sol = getFullMoonSolution(timestamp, fullMoons)

          const innerPuzzConditions = Program.fromList([
            Program.fromList([
              Program.fromInt(81),
              Program.fromInt(timestamp - twelveHoursInSeconds - 1),
            ]),
          ])
          expect(() => moonLayerPuzz(innerPuzzConditions).run(sol)).toThrow(
            `The error () was raised.`
          )
        })

        test("time is after the min timestamp then use it", () => {
          const timestamp = fullMoons[200]
          const sol = getFullMoonSolution(timestamp, fullMoons)

          const innerTimestamp = timestamp - twelveHoursInSeconds + 100
          const innerPuzzConditions = Program.fromList([
            Program.fromList([
              Program.fromInt(81),
              Program.fromInt(innerTimestamp),
            ]),
          ])
          const result = moonLayerPuzz(innerPuzzConditions).run(sol)
          const outputConditions = parseOutput(result.value.toString())
          const condition81 = outputConditions.find((x) => x[0] === "81")!
          const secondsInCondition81 = parseInt(condition81[1])

          expect(secondsInCondition81).toBe(innerTimestamp)
        })

        test("multiple inner condition 81 use the last", () => {
          const timestamp = fullMoons[200]
          const sol = getFullMoonSolution(timestamp, fullMoons)

          const innerTimestamp = timestamp - twelveHoursInSeconds + 100999
          const innerPuzzConditions = Program.fromList([
            Program.fromList([
              Program.fromInt(81),
              Program.fromInt(timestamp + 2000000),
            ]),
            Program.fromList([
              Program.fromInt(81),
              Program.fromInt(timestamp + twelveHoursInSeconds - 100),
            ]),
            Program.fromList([
              Program.fromInt(81),
              Program.fromInt(innerTimestamp),
            ]),
          ])
          const result = moonLayerPuzz(innerPuzzConditions).run(sol)
          const outputConditions = parseOutput(result.value.toString())
          const condition81s = outputConditions.filter((x) => x[0] === "81")!

          expect(condition81s.length).toBe(1)
          expect(parseInt(condition81s[0][1])).toBe(innerTimestamp)
        })
      })
    })

    describe("for condition code 85 (ASSERT_SECONDS_BEFORE_ABSOLUTE)", () => {
      test("when no inner conditions we expect it to be 12 hours after timestamp", () => {
        const timestamp = fullMoons[200]
        const sol = getFullMoonSolution(timestamp, fullMoons)

        const result = moonLayerPuzz().run(sol)
        const outputConditions = parseOutput(result.value.toString())
        const condition85 = outputConditions.find((x) => x[0] === "85")!
        const secondsInCondition81 = parseInt(condition85[1])

        expect(secondsInCondition81).toBe(timestamp + twelveHoursInSeconds)
      })

      describe("inner condition contains 85", () => {
        test("time is after the max timestamp then fail", () => {
          const timestamp = fullMoons[10]
          const sol = getFullMoonSolution(timestamp, fullMoons)

          const innerPuzzConditions = Program.fromList([
            Program.fromList([
              Program.fromInt(85),
              Program.fromInt(timestamp + twelveHoursInSeconds + 1),
            ]),
          ])
          expect(() => moonLayerPuzz(innerPuzzConditions).run(sol)).toThrow(
            `The error () was raised.`
          )
        })

        test("time is before the max timestamp then use it", () => {
          const timestamp = fullMoons[10]
          const sol = getFullMoonSolution(timestamp, fullMoons)

          const innerTimestamp = timestamp + twelveHoursInSeconds - 100
          const innerPuzzConditions = Program.fromList([
            Program.fromList([
              Program.fromInt(85),
              Program.fromInt(innerTimestamp),
            ]),
          ])
          const result = moonLayerPuzz(innerPuzzConditions).run(sol)
          const outputConditions = parseOutput(result.value.toString())
          const condition81 = outputConditions.find((x) => x[0] === "85")!
          const secondsInCondition81 = parseInt(condition81[1])

          expect(secondsInCondition81).toBe(innerTimestamp)
        })

        test("multiple inner condition 85 use the last", () => {
          const timestamp = fullMoons[10]
          const sol = getFullMoonSolution(timestamp, fullMoons)

          const innerTimestamp = timestamp + twelveHoursInSeconds - 100999
          const innerPuzzConditions = Program.fromList([
            Program.fromList([
              Program.fromInt(85),
              Program.fromInt(timestamp + 2000000),
            ]),
            Program.fromList([
              Program.fromInt(85),
              Program.fromInt(timestamp - twelveHoursInSeconds - 100),
            ]),
            Program.fromList([
              Program.fromInt(85),
              Program.fromInt(innerTimestamp),
            ]),
          ])
          const result = moonLayerPuzz(innerPuzzConditions).run(sol)
          const outputConditions = parseOutput(result.value.toString())
          const condition81s = outputConditions.filter((x) => x[0] === "85")!
          expect(condition81s.length).toBe(1)
          expect(parseInt(condition81s[0][1])).toBe(innerTimestamp)
        })
      })
    })
  })

  describe("morph create coin conditions", () => {
    const pubkey1 =
      "8cd92dc5b3056f0b7dd54092593c1926e9188c894b3cf7b4109ae37d2d2023db88fe40158bdf8f1da0b87270cdcefcfd"
    const pubkey2 =
      "b7e7c99e3d909fe374b4a341992c42a16e21dbc972e8990dc2084e6f67c807ece50301502f2dc4bac60d17cc2f96643c"
    const innerPuzz1 = puzzles.payToDelegatedOrHidden.curry([
      Program.fromHex(pubkey1),
    ])
    const innerPuzz2 = puzzles.payToDelegatedOrHidden.curry([
      Program.fromHex(pubkey2),
    ])

    describe("one create coin condition", () => {
      let output: string[][]
      const createCoinAmount = 2340
      let condition51: string[]

      const innerPuzzConditions = Program.fromList([
        Program.fromList([
          Program.fromInt(51),
          Program.fromBytes(innerPuzz1.hash()),
          Program.fromInt(createCoinAmount),
          Program.fromList([Program.fromBytes(innerPuzz1.hash())]),
        ]),
      ])
      beforeAll(() => {
        const sol = getFullMoonSolution(fullMoons[200], fullMoons)
        output = parseOutput(
          moonLayerPuzz(innerPuzzConditions).run(sol).value.toString()
        )
        condition51 = output.find((x) => x[0] === "51")!
      })

      test("we get one create coin condition", () => {
        const condition51s = output.filter((x) => x[0] === "51")
        expect(condition51s.length).toBe(1)
      })

      test("we get the morphed puzzle hash", () => {
        const expectedCreateCoinPuzzleHash = puzzles.moonLayer
          .curry([Program.fromBytes(puzzles.moonLayer.hash()), innerPuzz1])
          .hashHex()

        const createCoinPuzzleHash = condition51![1]
        expect(createCoinPuzzleHash).toBe(
          formatHex(expectedCreateCoinPuzzleHash)
        )
      })
      test("we get the correct amount", () => {
        const amount = condition51![2]
        expect(Number(amount)).toBe(createCoinAmount)
      })

      test("we get the correct hint within the memos", () => {
        const memos = condition51![3]
        expect(memos.length).toBe(1)
        expect(memos[0]).toBe(formatHex(innerPuzz1.hashHex()))
      })
    })

    describe("multiple create coin conditions", () => {
      const innerPuzzConditions = Program.fromList([
        Program.fromList([
          Program.fromInt(51),
          Program.fromBytes(innerPuzz1.hash()),
          Program.fromInt(100),
          Program.fromList([Program.fromBytes(innerPuzz1.hash())]),
        ]),
        Program.fromList([
          Program.fromInt(51),
          Program.fromBytes(innerPuzz2.hash()),
          Program.fromInt(30000),
        ]),
        Program.fromList([
          Program.fromInt(51),
          Program.fromInt(0),
          Program.fromInt(-113),
          Program.fromList([]),
          Program.fromList([]),
        ]),
      ])
      let output: string[][]
      let condition51s: string[][]
      beforeAll(() => {
        const sol = getFullMoonSolution(fullMoons[200], fullMoons)
        output = parseOutput(
          moonLayerPuzz(innerPuzzConditions).run(sol).value.toString()
        )
        condition51s = output.filter((x) => x[0] === "51")
      })

      test("we get three create coin conditions", () => {
        expect(condition51s.length).toBe(3)
      })

      test("we get the correct amounts and puzzle hashes", () => {
        const expectedCreateCoinPuzzleHash100 = formatHex(
          puzzles.moonLayer
            .curry([Program.fromBytes(puzzles.moonLayer.hash()), innerPuzz1])
            .hashHex()
        )
        const expectedCreateCoinPuzzleHash30000 = formatHex(
          puzzles.moonLayer
            .curry([Program.fromBytes(puzzles.moonLayer.hash()), innerPuzz2])
            .hashHex()
        )
        expect(condition51s.find((x) => x[2] === "100")![1]).toBe(
          expectedCreateCoinPuzzleHash100
        )
        expect(condition51s.find((x) => x[2] === "30000")![1]).toBe(
          expectedCreateCoinPuzzleHash30000
        )
      })

      test("we get the correct memos", () => {
        expect(condition51s.find((x) => x[2] === "100")![3][0]).toBe(
          formatHex(innerPuzz1.hashHex())
        )
        // no memo
        expect(condition51s.find((x) => x[2] === "30000")![3]).toBeUndefined()
      })

      test("condition tail -113 is untouched", () => {
        // parse function sees () as []
        const tailCondition = condition51s.find((x) => x[2] === "-113")
        expect(tailCondition![1]).toEqual([])
        expect(tailCondition![3]).toEqual([])
        expect(tailCondition![4]).toEqual([])
      })
    })
  })
})

describe("cost", () => {
  test("estimate cost", () => {
    const innerPuzzConditions = Program.fromList([
      Program.fromList([
        Program.fromInt(51),
        Program.fromText(
          "b9a365c4d2675d5fd8ec77672a2bc29474184c3805b550b987b630c83c200c9c"
        ),
        Program.fromInt(1000000000),
        Program.fromList([
          Program.fromText(
            "b9a365c4d2675d5fd8ec77672a2bc29474184c3805b550b987b630c83c200c9c"
          ),
        ]),
      ]),
    ])
    const generalSolutionHex =
      "ff8500841e06caffff82009effa04f484ec0c4c4b1581d10f0f3d8c65ab867f9100f625a512cf1fd8d97145c42cfffa0497aa54e02e7a7c1832cec1b86053c6602baf83a5417361239ad4b99070b363effa06d57aa49a3d888243e91c9a66faeae0bf3a53ef839e94feed003a74ae6ff6ed3ffa0f5b15a31f70778e6019c172e56dc371d2979fa04cc470faf7e411a6047873a8affa08648a3c47ac220598707cd6b45554684f301a93a351d379836b6cec0df42de8bffa0442a54c0c467feacbbcae65dd15a91aa56daa2480a3f6f98e248afd62f795f57ffa09c87021b6257d6723d5dc3869f43d0065e5d5414f65e2e914858bb591172a474ffa05a8d20dba183c3ba7b2ce90fea1e0e7977396b9ad22a70e6e17773e2c9c58331ffa05d1a49a8f69d2d665e1efb1a15fc306eaed18d4846b8cea09d4d7904945559d480ff8080"
    const moonLayerHex = MoonLayer.hex
    const sol = getFullMoonSolution(fullMoons[200], fullMoons)
    const runCost = moonLayerPuzz(innerPuzzConditions).run(sol).cost
    const oneCreateCoinConditionCost = 1800000
    const costPerByte = 12000

    const solutionBytes = generalSolutionHex.length / 2
    const moonLayerBytes = moonLayerHex.length / 2
    const solutionCost = solutionBytes * costPerByte
    const moonLayerCost = moonLayerBytes * costPerByte
    const catTransactionCost = 37000000
    const total =
      solutionCost +
      moonLayerCost +
      oneCreateCoinConditionCost +
      Number(runCost)
    console.log({
      total,
      solutionCost,
      moonLayerCost,
      oneCreateCoinConditionCost,
      runCost,
    })
    // {
    //   total: 31232763,
    //   solutionCost: 3864000,
    //   moonLayerCost: 25500000,
    //   oneCreateCoinConditionCost: 1800000,
    //   runCost: 68763n
    // }
  })
})

describe("issue moon cat", () => {
  const parentCoin: Coin = {
    amount: 100000,
    parent_coin_info:
      "0x24c36ade721050ca4f0380dabf40e68e2a8a7dd79523703cdfb38a7ab72641d3",
    puzzle_hash:
      "0x75da6b5fc6a02eafcfbd5c8248f35d30dd683c67565a6a93cf8599acd4ddf31b",
  }
  const puzzle_reveal =
    "ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b08cd92dc5b3056f0b7dd54092593c1926e9188c894b3cf7b4109ae37d2d2023db88fe40158bdf8f1da0b87270cdcefcfdff018080"
  const tail = puzzles.genesisByIdTail.curry([
    Program.fromBytes(toCoinId(parentCoin)),
  ])
  console.log("assetId", tail.hashHex())
  const evepuzzlehash = AssetToken.calculatePuzzle(
    tail,
    Program.nil,
    Program.fromHex(stripHexPrefix(parentCoin.puzzle_hash)).toBytes(),
    parentCoin.amount
  ).hash()
  const coinSpend: CoinSpend = {
    coin: parentCoin,
    puzzle_reveal: puzzle_reveal,
    solution: getStandardSolution([
      Program.fromList([
        Program.fromInt(51),
        Program.fromBytes(evepuzzlehash),
        Program.fromInt(parentCoin.amount),
      ]),
    ]).serializeHex(),
  }
  console.log(
    "solutionHex",
    getStandardSolution([
      Program.fromList([
        Program.fromInt(51),
        Program.fromBytes(evepuzzlehash),
        Program.fromInt(parentCoin.amount),
      ]),
    ]).serializeHex()
  )

  const issueCat = AssetToken.issue(
    coinSpend,
    tail,
    Program.nil,
    Program.fromHex(stripHexPrefix(coinSpend.coin.puzzle_hash)).toBytes(),
    parentCoin.amount
  )
  const sol = Program.deserializeHex(issueCat.puzzle_reveal).run(
    Program.deserializeHex(issueCat.solution)
  )
  console.log(sol.value.toString())
  const coinspendSol = Program.deserializeHex(coinSpend.puzzle_reveal).run(
    Program.deserializeHex(coinSpend.solution)
  )
  console.log(coinspendSol.value.toString())

  console.log()
})

const getFullMoonSolution = (
  fullMoonDate: number,
  moons: any[],
  dateForProofs?: number,
  innerSolution: Program = Program.nil
) => {
  const [_, proofs] = buildMerkleTree(moons.map((x: any) => encodeInt(x)))
  const [bitNumber, hashes] = proofs[dateForProofs ?? fullMoonDate]
  console.log(bitNumber, hashes)

  return Program.fromList([
    Program.fromInt(fullMoonDate),
    Program.fromList([
      Program.fromInt(bitNumber),
      ...hashes.map(Program.fromBytes),
    ]),
    innerSolution,
  ])
}

const moonLayerPuzz = (innerPuzzConditions: Program = Program.fromList([])) => {
  const innerPuzz = puzzles.payToConditions.run(
    Program.fromList([innerPuzzConditions])
  ).value
  return puzzles.moonLayer.curry([
    Program.fromBytes(puzzles.moonLayer.hash()),
    innerPuzz,
  ])
}
