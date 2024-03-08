import { encodeInt, hash256, sha256 } from "chia-bls"
import { Program } from "clvm-lib"
import { buildMerkleTree } from "../src/utils/merkleTree"
import fullMoons from "../src/astronomy/fullMoons.json"
import { puzzles } from "../src/utils/puzzles"
import { formatHex } from "../src/utils/hex"
import MoonLayer from "../puzzles/moon_layer.clvm.hex.json"

describe("moonLayer", () => {
  test("We get output if its a full moon date", () => {
    const sol = getFullMoonSolution(fullMoons[200].timestamp, fullMoons)

    const result = moonLayerPuzz().run(sol)
    expect(result.value.isNull).toBe(false)
  })

  test("We raise an error if it's not a full moon date", () => {
    const sol = getFullMoonSolution(
      23455432212, // not a full moon date
      fullMoons,
      fullMoons[200].timestamp
    )

    expect(() => moonLayerPuzz().run(sol)).toThrow(
      `The error ("N0t F00L M00N!") was raised.`
    )
  })

  test("We will fail on a non moon merkle tree", () => {
    const sol = getFullMoonSolution(
      2071098049, // not a full moon date
      [
        {
          date: "2035-07-20T10:37:25.223Z",
          timestamp: 2068540645,
        },
        {
          date: "2035-08-19T01:00:49.029Z",
          timestamp: 2071098049,
        },
        {
          date: "2035-09-17T14:24:02.011Z",
          timestamp: 2073651842,
        },
        {
          date: "2035-10-17T02:36:01.116Z",
          timestamp: 2076201361,
        },
      ]
    )

    expect(() => moonLayerPuzz().run(sol)).toThrow(
      `The error ("N0t F00L M00N!") was raised.`
    )
  })

  describe("Seconds before and after conditions", () => {
    const twelveHoursInSeconds = 43200

    describe("for condition code 81 (ASSERT_SECONDS_ABSOLUTE)", () => {
      test("when no inner conditions we expect it to be 12 hours before timestamp", () => {
        const timestamp = 1708777870
        const sol = getFullMoonSolution(timestamp, fullMoons)

        const result = moonLayerPuzz().run(sol)
        const outputConditions = parseOutput(result.value.toString())
        const condition81 = outputConditions.find((x) => x[0] === "81")!
        const secondsInCondition81 = parseInt(condition81[1])

        expect(secondsInCondition81).toBe(timestamp - twelveHoursInSeconds)
      })

      describe("inner condition contains 81", () => {
        test("time is before the min timestamp then fail", () => {
          const timestamp = 1708777870
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
          const timestamp = 1708777870
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
          const timestamp = 1708777870
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
        const timestamp = 1708777870
        const sol = getFullMoonSolution(timestamp, fullMoons)

        const result = moonLayerPuzz().run(sol)
        const outputConditions = parseOutput(result.value.toString())
        const condition85 = outputConditions.find((x) => x[0] === "85")!
        const secondsInCondition81 = parseInt(condition85[1])

        expect(secondsInCondition81).toBe(timestamp + twelveHoursInSeconds)
      })

      describe("inner condition contains 85", () => {
        test("time is after the max timestamp then fail", () => {
          const timestamp = 1708777870
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
          const timestamp = 1708777870
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
          const timestamp = 1708777870
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
        const sol = getFullMoonSolution(fullMoons[200].timestamp, fullMoons)
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
        const sol = getFullMoonSolution(fullMoons[200].timestamp, fullMoons)
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
    const sol = getFullMoonSolution(fullMoons[200].timestamp, fullMoons)
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

const getFullMoonSolution = (
  fullMoonDate: number,
  moons: any[],
  dateForProofs?: number,
  innerSolution: Program = Program.nil
) => {
  const [_, proofs] = buildMerkleTree(
    moons.map((x: any) => encodeInt(x.timestamp))
  )
  const [bitNumber, hashes] = proofs[dateForProofs ?? fullMoonDate]

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

const parseOutput = (input: string): string[][] => {
  // Helper function to recursively parse the string
  function parseHelper(chars: string[], currentArray: any[] = []): any[] {
    let currentElement = ""

    while (chars.length > 0) {
      const char = chars.shift() // Remove the first character

      if (char === "(") {
        // When an open parenthesis is found, start a new array and parse it recursively
        currentArray.push(parseHelper(chars))
      } else if (char === ")") {
        // When a close parenthesis is found, return the current array
        if (currentElement) {
          currentArray.push(currentElement)
          currentElement = ""
        }
        return currentArray
      } else if (char !== " ") {
        // Accumulate the characters for the current element
        currentElement += char
      } else if (currentElement) {
        // If there's a space and we have an accumulated element, push it to the current array
        currentArray.push(currentElement)
        currentElement = ""
      }
    }

    // After processing all characters, if there's any remaining element, add it to the current array
    if (currentElement) {
      currentArray.push(currentElement)
    }

    return currentArray
  }

  // Convert the input string to an array of characters and initiate parsing
  return parseHelper(input.split("")).flat()
}
