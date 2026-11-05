const SITE_NAME = 'Kibo Shop'

/**
 * Sets the browser tab title. React 19 moves a <title> rendered anywhere into <head>.
 * Screen readers announce the new title on navigation, and tabs and history stay readable.
 */
export function PageTitle({ children }: { children: string }) {
  // <title> must receive a single string, so it's built here rather than as JSX children.
  return <title>{`${children} · ${SITE_NAME}`}</title>
}
