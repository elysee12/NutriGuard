from pathlib import Path

files = [
    Path('frontend/src/pages/chw/RegisterChild.tsx'),
    Path('frontend/src/pages/chw/CHWAssessments.tsx'),
    Path('frontend/src/pages/nurse/NurseAssessments.tsx'),
]

pairs = {'(': ')', '[': ']', '{': '}'}
close_to_open = {v: k for k, v in pairs.items()}

for path in files:
    text = path.read_text(encoding='utf-8')
    print('\nFILE:', path)
    stack = []
    in_string = None
    escape = False
    in_line = False
    in_block = False
    for i, ch in enumerate(text):
        if ch == '\n':
            in_line = False
            continue
        if in_line:
            continue
        if in_block:
            if ch == '*' and i + 1 < len(text) and text[i + 1] == '/':
                in_block = False
            continue
        if in_string:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == in_string:
                in_string = None
            continue
        if ch in '"\'`':
            in_string = ch
            continue
        if ch == '/' and i + 1 < len(text) and text[i + 1] == '/':
            in_line = True
            continue
        if ch == '/' and i + 1 < len(text) and text[i + 1] == '*':
            in_block = True
            continue
        if ch in pairs:
            stack.append((ch, i))
        elif ch in close_to_open:
            if stack and stack[-1][0] == close_to_open[ch]:
                stack.pop()
            else:
                print('  mismatch close', repr(ch), 'at index', i, 'line', text.count('\n', 0, i) + 1)
                break
    else:
        print('  stack len', len(stack))
        if stack:
            print('  last open', stack[-1])
    if in_string:
        print('  unterminated string', in_string)
    if in_block:
        print('  unterminated block comment')
    if in_line:
        print('  ended inside line comment')
