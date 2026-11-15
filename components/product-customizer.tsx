"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { MenuItem } from "@/app/page";

// Where an add-on's reference image lands on the product, in % of the disc.
// Each selected add-on takes the next set so two add-ons never stack exactly.
const PIECE_SETS: [number, number][][] = [
  [[30, 28], [63, 22], [73, 57], [40, 68], [52, 45]],
  [[20, 48], [46, 20], [68, 38], [59, 72], [31, 76]],
  [[40, 34], [76, 30], [25, 62], [55, 58], [72, 76]],
  [[34, 44], [58, 30], [48, 76], [78, 46], [22, 30]],
];

export function ProductCustomizer({
  item,
  image,
  initialVariant,
  initialExtras,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  image: string;
  initialVariant: string;
  initialExtras: string[];
  onClose: () => void;
  onAdd: (variant: string, extras: string[]) => void;
}) {
  const slides = useMemo(
    () =>
      item.variants?.length
        ? item.variants.map((variant) => ({
            name: variant.name,
            image: variant.image_url || image,
            price: item.price + Number(variant.price || 0),
            measure: variant.measure_value ? `${variant.measure_value} ${variant.measure_unit || "g"}` : "",
          }))
        : [{
            name: "",
            image,
            price: item.price,
            measure: item.measure_value ? `${item.measure_value} ${item.measure_unit || "g"}` : "",
          }],
    [item, image],
  );
  const [index, setIndex] = useState(() => Math.max(0, slides.findIndex((slide) => slide.name === initialVariant)));
  const [extras, setExtras] = useState(initialExtras);
  const [closing, setClosing] = useState(false);
  const dragStart = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const many = slides.length > 1;
  const current = slides[index];

  const go = (next: number) => setIndex((next + slides.length) % slides.length);
  const close = () => {
    setClosing(true);
    window.setTimeout(onClose, 320);
  };

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setClosing(true); window.setTimeout(onClose, 320); }
      if (slides.length < 2) return;
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % slides.length);
      if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, slides.length]);

  const availableExtras = item.extras || [];
  const selected = availableExtras.filter((extra) => extras.includes(extra.name));
  const pieces = selected.flatMap((extra) => {
    if (!extra.image_url) return [];
    const set = PIECE_SETS[availableExtras.indexOf(extra) % PIECE_SETS.length];
    return set.map(([x, y], piece) => ({ key: `${extra.name}-${piece}`, image: extra.image_url!, x, y, delay: piece * 70 }));
  });
  const total = current.price + selected.reduce((sum, extra) => sum + Number(extra.price), 0);

  return (
    <div className={`pc-scrim ${closing ? "is-closing" : ""}`} onClick={close}>
      <div
        className="pc-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Customise ${item.title}`}
        onClick={(event) => event.stopPropagation()}
      >
        {slides.map((slide, slideIndex) => (
          <img key={`ambient-${slideIndex}`} src={slide.image} alt="" aria-hidden="true" className={`pc-ambient ${slideIndex === index ? "is-on" : ""}`} />
        ))}
        <div className="pc-body">
          <div className="pc-top">
            <button ref={closeButton} type="button" className="pc-round pc-glass" aria-label="Back to menu" onClick={close}>
              <ChevronDown className="size-5" />
            </button>
            <span className="pc-kicker">{item.category || item.tag} · {item.time} min</span>
            <span className="pc-round" aria-hidden="true" />
          </div>

          <div className="pc-stage-row">
            {many && (
              <button type="button" className="pc-round pc-glass" aria-label="Previous option" onClick={() => go(index - 1)}>
                <ChevronLeft className="size-5" />
              </button>
            )}
            <div
              className="pc-stage"
              onPointerDown={(event) => { dragStart.current = event.clientX; }}
              onPointerCancel={() => { dragStart.current = null; }}
              onPointerUp={(event) => {
                if (dragStart.current === null || !many) return;
                const distance = event.clientX - dragStart.current;
                dragStart.current = null;
                if (distance < -30) go(index + 1);
                else if (distance > 30) go(index - 1);
              }}
            >
              <span className="pc-halo" aria-hidden="true" />
              <div className="pc-spin">
                {slides.map((slide, slideIndex) => (
                  <img
                    key={`disc-${slideIndex}`}
                    src={slide.image}
                    alt={slideIndex === index ? `${item.title}${slide.name ? `, ${slide.name}` : ""}` : ""}
                    draggable={false}
                    className={`pc-disc ${slideIndex === index ? "is-on" : ""}`}
                  />
                ))}
                {pieces.map((piece) => (
                  <img
                    key={piece.key}
                    src={piece.image}
                    alt=""
                    draggable={false}
                    className="pc-piece"
                    style={{ left: `calc(${piece.x}% - 22px)`, top: `calc(${piece.y}% - 22px)`, animationDelay: `${piece.delay}ms` }}
                  />
                ))}
              </div>
            </div>
            {many && (
              <button type="button" className="pc-round pc-glass" aria-label="Next option" onClick={() => go(index + 1)}>
                <ChevronRight className="size-5" />
              </button>
            )}
          </div>

          {many && (
            <div className="pc-dots">
              <div aria-hidden="true">
                {slides.map((_, slideIndex) => <i key={slideIndex} className={slideIndex === index ? "is-on" : ""} />)}
              </div>
              <span>Swipe to change</span>
            </div>
          )}

          <div className="pc-copy" key={index}>
            <h2>{item.title}</h2>
            {current.name && <p className="pc-variant" aria-live="polite">{current.name}{current.measure ? ` · ${current.measure}` : ""}</p>}
            {item.description && <p className="pc-description">{item.description}</p>}
          </div>

          {availableExtras.length > 0 && (
            <div className="pc-extras">
              <span className="pc-kicker">Add on top</span>
              <div className="pc-extras-row">
                {availableExtras.map((extra) => {
                  const on = extras.includes(extra.name);
                  return (
                    <button
                      key={extra.name}
                      type="button"
                      aria-pressed={on}
                      className={`pc-extra pc-glass ${on ? "is-on" : ""}`}
                      onClick={() => setExtras((list) => on ? list.filter((name) => name !== extra.name) : [...list, extra.name])}
                    >
                      {extra.image_url
                        ? <img src={extra.image_url} alt="" />
                        : <span className="pc-extra-blank" aria-hidden="true"><Plus className="size-5" /></span>}
                      <b>{extra.name}</b>
                      <small>+${Number(extra.price).toFixed(2)}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button type="button" className="pc-buy" onClick={() => onAdd(current.name, extras)}>
            Add to order · ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
