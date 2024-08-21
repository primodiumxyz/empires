import { InterfaceIcons } from "@primodiumxyz/assets";
import { Modal } from "@/components/core/Modal";

export const Leaderboard = () => {
  return (
    <Modal>
      <Modal.Button size="md" tooltip="Top Holders" tooltipDirection="bottom">
        <img
          src={InterfaceIcons.Leaderboard}
          alt="Leaderboard"
          className={`pixel-images w-[1em] scale-150`}
          draggable="false"
        />
      </Modal.Button>
      <Modal.Content>Hello</Modal.Content>
    </Modal>
  );
};
