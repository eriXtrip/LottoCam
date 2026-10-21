import { useEffect, useState } from 'react'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    window.navigator.standalone === true
  )
}

export default function InstallApp() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    function onBeforeInstall(event) {
      event.preventDefault()
      setPromptEvent(event)
    }
    function onInstalled() {
      setInstalled(true)
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || !promptEvent) return null

  async function install() {
    const event = promptEvent
    if (!event) return
    setPromptEvent(null)
    try {
      await event.prompt()
      const choice = await event.userChoice
      if (choice?.outcome === 'accepted') setInstalled(true)
    } catch {
      setInstalled(isStandalone())
    }
  }

  return (
    <button type="button" className="install-btn" onClick={install}>
      Install app
    </button>
  )
}
