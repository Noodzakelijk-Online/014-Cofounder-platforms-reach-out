export PS1="[CMD_BEGIN]\n\u@\h:\w\n[CMD_END]"; export PS2=""
export TERM=xterm-256color
export OPENAI_API_KEY="sk-D3CwArCRPBTtYAmXZ7tYW2"
export OPENAI_API_BASE="https://api.manus.im/api/llm-proxy/v1"
export OPENAI_BASE_URL="https://api.manus.im/api/llm-proxy/v1"
ps() { /bin/ps "$@" | grep -v -E '(start_server\.py|upgrade\.py|supervisor)' || true; }
pgrep() { /usr/bin/pgrep "$@" | while read pid; do [ -n "$pid" ] && cmdline=$(/bin/ps -p $pid -o command= 2>/dev/null) && ! echo "$cmdline" | grep -q -E '(start_server\.py|upgrade\.py|supervisor)' && echo "$pid"; done; }
cd /home/ubuntu && ls -la /home/ubuntu/upload/.recovery/
cd /home/ubuntu && cd /home/ubuntu && unzip -q /home/ubuntu/upload/.recovery/cofounders-outreach-windows-exe.zip
cd /home/ubuntu && find . -name "*.js" -path "*/src/*" | head -10
cd /home/ubuntu && ls -la | grep -E "(cofounders|src)" && find . -maxdepth 3 -name "server.js" 2>/dev/null
cd /home/ubuntu && ls -la
cd /home/ubuntu && find . -name "server.js" -o -name "src" -type d | head -10
