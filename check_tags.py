import re
import sys

def check_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Simple tag matching logic
    tags = re.findall(r'<(/?)([a-zA-Z0-9]+)(\s|/?>)', content)
    stack = []
    line_numbers = content.split('\n')
    
    # We need to find the line numbers for each tag to report them
    # But for now let's just count.
    
    opening = {}
    closing = {}
    
    for tag in tags:
        is_closing = tag[0] == '/'
        tag_name = tag[1]
        is_self_closing = tag[2].strip() == '/>'
        
        if is_self_closing:
            continue
            
        if is_closing:
            closing[tag_name] = closing.get(tag_name, 0) + 1
        else:
            opening[tag_name] = opening.get(tag_name, 0) + 1
            
    for name in sorted(set(opening.keys()) | set(closing.keys())):
        o = opening.get(name, 0)
        c = closing.get(name, 0)
        if o != c:
            print(f"Tag {name}: {o} opening, {c} closing")

check_file('src/components/Dashboard.tsx')
