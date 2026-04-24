import re

def check_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Regex to find all tags, including self-closing ones
    # It handles attributes and whitespace.
    tag_re = re.compile(r'<(/?)([a-zA-Z0-9]+)(?:\s+[^>]*?)?\s*(/?)>', re.DOTALL)
    
    stack = []
    lines = content.split('\n')
    
    # We want to track line numbers
    pos = 0
    for match in tag_re.finditer(content):
        full_tag = match.group(0)
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        is_self_closing = match.group(3) == '/'
        
        # Calculate line number
        line_num = content.count('\n', 0, match.start()) + 1
        
        if is_self_closing:
            continue
            
        # React/JSX specific: some components are always self-closing if they have no children
        # But we can't easily know that. However, common ones like Input, img, etc.
        if tag_name in ['Input', 'img', 'br', 'hr', 'Badge', 'Zap', 'ArrowUpRight', 'CheckCircle2', 'ChevronRight', 'ChevronLeft', 'Copy', 'DollarSign', 'Edit2', 'Eye', 'Folder', 'Globe', 'ImageIcon', 'Layers', 'LayoutDashboard', 'MessageCircle', 'MousePointer2', 'Plus', 'Progress', 'RadioGroupItem', 'RefreshCw', 'Rocket', 'Save', 'Settings', 'ShieldCheck', 'SidebarTrigger', 'Switch', 'Target', 'Textarea', 'Trash2', 'TrendingUp', 'Users', 'Video', 'ZapOff', 'Activity', 'FunnelStep', 'KPICard', 'SelectValue']:
            # In our project, these are almost always self-closing or used with children.
            # If they are used as <Zap /> they are caught by is_self_closing.
            # If they are used as <Zap></Zap> they are not.
            # If they are used as <Zap> they are unbalanced.
            pass

        if is_closing:
            if not stack:
                print(f"Error: Unexpected closing tag </{tag_name}> at line {line_num}")
            else:
                top_tag, top_line = stack.pop()
                if top_tag != tag_name:
                    print(f"Error: Mismatched tag </{tag_name}> at line {line_num} (expected </{top_tag}> from line {top_line})")
        else:
            stack.append((tag_name, line_num))

    for tag_name, line_num in reversed(stack):
        print(f"Error: Unclosed tag <{tag_name}> at line {line_num}")

check_file('src/components/Dashboard.tsx')
