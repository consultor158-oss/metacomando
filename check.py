import re

def check(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # This regex tries to capture tag name and if it's closing or self-closing
    # It ignores attributes.
    tags = re.findall(r'<(/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?\s*(/?)>', content)
    
    stack = []
    # Components that are almost always self-closing in this file
    self_closing = {'Input', 'img', 'br', 'hr', 'Badge', 'Zap', 'ArrowUpRight', 'CheckCircle2', 'ChevronRight', 'ChevronLeft', 'Copy', 'DollarSign', 'Edit2', 'Eye', 'Folder', 'Globe', 'ImageIcon', 'Layers', 'LayoutDashboard', 'MessageCircle', 'MousePointer2', 'Plus', 'Progress', 'RadioGroupItem', 'RefreshCw', 'Rocket', 'Save', 'Settings', 'ShieldCheck', 'SidebarTrigger', 'Switch', 'Target', 'Textarea', 'Trash2', 'TrendingUp', 'Users', 'Video', 'ZapOff', 'Activity', 'FunnelStep', 'KPICard', 'SelectValue'}

    for tag, sc in tags:
        is_closing = tag.startswith('/')
        name = tag.lstrip('/')
        is_sc = sc == '/' or name in self_closing
        
        if is_sc:
            if is_closing:
                print(f"Error: Self-closing tag {name} should not have a closing tag")
            continue
            
        if is_closing:
            if not stack:
                print(f"Error: Unexpected closing tag </{name}>")
                continue
            top = stack.pop()
            if top != name:
                print(f"Error: Mismatched tag </{name}> (expected </{top}>)")
        else:
            stack.append(name)
            
    if stack:
        print(f"Error: Unclosed tags: {stack}")

check('src/components/Dashboard.tsx')
