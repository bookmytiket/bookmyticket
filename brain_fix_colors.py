import sys

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We want to replace `background: "#000"` with `background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)"`
    content = content.replace('background: "#000"', 'background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)"')
    
    # The tab buttons have `background: mode === ... ? "#000" : "transparent"`
    content = content.replace('? "#000" :', '? "linear-gradient(135deg, #f84464 0%, #c026d3 100%)" :')
    
    with open(filepath, 'w') as f:
        f.write(content)

replace_in_file('/home/raja/bookmyticket/app/signin/page.js')
replace_in_file('/home/raja/bookmyticket/app/signup/page.jsx')

