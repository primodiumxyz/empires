import { Animation } from "@engine/lib/types";

export function generateFrames(
  anims: Phaser.Animations.AnimationManager,
  animation: Animation,
): Phaser.Types.Animations.AnimationFrame[] {
  if (animation.prefix && animation.suffix) {
    return anims.generateFrameNames(animation.assetKey, {
      start: animation.startFrame,
      end: animation.endFrame,
      zeroPad: animation.zeroPad,
      prefix: animation.prefix,
      suffix: animation.suffix,
    });
  } else {
    return anims.generateFrameNumbers(animation.assetKey, {
      start: animation.startFrame,
      end: animation.endFrame,
    });
  }
}
