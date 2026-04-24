import re

def check_file(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    stack = []
    
    # Improved regex to handle self-closing tags and ignore attributes
    # This regex is still a bit simple but better.
    tag_re = re.compile(r'<(/?)([a-zA-Z0-9]+)(\s[^>]*?)?(/?)(>|$)')

    for i, line in enumerate(lines):
        line_num = i + 1
        for match in tag_re.finditer(line):
            is_closing = match.group(1) == '/'
            tag_name = match.group(2)
            is_self_closing = match.group(4) == '/'
            
            # Skip common self-closing components and HTML tags
            if is_self_closing:
                continue
            
            # Basic list of tags we know are almost always self-closing in this project
            if tag_name in ['Input', 'img', 'ArrowUpRight', 'CheckCircle2', 'ChevronRight', 'ChevronLeft', 'Copy', 'DollarSign', 'Edit2', 'Eye', 'Folder', 'Globe', 'ImageIcon', 'Layers', 'LayoutDashboard', 'MessageCircle', 'MousePointer2', 'Plus', 'Progress', 'RadioGroupItem', 'RefreshCw', 'Rocket', 'Save', 'SelectValue', 'Settings', 'ShieldCheck', 'SidebarTrigger', 'Switch', 'Target', 'Textarea', 'Trash2', 'TrendingUp', 'Users', 'Video', 'Zap', 'ZapOff', 'Activity', 'FunnelStep', 'KPICard']:
                 if not is_closing:
                    continue

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
