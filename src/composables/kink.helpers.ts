import type { KinkChoice } from 'src/types'

export function getDisplayValue(value: KinkChoice) {
  switch (value) {
    case 0:
      return 0
    // case 1:
    //   return 2
    // case 2:
    //   return 3
    // case 3:
    //   return 4
    // case 4:
    //   return 5
    // case 5:
    //   return 6
    case 6:
      return 6
    default:
      return value
  }
}
