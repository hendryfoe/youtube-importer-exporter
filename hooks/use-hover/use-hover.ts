import { MutableRefObject, useEffect, useState } from 'react';

export function useHover<T extends Element>(ref: MutableRefObject<T>) {
  const [isHovering, setHovering] = useState<boolean>(false);

  const handleMouseOver = () => setHovering(true);
  const handleMouseOut = () => setHovering(false);

  useEffect(
    () => {
      const node = ref.current;
      if (node) {
        node.addEventListener('mouseenter', handleMouseOver);
        node.addEventListener('mouseleave', handleMouseOut);

        return () => {
          node.removeEventListener('mouseenter', handleMouseOver);
          node.removeEventListener('mouseleave', handleMouseOut);
        };
      }
    },
    [ref]
  );

  return isHovering;
}
