import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** A QR code drawn on the device (no QR service is contacted). */
export function QR({ text, label }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  }, [text]);
  // The SVG is generated locally from our own string, not from user HTML.
  return <div className="qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
