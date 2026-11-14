import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronDown, Compass, Orbit, Sparkles, Telescope, X, Menu } from 'lucide-react'
import missions from './data/missions.json'
import SpaceModel from './components/SpaceModel'

type Mission = typeof missions[number]
type Answer = { mission: string; choice: string; evidence: string; theme: string }
const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.18 }, transition: { duration: 0.65 } }

function App() {
  const [destination, setDestination] = useState<'All' | 'Moon' | 'Mars'>('All')
  const [selected, setSelected] = useState<Mission>(missions[0])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [choice, setChoice] = useState('')
  const [evidence, setEvidence] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const filtered = useMemo(() => missions.filter(m => destination === 'All' || m.location === destination), [destination])

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileMenu(false)
  }
  const explore = (mission: Mission) => {
    setSelected(mission); setChoice(''); setEvidence(''); goTo('object')
  }
  const submitAnswer = () => {
    if (!choice || !evidence) return
    setAnswers(prev => [...prev.filter(a => a.mission !== selected.id), { mission: selected.id, choice, evidence, theme: selected.theme }])
    goTo('echo')
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#home" onClick={e => { e.preventDefault(); goTo('home') }}><span className="brand-mark"><Orbit size={18}/></span><span>ABNF<span className="brand-dot">.</span></span></a>
      <nav className={mobileMenu ? 'nav open' : 'nav'}>
        <button onClick={() => goTo('destinations')}>Destinations</button>
        <button onClick={() => goTo('gallery')}>The machines</button>
        <button onClick={() => goTo('timeline')}>Timeline</button>
        <button onClick={() => goTo('echo')}>Question Echo</button>
      </nav>
      <button className="menu-btn" aria-label="Toggle navigation" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X/> : <Menu/>}</button>
      <button className="nav-cta" onClick={() => goTo('gallery')}>Start exploring <ArrowUpRight size={15}/></button>
    </header>

    <main>
      <section className="hero scene" id="home">
        <div className="hero-stars" />
        <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse"/> NASA SPACE APPS CHALLENGE · 2026</div>
          <h1>ABANDONED<br/><em>BUT NOT</em><br/>FORGOTTEN<span className="hero-period">.</span></h1>
          <p className="hero-tagline">The mission ended. <strong>The questions didn't.</strong></p>
          <p className="hero-description">Across the Moon and Mars, machines remain where history happened. Meet the explorers, uncover what they taught us, and decide what we should ask next.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => goTo('destinations')}>Begin the journey <ArrowRight size={17}/></button>
            <button className="btn btn-ghost" onClick={() => goTo('gallery')}>Meet the machines <ArrowDown size={16}/></button>
          </div>
          <div className="hero-meta"><span><b>03</b> FEATURED MACHINES</span><i/><span><b>02</b> WORLDS</span><i/><span><b>01</b> BIG QUESTION</span></div>
        </div>
        <div className="hero-planet mars-planet"><span/></div>
        <div className="hero-planet moon-planet"><span/></div>
        <div className="hero-caption"><span>FIG. 01</span> / THE LEGACY OF EXPLORATION</div>
        <div className="scroll-cue"><span/> SCROLL TO EXPLORE</div>
      </section>

      <section className="intro-section section-pad" id="destinations">
        <motion.div {...fade} className="section-heading">
          <div className="eyebrow">01 / CHOOSE YOUR WORLD</div>
          <h2>Two worlds.<br/><em>Countless questions.</em></h2>
          <p>NASA sent machines to places humans could barely reach. Choose a world and discover what its silent explorers left behind.</p>
        </motion.div>
        <div className="destination-grid">
          <button className={`destination-card moon-card ${destination === 'Moon' ? 'active' : ''}`} onClick={() => { setDestination('Moon'); goTo('gallery') }}>
            <div className="destination-art moon-art"><div className="moon-sphere"/><div className="moon-shadow"/></div>
            <div className="destination-content"><span className="eyebrow">01 / EARTH'S NEIGHBOUR</span><h3>The Moon</h3><p>Where humans drove farther, explored more, and left their wheels behind.</p><span className="destination-link">Explore lunar legacy <ArrowUpRight size={16}/></span></div>
          </button>
          <button className={`destination-card mars-card ${destination === 'Mars' ? 'active' : ''}`} onClick={() => { setDestination('Mars'); goTo('gallery') }}>
            <div className="destination-art mars-art"><div className="mars-sphere"/><div className="mars-shadow"/></div>
            <div className="destination-content"><span className="eyebrow">02 / THE RED PLANET</span><h3>Mars</h3><p>Where robotic explorers searched for water and tested the skies.</p><span className="destination-link">Explore Martian legacy <ArrowUpRight size={16}/></span></div>
          </button>
        </div>
        <button className="text-link reset-link" onClick={() => { setDestination('All'); goTo('gallery') }}>View all machines <ArrowRight size={15}/></button>
      </section>

      <section className="gallery-section section-pad" id="gallery">
        <div className="section-topline"><span className="eyebrow">02 / THE EQUIPMENT GALLERY</span><span className="mono-note">FIELD RECORDS · 001—003</span></div>
        <div className="gallery-heading"><h2>Meet the <em>machines.</em></h2><p>Every explorer had a purpose. Every journey left a legacy.</p></div>
        <div className="filter-row" aria-label="Filter machines by destination">
          {(['All', 'Moon', 'Mars'] as const).map(d => <button key={d} className={destination === d ? 'filter active' : 'filter'} onClick={() => setDestination(d)}>{d === 'All' ? 'All missions' : d}</button>)}
        </div>
        <div className="machine-grid">
          {filtered.map((m, i) => <motion.article key={m.id} className="machine-card" {...fade}>
            <div className={`machine-visual visual-${m.id}`}>
              <div className="visual-grid"/><div className="visual-orb"/>
              <span className="machine-number">0{i+1}</span><span className="visual-location">{m.location.toUpperCase()}</span>
              <div className="machine-silhouette">{m.id === 'ingenuity' ? '✣' : m.id === 'lrv' ? '⌁' : '◈'}</div>
            </div>
            <div className="machine-info">
              <div className="card-kicker">{m.mission}</div><h3>{m.name}</h3>
              <p>{m.purpose}</p>
              <div className="machine-status"><span className="status-dot"/> {m.status}</div>
              <button className="card-link" onClick={() => explore(m)}>Explore this machine <ArrowUpRight size={16}/></button>
            </div>
          </motion.article>)}
        </div>
      </section>

      <section className="object-section section-pad" id="object">
        <div className="section-topline"><span className="eyebrow">03 / OBJECT EXPLORER</span><span className="mono-note">INTERACTIVE MODEL · DRAG TO ROTATE</span></div>
        <div className="object-layout">
          <div className="object-visual">
            <div className="object-label"><span className="status-dot"/> ARCHIVE OBJECT / {selected.location.toUpperCase()}</div>
            <SpaceModel id={selected.id}/>
            <div className="model-foot"><span>CONCEPTUAL 3D MODEL</span><span>ROTATE · ZOOM</span></div>
          </div>
          <div className="object-copy">
            <div className="eyebrow">THE MACHINE / {selected.mission}</div>
            <h2>{selected.name.split(' ').slice(0, -1).join(' ')} <em>{selected.name.split(' ').slice(-1)}</em></h2>
            <div className="object-status">{selected.status}</div>
            <p className="object-purpose">{selected.purpose}</p>
            <div className="fact-grid">
              <div><span>DESTINATION</span><b>{selected.location}</b></div>
              <div><span>MISSION</span><b>{selected.mission}</b></div>
              <div><span>KEY DATE</span><b>{selected.date}</b></div>
              <div><span>STATUS</span><b>Mission complete</b></div>
            </div>
            <button className="btn btn-primary" onClick={() => goTo('story')}>Enter the story <ArrowDown size={16}/></button>
          </div>
        </div>
      </section>

      <section className="story-section section-pad" id="story">
        <div className="story-header"><div className="eyebrow">04 / THE MISSION STORY</div><h2>Every machine<br/>has a <em>story.</em></h2></div>
        <div className="story-timeline">
          {['Meet the machine', 'Why NASA sent it', 'The journey', 'What it discovered', 'What happened', 'The legacy'].map((step, i) => <motion.div className="story-row" key={step} {...fade}>
            <div className="story-index">0{i+1}</div><div className="story-marker"/><div className="story-text"><h3>{step}</h3><p>{selected.story[Math.min(i === 0 ? 0 : i < 3 ? 1 : 2, selected.story.length - 1)]}</p></div>
          </motion.div>)}
        </div>
      </section>

      <section className="evidence-section section-pad" id="evidence">
        <div className="section-topline"><span className="eyebrow">05 / SCIENTIFIC EVIDENCE DESK</span><span className="mono-note">FACTS · INTERPRETATION · OPEN QUESTIONS</span></div>
        <div className="evidence-intro"><h2>Know what we know.<br/><em>Respect what we don't.</em></h2><p>Science is not only about answers. It is also about being honest about the evidence and the mysteries that remain.</p></div>
        <div className="evidence-list">
          {selected.evidence.map((e, i) => <article className="evidence-card" key={i}>
            <div className={`evidence-tag tag-${i}`}>{e.label}</div><p>{e.text}</p><span className="evidence-source">SOURCE: {e.source}</span>
          </article>)}
        </div>
        <p className="evidence-note"><Sparkles size={15}/> An unknown is not a failure. It is an invitation to investigate.</p>
      </section>

      <section className="timeline-section section-pad" id="timeline">
        <div className="eyebrow">06 / CONNECTING THE MISSIONS</div><h2>A timeline of <em>curiosity.</em></h2>
        <p className="timeline-sub">Different worlds. Different decades. One continuing story of exploration.</p>
        <div className="timeline-track">
          <div className="timeline-line"/>
          {[
            {year:'1971',label:'Apollo 15',detail:'First Lunar Roving Vehicle driven on the Moon',world:'MOON'},
            {year:'1972',label:'Apollo 16 & 17',detail:'Two more lunar rovers extend exploration',world:'MOON'},
            {year:'2004',label:'Opportunity',detail:'A rover begins a journey that lasts almost 15 years',world:'MARS'},
            {year:'2021',label:'Ingenuity',detail:'First powered, controlled flight on another planet',world:'MARS'},
            {year:'2024',label:'Ingenuity mission ends',detail:'72 flights become a new chapter in exploration',world:'MARS'}
          ].map((t,i) => <div className="timeline-event" key={t.year+t.label}><div className="timeline-dot"/><div className="timeline-year">{t.year}</div><h3>{t.label}</h3><p>{t.detail}</p><span>{t.world}</span></div>)}
        </div>
      </section>

      <section className="question-section section-pad" id="question">
        <div className="question-kicker"><Telescope size={18}/> YOUR TURN, EXPLORER</div>
        <div className="question-layout">
          <div><div className="eyebrow">07 / WHAT WOULD YOU INVESTIGATE NEXT?</div><h2>{selected.openQuestion.prompt}</h2><p>There is no score and no single correct answer. Choose the question you would send into the future.</p></div>
          <div className="question-controls">
            <div className="choice-list">{selected.openQuestion.choices.map((c,i) => <button key={c} className={choice === c ? 'choice selected' : 'choice'} onClick={() => setChoice(c)}><span>0{i+1}</span>{c}<span className="choice-radio"/></button>)}</div>
            <label className="select-label" htmlFor="evidence-select">WHAT EVIDENCE OR INSTRUMENT WOULD HELP?</label>
            <select id="evidence-select" value={evidence} onChange={e => setEvidence(e.target.value)}>
              <option value="">Choose your evidence</option>
              {selected.openQuestion.evidenceOptions.map(o => <option key={o}>{o}</option>)}
            </select>
            <button className="btn btn-primary submit-question" disabled={!choice || !evidence} onClick={submitAnswer}>Send your question into the future <ArrowRight size={16}/></button>
            <p className="privacy-note">Your choice stays in this browser session. No account. No personal data.</p>
          </div>
        </div>
      </section>

      <section className="echo-section section-pad" id="echo">
        <div className="echo-head"><div><div className="eyebrow">08 / QUESTION ECHO CONSTELLATION</div><h2>Your questions<br/>become <em>stars.</em></h2></div><div className="echo-count"><b>{answers.length.toString().padStart(2,'0')}</b><span>QUESTIONS<br/>IN THIS SESSION</span></div></div>
        <div className="constellation">
          <div className="constellation-glow"/>
          {Array.from({length:24},(_,i)=><span key={i} className={`star star-${i%6}`} style={{left:`${(i*37+9)%94}%`,top:`${(i*53+13)%88}%`}}/>)}
          {answers.length === 0 ? <div className="empty-echo"><Sparkles size={24}/><p>Your constellation is waiting.</p><span>Choose an investigation above to place your first star.</span></div> :
            <div className="answer-stars">{answers.map((a,i)=><div className="answer-star" key={a.mission}><span>✦</span><b>{a.choice}</b><small>{a.theme} · {a.evidence}</small></div>)}</div>}
        </div>
        {answers.length > 0 && <button className="text-link" onClick={() => goTo('closing')}>See your reflection <ArrowRight size={15}/></button>}
      </section>

      <section className="closing-section section-pad" id="closing">
        <div className="closing-orb"/>
        <div className="eyebrow">09 / FINAL REFLECTION</div>
        <h2>A mission may end.<br/>A machine may fall silent.<br/><em>But every discovery creates another question.</em></h2>
        <p className="closing-sub">Remember the machines. Celebrate the discoveries. Question the unknown.</p>
        <div className="closing-answers">
          <h3>Your questions for the future</h3>
          {answers.length === 0 ? <p>Your ideas will appear here when you submit an Open Question.</p> : answers.map(a=><div className="closing-answer" key={a.mission}><span>✦</span><div><b>{missions.find(m=>m.id===a.mission)?.name}</b><p>{a.choice} — investigate with {a.evidence.toLowerCase()}.</p></div></div>)}
        </div>
        <div className="source-panel"><h3>Mission sources & credits</h3><p>Mission facts in this experience are linked to NASA mission pages and official NASA resources. The 3D objects are simplified conceptual models created for this educational demo, not official NASA CAD models.</p>
          <div className="source-links">{missions.flatMap(m=>m.sources).map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title} <ArrowUpRight size={13}/></a>)}</div>
        </div>
        <button className="btn btn-primary back-top" onClick={() => goTo('home')}>Return to the beginning <ArrowUpRight size={16}/></button>
      </section>
    </main>
    <footer><span>ABNF<span className="brand-dot">.</span> / NASA SPACE APPS 2026</span><span>THE MISSION ENDED. THE QUESTIONS DIDN'T.</span><a href="https://www.nasa.gov/" target="_blank" rel="noreferrer">NASA <ArrowUpRight size={12}/></a></footer>
  </div>
}
export default App
