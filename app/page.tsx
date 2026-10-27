"use client";

import { useRef, useState } from "react";

type IconName = "shield" | "arrow" | "pin" | "signal" | "bolt" | "play" | "cross" | "check";
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    shield: <><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    signal: <path d="M5 20v-4m5 4v-8m5 8V8m5 12V4"/>,
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>,
    play: <path d="m9 5 11 7-11 7V5Z"/>,
    cross: <path d="m6 6 12 12M6 18 18 6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Device() {
  const [angle, setAngle] = useState(-24);
  const start = useRef<number | null>(null);
  return <div className="device-experience">
    <div className="device-caption"><span className="tiny-cross">+</span> POCKETSECULEX / PROTOTYPE 01</div>
    <div className="device-stage" onPointerDown={e => { start.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (start.current !== null) { setAngle(a => a + (e.clientX - start.current!) * .45); start.current = e.clientX; } }} onPointerUp={() => start.current = null} onPointerCancel={() => start.current = null}>
      <div className="device" role="img" aria-label="Interactive 3D PocketSeculex concept: graphite box, illuminated screen, two orange SOS buttons, and a woven bag strap" style={{ transform: `rotateX(9deg) rotateY(${angle}deg) rotateZ(-9deg)` }}>
        <div className="strap strap-top"><div className="buckle" /></div><div className="strap strap-bottom" />
        <div className="face back"><span>POCKETSECULEX</span><small>ESP32 · GNSS · LTE<br/>CONCEPT / 001</small></div>
        <div className="face side-left"/><div className="face side-right"><div className="port"/></div><div className="face top"/><div className="face bottom"/>
        <div className="face front"><i className="screw tl"/><i className="screw tr"/><i className="screw bl"/><i className="screw br"/>
          <div className="device-brand"><Icon name="shield" size={17}/> POCKET<span>SECULEX</span></div>
          <div className="screen"><div className="screen-top"><span>GNSS FIX</span><span>▥ 98%</span></div><Icon name="shield" size={43}/><strong>YOU’RE CONNECTED</strong><span className="screen-sub">Ready when it matters.</span><div className="screen-line"/><div className="screen-bottom"><span>14.5995° N<br/>120.9842° E</span><span>LTE <b>●</b></span></div></div>
          <div className="device-buttons"><div>Ⅰ</div><span>PRESS BOTH<br/>FOR SOS</span><div>Ⅱ</div></div><div className="device-footer"><span className="led"/> SYSTEM READY <span className="speaker">||||||||</span></div>
        </div>
      </div>
    </div>
    <div className="device-callout"><span className="callout-line"/><span><b>Built to stay with you.</b><br/>Bag-attached. Always within reach.</span></div>
    <div className="rotate-controls"><button aria-label="Rotate device left" onClick={() => setAngle(a => a - 30)}>↶</button><span>DRAG TO EXPLORE <span className="muted">/</span> 3D CONCEPT</span><button aria-label="Rotate device right" onClick={() => setAngle(a => a + 30)}>↷</button></div>
  </div>;
}

export default function Home() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"user" | "lgu" | "demo">("demo");
  const [step, setStep] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [name, setName] = useState("");
  const [menu, setMenu] = useState(false);
  function open(value: typeof mode) { setMode(value); setStep(0); dialog.current?.showModal(); setMenu(false); }
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header"><a className="brand" href="#" aria-label="PocketSeculex home"><span className="brand-mark"><Icon name="shield" size={25}/></span>Pocket<span>Seculex</span></a>
      <button className="menu-toggle" aria-expanded={menu} aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>☰</button>
      <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation"><a className="active" href="#main" onClick={() => setMenu(false)}>Overview</a><a href="#how-it-works" onClick={() => setMenu(false)}>How it works</a><a href="#technology" onClick={() => setMenu(false)}>Technology</a><a href="#mission" onClick={() => setMenu(false)}>Our mission</a></nav>
      <button className="portal-button" onClick={() => open("lgu")}><Icon name="shield" size={16}/> LGU Portal <span>↗</span></button>
    </header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title"><div className="city-backdrop"/><div className="city-grid"/><div className="hero-atmosphere"/>
        <div className="hero-content"><div className="eyebrow"><span className="status-dot"/> PERSONAL SAFETY. CONNECTED.</div><h1 id="hero-title">A small device.<br/>A stronger<br/><span>line of defense.</span></h1><p className="hero-description">The city never stops. Neither should your safety.<br className="desktop-break"/> Meet PocketSeculex — your direct connection to<br className="desktop-break"/> help, when every second matters.</p>
          <div className="hero-actions"><button className="button primary" onClick={() => open("user")}>Get connected <Icon name="arrow" size={18}/></button><button className="button watch" onClick={() => open("demo")}><span className="play-circle"><Icon name="play" size={13}/></span> See it in action</button></div>
          <div className="hero-note"><Icon name="shield" size={15}/><span>Designed for everyday life. Ready for the unexpected.</span></div>
        </div>
        <Device/>
        <div className="scene-meta"><span><i/> BUILT FOR EVERYDAY JOURNEYS</span><span>YOUR CITY. YOUR SAFETY. YOUR CONNECTION.</span><a href="#how-it-works">SCROLL TO DISCOVER ↓</a></div>
      </section>
      <section className="feature-strip" aria-label="Core capabilities"><div><Icon name="bolt"/><span><b>One deliberate action.</b><small>Dual-button emergency trigger</small></span></div><div><Icon name="pin"/><span><b>Your location. Precisely.</b><small>GNSS-powered positioning</small></span></div><div><Icon name="signal"/><span><b>Connected beyond your phone.</b><small>Dedicated 5G / LTE connectivity</small></span></div><div><Icon name="shield"/><span><b>A clearer path to help.</b><small>AI-assisted LGU response</small></span></div></section>
      <section className="how-section section-wrap" id="how-it-works"><div className="section-heading"><div><div className="eyebrow orange">FROM SIGNAL TO SUPPORT</div><h2>When you need help,<br/>every connection counts.</h2></div><p>One connected ecosystem. From the device on your bag to the responders in your community.</p></div>
        <div className="steps">{[{n:"01",icon:"bolt" as const,title:"Press. Send a signal.",text:"Engage both buttons on your PocketSeculex to initiate a deliberate emergency alert."},{n:"02",icon:"pin" as const,title:"Let your location speak.",text:"GNSS coordinates and your registered profile travel through a dedicated cellular connection."},{n:"03",icon:"shield" as const,title:"Give responders clarity.",text:"An AI-assisted brief helps your LGU assess the alert and plan a direct route to your location."}].map(s=><article key={s.n}><div className="step-top"><span>{s.n}</span><Icon name={s.icon}/></div><h3>{s.title}</h3><p>{s.text}</p></article>)}</div>
        <button className="text-button" onClick={()=>open("demo")}>Explore the response flow <Icon name="arrow" size={17}/></button>
      </section>
      <section className="tech-section section-wrap" id="technology"><div className="tech-visual"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="tech-core"><Icon name="shield" size={50}/></div><span className="orbit-label label-one">GNSS POSITIONING</span><span className="orbit-label label-two">ESP32 CORE</span><span className="orbit-label label-three">5G / LTE UPLINK</span><span className="tech-coordinate">14.5995° N &nbsp; 120.9842° E</span></div><div className="tech-copy"><div className="eyebrow orange">PURPOSE-BUILT TECHNOLOGY</div><h2>Less complexity.<br/>More connection.</h2><p>A focused safety module, built around what matters: a deliberate trigger, precise location, and a direct line to local responders.</p><dl><div><dt>On your bag</dt><dd>ESP32 controller + Quectel cellular module</dd></div><div><dt>In the cloud</dt><dd>Supabase telemetry + Groq-assisted briefs</dd></div><div><dt>At the command center</dt><dd>Live location + Dijkstra and A* route planning</dd></div></dl><span className="concept-note">Proposed architecture · Thesis research prototype</span></div></section>
      <section className="mission section-wrap" id="mission"><div className="eyebrow orange">TWO EXPERIENCES. ONE PURPOSE.</div><h2>Safer journeys.<br/><span>Stronger communities.</span></h2><p>Personal safety shouldn’t end at the edge of your screen. We’re exploring a more direct connection between people and the teams who protect them.</p><div className="mission-actions"><button className="button primary" onClick={()=>open("user")}>Explore user experience <Icon name="arrow" size={18}/></button><button className="button secondary" onClick={()=>open("lgu")}>Explore LGU dashboard ↗</button></div></section>
    </main>
    <footer><a className="brand" href="#"><Icon name="shield"/> PocketSeculex</a><span>A connection that matters.</span><small>PocketSeculex · Thesis prototype</small></footer>
    <dialog ref={dialog} className="experience-dialog" onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}><button className="dialog-close" aria-label="Close experience" onClick={()=>dialog.current?.close()}><Icon name="cross"/></button><div className="eyebrow orange">INTERACTIVE PROTOTYPE</div><h2>{mode==="user"?"Your safety starts here.":mode==="lgu"?"LGU command center.":"From signal to support."}</h2><p className="demo-notice">Demo only. No emergency alert is sent and no responders are contacted.</p>
      <div className="dialog-tabs"><button aria-pressed={mode!=="lgu"} onClick={()=>setMode("demo")}>User & device</button><button aria-pressed={mode==="lgu"} onClick={()=>setMode("lgu")}>LGU response</button></div>
      {mode==="user" && !registered ? <form onSubmit={e=>{e.preventDefault();setRegistered(true);}} className="profile-form"><label htmlFor="profile-name">Your display name</label><input id="profile-name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={60} pattern=".*\S.*" placeholder="e.g. Alex Santos" autoComplete="given-name"/><p>Use a sample name. This demo profile stays only in this page’s memory.</p><button className="button primary" type="submit">Create demo profile <Icon name="arrow"/></button></form> : <><div className="demo-status"><span className="status-dot"/>{step===0?"Demo device ready":step===1?"Demo distress signal received":step===2?"Demo team dispatched":"Demo incident resolved"}<span>PSX–001</span></div>
      {mode==="lgu" ? <div className="dispatch-layout"><div className="demo-map" role="img" aria-label="Illustrative street diagram showing a sample device location and responder route, not a real navigation map"><div className="map-route"/><span className="map-marker"><Icon name="pin"/></span><span className="map-station"><Icon name="shield"/></span><small>MANILA · ILLUSTRATIVE MAP</small></div><div className="brief"><span className="eyebrow orange">SAMPLE SITUATIONAL BRIEF</span><h3>{step===0?"No active demo alerts":`${name || "Sample user"} · Manual SOS`}</h3><p>{step===0?"Simulate a signal to preview the information available to a dispatcher.":"Dual-button distress trigger received at the sample location: 14.5995° N, 120.9842° E. Nature of emergency is unconfirmed. Contact the user and assess before deployment."}</p><small>Illustrative brief · Not generated by a live AI service</small></div></div> : <div className="user-demo"><Icon name="shield" size={38}/><h3>{registered?`You're connected, ${name}.`:"Your everyday lifeline."}</h3><p>Try a simulated dual-button trigger and follow the alert into the LGU dashboard.</p></div>}
      <div className="flow-track" aria-live="polite">{["Ready","Signal received","Team dispatched","Resolved"].map((s,i)=><span key={s} className={i<=step?"complete":""}>{i<step?<Icon name="check" size={14}/>:<b>{i+1}</b>}{s}</span>)}</div><div className="demo-actions">{step===0?<button className="button primary" onClick={()=>setStep(1)}>Simulate SOS <Icon name="bolt" size={17}/></button>:step===1?<button className="button primary" onClick={()=>{if(mode!=="lgu")setMode("lgu");else setStep(2);}}>{mode==="lgu"?"Dispatch demo team":"View in LGU dashboard"}<Icon name="arrow" size={17}/></button>:step===2?<button className="button primary" onClick={()=>setStep(3)}>Mark demo resolved <Icon name="check" size={17}/></button>:<span className="resolved-message"><Icon name="check"/> Demo response completed</span>}<button className="text-button" onClick={()=>setStep(0)}>Reset demo</button></div></>}
    </dialog>
  </>;
}
