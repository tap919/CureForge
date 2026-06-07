const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
// only replace fetch calls, careful about the one inside apiFetch definition:
// apiFetch calls native fetch, so we skip it.
content = content.replace(/fetch\('/g, "apiFetch('");
content = content.replace(/fetch\(\`/g, "apiFetch(`");
fs.writeFileSync('src/App.tsx', content);
