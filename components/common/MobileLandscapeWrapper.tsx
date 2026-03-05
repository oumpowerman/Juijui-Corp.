import React, { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

interface Props {
  isActive: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MobileLandscapeWrapper: React.FC<Props> = ({
  isActive,
  onClose,
  children,
}) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // หลัง rotate width จะกลายเป็น h และ height จะกลายเป็น w
      const scaleFactor = Math.min(w / h, h / w);
      setScale(scaleFactor);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  if (!isActive) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[400] bg-white overflow-hidden">
      <div
        style={{
          width: "100vh",
          height: "100vw",
          transform: `rotate(90deg) translateY(-100%) scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-[410] bg-white shadow-lg p-3 rounded-full border"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <div className="w-full h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileLandscapeWrapper;