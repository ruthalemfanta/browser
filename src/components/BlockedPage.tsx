import { ArrowLeft, Clock, Download, House, Lock, ShieldAlert, WifiOff } from "lucide-react";

const COPY: Record<BlockReason, { title: string; body: string }> = {
  "not-allowed": {
    title: "This website needs a grown-up's OK",
    body: "We've sent a request. A grown-up can approve it from the parent dashboard."
  },
  "blocked-site": {
    title: "This website is blocked",
    body: "A grown-up has decided this site isn't for this browser."
  },
  "blocked-word": {
    title: "That search isn't allowed",
    body: "It contains words that are blocked. Try searching for something else!"
  },
  "blocked-content": {
    title: "This page was hidden",
    body: "It contained words that aren't allowed here."
  },
  schedule: {
    title: "Browsing time is over",
    body: "The web is closed right now. Come back during browsing hours!"
  },
  insecure: {
    title: "This page isn't secure",
    body: "Only secure (https) websites can be opened."
  },
  "ip-address": {
    title: "This address isn't allowed",
    body: "Please use a regular website name."
  },
  invalid: {
    title: "That address doesn't look right",
    body: "Check the spelling and try again."
  },
  download: {
    title: "Downloads are turned off",
    body: "Ask a grown-up if you need this file."
  },
  unreachable: {
    title: "This page couldn't open",
    body: "It may be blocked by the family safety filter, or the internet may be down."
  },
  setup: {
    title: "Browser not connected yet",
    body: "A grown-up needs to connect this browser to their parent account."
  }
};

const ICONS: Partial<Record<BlockReason, typeof Lock>> = {
  schedule: Clock,
  download: Download,
  unreachable: WifiOff,
  "not-allowed": Lock
};

export default function BlockedPage({ info, onBack, onHome }: {
  info: BlockInfo;
  onBack: () => void;
  onHome: () => void;
}) {
  const copy = COPY[info.reason] ?? COPY["blocked-site"];
  const Icon = ICONS[info.reason] ?? ShieldAlert;

  return (
    <section className="blocked-page">
      <div className="blocked-card">
        <span className="blocked-icon"><Icon size={30} /></span>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        {info.host && <code>{info.host}</code>}
        <div className="blocked-actions">
          <button onClick={onBack}><ArrowLeft size={16} /> Go back</button>
          <button className="primary" onClick={onHome}><House size={16} /> Home</button>
        </div>
      </div>
    </section>
  );
}
