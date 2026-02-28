import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const MIN_SIZE = 80;

export default function ImageCropper({ src, onCrop, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [crop, setCrop] = useState(null); // {x, y, w, h} in image coords
  const [drag, setDrag] = useState(null); // {type: 'move'|'nw'|'ne'|'sw'|'se'|'new', ...}
  const [displayScale, setDisplayScale] = useState(1); // image display scale
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 }); // image top-left in canvas

  const CANVAS_W = Math.min(window.innerWidth - 48, 560);
  const CANVAS_H = Math.round(CANVAS_W * 0.75);
  const HANDLE = 10; // handle radius in px

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
      setDisplayScale(scale);
      const ox = (CANVAS_W - img.width * scale) / 2;
      const oy = (CANVAS_H - img.height * scale) / 2;
      setImgOffset({ x: ox, y: oy });
      // Default crop: center 80% of image
      const margin = 0.1;
      setCrop({
        x: img.width * margin,
        y: img.height * margin,
        w: img.width * (1 - margin * 2),
        h: img.height * (1 - margin * 2),
      });
      setImgLoaded(true);
    };
    img.src = src;
  }, [src]); // eslint-disable-line

  // Convert image coords → canvas coords
  const toCanvas = useCallback((ix, iy) => ({
    x: ix * displayScale + imgOffset.x,
    y: iy * displayScale + imgOffset.y,
  }), [displayScale, imgOffset]);

  // Convert canvas coords → image coords
  const toImage = useCallback((cx, cy) => ({
    x: (cx - imgOffset.x) / displayScale,
    y: (cy - imgOffset.y) / displayScale,
  }), [displayScale, imgOffset]);

  const clampCrop = useCallback((c, img) => {
    const x = Math.max(0, Math.min(c.x, img.width - MIN_SIZE));
    const y = Math.max(0, Math.min(c.y, img.height - MIN_SIZE));
    const w = Math.max(MIN_SIZE, Math.min(c.w, img.width - x));
    const h = Math.max(MIN_SIZE, Math.min(c.h, img.height - y));
    return { x, y, w, h };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !crop) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw image
    ctx.drawImage(img, imgOffset.x, imgOffset.y, img.width * displayScale, img.height * displayScale);

    // Dim outside crop
    const c = toCanvas(crop.x, crop.y);
    const cw = crop.w * displayScale;
    const ch = crop.h * displayScale;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(imgOffset.x, imgOffset.y, img.width * displayScale, img.height * displayScale);
    ctx.clearRect(c.x, c.y, cw, ch);
    // Redraw image inside crop
    ctx.drawImage(img,
      crop.x, crop.y, crop.w, crop.h,
      c.x, c.y, cw, ch
    );

    // Crop border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, cw, ch);

    // Rule of thirds grid
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(c.x + cw * i / 3, c.y); ctx.lineTo(c.x + cw * i / 3, c.y + ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c.x, c.y + ch * i / 3); ctx.lineTo(c.x + cw, c.y + ch * i / 3); ctx.stroke();
    }

    // Corner handles
    const handles = [
      { x: c.x, y: c.y }, { x: c.x + cw, y: c.y },
      { x: c.x, y: c.y + ch }, { x: c.x + cw, y: c.y + ch }
    ];
    handles.forEach(h => {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(h.x, h.y, HANDLE, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [crop, displayScale, imgOffset, toCanvas, CANVAS_W, CANVAS_H, HANDLE]);

  useEffect(() => { if (imgLoaded) draw(); }, [imgLoaded, draw]);

  const getHandleAt = (cx, cy) => {
    if (!crop) return null;
    const c = toCanvas(crop.x, crop.y);
    const cw = crop.w * displayScale, ch = crop.h * displayScale;
    const corners = [
      { name: "nw", x: c.x, y: c.y },
      { name: "ne", x: c.x + cw, y: c.y },
      { name: "sw", x: c.x, y: c.y + ch },
      { name: "se", x: c.x + cw, y: c.y + ch },
    ];
    for (const corner of corners) {
      if (Math.hypot(cx - corner.x, cy - corner.y) <= HANDLE + 6) return corner.name;
    }
    // Inside crop = move
    if (cx >= c.x && cx <= c.x + cw && cy >= c.y && cy <= c.y + ch) return "move";
    return null;
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      cx: (src.clientX - rect.left) * scaleX,
      cy: (src.clientY - rect.top) * scaleY,
    };
  };

  const handleDown = (e) => {
    e.preventDefault();
    const { cx, cy } = getPos(e);
    const handle = getHandleAt(cx, cy);
    const img = imgRef.current;
    if (handle) {
      setDrag({ type: handle, startCx: cx, startCy: cy, startCrop: { ...crop } });
    } else {
      // Start new crop
      const ip = toImage(cx, cy);
      if (ip.x >= 0 && ip.x <= img.width && ip.y >= 0 && ip.y <= img.height) {
        setCrop({ x: ip.x, y: ip.y, w: 1, h: 1 });
        setDrag({ type: "new", startIx: ip.x, startIy: ip.y });
      }
    }
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (!drag || !crop) return;
    const { cx, cy } = getPos(e);
    const img = imgRef.current;
    const ip = toImage(cx, cy);

    if (drag.type === "new") {
      const x = Math.min(drag.startIx, ip.x);
      const y = Math.min(drag.startIy, ip.y);
      const w = Math.abs(ip.x - drag.startIx);
      const h = Math.abs(ip.y - drag.startIy);
      setCrop(clampCrop({ x, y, w: Math.max(w, 1), h: Math.max(h, 1) }, img));
      return;
    }

    const dx = (cx - drag.startCx) / displayScale;
    const dy = (cy - drag.startCy) / displayScale;
    const sc = drag.startCrop;

    let next = { ...sc };
    if (drag.type === "move") {
      next.x = sc.x + dx;
      next.y = sc.y + dy;
    } else if (drag.type === "nw") {
      next.x = sc.x + dx; next.y = sc.y + dy;
      next.w = sc.w - dx; next.h = sc.h - dy;
    } else if (drag.type === "ne") {
      next.y = sc.y + dy; next.w = sc.w + dx; next.h = sc.h - dy;
    } else if (drag.type === "sw") {
      next.x = sc.x + dx; next.w = sc.w - dx; next.h = sc.h + dy;
    } else if (drag.type === "se") {
      next.w = sc.w + dx; next.h = sc.h + dy;
    }
    setCrop(clampCrop(next, img));
  };

  const handleUp = () => setDrag(null);

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img || !crop) return;
    const out = document.createElement("canvas");
    const outSize = Math.min(Math.round(crop.w), Math.round(crop.h), 1200);
    out.width = outSize; out.height = Math.round(crop.h * outSize / crop.w);
    out.getContext("2d").drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, out.width, out.height);
    onCrop(out.toDataURL("image/jpeg", 0.85));
  };

  const cursorForHandle = (cx, cy) => {
    const h = getHandleAt(cx, cy);
    if (!h) return "crosshair";
    if (h === "move") return "move";
    if (h === "nw" || h === "se") return "nwse-resize";
    return "nesw-resize";
  };

  return createPortal(
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.9)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", zIndex: 9999, gap: 16, padding: 24
    }}>
      <div style={{ color: "white", fontFamily: "DM Sans", fontSize: "0.85rem", opacity: 0.8, textAlign: "center" }}>
        Arrastra las esquinas para recortar libremente · Arrastra dentro para mover
      </div>
      <canvas
        ref={containerRef}
        style={{ display: "none" }}
      />
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          borderRadius: 12, touchAction: "none",
          maxWidth: "100%",
          cursor: "crosshair"
        }}
        onMouseDown={handleDown}
        onMouseMove={(e) => {
          handleMove(e);
          const { cx, cy } = getPos(e);
          e.currentTarget.style.cursor = cursorForHandle(cx, cy);
        }}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        onTouchEnd={handleUp}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onCancel} style={{
          padding: "10px 24px", borderRadius: 100,
          border: "1.5px solid rgba(255,255,255,0.3)",
          background: "transparent", color: "white",
          fontFamily: "DM Sans", cursor: "pointer"
        }}>Cancelar</button>
        <button onClick={handleCrop} style={{
          padding: "10px 24px", borderRadius: 100, border: "none",
          background: "var(--green-mid)", color: "white",
          fontFamily: "DM Sans", fontWeight: 600, cursor: "pointer"
        }}>✓ Recortar</button>
      </div>
    </div>,
    document.body
  );
}