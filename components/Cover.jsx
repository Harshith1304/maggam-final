/* One way to show a cover everywhere (thread banner, swatches, composer):
   either your uploaded photo or one of the bundled illustrations, framed by position + zoom.
   Illustrations are plain cacheable pictures, so pages stay light and navigation stays quick. */
export default function Cover({ motif, dye, cover }) {
  const x = cover?.x ?? 50, y = cover?.y ?? 50, z = cover?.zoom ?? 1;
  const src = cover?.src || `/art/${motif}-${(dye || 'indigo').replace(/^c-/, '')}/`;
  return (
    <div className="cover">
      <div className="cover-in">
        <img
          className="cover-img"
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          style={{ objectPosition: `${x}% ${y}%`, transform: z !== 1 ? `scale(${z})` : undefined, transformOrigin: `${x}% ${y}%` }}
        />
      </div>
    </div>
  );
}
