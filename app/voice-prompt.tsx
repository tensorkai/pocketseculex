"use client";

import { useEffect, useId, useRef, useState } from "react";
import "./voice-prompt.css";

function Microphone() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg>;
}

export default function VoicePrompt() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" className="voice-launch" aria-label="Open voice prompt" onClick={() => setOpen(true)}><Microphone/><span>Voice prompt</span></button>
    {open && <VoiceRecorder onClose={() => { setOpen(false); trigger.current?.focus(); }}/>}
  </>;
}

function VoiceRecorder({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, setState] = useState<"idle" | "requesting" | "recording" | "finishing" | "ready">("idle");
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [clip, setClip] = useState<{ url: string; extension: string } | null>(null);
  const alive = useRef(false);
  const busy = useRef(false);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const url = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    alive.current = true;
    dialog.current?.showModal();
    return () => {
      alive.current = false;
      clearInterval(timer.current);
      clearTimeout(deadline.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);

  function discard() {
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null;
    setClip(null);
    setSeconds(0);
    setMessage("");
    setState("idle");
  }

  function stop() {
    if (recorder.current?.state !== "recording") return;
    setState("finishing");
    recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    clearInterval(timer.current);
    clearTimeout(deadline.current);
  }

  async function start() {
    if (busy.current) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage("Microphone recording is unavailable here. Open this site over HTTPS in a supported browser.");
      return;
    }
    busy.current = true;
    setMessage("");
    setState("requesting");
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
      if (!alive.current) { input.getTracks().forEach(track => track.stop()); return; }
      stream.current = input;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      const capture = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
      recorder.current = capture;
      const chunks: Blob[] = [];
      let failed = false;
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      capture.onerror = () => {
        failed = true;
        input.getTracks().forEach(track => track.stop());
        if (alive.current) setMessage("Recording was interrupted. Check your microphone and try again.");
      };
      capture.onstop = () => {
        clearInterval(timer.current);
        clearTimeout(deadline.current);
        input.getTracks().forEach(track => track.stop());
        busy.current = false;
        recorder.current = null;
        stream.current = null;
        if (!alive.current) return;
        const blob = new Blob(chunks, { type: capture.mimeType || chunks[0]?.type || "audio/webm" });
        if (failed || !blob.size) {
          setState("idle");
          if (!failed) setMessage("No audio was captured. Please try again.");
          return;
        }
        if (url.current) URL.revokeObjectURL(url.current);
        url.current = URL.createObjectURL(blob);
        setClip({ url: url.current, extension: blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm" });
        setState("ready");
      };
      capture.start();
      setSeconds(0);
      setState("recording");
      const started = Date.now();
      timer.current = setInterval(() => setSeconds(Math.min(30, Math.floor((Date.now() - started) / 1000))), 250);
      deadline.current = setTimeout(() => { setSeconds(30); stop(); }, 30000);
    } catch (error) {
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
      busy.current = false;
      if (!alive.current) return;
      setState("idle");
      const name = error instanceof DOMException ? error.name : "";
      setMessage(name === "NotAllowedError" ? "Microphone access was denied. Allow microphone access in your browser’s site settings, then try again."
        : name === "NotFoundError" ? "No microphone was found. Connect a microphone and try again."
        : name === "NotSupportedError" ? "This browser cannot capture microphone audio. Try another browser or device."
        : "The microphone could not start. Check whether another app is using it and try again.");
    }
  }

  return <dialog ref={dialog} className="voice-dialog" aria-labelledby={titleId} onClose={onClose}>
    <div className="voice-heading"><span className="voice-icon"><Microphone/></span><button type="button" onClick={() => dialog.current?.close()} aria-label="Close voice prompt">×</button></div>
    <h2 id={titleId}>Your voice prompt</h2>
    <p>Record up to 30 seconds, then listen back.</p>
    <p className="voice-privacy">Audio stays in this browser until you download it. AI replies are not connected yet.</p>
    <div className="voice-status" role="status">{state === "requesting" ? "Waiting for microphone permission…" : state === "recording" ? "Recording — microphone is on" : state === "finishing" ? "Preparing your recording…" : state === "ready" ? "Recording ready to preview" : "Microphone is off"}</div>
    {state === "recording" && <div className="voice-timer" aria-label={`${seconds} seconds recorded`}>{`0:${String(seconds).padStart(2, "0")}`} <span>/ 0:30</span></div>}
    {message && <p className="voice-error" role="alert">{message}</p>}
    {clip && <audio className="voice-playback" controls src={clip.url} aria-label="Preview voice prompt"/>}
    <div className="voice-actions">
      {state === "idle" && <button type="button" className="voice-primary" onClick={() => void start()}><Microphone/> Start recording</button>}
      {state === "recording" && <button type="button" className="voice-primary" onClick={stop}>Stop recording</button>}
      {(state === "requesting" || state === "finishing") && <button type="button" disabled>Please wait…</button>}
      {state === "ready" && clip && <><a className="voice-primary" href={clip.url} download={`voice-prompt.${clip.extension}`}>Download recording</a><button type="button" onClick={discard}>Discard recording</button></>}
    </div>
  </dialog>;
}
