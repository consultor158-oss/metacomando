def check_range(filename, start_line, end_line):
    with open(filename, 'r') as f:
        lines = f.readlines()[start_line-1:end_line]
    
    content = "".join(lines)
    import re
    # Simple count of <div> and </div>
    # Ignoring self-closing <div />
    open_divs = len(re.findall(r'<div(?![^>]*/>)', content))
    close_divs = len(re.findall(r'</div>', content))
    print(f"Lines {start_line}-{end_line}: {open_divs} open, {close_divs} close")

check_range('src/components/Dashboard.tsx', 1178, 1258)
check_range('src/components/Dashboard.tsx', 1259, 1382)
