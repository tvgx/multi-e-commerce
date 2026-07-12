import type { BoxDict, ImageSize } from "./api";

export interface OverlayBox {
  box: BoxDict;
  label: string;
  color: string;
}

interface DetectionOverlayProps {
  imageSrc: string;
  imageSize: ImageSize;
  boxes: OverlayBox[];
}

/** Hiển thị 1 ảnh + vẽ đè các bounding box lên trên bằng SVG (viewBox = kích thước gốc của ảnh,
 * nên box luôn khớp đúng vị trí bất kể ảnh hiển thị to/nhỏ thế nào trên trang). */
export function DetectionOverlay({ imageSrc, imageSize, boxes }: DetectionOverlayProps) {
  return (
    <div className="detect-overlay">
      <img src={imageSrc} alt="Ảnh đang test" className="detect-overlay__img" />
      <svg
        className="detect-overlay__svg"
        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
        preserveAspectRatio="none"
      >
        {boxes.map((b, i) => {
          const w = b.box.x_max - b.box.x_min;
          const h = b.box.y_max - b.box.y_min;
          const fontSize = Math.max(12, Math.min(imageSize.width, imageSize.height) * 0.018);
          return (
            <g key={i}>
              <rect x={b.box.x_min} y={b.box.y_min} width={w} height={h} fill="none" stroke={b.color} strokeWidth={Math.max(2, fontSize * 0.18)} />
              <text
                x={b.box.x_min}
                y={Math.max(fontSize, b.box.y_min - 4)}
                fill={b.color}
                fontSize={fontSize}
                fontWeight={700}
                style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
