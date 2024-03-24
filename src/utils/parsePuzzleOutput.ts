export const parseOutput = (input: string): string[][] => {
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
