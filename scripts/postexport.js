// Prepares dist/ for GitHub Pages: SPA fallback for deep links + disable Jekyll (it hides the _expo folder).
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('dist/ ready for GitHub Pages (404.html + .nojekyll)');
