import type { createCamera } from "@engine/lib/core/createCamera";
import { BoundingBox } from "@engine/lib/core/StaticObjectManager";
import { Coord } from "@engine/lib/types";

const MARGIN = 5;
export class ChunkManager {
  private camera;
  private chunkSize;
  private onEnterChunk;
  private onExitChunk;
  private visibleChunks: Set<string>;
  private knownChunks: Set<string> = new Set();
  private visibleArea: BoundingBox;
  private worldViewUnsub;

  constructor(
    camera: ReturnType<typeof createCamera>,
    chunkSize: number,
    onEnterChunk: (chunkCoord: Coord) => void,
    onExitChunk: (chunkCoord: Coord) => void,
  ) {
    this.camera = camera;
    this.chunkSize = chunkSize;
    this.onEnterChunk = onEnterChunk;
    this.onExitChunk = onExitChunk;
    this.visibleChunks = new Set();
    this.visibleArea = new Phaser.Geom.Rectangle();
    this.worldViewUnsub = camera.worldView$.subscribe(() => this.update());
  }

  getVisibleChunks(): Set<string> {
    return this.visibleChunks;
  }

  isVisibleChunk(chunkCoord: Coord): boolean {
    return this.visibleChunks.has(this.encodeKeyForChunk(chunkCoord));
  }

  isKnownChunk(chunkCoord: Coord): boolean {
    return this.knownChunks.has(this.encodeKeyForChunk(chunkCoord));
  }

  isVisibleBoundingBox(boundingBox: BoundingBox): boolean {
    return Phaser.Geom.Intersects.RectangleToRectangle(boundingBox, this.visibleArea);
  }

  dispose(): void {
    this.worldViewUnsub.unsubscribe();
  }

  encodeKeyForChunk({ x, y }: Coord): string {
    return `${x}:${y}`;
  }

  decodeKeyFromChunk(key: string): Coord {
    const [x, y] = key.split(":").map(Number) as [number, number];
    return { x, y };
  }

  private update(): void {
    const { chunks: currentVisibleChunks, area: currentVisibleArea } = this.getVisible();

    // Find chunks that have just become visible
    currentVisibleChunks.forEach((chunkKey) => {
      if (!this.visibleChunks.has(chunkKey)) {
        this.onEnterChunk(this.decodeKeyFromChunk(chunkKey));
        this.visibleChunks.add(chunkKey);
      }
    });

    // Find chunks that are no longer visible
    this.visibleChunks.forEach((chunkKey) => {
      if (!currentVisibleChunks.has(chunkKey)) {
        this.onExitChunk(this.decodeKeyFromChunk(chunkKey));
        this.visibleChunks.delete(chunkKey);
      }
    });

    this.visibleArea = currentVisibleArea;
    this.knownChunks = new Set([...this.knownChunks, ...currentVisibleChunks]);
  }

  private getVisible(): { chunks: Set<string>; area: Phaser.Geom.Rectangle } {
    const cam = this.camera.phaserCamera;
    const chunks = new Set<string>();

    const startX = Math.floor(cam.worldView.x / this.chunkSize) - MARGIN;
    const startY = Math.floor(cam.worldView.y / this.chunkSize) - MARGIN;
    const endX = Math.ceil((cam.worldView.x + cam.worldView.width) / this.chunkSize) + MARGIN;
    const endY = Math.ceil((cam.worldView.y + cam.worldView.height) / this.chunkSize) + MARGIN;

    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        chunks.add(this.encodeKeyForChunk({ x, y }));
      }
    }

    const area = new Phaser.Geom.Rectangle(
      startX * this.chunkSize,
      startY * this.chunkSize,
      (endX - startX) * this.chunkSize,
      (endY - startY) * this.chunkSize,
    );

    return { chunks, area };
  }
}
