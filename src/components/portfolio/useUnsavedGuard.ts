import { useContext, useEffect } from 'react'
import { UNSAFE_NavigationContext } from 'react-router-dom'

const MESSAGE = 'You have unsaved portfolio changes. Leave without saving?'

/** Warn before a refresh, tab close or in-app navigation drops unsaved edits.
 *  The app uses <BrowserRouter>, where useBlocker is unavailable, so in-app
 *  navigation is intercepted on the router's navigator. */
export function useUnsavedGuard(dirty: boolean) {
  const { navigator } = useContext(UNSAFE_NavigationContext)

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', onBeforeUnload)

    const { push, replace } = navigator
    // eslint-disable-next-line react-hooks/immutability -- no blocker API under <BrowserRouter>; restored on cleanup
    navigator.push = (...args: Parameters<typeof push>) => {
      if (window.confirm(MESSAGE)) push(...args)
    }
     
    navigator.replace = (...args: Parameters<typeof replace>) => {
      if (window.confirm(MESSAGE)) replace(...args)
    }
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
       
      navigator.push = push
       
      navigator.replace = replace
    }
  }, [dirty, navigator])
}
