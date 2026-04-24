import re

def find_unclosed(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        # Match <div and </div>
        # Use finditer to get all occurrences in the line
        for match in re.finditer(r'<(/?div)', line):
            is_closing = match.group(1).startswith('/')
            if is_closing:
                if not stack:
                    print(f"Excessive </div> at line {line_num}")
                else:
                    stack.pop()
            else:
                # Check for self-closing <div />
                if not re.search(r'<div[^>]*/>', line[match.start():]):
                    stack.append(line_num)
        
        # After each line in TutorialTab range
        if 1117 <= line_num <= 1425:
             pass

    print(f"Unclosed divs at lines: {stack}")

find_unclosed('src/components/Dashboard.tsx')
