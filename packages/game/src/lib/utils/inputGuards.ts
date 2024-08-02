export function isValidClick(e: Phaser.Input.Pointer) {
  return (
    e.upElement?.nodeName === "CANVAS" &&
    e.getDuration() <= 250 &&
    e.distance < 25
  );
}

export function isDragging(e: Phaser.Input.Pointer) {
  return (
    e.downElement?.nodeName === "CANVAS" &&
    e.getDuration() > 250 &&
    e.primaryDown
  );
}

export function isValidHover(e: Phaser.Input.Pointer) {
  return !isDragging(e) && !e.primaryDown;
}
