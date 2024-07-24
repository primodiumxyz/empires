import Phaser from "phaser";

export const createPhaserScene = (options: {
  key: string;
  preload?: (scene: Phaser.Scene) => void;
  create?: (scene: Phaser.Scene) => void;
  update?: (scene: Phaser.Scene) => void;
}) => {
  const { preload, create, update, key } = options;
  return class GameScene extends Phaser.Scene {
    constructor() {
      super({ key });
    }

    preload() {
      preload && preload(this);
    }

    create() {
      create && create(this);
    }

    override update(time: number, delta: number) {
      update && update(this);

      this.children.each((child) => {
        child.active && child.update(time, delta);
      });
    }
  };
};

export default createPhaserScene;
