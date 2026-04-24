import re

def check_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Match tags, ignoring attributes that might contain >
    # This is still not perfect but better.
    # We find <tag and </tag.
    tags = re.finditer(r'<(/?)([a-zA-Z0-9]+)', content)
    
    stack = []
    lines = content.split('\n')
    
    for match in tags:
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        
        # Calculate line number
        line_num = content.count('\n', 0, match.start()) + 1
        
        # Find the end of this tag
        end_pos = content.find('>', match.end())
        if end_pos == -1: continue
        tag_content = content[match.start():end_pos+1]
        is_self_closing = tag_content.endswith('/>') or tag_name in ['Input', 'img', 'br', 'hr', 'Badge', 'Zap', 'ArrowUpRight', 'CheckCircle2', 'ChevronRight', 'ChevronLeft', 'Copy', 'DollarSign', 'Edit2', 'Eye', 'Folder', 'Globe', 'ImageIcon', 'Layers', 'LayoutDashboard', 'MessageCircle', 'MousePointer2', 'Plus', 'Progress', 'RadioGroupItem', 'RefreshCw', 'Rocket', 'Save', 'Settings', 'ShieldCheck', 'SidebarTrigger', 'Switch', 'Target', 'Textarea', 'Trash2', 'TrendingUp', 'Users', 'Video', 'ZapOff', 'Activity', 'FunnelStep', 'KPICard', 'SelectValue']
        
        if is_self_closing:
            if not is_closing: continue
            
        if is_closing:
            if not stack:
                print(f"Excessive closing </{tag_name}> at line {line_num}")
                return
            top_tag, top_line = stack.pop()
            if top_tag != tag_name:
                print(f"Mismatched </{tag_name}> at line {line_num} (expected </{top_tag}> from line {top_line})")
                return
        else:
            stack.append((tag_name, line_num))
            
    if stack:
        print(f"Unclosed {stack[-1][0]} at line {stack[-1][1]}")

find_mismatch.py
find_mismatch.py
