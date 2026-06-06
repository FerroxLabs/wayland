
cat-config:
	@base64 -D -i ~/.wayland-config-dev/wayland-config.txt | python3 -c 'import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read()))' | pbcopy
