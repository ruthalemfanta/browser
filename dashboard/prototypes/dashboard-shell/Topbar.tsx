import { LogOut } from "lucide-react";
import logo from "../../../brand/wonderly-logo.svg";

export function Topbar({ onBrand }: { onBrand?: () => void }) {
  return (
    <header className="topbar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); onBrand?.(); }}>
        <img src={logo} alt="Wonderly" /> <small>Parents</small>
      </a>
      <span className="account">
        <span>sam.okafor@gmail.com</span>
        <button className="ghost"><LogOut size={15} /> Sign out</button>
      </span>
    </header>
  );
}
