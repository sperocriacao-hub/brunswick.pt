with open("app/tv/actions.ts", "r") as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    # ignore comments roughly
    stripped = line.split("//")[0]
    for c in stripped:
        if c == '{': depth += 1
        elif c == '}': depth -= 1
    if i >= 800 and i <= 880:
        print(f"{i+1:3d} [{depth:2d}]: {line.rstrip()}")
