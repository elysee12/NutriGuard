import ts from 'typescript';
import fs from 'fs';

const files = [
  'src/pages/chw/RegisterChild.tsx',
  'src/pages/chw/CHWAssessments.tsx',
  'src/pages/nurse/NurseAssessments.tsx'
];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const diags = sf.parseDiagnostics;
  console.log('FILE', file, 'DIAGS', diags.length);
  for (const d of diags) {
    const { line, character } = sf.getLineAndCharacterOfPosition(d.start);
    const message = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
    const start = Math.max(0, d.start - 120);
    const end = Math.min(text.length, d.start + 120);
    const context = text.slice(start, end);
    console.log(`${line + 1}:${character + 1} ${message}`);
    console.log('--- CONTEXT ---');
    console.log(context);
    console.log('--- END CONTEXT ---\n');
  }
}
