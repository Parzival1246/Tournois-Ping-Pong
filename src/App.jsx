import { useState } from 'react'
import { saveTournament, loadTournament } from './firebase.js'

const generateKey = () => {
  const words = ["ACE","NET","SET","LOB","CUP","PRO","WIN","TOP","BIG","SKY"]
  return `${words[Math.floor(Math.random()*words.length)]}-${Math.floor(1000+Math.random()*9000)}`
}
const generateId = () => Math.random().toString(36).slice(2,9)

export default function App() {
  const [screen, setScreen] = useState('home')
  const [tournament, setTournament] = useState(null)
  const [joinKey, setJoinKey] = useState('')
  const [newName, setNewName] = useState('')
  const [newPlayer, setNewPlayer] = useState('')
  const [matchP1, setMatchP1] = useState('')
  const [matchP2, setMatchP2] = useState('')
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const setT = async (t) => { await saveTournament(t); setTournament(t) }

  const createT = async () => {
    if (!newName.trim()) { setError('Entrez un nom.'); return }
    setLoading(true)
    const t = { key: generateKey(), name: newName.trim(), players: [], matches: [] }
    await setT(t); setScreen('tournament'); setNewName(''); setError(''); setLoading(false)
  }

  const joinT = async () => {
    if (!joinKey.trim()) { setError('Entrez une clé.'); return }
    setLoading(true)
    const t = await loadTournament(joinKey.trim().toUpperCase())
    if (!t) { setError('Tournoi introuvable.'); setLoading(false); return }
    t.players = t.players || []
    t.matches = t.matches || []
    setTournament(t); setScreen('tournament'); setJoinKey(''); setError(''); setLoading(false)
  }

  const addPlayer = async () => {
    if (!newPlayer.trim()) return
    if (tournament.players.find(p => p.name.toLowerCase() === newPlayer.trim().toLowerCase())) {
      setError('Joueur déjà existant.'); return
    }
    await setT({ ...tournament, players: [...tournament.players, { id: generateId(), name: newPlayer.trim(), wins: 0, losses: 0, points: 0, pf: 0, pa: 0 }] })
    setNewPlayer(''); setError('')
  }

  const addMatch = async () => {
    if (!matchP1 || !matchP2) { setError('Sélectionnez deux joueurs.'); return }
    const s1 = score1 !== '' ? parseInt(score1) : null
    const s2 = score2 !== '' ? parseInt(score2) : null
    const hasScore = s1 !== null && s2 !== null
    if (hasScore && s1 === s2) { setError('Pas de match nul au ping pong.'); return }
    const winner = hasScore ? (s1 > s2 ? matchP1 : matchP2) : null
    if (!winner) { setError('Renseignez le score.'); return }
    const loserId = winner === matchP1 ? matchP2 : matchP1
    const updated = {
      ...tournament,
      players: tournament.players.map(p => {
        if (p.id === winner) return { ...p, wins: p.wins+1, points: p.points+1, pf: p.pf+(hasScore?(p.id===matchP1?s1:s2):0), pa: p.pa+(hasScore?(p.id===matchP1?s2:s1):0) }
        if (p.id === loserId) return { ...p, losses: p.losses+1, pf: p.pf+(hasScore?(p.id===matchP1?s1:s2):0), pa: p.pa+(hasScore?(p.id===matchP1?s2:s1):0) }
        return p
      }),
      matches: [{ id: generateId(), p1: matchP1, p2: matchP2, s1, s2, winner, date: new Date().toLocaleDateString('fr-FR') }, ...tournament.matches]
    }
    await setT(updated)
    setMatchP1(''); setMatchP2(''); setScore1(''); setScore2(''); setError('')
  }

  const refresh = async () => {
    if (!tournament) return
    setLoading(true)
    const t = await loadTournament(tournament.key)
    if (t) setTournament(t)
    setLoading(false)
  }

  const pName = (id) => tournament?.players.find(p => p.id === id)?.name || id
  const ranked = tournament ? [...tournament.players].sort((a,b) => {
    if (b.points !== a.points) return b.points - a.points
    const diffA = a.pf - a.pa, diffB = b.pf - b.pa
    if (diffB !== diffA) return diffB - diffA
    return b.pf - a.pf
  }) : []

  const card = { background:'#fff', border:'1px solid #e5e5e5', borderRadius:12, padding:'1.25rem', marginBottom:'1rem' }
  const btnBlue = { background:'#e8f0fe', color:'#1a56db', border:'1px solid #93b4f8', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontWeight:500 }
  const btnGreen = { background:'#e8f5e9', color:'#1b7a3e', border:'1px solid #86c898', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontWeight:500 }

  if (screen === 'home') return (
    <div style={{ maxWidth:600, margin:'2rem auto', padding:'0 1rem' }}>
      <h1 style={{ fontSize:22, fontWeight:600, marginBottom:4 }}>🏓 Tournoi de ping pong</h1>
      <p style={{ color:'#666', fontSize:14, marginBottom:'1.5rem' }}>Créez un tournoi ou rejoignez-en un avec une clé.</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div style={card}>
          <p style={{ fontWeight:500, marginBottom:8 }}>Créer un tournoi</p>
          <input style={{ width:'100%' }} placeholder="Nom du tournoi" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createT()} />
          <button style={{ ...btnBlue, marginTop:10, width:'100%' }} onClick={createT} disabled={loading}>{loading?'...':'Créer'}</button>
        </div>
        <div style={card}>
          <p style={{ fontWeight:500, marginBottom:8 }}>Rejoindre</p>
          <input style={{ width:'100%' }} placeholder="Clé ex: ACE-1234" value={joinKey} onChange={e=>setJoinKey(e.target.value)} onKeyDown={e=>e.key==='Enter'&&joinT()} />
          <button style={{ ...btnGreen, marginTop:10, width:'100%' }} onClick={joinT} disabled={loading}>{loading?'...':'Rejoindre'}</button>
        </div>
      </div>
      {error && <p style={{ color:'red', fontSize:13, marginTop:8 }}>{error}</p>}
    </div>
  )

  return (
    <div style={{ maxWidth:600, margin:'2rem auto', padding:'0 1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600 }}>🏓 {tournament.name}</h1>
          <div style={{ marginTop:6 }}>
            <span style={{ fontSize:13, color:'#666' }}>Clé : </span>
            <span style={{ fontFamily:'monospace', fontSize:18, fontWeight:600, background:'#f0f0f0', padding:'4px 12px', borderRadius:6 }}>{tournament.key}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={refresh} style={{ padding:'6px 10px', borderRadius:8, fontSize:13 }}>🔄</button>
          <button onClick={()=>{setScreen('home');setTournament(null)}} style={{ padding:'6px 10px', borderRadius:8, fontSize:13 }}>← Accueil</button>
        </div>
      </div>

      <div style={card}>
        <p style={{ fontWeight:500, marginBottom:10 }}>Joueurs</p>
        <div style={{ display:'flex', gap:8 }}>
          <input style={{ flex:1 }} placeholder="Nom du joueur" value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPlayer()} />
          <button style={btnBlue} onClick={addPlayer}>Ajouter</button>
        </div>
        {error && <p style={{ color:'red', fontSize:13, marginTop:6 }}>{error}</p>}
      </div>

      {ranked.length > 0 && (
        <div style={card}>
          <p style={{ fontWeight:500, marginBottom:10 }}>Classement</p>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ color:'#888', fontSize:12 }}>
                <th style={{ textAlign:'left', fontWeight:400, padding:'4px' }}>#</th>
                <th style={{ textAlign:'left', fontWeight:400, padding:'4px' }}>Joueur</th>
                <th style={{ textAlign:'center', fontWeight:400, padding:'4px' }}>Pts</th>
                <th style={{ textAlign:'center', fontWeight:400, padding:'4px' }}>V</th>
                <th style={{ textAlign:'center', fontWeight:400, padding:'4px' }}>D</th>
                <th style={{ textAlign:'center', fontWeight:400, padding:'4px' }}>Diff.</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((p,i) => {
                const diff = p.pf - p.pa
                const hasDiff = p.pf > 0 || p.pa > 0
                return (
                  <tr key={p.id} style={{ borderTop:'1px solid #f0f0f0' }}>
                    <td style={{ padding:'8px 4px' }}>{i+1}</td>
                    <td style={{ padding:'8px 4px', fontWeight:i===0?600:400 }}>{p.name}</td>
                    <td style={{ textAlign:'center', padding:'8px 4px', fontWeight:600 }}>{p.points}</td>
                    <td style={{ textAlign:'center', padding:'8px 4px', color:'green' }}>{p.wins}</td>
                    <td style={{ textAlign:'center', padding:'8px 4px', color:'red' }}>{p.losses}</td>
                    <td style={{ textAlign:'center', padding:'8px 4px', fontWeight:500, color: !hasDiff?'#999':diff>0?'green':diff<0?'red':'#999' }}>
                      {hasDiff ? (diff > 0 ? `+${diff}` : diff) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tournament.players.length >= 2 && (
        <div style={card}>
          <p style={{ fontWeight:500, marginBottom:10 }}>Ajouter un résultat</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:8, alignItems:'end', marginBottom:12 }}>
            <div>
              <p style={{ fontSize:12, color:'#888', marginBottom:4 }}>Joueur 1</p>
              <select style={{ width:'100%' }} value={matchP1} onChange={e=>setMatchP1(e.target.value)}>
                <option value="">— Choisir —</option>
                {tournament.players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ textAlign:'center', paddingBottom:6, color:'#888', fontWeight:500 }}>vs</div>
            <div>
              <p style={{ fontSize:12, color:'#888', marginBottom:4 }}>Joueur 2</p>
              <select style={{ width:'100%' }} value={matchP2} onChange={e=>setMatchP2(e.target.value)}>
                <option value="">— Choisir —</option>
                {tournament.players.filter(p=>p.id!==matchP1).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {matchP1 && matchP2 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, padding:'1rem', background:'#f9f9f9', borderRadius:8, marginBottom:12 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>{pName(matchP1)}</div>
                <input type="number" min="0" style={{ width:56, textAlign:'center', fontSize:20, fontWeight:600 }} placeholder="—" value={score1} onChange={e=>setScore1(e.target.value)} />
              </div>
              <span style={{ fontSize:22, color:'#888', paddingTop:18 }}>–</span>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>{pName(matchP2)}</div>
                <input type="number" min="0" style={{ width:56, textAlign:'center', fontSize:20, fontWeight:600 }} placeholder="—" value={score2} onChange={e=>setScore2(e.target.value)} />
              </div>
            </div>
          )}
          <button style={{ ...btnBlue, width:'100%' }} onClick={addMatch} disabled={!matchP1||!matchP2}>
            ✓ Enregistrer
          </button>
          {error && <p style={{ color:'red', fontSize:13, marginTop:6 }}>{error}</p>}
        </div>
      )}

      {tournament.matches.length > 0 && (
        <div style={card}>
          <p style={{ fontWeight:500, marginBottom:10 }}>Historique</p>
          {tournament.matches.map(m => {
            const p1win = m.winner === m.p1
            return (
              <div key={m.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderTop:'1px solid #f0f0f0', fontSize:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:p1win?600:400, color:p1win?'green':'red' }}>{pName(m.p1)}</span>
                  <span style={{ fontFamily:'monospace', background:'#f0f0f0', padding:'2px 10px', borderRadius:6, fontSize:13 }}>{m.s1 !== null ? `${m.s1} – ${m.s2}` : '— – —'}</span>
                  <span style={{ fontWeight:!p1win?600:400, color:!p1win?'green':'red' }}>{pName(m.p2)}</span>
                </div>
                <span style={{ fontSize:12, color:'#888' }}>{m.date}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}