# src/voynich_pipeline/decoder.py
import json, importlib.util, os, re

def load_key(key_path):
    if not os.path.exists(key_path):
        raise FileNotFoundError(f"Private key not found: {key_path}")
    with open(key_path, "r") as f:
        return json.load(f)

def maybe_import_module(mod_name, search_paths):
    for p in search_paths:
        cand = os.path.join(p, f"{mod_name}.py")
        if os.path.exists(cand):
            spec = importlib.util.spec_from_file_location(mod_name, cand)
            m = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(m)
            return m
    return None

def apply_substitution(text, mapping, post_rules=None):
    out = []
    for ch in text:
        out.append(mapping.get(ch, ch))
    out = "".join(out)
    if post_rules:
        for src, dst in post_rules:
            out = out.replace(src, dst)
    return out

def decode_text(text, key_cfg, extra_paths):
    """
    text: raw transliteration string (or glyph string if you have it)
    key_cfg: parsed key.json
    extra_paths: list of paths to look for 'voynich_decoder.py' or others
    """
    typ = key_cfg.get("type", "substitution")
    if typ == "substitution":
        mapping = key_cfg.get("mapping", {})
        post_rules = key_cfg.get("post_rules", [])
        return apply_substitution(text, mapping, post_rules)
    elif typ == "callable":
        mod = key_cfg.get("module", "voynich_decoder")
        func = key_cfg.get("function", "decode_text")
        m = maybe_import_module(mod, extra_paths)
        if m is None:
            raise RuntimeError(f"Callable key requested but module {mod} not found in {extra_paths}")
        if not hasattr(m, func):
            raise RuntimeError(f"Module {mod} does not define {func}")
        return getattr(m, func)(text, key_cfg)
    else:
        raise ValueError(f"Unknown key type: {typ}")
