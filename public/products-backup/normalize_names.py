import os, re, unicodedata

def clean(name: str) -> str:
    # Normalize unicode, so exotic spaces become consistent
    n = unicodedata.normalize("NFKC", name)

    # Strip leading unicode whitespace and an optional leading single quote
    n = re.sub(r"^\s+'?", "", n)

    # Remove any remaining single quotes anywhere
    n = n.replace("'", "")

    # Replace & with "and"
    n = n.replace("&", "and")

    # Remove parentheses
    n = n.replace("(", "").replace(")", "")

    # Replace ANY run of whitespace (unicode-aware) with a hyphen
    n = re.sub(r"\s+", "-", n)

    # Collapse multiple dashes
    n = re.sub(r"-{2,}", "-", n)

    # Lowercase
    n = n.lower()

    # Strip leading/trailing dashes (if any appeared)
    n = n.strip("-")

    return n

root = "."
# Rename directories first (deepest to top) so child paths don't break
for dirpath, dirnames, filenames in os.walk(root, topdown=False):
    # Directories
    for d in dirnames:
        old = os.path.join(dirpath, d)
        newname = clean(d)
        new = os.path.join(dirpath, newname)
        if new != old:
            # If collision, add a suffix
            if os.path.exists(new):
                base = new
                i = 1
                while os.path.exists(f"{base}-{i}"):
                    i += 1
                new = f"{base}-{i}"
            os.rename(old, new)
    # Files
    for f in filenames:
        old = os.path.join(dirpath, f)
        newname = clean(f)
        new = os.path.join(dirpath, newname)
        if new != old:
            if os.path.exists(new):
                base, ext = os.path.splitext(new)
                i = 1
                while os.path.exists(f"{base}-{i}{ext}"):
                    i += 1
                new = f"{base}-{i}{ext}"
            os.rename(old, new)
