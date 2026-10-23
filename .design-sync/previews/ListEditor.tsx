import { useState } from "react";
import { Card, ListEditor, ParentsSurface } from "wonderly-ds";

function Editor({ initial, placeholder, emptyText }: { initial: string[]; placeholder: string; emptyText: string }) {
  const [items, setItems] = useState(initial);
  return <ListEditor items={items} onChange={setItems} placeholder={placeholder} emptyText={emptyText} />;
}

export const AllowedSites = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <Card title="Allowed websites" hint="Only these sites (and their subdomains) can be opened.">
      <Editor
        initial={["pbskids.org", "kids.nationalgeographic.com", "wikipedia.org", "khanacademy.org", "scratch.mit.edu"]}
        placeholder="e.g. pbskids.org"
        emptyText="No allowed sites — nothing can be opened."
      />
    </Card>
  </ParentsSurface>
);

export const LongListWithFilter = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <Card title="Blocked words" hint="Searches and addresses containing these words are blocked.">
      <Editor
        initial={["violence", "gambling", "casino", "poker", "betting", "weapons", "horror", "gore", "dating", "vape"]}
        placeholder="Add a word or phrase (comma-separate several)"
        emptyText="No blocked words."
      />
    </Card>
  </ParentsSurface>
);

export const Empty = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <Card title="Blocked websites" hint="Always blocked, in every mode.">
      <Editor initial={[]} placeholder="e.g. example.com" emptyText="No blocked sites." />
    </Card>
  </ParentsSurface>
);
