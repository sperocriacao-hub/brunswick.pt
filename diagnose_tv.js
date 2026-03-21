const fs = require('fs');
const ts = require('typescript');

const file = fs.readFileSync('app/tv/actions.ts', 'utf8');
const sourceFile = ts.createSourceFile('app/tv/actions.ts', file, ts.ScriptTarget.Latest, true);

function analyze(node) {
    if (node.kind === ts.SyntaxKind.CatchClause) {
        console.log("Catch Clause at", sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    }
    ts.forEachChild(node, analyze);
}
analyze(sourceFile);
