#!/usr/bin/env python3
"""Generate Time Machine app icon and splash screens."""

from PIL import Image, ImageDraw, ImageFont
import math
import os

# ── Helpers ──────────────────────────────────────────────────────────────────

def draw_circle(draw, cx, cy, r, fill, alpha=255):
    """Draw a filled circle."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(len(c1)))

def radial_gradient(img, center, r_outer, c_inner, c_outer):
    """Apply radial gradient over img (RGBA)."""
    cx, cy = center
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            t = min(dist / r_outer, 1.0)
            r, g, b, a = lerp_color(c_inner, c_outer, t)
            px[x, y] = (r, g, b, a)
    return img

def make_icon(size):
    """Create the Time Machine icon at given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background circle with deep space gradient
    for i in range(size // 2, 0, -1):
        t = 1 - i / (size // 2)
        r = int(6 + (30 - 6) * t)
        g = int(6 + (17 - 6) * t)
        b = int(18 + (60 - 18) * t)
        draw.ellipse(
            [size // 2 - i, size // 2 - i, size // 2 + i, size // 2 + i],
            fill=(r, g, b, 255)
        )

    cx, cy = size // 2, size // 2
    unit = size / 192  # scale unit based on 192px reference

    # Outer glow ring
    glow_r = int(80 * unit)
    for i in range(glow_r, glow_r - int(12 * unit), -1):
        alpha = int(80 * (glow_r - i) / (12 * unit))
        draw.ellipse(
            [cx - i, cy - i, cx + i, cy + i],
            outline=(124, 58, 237, alpha),
            width=1
        )

    # Clock face
    face_r = int(60 * unit)
    # Clock face fill
    for i in range(face_r, 0, -1):
        t = 1 - i / face_r
        ri = int(20 + (10 - 20) * t)
        gi = int(10 + (5 - 10) * t)
        bi = int(50 + (30 - 50) * t)
        draw.ellipse(
            [cx - i, cy - i, cx + i, cy + i],
            fill=(ri, gi, bi, 255)
        )

    # Clock border
    border_w = max(2, int(3 * unit))
    draw.ellipse(
        [cx - face_r, cy - face_r, cx + face_r, cy + face_r],
        outline=(167, 139, 250, 255),
        width=border_w
    )

    # Clock hour markers
    for h in range(12):
        angle = math.radians(h * 30 - 90)
        tick_outer = face_r - int(4 * unit)
        tick_inner = tick_outer - (int(8 * unit) if h % 3 == 0 else int(4 * unit))
        x1 = cx + tick_outer * math.cos(angle)
        y1 = cy + tick_outer * math.sin(angle)
        x2 = cx + tick_inner * math.cos(angle)
        y2 = cy + tick_inner * math.sin(angle)
        lw = max(1, int((2 if h % 3 == 0 else 1) * unit))
        draw.line([x1, y1, x2, y2], fill=(167, 139, 250, 200), width=lw)

    # Hour hand (pointing to ~10)
    hour_angle = math.radians(-60)
    hour_len = int(28 * unit)
    hx = cx + hour_len * math.cos(hour_angle)
    hy = cy + hour_len * math.sin(hour_angle)
    hw = max(2, int(3 * unit))
    draw.line([cx, cy, hx, hy], fill=(255, 255, 255, 255), width=hw)

    # Minute hand (pointing to ~2)
    min_angle = math.radians(60)
    min_len = int(40 * unit)
    mx2 = cx + min_len * math.cos(min_angle)
    my2 = cy + min_len * math.sin(min_angle)
    mw = max(1, int(2 * unit))
    draw.line([cx, cy, mx2, my2], fill=(196, 181, 253, 255), width=mw)

    # Center dot
    dot_r = max(2, int(4 * unit))
    draw.ellipse(
        [cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r],
        fill=(124, 58, 237, 255)
    )

    # Orbital ring around clock (tilted ellipse simulation)
    orbit_rx = int(72 * unit)
    orbit_ry = int(20 * unit)
    orbit_w = max(1, int(2 * unit))
    draw.ellipse(
        [cx - orbit_rx, cy - orbit_ry, cx + orbit_rx, cy + orbit_ry],
        outline=(99, 102, 241, 160),
        width=orbit_w
    )

    # Small dot on orbit (like a planet)
    planet_angle = math.radians(30)
    px2 = cx + orbit_rx * math.cos(planet_angle)
    py2 = cy + orbit_ry * math.sin(planet_angle)
    planet_r = max(3, int(5 * unit))
    for i in range(planet_r + int(3 * unit), planet_r - 1, -1):
        alpha = max(0, int(120 * (planet_r - (i - planet_r)) / (3 * unit)))
        draw.ellipse(
            [px2 - i, py2 - i, px2 + i, py2 + i],
            fill=(251, 191, 36, min(255, alpha))
        )
    draw.ellipse(
        [px2 - planet_r, py2 - planet_r, px2 + planet_r, py2 + planet_r],
        fill=(251, 191, 36, 255)
    )

    # Stars scattered in background
    import random
    random.seed(42)
    for _ in range(max(5, int(20 * unit * unit / 4))):
        sx = random.randint(0, size - 1)
        sy = random.randint(0, size - 1)
        dist = math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2)
        if dist > face_r + int(15 * unit):
            sr = random.randint(1, max(1, int(2 * unit)))
            sa = random.randint(100, 220)
            draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255, sa))

    # Round corners for adaptive icon (squircle-ish by masking)
    # Already circular background, good for mipmap

    return img


def make_splash(width, height):
    """Create a splash screen."""
    img = Image.new("RGBA", (width, height), (6, 6, 18, 255))
    draw = ImageDraw.Draw(img)

    cx, cy = width // 2, height // 2

    # Background gradient (simulated with concentric circles)
    for i in range(min(width, height) // 2, 0, -4):
        t = 1 - i / (min(width, height) // 2)
        r = int(6 + (20 - 6) * t * 0.5)
        g = int(6 + (10 - 6) * t * 0.5)
        b = int(18 + (50 - 18) * t * 0.5)
        draw.ellipse(
            [cx - i, cy - i, cx + i, cy + i],
            fill=(r, g, b, 255)
        )

    # Stars
    import random
    random.seed(99)
    for _ in range(120):
        sx = random.randint(0, width)
        sy = random.randint(0, height)
        sr = random.choice([1, 1, 1, 2])
        sa = random.randint(80, 220)
        draw.ellipse([sx, sy, sx + sr, sy + sr], fill=(255, 255, 255, sa))

    # Glow behind icon
    glow_r = min(width, height) // 4
    for i in range(glow_r, 0, -4):
        t = i / glow_r
        alpha = int(40 * t * t)
        draw.ellipse(
            [cx - i, cy - i - min(height//8, 40), cx + i, cy + i - min(height//8, 40)],
            fill=(124, 58, 237, alpha)
        )

    # Icon in center
    icon_size = min(width, height) // 3
    icon = make_icon(icon_size)
    icon_x = cx - icon_size // 2
    icon_y = cy - icon_size // 2 - min(height // 10, 60)
    img.paste(icon, (icon_x, icon_y), icon)

    # App name
    font_size = max(28, min(width, height) // 18)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", max(14, font_size // 2))
    except Exception:
        font = ImageFont.load_default()
        font_small = font

    text = "Time Machine"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    text_y = icon_y + icon_size + max(20, height // 30)

    # Glow behind text
    for offset in range(8, 0, -2):
        draw.text((cx - tw // 2, text_y), text, font=font,
                  fill=(124, 58, 237, 30 * offset // 8))

    draw.text((cx - tw // 2, text_y), text, font=font, fill=(255, 255, 255, 255))

    # Tagline
    tag = "Reconnect with your past"
    tbbox = draw.textbbox((0, 0), tag, font=font_small)
    tw2 = tbbox[2] - tbbox[0]
    draw.text((cx - tw2 // 2, text_y + font_size + 8), tag, font=font_small,
              fill=(167, 139, 250, 200))

    return img.convert("RGB")


# ── Icon sizes ────────────────────────────────────────────────────────────────

base = "/Users/appypie/Desktop/Time Machine/android/app/src/main/res"

icon_sizes = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

print("Generating app icons...")
for folder, size in icon_sizes.items():
    icon = make_icon(size)
    path = os.path.join(base, folder, "ic_launcher.png")
    icon.convert("RGB").save(path, "PNG")
    # Also save round version
    path_round = os.path.join(base, folder, "ic_launcher_round.png")
    icon.convert("RGB").save(path_round, "PNG")
    print(f"  ✓ {folder}/ic_launcher.png ({size}x{size})")

# Foreground for adaptive icon
fg_sizes = {
    "mipmap-mdpi":    108,
    "mipmap-hdpi":    162,
    "mipmap-xhdpi":   216,
    "mipmap-xxhdpi":  324,
    "mipmap-xxxhdpi": 432,
}
print("Generating adaptive icon foregrounds...")
for folder, size in fg_sizes.items():
    icon = make_icon(size)
    path = os.path.join(base, folder, "ic_launcher_foreground.png")
    icon.save(path, "PNG")
    print(f"  ✓ {folder}/ic_launcher_foreground.png")

# ── Splash screens ─────────────────────────────────────────────────────────────

splash_sizes = {
    "drawable-port-mdpi":    (320, 480),
    "drawable-port-hdpi":    (480, 800),
    "drawable-port-xhdpi":   (720, 1280),
    "drawable-port-xxhdpi":  (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi":    (480, 320),
    "drawable-land-hdpi":    (800, 480),
    "drawable-land-xhdpi":   (1280, 720),
    "drawable-land-xxhdpi":  (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}

print("\nGenerating splash screens...")
for folder, (w, h) in splash_sizes.items():
    splash = make_splash(w, h)
    path = os.path.join(base, folder, "splash.png")
    splash.save(path, "PNG")
    print(f"  ✓ {folder}/splash.png ({w}x{h})")

# Also save to drawable (fallback)
splash_default = make_splash(1080, 1920)
splash_default.save(os.path.join(base, "drawable", "splash.png"), "PNG")
print("  ✓ drawable/splash.png (1080x1920)")

print("\n✅ All assets generated!")
