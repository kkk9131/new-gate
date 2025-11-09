'use client';

import { useDesktopStore } from '@/store/desktopStore';
import { Window } from './Window';

export function WindowManager() {
  const windows = useDesktopStore((state) => state.windows);

  return (
    <>
      {windows.map((window) => (
        <Window key={window.id} window={window} />
      ))}
    </>
  );
}
