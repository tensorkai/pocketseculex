"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DeviceModel from "./device-model";
import AccountLink from "./account-link";
import "./lobby.css";

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
      <div className="portal-links"><AccountLink /><Link className="portal-button" href="/lgu/dashboard"><Icon name="shield" size={16}/> LGU Portal <span>↗</span></Link></div>
    </header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="city-backdrop" />
        <div className="hero-atmosphere" />
        <div className="hero-content">
          <p className="edition-label">PocketSeculex <span>Personal safety, considered.</span></p>
          <h1 id="hero-title">Out in the city.<br /><em>Never on your own.</em></h1>
          <p className="hero-description">A direct line to help, carried on your bag.<br />Meet the personal safety device that connects<br className="desktop-break" /> you with your local emergency responders.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/user/create-account">Get connected <Icon name="arrow" size={18} /></Link>
            <button className="button watch" onClick={() => open("demo")}>How it works <span aria-hidden="true">↗</span></button>
          </div>
          <div className="hero-note"><span className="note-rule" /><span>One device. A more reassuring everyday.</span></div>
        </div>
        <DeviceModel />
        <div className="scene-meta">
          <span>01 / THE EVERYDAY COMPANION</span>
          <span className="prototype-caption">PocketSeculex · Design concept</span>
          <a href="#how-it-works">A closer look <span aria-hidden="true">↓</span></a>
        </div>
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
    <dialog ref={dialog} aria-labelledby="experience-title" onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); dialog.current?.close(); } }} className="experience-dialog" onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}><button className="dialog-close" aria-label="Close experience" onClick={()=>dialog.current?.close()}><Icon name="cross"/></button><div className="eyebrow orange">INTERACTIVE PROTOTYPE</div><h2 id="experience-title">{mode==="user"?"Your safety starts here.":mode==="lgu"?"LGU command center.":"From signal to support."}</h2><p className="demo-notice">Demo only. No emergency alert is sent and no responders are contacted.</p>
      <div className="dialog-tabs"><button aria-pressed={mode!=="lgu"} onClick={()=>setMode("demo")}>User & device</button><button aria-pressed={mode==="lgu"} onClick={()=>setMode("lgu")}>LGU response</button></div>
      {mode==="user" && !registered ? <form onSubmit={e=>{e.preventDefault();setRegistered(true);}} className="profile-form"><label htmlFor="profile-name">Your display name</label><input id="profile-name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={60} pattern=".*\S.*" placeholder="e.g. Alex Santos" autoComplete="given-name"/><p>Use a sample name. This demo profile stays only in this page’s memory.</p><button className="button primary" type="submit">Create demo profile <Icon name="arrow"/></button></form> : <><div className="demo-status" aria-live="polite"><span className="status-dot"/>{step===0?"Demo device ready":step===1?"Demo distress signal received":step===2?"Demo team dispatched":"Demo incident resolved"}<span>PSX–001</span></div>
      {mode==="lgu" ? <div className="dispatch-layout"><div className="demo-map" role="img" aria-label="Illustrative street diagram showing a sample device location and responder route, not a real navigation map"><div className="map-route"/><span className="map-marker"><Icon name="pin"/></span><span className="map-station"><Icon name="shield"/></span><small>MANILA · ILLUSTRATIVE MAP</small></div><div className="brief"><span className="eyebrow orange">SAMPLE SITUATIONAL BRIEF</span><h3>{step===0?"No active demo alerts":`${name || "Sample user"} · Manual SOS`}</h3><p>{step===0?"Simulate a signal to preview the information available to a dispatcher.":"Dual-button distress trigger received at the sample location: 14.5995° N, 120.9842° E. Nature of emergency is unconfirmed. Contact the user and assess before deployment."}</p><small>Illustrative brief · Not generated by a live AI service</small></div></div> : <div className="user-demo"><Icon name="shield" size={38}/><h3>{registered?`You're connected, ${name}.`:"Your everyday lifeline."}</h3><p>Try a simulated dual-button trigger and follow the alert into the LGU dashboard.</p></div>}
      <div className="flow-track" aria-live="polite">{["Ready","Signal received","Team dispatched","Resolved"].map((s,i)=><span key={s} className={i<=step?"complete":""}>{i<step?<Icon name="check" size={14}/>:<b>{i+1}</b>}{s}</span>)}</div><div className="demo-actions">{step===0?<button className="button primary" onClick={()=>setStep(1)}>Simulate SOS <Icon name="bolt" size={17}/></button>:step===1?<button className="button primary" onClick={()=>{if(mode!=="lgu")setMode("lgu");else setStep(2);}}>{mode==="lgu"?"Dispatch demo team":"View in LGU dashboard"}<Icon name="arrow" size={17}/></button>:step===2?<button className="button primary" onClick={()=>setStep(3)}>Mark demo resolved <Icon name="check" size={17}/></button>:<span className="resolved-message"><Icon name="check"/> Demo response completed</span>}<button className="text-button" onClick={()=>setStep(0)}>Reset demo</button></div></>}
    </dialog>
  </>;
}
