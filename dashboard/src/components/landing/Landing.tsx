import { useRef, useState, type CSSProperties } from "react";
import Link from "../Link";
import { DOWNLOADS, RELEASES_URL, detectPlatform } from "../../lib/downloads";
import logo from "../../../../brand/wonderly-logo.svg";
import logoLight from "../../../../brand/wonderly-logo-light.svg";
import { BrowserMock } from "./Mocks";
import kidsTablet from "../../../../wonderly-assets/kids-enjoying-tablet-stockcake.jpg";
import teenWin from "../../../../wonderly-assets/surprised-teen-girl-looking-smartphone-pink-background-showing-win-gesture-over-453763850.jpg.webp";
import { useReveal } from "./useReveal";
import "./landing.css";
import "./motion.css";

const HIGHLIGHTS = ["Kid-Safe Search", "Approved Sites", "Blocked Words", "Browsing Hours", "Parent Dashboard"];
const TICKER_SHAPES = ["circle", "square", "diamond"];
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;
const FEATURE_COLORS = ["#FFD84D", "#F3A9E9", "#7CCBF4", "#D9F45F"];

const FEATURES = [
  { title: "Kid-Safe Search", desc: "Google, Bing, DuckDuckGo and YouTube are locked to their strictest safe modes, and a family DNS filter catches the rest." },
  { title: "Approved Sites Only", desc: "Kids open the sites you've approved. Anything new becomes a request you can approve or deny from your phone." },
  { title: "Backgrounds They Choose", desc: "Kids make the new tab their own with colors, patterns or a picture they upload." },
  { title: "Parent Dashboard", desc: "Approve websites, block words, set browsing hours and see what was explored, from anywhere." }
];

const SAFETY = [
  { n: "01", title: "Filtered Search", shape: "circle", bg: "#fff", fill: "#FFD84D" },
  { n: "02", title: "Approved Sites Only", shape: "square", bg: "#F3A9E9", fill: "#D9F45F" },
  { n: "03", title: "Words Kept Out", shape: "diamond", bg: "#7CCBF4", fill: "#F3A9E9" },
  { n: "04", title: "Healthy Browsing Hours", shape: "circle", bg: "#fff", fill: "#7CCBF4" }
];

const STEPS = [
  { n: "1", title: "Create a parent account", desc: "Sign up on this site. It takes a minute." },
  { n: "2", title: "Install Wonderly", desc: "Download the browser for Windows, macOS or Linux and install it on your child's computer." },
  { n: "3", title: "Pair with a code", desc: "Click “Add device” in your dashboard and type the code into Wonderly." }
];

const FAQS = [
  { q: "What ages is Wonderly for?", a: "Wonderly is designed for children aged 5 to 12, with settings you can loosen as they grow." },
  { q: "How does Safe Search work?", a: "Searches are forced into strict SafeSearch, YouTube runs in Restricted Mode, and pages are scanned for words you've blocked before they're shown." },
  { q: "Can I choose which websites my child can visit?", a: "Yes. Use “Approved sites only” for the tightest control, or “Block specific sites” to allow everything except what you list." },
  { q: "Which devices does it work on?", a: "The browser runs on Windows, macOS and Linux computers. The parent dashboard works in any browser, on your phone or computer." },
  { q: "What happens if the internet goes down?", a: "Wonderly keeps enforcing the last settings it received and syncs again as soon as it's back online." }
];

export default function Landing({ signedIn }: { signedIn: boolean }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const dashboardHref = signedIn ? "/dashboard" : "/login";
  const [platform] = useState(detectPlatform);
  const primaryDownload = DOWNLOADS.find(d => d.platform === platform);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  return (
    <div className="lp" ref={root}>
      <header className="lp-header">
        <div className="lp-header-top">
          <button className="lp-burger" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
          <Link to="/" className="lp-logo lp-wobble"><img src={logo} alt="Wonderly" /></Link>
          <div className="lp-header-cta">
            <Link to={dashboardHref} className="lp-btn lp-lime">{signedIn ? "Dashboard" : "Parent Sign In"}</Link>
          </div>
        </div>
        <nav className={`lp-nav ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
          <a href="#features">Features</a>
          <a href="#safety">Safety</a>
          <a href="#start">Get Started</a>
          <a href="#download">Download</a>
          <a href="#faq">FAQ</a>
          <Link to={dashboardHref}>Parents</Link>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-floaters" aria-hidden="true">
          <svg className="fl a" viewBox="0 0 40 40"><polygon points="20,2 25,15 38,15 27,24 31,37 20,29 9,37 13,24 2,15 15,15" fill="#FFD84D" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" /></svg>
          <span className="fl b" />
          <span className="fl c" />
          <svg className="fl d" viewBox="0 0 80 24"><path d="M2 12 Q 12 0 22 12 T 42 12 T 62 12 T 78 12" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" /></svg>
          <span className="fl e" />
          <span className="fl f" />
        </div>
        <div className="lp-wrap">
          <h1 className="lp-rise">Curious Kids, Safe Adventures</h1>
          <div className="lp-giant" aria-label="EXPLORE">
            {[..."EXPLORE"].map((ch, i) => <span key={i} style={stagger(i)}>{ch}</span>)}
          </div>
          <div className="lp-hero-media lp-rise" style={{ animationDelay: ".5s" }}>
            <BrowserMock />
            <figure className="lp-box lp-photo lp-photo-hero">
              <img src={kidsTablet} alt="Four kids smiling at a tablet together" />
              <figcaption className="lp-sticker">● Safe Search on</figcaption>
            </figure>
          </div>
          <div className="lp-hero-foot lp-rise" style={{ animationDelay: ".8s" }}>
            <p>A web browser made for kids. Safe search, approved websites and a parent dashboard, so children can learn, play and explore on their own while grown-ups stay in the loop.</p>
            <div className="lp-actions">
              {primaryDownload
                ? <a href={primaryDownload.href} className="lp-btn lp-lime">Download for {primaryDownload.label} ↓</a>
                : <a href="#download" className="lp-btn lp-lime">Download Wonderly ↓</a>}
              <a href="#features" className="lp-btn">See How It Works</a>
              <Link to={dashboardHref} className="lp-btn lp-pink">Open Parent Dashboard →</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="lp-ticker">
        <div className="lp-track">
          {[0, 1].map(copy => HIGHLIGHTS.map((item, i) => (
            <span key={`${copy}-${item}`} aria-hidden={copy === 1 || undefined}>
              {item}<i className={`lp-tk ${TICKER_SHAPES[i % 3]}`} />
            </span>
          )))}
        </div>
      </div>

      <section id="features" className="lp-section">
        <div className="lp-wrap lp-cols">
          <div className="lp-stack lp-reveal">
            <div className="lp-box lp-pink-bg lp-tall">
              <h2>The Safe Little Corner of the Internet</h2>
              <svg className="lp-spin" viewBox="0 0 40 40"><polygon points="20,2 25,15 38,15 27,24 31,37 20,29 9,37 13,24 2,15 15,15" fill="#FFD84D" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" /></svg>
            </div>
            <p className="lp-lead">A browser with <b>kid-friendly search</b>, big buttons and <b>their own backgrounds</b>, built for ages 5 to 12.</p>
          </div>
          <div className="lp-stack lp-reveal" style={stagger(1)}>
            <div className="lp-tags">
              <span>Safe Search</span>
              <span>Quick Access</span>
              <span className="lp-sky-bg">Fun Backgrounds</span>
              <span>Browsing Hours</span>
              <span className="lp-sky-bg">Parent Dashboard</span>
            </div>
            <div className="lp-box lp-lime-bg lp-stats">
              <div><strong data-count="99">0</strong><span>Sites opened without your OK</span></div>
              <div className="right"><strong>5–<span data-count="5">12</span></strong><span>Ages it's designed for</span></div>
            </div>
          </div>
          <div className="lp-stack lp-reveal" style={stagger(2)}>
            <figure className="lp-box lp-photo lp-photo-teen">
              <img src={teenWin} alt="Excited girl celebrating while looking at her phone" />
              <figcaption className="lp-sticker">Approved! ✓</figcaption>
            </figure>
            <div>
              <div className="lp-ready">Ready to explore?</div>
              <div className="lp-muted">Set up a parent account in under two minutes.</div>
            </div>
            <div><Link to={dashboardHref} className="lp-btn lp-pink">Get Started →</Link></div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-band">
        <div className="lp-wrap">
          <div className="lp-section-head lp-reveal">
            <h2>Everything a Young Explorer Needs</h2>
            <a href="#start" className="lp-btn lp-sky">How to Set Up →</a>
          </div>
          <div className="lp-feature-list">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="lp-reveal from-left" style={stagger(i)}>
                <div className="lp-feature">
                  <span className="lp-feature-n" style={{ background: FEATURE_COLORS[i % 4] }}>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="lp-feature-title">{f.title}</div>
                    <div className="lp-feature-desc">{f.desc}</div>
                  </div>
                  <span className="lp-feature-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="lp-section">
        <div className="lp-wrap lp-safety">
          <div className="lp-safety-copy lp-reveal">
            <div>
              <h2>How We Keep It Safe</h2>
              <p className="lp-lead">Safety is built into every part of Wonderly, from what kids can search to which websites they can open.</p>
            </div>
            <svg className="lp-shield" viewBox="0 0 120 130" aria-hidden="true">
              <path d="M60 6 L108 24 L108 62 C108 94 86 114 60 124 C34 114 12 94 12 62 L12 24 Z" fill="#7CCBF4" stroke="#111" strokeWidth="4.5" strokeLinejoin="round" />
              <path className="check" d="M38 66 L54 82 L84 50" fill="none" stroke="#111" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div><a href="#faq" className="lp-btn lp-sky">Read the FAQ →</a></div>
          </div>
          <div className="lp-safety-grid">
            {SAFETY.map((s, i) => (
              <div key={s.n} className="lp-reveal pop" style={stagger(i)}>
                <div className="lp-box lp-safety-card" style={{ background: s.bg }}>
                  <span className={`lp-shape ${s.shape}`} style={{ background: s.fill }} />
                  <div>{s.n} —<br />{s.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="lp-section lp-band lp-sky-band">
        <div className="lp-wrap">
          <div className="lp-section-head lp-reveal">
            <h2>Up and Running in Three Steps</h2>
            <Link to={dashboardHref} className="lp-btn lp-lime">{signedIn ? "Go to Dashboard →" : "Create Parent Account →"}</Link>
          </div>
          <div className="lp-steps">
            {STEPS.map((step, i) => (
              <div key={step.n} className="lp-reveal pop" style={stagger(i)}>
                <div className="lp-box lp-step">
                  <span className="lp-step-n">{step.n}</span>
                  <div className="lp-feature-title">{step.title}</div>
                  <div className="lp-feature-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className="lp-section">
        <div className="lp-wrap">
          <div className="lp-section-head lp-reveal">
            <h2>Download Wonderly</h2>
            <p className="lp-muted">Free for Windows, macOS and Linux. Install it on your child's computer, then pair it from your dashboard.</p>
          </div>
          <div className="lp-downloads lp-reveal">
            {DOWNLOADS.map(d => (
              <a key={d.href} href={d.href} className={`lp-btn ${d.platform === platform ? "lp-lime" : ""}`}>{d.label} ↓</a>
            ))}
          </div>
          <p className="lp-download-note">
            First launch on macOS: right-click Wonderly in Applications and choose Open. On Windows, click “More info” → “Run anyway”.
            {" "}<a href={RELEASES_URL}>All releases</a>
          </p>
        </div>
      </section>

      <section id="faq" className="lp-section">
        <div className="lp-wrap">
          <div className="lp-section-head lp-reveal">
            <h2>Frequently Asked Questions</h2>
            <p className="lp-muted">Everything parents need to know about keeping kids safe online with Wonderly.</p>
          </div>
          <div className="lp-faqs">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="lp-reveal" style={stagger(i)}>
                  <div className={`lp-faq ${open ? "open" : ""}`}>
                    <button onClick={() => setOpenFaq(open ? -1 : i)} aria-expanded={open}>
                      <span>{f.q}</span>
                      <i>{open ? "▲" : "▼"}</i>
                    </button>
                    {open && <p>{f.a}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-cols">
          <div className="lp-footer-brand">
            <img src={logoLight} alt="Wonderly" />
            <span>A safe browser for curious kids.</span>
            <div className="lp-swatches"><i /><i /><i /></div>
          </div>
          <div><b>Product</b><a href="#features">Safe Search</a><a href="#features">Quick Access</a><a href="#features">Backgrounds</a></div>
          <div><b>Parents</b><Link to={dashboardHref}>Parent Dashboard</Link><a href="#safety">Browsing Hours</a><a href="#safety">Approved Sites</a></div>
          <div><b>Support</b><a href="#download">Download</a><a href="#faq">FAQs</a><a href="#start">Getting Started</a></div>
        </div>
        <div className="lp-footer-giant" aria-hidden="true">{[..."Wonderly"].map((ch, i) => <span key={i}>{ch}</span>)}</div>
        <div className="lp-copy">© {new Date().getFullYear()} Wonderly. All rights reserved.</div>
      </footer>
    </div>
  );
}
