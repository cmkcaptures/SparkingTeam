import { useRef, useState } from 'react'

const APP = 'sparkingteam'

function collect() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k.startsWith('sz')) data[k] = localStorage.getItem(k)
  }
  return data
}

export default function Backup() {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: APP, v: 1, saved: new Date().toISOString(), data: collect() }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sparking-zero-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg({ ok: true, t: 'Backup saved to your downloads.' })
  }

  const importData = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (parsed.app !== APP || typeof parsed.data !== 'object') throw new Error('not a backup')
      const games = (() => { try { return JSON.parse(parsed.data.szMatchHistory || '[]').length } catch { return 0 } })()
      if (!window.confirm(`Restore this backup (${games} games)? It replaces the stats currently on this device.`)) return
      for (const k of Object.keys(collect())) localStorage.removeItem(k)
      for (const [k, v] of Object.entries(parsed.data)) if (k.startsWith('sz')) localStorage.setItem(k, v)
      setMsg({ ok: true, t: `Restored ${games} games. Reloading…` })
      setTimeout(() => window.location.reload(), 800)
    } catch {
      setMsg({ ok: false, t: "That file isn't a Sparking Zero backup." })
    }
  }

  return (
    <section className="bk">
      <div>
        <span className="mw__eyebrow">BACKUP</span>
        <p className="bk__text">Your stats live in this browser only. Save a backup now and then so you never lose them.</p>
        {msg && <p className={'bk__msg' + (msg.ok ? '' : ' bk__msg--err')}>{msg.t}</p>}
      </div>
      <div className="bk__btns">
        <button type="button" className="wr__share" onClick={exportData}>⬇ SAVE BACKUP</button>
        <button type="button" className="bk__restore" onClick={() => fileRef.current?.click()}>⬆ RESTORE</button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importData} />
      </div>
    </section>
  )
}
