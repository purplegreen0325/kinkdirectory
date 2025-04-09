import { kinkList } from '../data/kinks'
import type { KinkCategory } from '../types'

// Find the highest existing key
let highestKey = -1

kinkList.forEach((category: KinkCategory) => {
  category.kinks.forEach((kink) => {
    if (kink.key !== undefined && kink.key > highestKey) {
      highestKey = kink.key
    }
  })
})

console.log(`Highest key found: ${highestKey}`) 