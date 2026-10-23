import { useState } from "react";
import { BackgroundPicker, BrowserSurface } from "wonderly-ds";

function Picker({ initial }: { initial: string }) {
  const [value, setValue] = useState({ id: initial, custom: null as string | null });
  return (
    <BrowserSurface style={{ position: "relative", height: 460, background: "#7CCBF4" }}>
      <BackgroundPicker value={value} onChange={setValue} onClose={() => {}} />
    </BrowserSurface>
  );
}

export const SkySelected = () => <Picker initial="sky" />;
export const PatternSelected = () => <Picker initial="dots" />;
