import FlappyBird3DGame from "./FlappyBird3DGame";

interface Props {
  onClose: () => void;
}

export default function FlappyBird3D({ onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
      }}
    >
      <FlappyBird3DGame onClose={onClose} />
    </div>
  );
}
