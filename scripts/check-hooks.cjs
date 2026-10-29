// AST-based Rules-of-Hooks checker (early returns before hooks, hooks in conditions/loops)
const ts = require(process.cwd() + "/node_modules/typescript");
const fs = require("fs");
const path = require("path");

const isHookName = (n) => /^use[A-Z0-9]/.test(n);
const hookNameOf = (call) => {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === "React") return e.name.text;
  return null;
};
const isFn = (n) => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n);

const problems = [];

function containsReturn(node) {
  let found = false;
  (function walk(n) {
    if (found) return;
    if (n !== node && isFn(n)) return;
    if (ts.isReturnStatement(n)) { found = true; return; }
    ts.forEachChild(n, walk);
  })(node);
  return found;
}

function checkComponent(name, fnNode, sf, file) {
  const body = fnNode.body;
  if (!body || !ts.isBlock(body)) return;
  let earlyReturnLine = null;
  const report = (call, why) => {
    const { line } = sf.getLineAndCharacterOfPosition(call.getStart());
    problems.push(`${file}:${line + 1}  [${name}] ${hookNameOf(call)}  -> ${why}`);
  };
  const scanHooks = (n, conditional) => {
    if (isFn(n)) return;
    if (ts.isCallExpression(n)) {
      const hn = hookNameOf(n);
      if (hn && isHookName(hn)) {
        if (earlyReturnLine !== null) report(n, `called after early return (line ${earlyReturnLine})`);
        else if (conditional) report(n, "called conditionally / in loop");
      }
    }
    const cond = conditional || ts.isIfStatement(n) || ts.isConditionalExpression(n) || ts.isForStatement(n) ||
      ts.isForOfStatement(n) || ts.isForInStatement(n) || ts.isWhileStatement(n) || ts.isSwitchStatement(n) ||
      (ts.isBinaryExpression(n) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(n.operatorToken.kind));
    ts.forEachChild(n, (c) => scanHooks(c, cond));
  };
  for (const st of body.statements) {
    scanHooks(st, false);
    if (ts.isReturnStatement(st)) break;
    if (containsReturn(st) && !ts.isReturnStatement(st)) {
      const { line } = sf.getLineAndCharacterOfPosition(st.getStart());
      if (earlyReturnLine === null) earlyReturnLine = line + 1;
    }
  }
}

function visit(n, sf, file) {
  let name = null, fnNode = null;
  if (ts.isFunctionDeclaration(n) && n.name) { name = n.name.text; fnNode = n; }
  else if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
    let init = n.initializer;
    if (ts.isCallExpression(init) && init.arguments[0] && isFn(init.arguments[0])) init = init.arguments[0]; // memo/forwardRef
    if (isFn(init)) { name = n.name.text; fnNode = init; }
  }
  if (name && fnNode && (/^[A-Z]/.test(name) || isHookName(name))) checkComponent(name, fnNode, sf, file);
  ts.forEachChild(n, (c) => visit(c, sf, file));
}

function walkDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walkDir(full);
    else if (/\.(tsx|ts)$/.test(f)) {
      const src = fs.readFileSync(full, "utf8");
      const sf = ts.createSourceFile(full, src, ts.ScriptTarget.Latest, true, f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      visit(sf, sf, path.relative(process.cwd(), full));
    }
  }
}

for (const d of process.argv.slice(2)) walkDir(d);
console.log(problems.length ? problems.join("\n") : "OK: no Rules-of-Hooks violations found");
console.log(`\nTotal: ${problems.length}`);
// Chặn build nếu có vi phạm — tránh đưa lỗi React #310/#318 lên production
if (problems.length) process.exit(1);
