import { CARD_HEIGHT, NODE_WIDTH } from '@/utils/flowTransform'

export function getFocusCenter(position, { zoom = 1, coveredRight = 0 } = {}) {
  return {
    x: position.x + NODE_WIDTH / 2 + coveredRight / 2 / zoom,
    y: position.y + CARD_HEIGHT / 2,
  }
}

export const getCoveredRight = (drawerSpace, screenWidth) =>
  drawerSpace < screenWidth * 0.75 ? drawerSpace : 0
