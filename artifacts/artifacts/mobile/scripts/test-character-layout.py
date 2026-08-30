"""Verify every avatar/wing pair attaches at the same back point."""
from pathlib import Path

BOUNDS = {}
text = Path("artifacts/artifacts/mobile/constants/assetContentBounds.ts").read_text(encoding="utf-8")
for line in text.splitlines():
    stripped = line.strip()
    if not stripped.startswith("avatar_") and not stripped.startswith("wing_"):
        continue
    ident = line.strip().split(":")[0]
    nums = {}
    for part in line.split("{", 1)[1].split("}")[0].split(","):
        k, v = [s.strip() for s in part.split(":")]
        nums[k] = float(v)
    BOUNDS[ident] = nums

BACK_Y_IN_CONTENT = 0.38
WING_ROOT_Y_IN_CONTENT = 0.5
WING_SPAN_VS_AVATAR = 2.25
PLATFORM_GROUND_Y = 0.89

AVATARS = [k for k in BOUNDS if k.startswith("avatar_")]
WINGS = [k for k in BOUNDS if k.startswith("wing_")]


def layout(avatar_id, wing_id, stage_w=400, stage_h=500, mode="platform"):
    a = BOUNDS[avatar_id]
    ground_y = stage_h * (PLATFORM_GROUND_Y if mode == "platform" else 0.92)
    desired = min(stage_h * 0.78, ground_y * 0.9) if mode == "platform" else stage_h * 0.72
    aspect = a["canvasW"] / a["canvasH"]
    canvas_h = desired / (a["bottom"] - a["top"])
    canvas_w = canvas_h * aspect
    content_w = (a["right"] - a["left"]) * canvas_w
    max_w = stage_w * 0.62
    if content_w > max_w:
        s = max_w / content_w
        canvas_w *= s
        canvas_h *= s
    cx = a["left"] + (a["right"] - a["left"]) / 2
    left = stage_w / 2 - cx * canvas_w
    top = ground_y - a["bottom"] * canvas_h if mode == "platform" else stage_h / 2 - ((a["top"] + a["bottom"]) / 2) * canvas_h
    back_x = left + cx * canvas_w
    back_y = top + (a["top"] + BACK_Y_IN_CONTENT * (a["bottom"] - a["top"])) * canvas_h
    out = {"back": (back_x, back_y), "avatar_bottom": top + canvas_h, "ground": ground_y}
    if not wing_id:
        return out
    w = BOUNDS[wing_id]
    vis_w = (a["right"] - a["left"]) * canvas_w
    wing_canvas_w = (vis_w * WING_SPAN_VS_AVATAR) / (w["right"] - w["left"])
    wing_aspect = w["canvasW"] / w["canvasH"]
    wing_canvas_h = wing_canvas_w / wing_aspect
    max_h = stage_h * (1.2 if mode == "platform" else 0.98)
    if wing_canvas_h > max_h:
        s = max_h / wing_canvas_h
        wing_canvas_w *= s
        wing_canvas_h *= s
    root_x = w["left"] + (w["right"] - w["left"]) / 2
    root_y = w["top"] + WING_ROOT_Y_IN_CONTENT * (w["bottom"] - w["top"])
    wing_left = back_x - root_x * wing_canvas_w
    wing_top = back_y - root_y * wing_canvas_h
    attach_x = wing_left + root_x * wing_canvas_w
    attach_y = wing_top + root_y * wing_canvas_h
    out["wing_attach"] = (attach_x, attach_y)
    out["wing_size"] = (wing_canvas_w, wing_canvas_h)
    return out

errors = []
for a in AVATARS:
    for w in WINGS:
        for mode in ("platform", "preview"):
            r = layout(a, w, mode=mode)
            dx = abs(r["back"][0] - r["wing_attach"][0])
            dy = abs(r["back"][1] - r["wing_attach"][1])
            if dx > 0.01 or dy > 0.01:
                errors.append(f"{a}+{w} {mode} attach mismatch {dx},{dy}")
            if r["wing_size"][0] <= 1 or r["wing_size"][1] <= 1:
                errors.append(f"{a}+{w} {mode} tiny wing {r['wing_size']}")

print(f"checked {len(AVATARS)*len(WINGS)*2} pairs")
if errors:
    print("FAIL")
    for e in errors:
        print(" ", e)
    raise SystemExit(1)
print("OK — wing root matches avatar back for every pair")
# sample
s = layout("avatar_1", "wing_basic")
print("sample Abigail+basic", {k: (round(v[0],1), round(v[1],1)) if isinstance(v, tuple) else v for k,v in s.items()})
