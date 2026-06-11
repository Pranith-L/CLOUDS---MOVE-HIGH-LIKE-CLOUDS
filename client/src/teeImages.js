import blackImg from './assets/black.png'
import blueImg from './assets/blue.png'
import beigeImg from './assets/beige.png'
import whiteImg from './assets/white.png'

export const TEE_IMAGES = {
  black: blackImg,
  blue: blueImg,
  beige: beigeImg,
  white: whiteImg,
}

export function getTeeImage(color) {
  return TEE_IMAGES[color] || TEE_IMAGES.black
}
