import { bytesEqual, modNumber, toHex } from "chia-bls"
import { Program } from "clvm-lib"
import { puzzles } from "../utils/puzzles"
import { SpendableAssetCoin } from "../coins/SpendableAssetCoin"
import { formatHex, stripHexPrefix } from "../utils/hex"
import { Coin, CoinSpend } from "../../globals"
import { toCoinId } from "../utils/hash"
import { getFullMoonForIssueSolution } from "./moonLayerIssue"
import fullMoons from "../astronomy/fullMoons.json"
import { getStandardSolution } from "./standardTransaction"

export class AssetToken<T extends Program> extends Program {
  public readonly assetId: Uint8Array
  public readonly innerPuzzle: T

  constructor(assetId: Uint8Array, innerPuzzle: T) {
    super(
      puzzles.cat.curry([
        Program.fromBytes(puzzles.cat.hash()),
        Program.fromBytes(assetId),
        innerPuzzle,
      ]).value
    )

    this.assetId = assetId
    this.innerPuzzle = innerPuzzle
  }

  public static calculateIssuePayment(
    tail: Program,
    solution: Program,
    innerPuzzleHash: Uint8Array,
    amount: number
  ): Program {
    return Program.cons(
      Program.fromInt(1),
      Program.fromList([
        Program.fromList([
          Program.fromInt(51),
          Program.fromInt(0),
          Program.fromInt(-113),
          tail,
          solution,
        ]),
        Program.fromList([
          Program.fromInt(51),
          Program.fromBytes(innerPuzzleHash),
          Program.fromInt(amount),
          Program.fromList([Program.fromBytes(innerPuzzleHash)]),
        ]),
      ])
    )
  }

  public static moonPuzz(
    tail: Program,
    tailSolution: Program,
    innerPuzzleHash: Uint8Array,
    amount: number
  ): AssetToken<Program> {
    return puzzles.moonLayer.curry([
      Program.fromBytes(puzzles.moonLayer.hash()),
      this.calculateIssuePayment(tail, tailSolution, innerPuzzleHash, amount),
    ]) as AssetToken<Program>
  }

  public static calculatePuzzle(
    tail: Program,
    tailSolution: Program,
    innerPuzzleHash: Uint8Array,
    amount: number
  ): AssetToken<Program> {
    return puzzles.cat.curry([
      Program.fromBytes(puzzles.cat.hash()),
      Program.fromBytes(tail.hash()),
      this.moonPuzz(tail, tailSolution, innerPuzzleHash, amount),
    ]) as AssetToken<Program>
  }

  public static issue(
    originCoinSpend: CoinSpend,
    tail: Program,
    tailSolution: Program,
    destinationPuzzHash: Uint8Array,
    amount: number
  ): CoinSpend {
    const moonPuzzle = AssetToken.moonPuzz(
      tail,
      tailSolution,
      destinationPuzzHash,
      amount
    )

    const catPuzzle = AssetToken.calculatePuzzle(
      tail,
      tailSolution,
      destinationPuzzHash,
      amount
    )

    const eveCoin: Coin = {
      parent_coin_info: formatHex(toHex(toCoinId(originCoinSpend.coin))),
      puzzle_hash: formatHex(catPuzzle.hashHex()),
      amount,
    }

    const spendableEve = new SpendableAssetCoin(
      originCoinSpend,
      eveCoin,
      moonPuzzle,
      getFullMoonForIssueSolution(fullMoons[0], fullMoons),
      undefined,
      tail.hash()
    )

    return AssetToken.spend([spendableEve])[0]
  }

  public static doIt() {
    const originCoin: Coin = {
      parent_coin_info:
        "0xaeb44700ec185049f9e79e16e3b09428b198cc621ba2b32fb8b1cfc7cdad12d3",
      puzzle_hash:
        "0x5f31bbdd25e25b69b1a0e2135b1abd0303c24ca7a4245a503be238ef2108b468",
      amount: 100000,
    }
    const originCoinSpend: CoinSpend = {
      coin: {
        parent_coin_info:
          "0x5ee374c3f068fd78a80f3a0e1012da4c9699c4ff2d34bd8602d9f93ab6f032ad",
        puzzle_hash:
          "0xb4e51d50276a3c8a1b3f6a0b2599ddf87907692bda307b35f29386a1d8e034f9",
        amount: 100000,
      },
      puzzle_reveal:
        "0xff02ffff01ff02ffff01ff02ff5effff04ff02ffff04ffff04ff05ffff04ffff0bff34ff0580ffff04ff0bff80808080ffff04ffff02ff17ff2f80ffff04ff5fffff04ffff02ff2effff04ff02ffff04ff17ff80808080ffff04ffff02ff2affff04ff02ffff04ff82027fffff04ff82057fffff04ff820b7fff808080808080ffff04ff81bfffff04ff82017fffff04ff8202ffffff04ff8205ffffff04ff820bffff80808080808080808080808080ffff04ffff01ffffffff3d46ff02ff333cffff0401ff01ff81cb02ffffff20ff02ffff03ff05ffff01ff02ff32ffff04ff02ffff04ff0dffff04ffff0bff7cffff0bff34ff2480ffff0bff7cffff0bff7cffff0bff34ff2c80ff0980ffff0bff7cff0bffff0bff34ff8080808080ff8080808080ffff010b80ff0180ffff02ffff03ffff22ffff09ffff0dff0580ff2280ffff09ffff0dff0b80ff2280ffff15ff17ffff0181ff8080ffff01ff0bff05ff0bff1780ffff01ff088080ff0180ffff02ffff03ff0bffff01ff02ffff03ffff09ffff02ff2effff04ff02ffff04ff13ff80808080ff820b9f80ffff01ff02ff56ffff04ff02ffff04ffff02ff13ffff04ff5fffff04ff17ffff04ff2fffff04ff81bfffff04ff82017fffff04ff1bff8080808080808080ffff04ff82017fff8080808080ffff01ff088080ff0180ffff01ff02ffff03ff17ffff01ff02ffff03ffff20ff81bf80ffff0182017fffff01ff088080ff0180ffff01ff088080ff018080ff0180ff04ffff04ff05ff2780ffff04ffff10ff0bff5780ff778080ffffff02ffff03ff05ffff01ff02ffff03ffff09ffff02ffff03ffff09ff11ff5880ffff0159ff8080ff0180ffff01818f80ffff01ff02ff26ffff04ff02ffff04ff0dffff04ff0bffff04ffff04ff81b9ff82017980ff808080808080ffff01ff02ff7affff04ff02ffff04ffff02ffff03ffff09ff11ff5880ffff01ff04ff58ffff04ffff02ff76ffff04ff02ffff04ff13ffff04ff29ffff04ffff0bff34ff5b80ffff04ff2bff80808080808080ff398080ffff01ff02ffff03ffff09ff11ff7880ffff01ff02ffff03ffff20ffff02ffff03ffff09ffff0121ffff0dff298080ffff01ff02ffff03ffff09ffff0cff29ff80ff3480ff5c80ffff01ff0101ff8080ff0180ff8080ff018080ffff0109ffff01ff088080ff0180ffff010980ff018080ff0180ffff04ffff02ffff03ffff09ff11ff5880ffff0159ff8080ff0180ffff04ffff02ff26ffff04ff02ffff04ff0dffff04ff0bffff04ff17ff808080808080ff80808080808080ff0180ffff01ff04ff80ffff04ff80ff17808080ff0180ffff02ffff03ff05ffff01ff04ff09ffff02ff56ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff0bff7cffff0bff34ff2880ffff0bff7cffff0bff7cffff0bff34ff2c80ff0580ffff0bff7cffff02ff32ffff04ff02ffff04ff07ffff04ffff0bff34ff3480ff8080808080ffff0bff34ff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ffff04ffff04ff30ffff04ff5fff808080ffff02ff7effff04ff02ffff04ffff04ffff04ff2fff0580ffff04ff5fff82017f8080ffff04ffff02ff26ffff04ff02ffff04ff0bffff04ff05ffff01ff808080808080ffff04ff17ffff04ff81bfffff04ff82017fffff04ffff02ff2affff04ff02ffff04ff8204ffffff04ffff02ff76ffff04ff02ffff04ff09ffff04ff820affffff04ffff0bff34ff2d80ffff04ff15ff80808080808080ffff04ff8216ffff808080808080ffff04ff8205ffffff04ff820bffff808080808080808080808080ff02ff5affff04ff02ffff04ff5fffff04ff3bffff04ffff02ffff03ff17ffff01ff09ff2dffff02ff2affff04ff02ffff04ff27ffff04ffff02ff76ffff04ff02ffff04ff29ffff04ff57ffff04ffff0bff34ff81b980ffff04ff59ff80808080808080ffff04ff81b7ff80808080808080ff8080ff0180ffff04ff17ffff04ff05ffff04ff8202ffffff04ffff04ffff04ff78ffff04ffff0eff5cffff02ff2effff04ff02ffff04ffff04ff2fffff04ff82017fff808080ff8080808080ff808080ffff04ffff04ff20ffff04ffff0bff81bfff5cffff02ff2effff04ff02ffff04ffff04ff15ffff04ffff10ff82017fffff11ff8202dfff2b80ff8202ff80ff808080ff8080808080ff808080ff138080ff80808080808080808080ff018080ffff04ffff01a037bef360ee858133b69d595a906dc45d01af50379dad515eb9518abb7c1d2a7affff04ffff01a09c5172650fd0b9d69ecc4beccc15b656c35e9e855b4cb5233b87dcaca2e2715bffff04ffff01ff02ffff01ff02ffff01ff02ffff03ffff02ff24ffff04ff02ffff04ff17ffff04ff2fff8080808080ffff01ff02ff2effff04ff02ffff04ff03ffff04ffff02ff0bff5f80ffff04ffff10ff17ffff018300a8c080ffff04ffff11ff17ffff018300a8c080ff80808080808080ffff01ff08ffff018e4e3074204630304c204d30304e218080ff0180ffff04ffff01ffffffffff02ffff03ff1bffff01ff02ff20ffff04ff02ffff04ffff02ffff03ffff18ffff0101ff1380ffff01ff0bffff0102ff2bff0580ffff01ff0bffff0102ff05ff2b8080ff0180ffff04ffff04ffff17ff13ffff0181ff80ff3b80ff8080808080ffff010580ff0180ff0bffff0102ffff0bffff0102ffff06ffff05ffff01ffffa04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459aa09dcf97a184f32623d11a73124ceb99a5709b083721e878a16d78f596718ba7b2ffa102a12871fee210fb8619291eaea194581cbd2531e4b23759d225f6806923f63222a102a8d5dd63fba471ebcb1f3e8f7c1e1879b7152a6e7298a91ce119a63400ade7c58080ff0580ffff0bffff0102ff0bffff05ffff05ffff01ffffa04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459aa09dcf97a184f32623d11a73124ceb99a5709b083721e878a16d78f596718ba7b2ffa102a12871fee210fb8619291eaea194581cbd2531e4b23759d225f6806923f63222a102a8d5dd63fba471ebcb1f3e8f7c1e1879b7152a6e7298a91ce119a63400ade7c580808080ffff02ffff03ff05ffff01ff0bffff06ffff06ffff01ffffa04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459aa09dcf97a184f32623d11a73124ceb99a5709b083721e878a16d78f596718ba7b2ffa102a12871fee210fb8619291eaea194581cbd2531e4b23759d225f6806923f63222a102a8d5dd63fba471ebcb1f3e8f7c1e1879b7152a6e7298a91ce119a63400ade7c58080ffff02ff30ffff04ff02ffff04ff09ffff04ffff02ff28ffff04ff02ffff04ff0dff80808080ff808080808080ffff01ff06ffff05ffff01ffffa04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459aa09dcf97a184f32623d11a73124ceb99a5709b083721e878a16d78f596718ba7b2ffa102a12871fee210fb8619291eaea194581cbd2531e4b23759d225f6806923f63222a102a8d5dd63fba471ebcb1f3e8f7c1e1879b7152a6e7298a91ce119a63400ade7c5808080ff0180ff0bffff05ffff06ffff01ffffa04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459aa09dcf97a184f32623d11a73124ceb99a5709b083721e878a16d78f596718ba7b2ffa102a12871fee210fb8619291eaea194581cbd2531e4b23759d225f6806923f63222a102a8d5dd63fba471ebcb1f3e8f7c1e1879b7152a6e7298a91ce119a63400ade7c58080ffff02ff30ffff04ff02ffff04ff05ffff04ffff02ff28ffff04ff02ffff04ff07ff80808080ff808080808080ffffff09ffff01a02104c27dfe62a9533562de04f7036b2ad39b5a2a8f8669ed3f08b373b1d21e70ffff02ff20ffff04ff02ffff04ffff0bffff0101ff0580ffff04ff0bff808080808080ff02ffff03ff17ffff01ff02ff34ffff04ff02ffff04ff05ffff04ffff02ff05ffff04ff0bffff04ff27ff80808080ffff04ff37ff808080808080ffff010b80ff0180ffff02ffff03ff0bffff01ff04ffff02ff05ffff04ff13ff808080ffff02ff2cffff04ff02ffff04ff05ffff04ff1bff808080808080ffff01ff018080ff0180ff02ffff03ffff09ff13ffff015180ffff01ff04ff09ffff04ff0bffff04ff2dff80808080ffff01ff02ffff03ffff09ff13ffff015580ffff01ff04ff09ffff04ff15ffff04ff0bff80808080ffff01ff04ffff04ff0bff0980ffff04ff15ffff04ff2dff8080808080ff018080ff0180ffffffff02ffff03ff05ffff01ff02ffff03ffff21ffff09ff15ff0b80ffff15ff15ff0b8080ffff0105ffff01ff088080ff0180ffff01ff04ffff0151ffff04ff0bff80808080ff0180ff02ffff03ff05ffff01ff02ffff03ffff21ffff09ff15ff0b80ffff20ffff15ff15ff0b808080ffff0105ffff01ff088080ff0180ffff01ff04ffff0155ffff04ff0bff80808080ff0180ffff02ff3affff04ff02ffff04ff03ffff04ffff02ff34ffff04ff02ffff04ffff04ffff0102ffff04ffff04ffff0101ff3c80ffff04ffff04ffff0104ffff04ffff04ffff0101ff0280ffff04ffff0101ff80808080ff80808080ffff04ffff04ff80ffff04ff80ffff04ff80ff80808080ffff04ff05ff808080808080ff8080808080ff04ffff02ff32ffff04ff02ffff04ff5bffff04ff2dff8080808080ffff04ffff02ff22ffff04ff02ffff04ff2bffff04ff15ff8080808080ff138080ffffff02ff2cffff04ff02ffff04ffff04ffff0102ffff04ffff04ffff0101ffff04ffff0102ffff04ffff04ffff0101ff3680ffff04ffff04ffff0104ffff04ffff04ffff0101ff0280ffff04ffff0101ff80808080ff8080808080ffff04ffff04ffff0104ffff04ffff04ffff0101ffff04ff0bff808080ffff04ffff0101ff80808080ff80808080ffff04ff05ff8080808080ff02ffff03ffff09ff13ffff013380ffff01ff02ffff03ffff09ff5bffff01818f80ffff010bffff01ff04ffff0133ffff04ffff02ff38ffff04ff02ffff04ff09ffff04ffff0bffff0101ff0980ffff04ff2bff808080808080ff3b808080ff0180ffff010b80ff0180ffff02ff3effff04ff02ffff04ff03ffff04ffff02ff2affff04ff02ffff04ff0bffff04ff2fffff04ff17ff808080808080ff8080808080ff02ff26ffff04ff02ffff04ff0bffff04ff11ff8080808080ff018080ffff04ffff01a079bd0d6577e7bd10554a375db8948e3453bd89700b2a88fa312fedc70a062ce8ffff04ffff01ff01ffff33ff80ff818fffff02ffff01ff02ffff03ff2fffff01ff0880ffff01ff02ffff03ffff09ff2dff0280ff80ffff01ff088080ff018080ff0180ffff04ffff01a05ee374c3f068fd78a80f3a0e1012da4c9699c4ff2d34bd8602d9f93ab6f032adff018080ff8080ffff33ffa075da6b5fc6a02eafcfbd5c8248f35d30dd683c67565a6a93cf8599acd4ddf31bff830186a0ffffa075da6b5fc6a02eafcfbd5c8248f35d30dd683c67565a6a93cf8599acd4ddf31b808080ff01808080ff0180808080",
      solution:
        "0xffff8465f23e00ffff01ffa0857a934274b8310e703d1df48908f3254b7c11bc0317787c0c37225703936549ffa062d166feb9a39f7360cd27c1600b83604d936abb502a28f072381181fff6aaa8ffa01819c07c17e1fed227f2a11db97f2bb3819baccd29399fb9c3a7b5af6e237c74ffa0ccfc141e20d88e3e8da97c6c4c6b98263c18b62245e44aa04b7a68c7dd14c555ffa02edf8e78b289abc4cafab9940f87b02dee17a47449a45fb4b1bfe43d76e16de2ffa01ef586ba2daeb3baddaf802a9072134cc6c5304c9119a56d1a3597753d0e0fa7ffa029e4ba70f2789068fca1b5ea495f7e1067972f7faf29418592d822e304f90cbeffa0088ad1a3f69cd4e8f7e4167dd78550f5bd414a66d81b84825840b37579cc9204ffa0a7be4c04d423ebd27f2188fd7de28174195d76dba82c8d53fce2851895f51cb2ffa03edb04c42b104302afa003116cd1909cc535375fbee7c5c7ad26e7e5614be72c80ff8080ff80ffa0aeb44700ec185049f9e79e16e3b09428b198cc621ba2b32fb8b1cfc7cdad12d3ffffa05ee374c3f068fd78a80f3a0e1012da4c9699c4ff2d34bd8602d9f93ab6f032adffa0b4e51d50276a3c8a1b3f6a0b2599ddf87907692bda307b35f29386a1d8e034f9ff830186a080ffffa05ee374c3f068fd78a80f3a0e1012da4c9699c4ff2d34bd8602d9f93ab6f032adffa043973d82a6b02b8e735afd8df68287c6f50a26bb09f067c90db0aa0c35264befff830186a080ff80ff8080",
    }

    const spendable = new SpendableAssetCoin(
      originCoinSpend,
      originCoin,
      moonPuzzWith(""),
      getFullMoonForIssueSolution(
        fullMoons[0],
        fullMoons,
        getStandardSolution([
          Program.fromList([
            Program.fromInt(51),
            Program.fromHex(
              "75da6b5fc6a02eafcfbd5c8248f35d30dd683c67565a6a93cf8599acd4ddf31b"
            ),
            Program.fromInt(100000),
            Program.fromList([
              Program.fromHex(
                "75da6b5fc6a02eafcfbd5c8248f35d30dd683c67565a6a93cf8599acd4ddf31b"
              ),
            ]),
          ]),
        ])
      )
    )
    return AssetToken.spend([spendable])[0]
  }

  public static spend(
    spendableAssetCoins: SpendableAssetCoin[]
  ): Array<CoinSpend> {
    if (!spendableAssetCoins.length)
      throw new Error("Missing spendable asset coin.")

    const assetId = spendableAssetCoins[0].assetId

    for (const item of spendableAssetCoins.slice(1)) {
      if (!bytesEqual(item.assetId, assetId))
        throw new Error("Mixed asset ids in spend.")
    }

    const deltas = SpendableAssetCoin.calculateDeltas(spendableAssetCoins)
    const subtotals = SpendableAssetCoin.calculateSubtotals(deltas)

    return spendableAssetCoins.map((spendableAssetCoin, i) => {
      const previous = modNumber(i - 1, spendableAssetCoins.length)
      const next = modNumber(i + 1, spendableAssetCoins.length)

      const previousCoin = spendableAssetCoins[previous]
      const nextCoin = spendableAssetCoins[next]

      const solution = Program.fromList([
        spendableAssetCoin.innerSolution,
        spendableAssetCoin.lineageProof,
        Program.fromBytes(toCoinId(previousCoin.coin)),
        Program.fromList([
          Program.fromHex(
            stripHexPrefix(spendableAssetCoin.coin.parent_coin_info)
          ),
          Program.fromHex(stripHexPrefix(spendableAssetCoin.coin.puzzle_hash)),
          Program.fromInt(spendableAssetCoin.coin.amount),
        ]),
        Program.fromList([
          Program.fromHex(stripHexPrefix(nextCoin.coin.parent_coin_info)),
          Program.fromBytes(nextCoin.innerPuzzle.hash()),
          Program.fromInt(nextCoin.coin.amount),
        ]),
        Program.fromInt(subtotals[i]),
        Program.fromInt(spendableAssetCoin.extraDelta),
      ])

      return {
        coin: spendableAssetCoin.coin,
        puzzle_reveal: spendableAssetCoin.puzzle.serializeHex(),
        solution: solution.serializeHex(),
      }
    })
  }
}

const moonPuzzWith = (syntheticPubKey: string) => {
  const moonPuzzle = puzzles.moonLayer.curry([
    Program.fromBytes(puzzles.moonLayer.hash()),
    puzzles.payToDelegatedOrHidden.curry([
      Program.fromHex(
        stripHexPrefix(
          "0x8cd92dc5b3056f0b7dd54092593c1926e9188c894b3cf7b4109ae37d2d2023db88fe40158bdf8f1da0b87270cdcefcfd"
        )
      ),
    ]),
  ])
  return moonPuzzle
}
