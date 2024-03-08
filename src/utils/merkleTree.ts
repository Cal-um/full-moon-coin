import { concatBytes, decodeInt, encodeInt, hash256 } from "chia-bls"

const HASH_TREE_PREFIX = encodeInt(2)
const HASH_LEAF_PREFIX = encodeInt(1)

type TupleTree = [TupleTree, TupleTree] | Uint8Array
interface MerkleProofs {
  [key: string]: [number, Uint8Array[]]
}

const sha256 = (...args: Uint8Array[]): Uint8Array =>
  hash256(concatBytes(...args))

const buildMerkleTreeFromBinaryTree = (
  tuples: TupleTree
): [Uint8Array, MerkleProofs] => {
  if (tuples instanceof Uint8Array) {
    const leaf = sha256(HASH_LEAF_PREFIX, tuples)
    return [leaf, { [decodeInt(tuples)]: [0, []] }]
  }

  const [left, right] = tuples
  const [leftRoot, leftProofs] = buildMerkleTreeFromBinaryTree(left)
  const [rightRoot, rightProofs] = buildMerkleTreeFromBinaryTree(right)

  const newRoot = sha256(HASH_TREE_PREFIX, leftRoot, rightRoot)
  const newProofs: MerkleProofs = {}

  Object.entries(leftProofs).forEach(([name, [path, proof]]) => {
    proof.push(rightRoot)
    newProofs[name] = [path, proof]
  })

  Object.entries(rightProofs).forEach(([name, [path, proof]]) => {
    const newPath = path | (1 << proof.length)
    proof.push(leftRoot)
    newProofs[name] = [newPath, proof]
  })

  return [newRoot, newProofs]
}

const listToBinaryTree = (objects: Uint8Array[]): TupleTree => {
  const size = objects.length
  if (size === 1) {
    return objects[0]
  }
  const midpoint = (size + 1) >> 1
  const firstHalf = objects.slice(0, midpoint)
  const lastHalf = objects.slice(midpoint)
  return [listToBinaryTree(firstHalf), listToBinaryTree(lastHalf)]
}

export const buildMerkleTree = (
  objects: Uint8Array[]
): [Uint8Array, MerkleProofs] => {
  const objectsBinaryTree = listToBinaryTree(objects)
  return buildMerkleTreeFromBinaryTree(objectsBinaryTree)
}
