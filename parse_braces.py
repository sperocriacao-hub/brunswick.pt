with open("app/tv/actions.ts", "r") as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # ignore comments roughly (does not handle block comments well but okay)
    stripped = line.split("//")[0]
    for j, c in enumerate(stripped):
        if c == '{':
            stack.append(i + 1)
        elif c == '}':
            if len(stack) > 0:
                stack.pop()
            else:
                print(f"UNMATCHED CLOSING BRACE AT LINE {i + 1}")

if len(stack) > 0:
    for line_num in stack:
        print(f"UNMATCHED OPENING BRACE AT LINE {line_num}")
else:
    print("ALL BRACES MATCH!")
