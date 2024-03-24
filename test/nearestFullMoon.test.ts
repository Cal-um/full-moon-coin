import { findClosestFullMoon } from "../src/astronomy/nearestFullMoon"
import fullMoons from "../src/astronomy/fullMoons.json"
import { getFullMoonSolution } from "../src/puzzles/fullMoon"

describe("nearestFullMoon", () => {
  console.log(getFullMoonSolution(fullMoons[0]))
  test("timestamp is more then 12 hours until next full moon", () => {
    // 20 ihours before the next full moon
    const timestamp = fullMoons[10] - 60 * 60 * 20
    const result = findClosestFullMoon(timestamp)
    expect(result).toBe(fullMoons[10])
  })

  test("timestamp is less than 12 hours until next full moon", () => {
    // 10 hours before the next full moon
    const timestamp = fullMoons[10] - 60 * 60 * 10
    const result = findClosestFullMoon(timestamp)
    expect(result).toBe(fullMoons[10])
  })

  test("timestamp is less than 12 hours after previous full moon", () => {
    // 10 hours after the previous full moon
    const timestamp = fullMoons[10] + 60 * 60 * 10
    const result = findClosestFullMoon(timestamp)
    expect(result).toBe(fullMoons[10])
  })

  test("timestamp is 13 hours after previous full moon", () => {
    // 10 hours after the previous full moon
    const timestamp = fullMoons[10] + 60 * 60 * 13
    const result = findClosestFullMoon(timestamp)
    expect(result).toBe(fullMoons[11])
  })
})
