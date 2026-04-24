import re

def check_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Simple tag matching, but we need to handle > in attributes
    # We search for < and then look for the next > that is NOT inside {}
    pos = 0
    stack = []
    
    while True:
        start = content.find('<', pos)
        if start == -1: break
        
        # Check if it's a comment
        if content[start:start+4] == '<!--':
            pos = content.find('-->', start) + 3
            continue
            
        # Find the end of the tag name
        name_match = re.search(r'([a-zA-Z0-9]+)', content[start+1:])
        if not name_match:
            pos = start + 1
            continue
            
        tag_name = name_match.group(1)
        is_closing = content[start+1] == '/'
        if is_closing:
             tag_name = re.search(r'([a-zA-Z0-9]+)', content[start+2:]).group(1)
        
        # Find the closing > of this tag, ignoring those inside {}
        brace_level = 0
        end = -1
        for i in range(start, len(content)):
            if content[i] == '{': brace_level += 1
            elif content[i] == '}': brace_level -= 1
            elif content[i] == '>' and brace_level == 0:
                end = i
                break
        
        if end == -1: break
        
        tag_full = content[start:end+1]
        is_self_closing = tag_full.endswith('/>')
        
        line_num = content.count('\n', 0, start) + 1
        
        if not is_self_closing:
            if is_closing:
                if not stack:
                    print(f"Error: Unexpected closing tag </{tag_name}> at line {line_num}")
                    return
                top_tag, top_line = stack.pop()
                if top_tag != tag_name:
                    print(f"Error: Mismatched tag </{tag_name}> at line {line_num} (expected </{top_tag}> from line {top_line})")
                    return
            else:
                # Basic list of tags we know are almost always self-closing in this project
                if tag_name not in ['Input', 'img', 'br', 'hr', 'Badge', 'Zap', 'ArrowUpRight', 'CheckCircle2', 'ChevronRight', 'ChevronLeft', 'Copy', 'DollarSign', 'Edit2', 'Eye', 'Folder', 'Globe', 'ImageIcon', 'Layers', 'LayoutDashboard', 'MessageCircle', 'MousePointer2', 'Plus', 'Progress', 'RadioGroupItem', 'RefreshCw', 'Rocket', 'Save', 'Settings', 'ShieldCheck', 'SidebarTrigger', 'Switch', 'Target', 'Textarea', 'Trash2', 'TrendingUp', 'Users', 'Video', 'ZapOff', 'Activity', 'FunnelStep', 'KPICard', 'SelectValue']:
                    stack.append((tag_name, line_num))
        
        pos = end + 1
        
    for tag_name, line_num in reversed(stack):
        print(f"Error: Unclosed tag <{tag_name}> at line {line_num}")

check_file('src/components/Dashboard.tsx')
