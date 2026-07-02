const ts = require('./node_modules/typescript');
const fs = require('fs');
const files = ['src/pages/chw/CHWAssessments.tsx','src/pages/chw/RegisterChild.tsx','src/pages/nurse/NurseAssessments.tsx'];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  console.log('FILE', file, 'DIAGNOSTICS', sf.parseDiagnostics.length);
  sf.parseDiagnostics.forEach(d => {
    const { line, character } = sf.getLineAndCharacterOfPosition(d.start);
    console.log(`  ${line+1}:${character+1} ${ts.DiagnosticCategory[d.category]} ${d.code} ${d.messageText}`);
  });
}
