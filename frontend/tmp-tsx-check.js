const ts = require('typescript');
const fs = require('fs');
const files = [
  'src/pages/chw/RegisterChild.tsx',
  'src/pages/chw/CHWAssessments.tsx',
  'src/pages/nurse/NurseAssessments.tsx',
];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const diags = src.parseDiagnostics;
  console.log('FILE', file, 'DIAGS', diags.length);
  diags.forEach((d) => {
    const { line, character } = src.getLineAndCharacterOfPosition(d.start);
    const message = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
    console.log(' ', `${line + 1}:${character + 1}`, message);
  });
}
