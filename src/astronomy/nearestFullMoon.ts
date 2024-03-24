import fullMoons from "./fullMoons.json"

export const findClosestFullMoon = (
  currentTimestamp: number
): number | null => {
  let left = 0
  let right = fullMoons.length - 1
  let closest = null
  let closestIndex = -1 // Track the index of the closest full moon

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    // Direct comparison to reduce the absolute difference check
    if (
      closest === null ||
      Math.abs(fullMoons[mid] - currentTimestamp) <
        Math.abs(closest - currentTimestamp)
    ) {
      closest = fullMoons[mid]
      closestIndex = mid
    }

    if (fullMoons[mid] < currentTimestamp) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  // Apply the 12-hour rule
  if (closest !== null) {
    const twelveHoursInSeconds = 12 * 60 * 60
    if (
      closest < currentTimestamp &&
      currentTimestamp - closest > twelveHoursInSeconds
    ) {
      // The closest full moon is more than 12 hours in the past, so we attempt to find the next future full moon
      // Using closestIndex+1 to find the next future full moon efficiently
      if (closestIndex + 1 < fullMoons.length) {
        closest = fullMoons[closestIndex + 1]
      } else {
        // If there's no future full moon in the list (we're at the end), then there's no valid closest full moon to return
        closest = null
      }
    }
  }

  return closest
}
