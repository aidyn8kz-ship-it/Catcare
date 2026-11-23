from PIL import Image, ImageDraw, ImageFont

def C(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)

WALL = C('ead5b0'); WALL_D = C('dcc59c'); BASE = C('b88a5a'); BASE_D = C('9c7248')
FLOOR1 = C('b9835a'); FLOOR2 = C('a8724a'); FLOOR_LINE = C('946142')
WOOD = C('c28b52'); WOOD_L = C('d9a46a'); WOOD_D = C('8f5f36'); DARK = C('2a1d1a')
RED = C('c53a45'); RED_D = C('9b2a38'); GLASS = C('a9d4ea'); GLASS_L = C('d5ecf7')
GREEN = C('4fae5a'); GREEN_L = C('8bdc7a'); GREEN_D = C('37893f')
BLUE = C('3b5ea8'); ORANGE = C('e08a2c'); YELLOW = C('f6d64b'); PINK = C('e07f94')
CREAM = C('f3e9d2'); ROPE = C('d8b77a'); ROPE_D = C('b8955a')
K = C('1c1c28'); KH = C('3a3a52'); KD = C('111119'); EYE = C('f7d94c'); NOSE = C('e48b9f')
WHISK = C('d9d4c8'); T = (0, 0, 0, 0)

def canvas(w, h, fill=T):
    return Image.new('RGBA', (w, h), fill)

def px(img, x, y, c):
    if 0 <= x < img.width and 0 <= y < img.height: img.putpixel((x, y), c)

def rect(img, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): px(img, x, y, c)

def pts(img, lst, c):
    for x, y in lst: px(img, x, y, c)

def scale(img, k): return img.resize((img.width * k, img.height * k), Image.NEAREST)





def cat_walk(frame=0, sick=False):
    im = canvas(30, 22)
    drop = 2 if sick else 0
    if sick:
        pts(im, [(5, 12), (4, 13), (3, 14), (3, 15), (3, 16), (4, 16)], K)
    else:
        pts(im, [(5, 10), (4, 9), (3, 8), (3, 7), (3, 6), (4, 5), (5, 5)], K)
        pts(im, [(4, 8), (4, 7), (4, 6)], KH)
    rect(im, 6, 8 + drop, 18, 14 + drop, K)
    pts(im, [(6, 8 + drop), (18, 8 + drop), (6, 14 + drop), (18, 14 + drop)], T)
    rect(im, 8, 8 + drop, 16, 9 + drop, KH)
    if sick:
        pts(im, [(8, 8 + drop), (16, 8 + drop)], K)
    if frame % 2 == 0:
        legs = [(5, 0), (9, 1), (15, 1), (19, 0)]
    else:
        legs = [(8, 1), (11, 0), (13, 0), (16, 1)]
    for lx, lift in legs:
        top = 15 + drop
        h = 4 - lift - (1 if sick else 0)
        rect(im, lx, top, lx + 1, top + h - 1, K)
        px(im, lx + 1, top + h - 1, KH)
    hy = 5 + (4 if sick else 0)
    rect(im, 18, hy, 25, hy + 6, K)
    pts(im, [(18, hy), (25, hy), (18, hy + 6), (25, hy + 6)], T)
    rect(im, 19, hy, 24, hy, KH)
    if sick:
        pts(im, [(19, hy - 1), (20, hy - 1), (23, hy - 1), (24, hy - 1)], K)
    else:
        pts(im, [(19, hy - 1), (19, hy - 2), (20, hy - 1), (24, hy - 1), (24, hy - 2), (23, hy - 1)], K)
        pts(im, [(20, hy - 1), (23, hy - 1)], NOSE)
    if sick:
        pts(im, [(21, hy + 2), (22, hy + 2), (24, hy + 2)], C('a89238'))
        pts(im, [(21, hy + 3), (24, hy + 3)], KD)
    else:
        pts(im, [(21, hy + 2), (24, hy + 2)], EYE)
        pts(im, [(21, hy + 3), (24, hy + 3)], KD)
    pts(im, [(25, hy + 4)], NOSE)
    pts(im, [(26, hy + 4), (26, hy + 5)], WHISK)
    return im

def cat_sleep():
    im = canvas(28, 15)
    rows = {4: (7, 19), 5: (5, 21), 6: (4, 22), 7: (3, 23), 8: (3, 23), 9: (3, 23), 10: (3, 23), 11: (4, 22), 12: (5, 21), 13: (7, 19)}
    for y, (x0, x1) in rows.items(): rect(im, x0, y, x1, y, K)
    rect(im, 8, 4, 17, 5, KH)
    rect(im, 17, 7, 25, 13, K)
    pts(im, [(17, 7), (25, 7), (25, 13), (17, 13)], T)
    pts(im, [(18, 6), (18, 5), (19, 6), (23, 6), (23, 5), (22, 6)], K)
    pts(im, [(19, 6), (22, 6)], NOSE)
    pts(im, [(19, 10), (20, 10), (22, 10), (23, 10)], KH)
    pts(im, [(21, 11)], NOSE)
    rect(im, 17, 13, 24, 13, KH)
    pts(im, [(6, 13), (7, 13), (8, 13), (9, 13), (10, 13), (11, 13), (12, 13), (13, 13), (14, 13), (15, 13)], KH)
    return im

def cat_sit_front():
    im = canvas(22, 24)
    pts(im, [(18, 21), (19, 21), (20, 20), (20, 19), (20, 18), (19, 17)], K)
    rect(im, 4, 13, 17, 22, K)
    pts(im, [(4, 13), (17, 13), (4, 22), (17, 22)], T)
    rect(im, 6, 14, 15, 14, KH)
    rect(im, 6, 18, 8, 22, KH); rect(im, 13, 18, 15, 22, KH)
    rect(im, 3, 3, 18, 12, K)
    pts(im, [(3, 3), (18, 3), (3, 12), (18, 12)], T)
    rect(im, 5, 3, 16, 3, KH)
    pts(im, [(3, 2), (3, 1), (4, 2), (4, 1), (4, 0), (5, 2), (18, 2), (18, 1), (17, 2), (17, 1), (17, 0), (16, 2)], K)
    pts(im, [(4, 1), (4, 2), (17, 1), (17, 2)], NOSE)
    rect(im, 5, 6, 8, 9, EYE); rect(im, 13, 6, 16, 9, EYE)
    rect(im, 6, 6, 7, 9, KD); rect(im, 14, 6, 15, 9, KD)
    pts(im, [(6, 6), (14, 6)], WHISK)
    pts(im, [(10, 10), (11, 10)], NOSE)
    pts(im, [(1, 9), (2, 10), (20, 9), (19, 10)], WHISK)
    return im

def cat_peek():
    im = canvas(16, 8)
    rect(im, 0, 0, 15, 7, KD)
    pts(im, [(0, 0), (15, 0), (0, 7), (15, 7)], T)
    rect(im, 4, 3, 5, 4, EYE); rect(im, 10, 3, 11, 4, EYE)
    pts(im, [(4, 3), (10, 3)], K)
    return im

def bubble_exclaim():
    im = canvas(11, 13)
    rect(im, 0, 0, 10, 9, CREAM)
    pts(im, [(0, 0), (10, 0), (0, 9), (10, 9)], T)
    pts(im, [(4, 10), (5, 11), (6, 10)], CREAM)
    rect(im, 5, 2, 5, 5, RED); rect(im, 5, 7, 5, 7, RED)
    return im


def bubble_sneeze():
    im = canvas(15, 12)
    rect(im, 0, 0, 14, 9, CREAM)
    pts(im, [(0, 0), (14, 0), (0, 9), (14, 9)], T)
    pts(im, [(6, 10), (7, 11), (8, 10)], CREAM)
    blue = C('5f95d6')
    pts(im, [(3, 3), (4, 5), (3, 7), (7, 2), (7, 4), (7, 6), (7, 8), (10, 3), (11, 5), (10, 7)], blue)
    return im


def book_closed():
    im = canvas(20, 24)
    cover = C('b8323f'); cover_d = C('8a2230'); cover_l = C('d9525f'); gold = C('f2c14e'); page = C('f6ecd4')
    rect(im, 2, 1, 17, 21, cover)
    rect(im, 2, 1, 4, 21, cover_d)
    rect(im, 5, 1, 17, 2, cover_l)
    rect(im, 3, 22, 18, 22, page); rect(im, 3, 23, 17, 23, C('d8c9a6'))
    pts(im, [(2, 1), (17, 1), (17, 21)], T)
    rect(im, 5, 5, 15, 5, gold); rect(im, 5, 18, 15, 18, gold)
    pts(im, [(10, 12), (11, 12), (9, 13), (10, 13), (11, 13), (12, 13), (9, 14), (10, 14), (11, 14), (12, 14)], gold)
    pts(im, [(8, 10), (11, 9), (13, 10), (14, 11)], gold)
    return im

def _icon(draw):
    im = canvas(16, 16); draw(im); return im

def icon_onion(im):
    rect(im, 4, 5, 11, 12, C('d9a6d0')); rect(im, 3, 7, 12, 11, C('d9a6d0'))
    rect(im, 5, 6, 6, 11, C('f2d4ee')); rect(im, 9, 7, 10, 11, C('b97fb0'))
    pts(im, [(4, 5), (11, 5), (4, 12), (11, 12)], T)
    rect(im, 7, 2, 8, 5, C('7fbf5a')); pts(im, [(6, 1), (9, 1)], C('7fbf5a'))
    rect(im, 6, 13, 9, 13, C('c9b79a'))

def icon_choc(im):
    rect(im, 2, 3, 13, 13, C('7a4a2b'))
    for x in (5, 8, 11): rect(im, x, 3, x, 13, C('5a331c'))
    for y in (6, 9, 12): rect(im, 2, y, 13, y, C('5a331c'))
    rect(im, 3, 4, 4, 5, C('9a6a45'))
    rect(im, 2, 1, 13, 2, C('d8c9a6')); rect(im, 3, 2, 12, 2, C('f6ecd4'))

def icon_coffee(im):
    rect(im, 3, 6, 11, 12, C('f6f0e2')); rect(im, 3, 6, 11, 7, C('6a3d22'))
    rect(im, 12, 7, 14, 10, C('f6f0e2')); rect(im, 13, 8, 13, 9, T)
    rect(im, 2, 13, 12, 14, C('d9d2c0'))
    pts(im, [(5, 3), (6, 2), (5, 1), (9, 3), (10, 2), (9, 1)], C('c9c9c9'))

def icon_alcohol(im):
    rect(im, 4, 2, 11, 7, C('e3f0f7')); rect(im, 5, 4, 10, 7, C('b83a52'))
    rect(im, 7, 8, 8, 12, C('e3f0f7')); rect(im, 4, 13, 11, 13, C('e3f0f7'))
    pts(im, [(4, 2), (11, 2)], T)

def icon_xylitol(im):
    rect(im, 2, 4, 13, 12, C('3a9a8a')); rect(im, 2, 4, 13, 5, C('5bc0ae'))
    rect(im, 5, 7, 10, 9, C('ffffff'))
    pts(im, [(6, 8), (7, 8), (8, 8), (9, 8)], C('3a9a8a'))
    rect(im, 3, 13, 12, 13, C('2a7a6c'))

def icon_dough(im):
    rect(im, 3, 6, 12, 12, C('f0dfb8')); rect(im, 5, 4, 10, 6, C('f0dfb8')); rect(im, 2, 8, 13, 11, C('f0dfb8'))
    pts(im, [(3, 6), (12, 6), (2, 12), (13, 12)], T)
    rect(im, 5, 5, 7, 6, C('fff4d6')); pts(im, [(6, 9), (9, 8), (8, 11), (4, 10)], C('d9c58f'))
    rect(im, 4, 13, 11, 13, C('d9c58f'))

def icon_grapes(im):
    pur = C('6a3f9a'); pl = C('8f66bf')
    for (x, y) in [(4, 5), (7, 5), (10, 5), (5, 8), (8, 8), (6, 11), (9, 11)]:
        rect(im, x, y, x + 2, y + 2, pur); px(im, x, y, pl)
    rect(im, 7, 1, 8, 4, C('6b4a2b')); rect(im, 8, 2, 11, 3, C('5fae4a'))

def icon_lily(im):
    pet = C('fff6f0'); pink = C('f2a6bd')
    for (x0, y0, x1, y1) in [(7, 1, 8, 6), (2, 4, 6, 6), (9, 4, 13, 6), (3, 7, 6, 9), (9, 7, 12, 9)]:
        rect(im, x0, y0, x1, y1, pet)
    rect(im, 6, 5, 9, 8, pink); pts(im, [(7, 6), (8, 7)], C('f2c14e'))
    rect(im, 7, 9, 8, 14, C('4f9a3f')); rect(im, 9, 11, 12, 12, C('4f9a3f')); rect(im, 3, 12, 6, 13, C('4f9a3f'))

ICONS = {'onion_garlic': icon_onion, 'chocolate': icon_choc, 'caffeine': icon_coffee, 'alcohol': icon_alcohol,
         'xylitol': icon_xylitol, 'raw_dough': icon_dough, 'grapes': icon_grapes, 'lilies': icon_lily}

def zzz():
    im = canvas(12, 10)
    c = C('7fa9d6')
    pts(im, [(0, 5), (1, 5), (2, 5), (1, 6), (0, 7), (1, 7), (2, 7)], c)
    pts(im, [(5, 1), (6, 1), (7, 1), (6, 2), (5, 3), (6, 3), (7, 3)], c)
    return im

def living_room():
    W, H = 160, 100
    im = canvas(W, H, WALL)
    for x in range(0, W, 8): rect(im, x, 0, x, 58, WALL_D)
    rect(im, 0, 59, W - 1, 62, BASE); rect(im, 0, 62, W - 1, 62, BASE_D)
    for y in range(63, H):
        for x in range(W):
            tile = ((x // 14) + ((y - 63) // 8)) % 2
            px(im, x, y, FLOOR1 if tile == 0 else FLOOR2)
    for y in range(63, H, 8): rect(im, 0, y, W - 1, y, FLOOR_LINE)

    rect(im, 28, 10, 54, 42, WOOD_D); rect(im, 30, 12, 52, 40, GLASS)
    rect(im, 40, 12, 41, 40, WOOD_D); rect(im, 30, 25, 52, 26, WOOD_D)
    rect(im, 31, 13, 34, 17, GLASS_L)
    rect(im, 26, 43, 56, 45, WOOD_L)
    rect(im, 22, 8, 31, 44, RED); rect(im, 22, 8, 23, 44, RED_D); rect(im, 27, 8, 27, 44, RED_D)
    rect(im, 51, 8, 60, 44, RED); rect(im, 59, 8, 60, 44, RED_D); rect(im, 55, 8, 55, 44, RED_D)
    rect(im, 20, 6, 62, 8, WOOD_D)

    rect(im, 70, 24, 108, 26, WOOD_L); rect(im, 70, 27, 108, 27, WOOD_D)
    rect(im, 74, 28, 76, 31, WOOD_D); rect(im, 102, 28, 104, 31, WOOD_D)
    for (x0, x1, c, top) in [(73, 78, RED, 10), (79, 83, ORANGE, 12), (84, 89, GREEN, 9), (91, 98, BLUE, 17)]:
        rect(im, x0, top + 5, x1, 23, c)
        rect(im, x0, top + 5, x0, 23, WOOD_D)
    rect(im, 101, 15, 105, 23, GREEN_D); rect(im, 100, 19, 106, 23, ORANGE)

    rect(im, 116, 30, 134, 44, WOOD_D); rect(im, 118, 32, 132, 42, C('8ec9ef'))
    rect(im, 118, 38, 132, 42, GREEN); pts(im, [(122, 37), (123, 36), (124, 37), (125, 37), (126, 36), (127, 37)], GREEN)
    rect(im, 128, 33, 130, 35, YELLOW)

    rect(im, 146, 8, 148, 10, WOOD_D); rect(im, 143, 11, 151, 17, YELLOW)
    pts(im, [(143, 11), (151, 11), (143, 17), (151, 17)], T)
    rect(im, 145, 13, 149, 15, C('fff3a8'))

    rect(im, 4, 50, 26, 52, WOOD_L); rect(im, 5, 53, 25, 80, WOOD); rect(im, 5, 53, 5, 80, WOOD_D); rect(im, 25, 53, 25, 80, WOOD_D)
    rect(im, 8, 57, 22, 64, WOOD_D); rect(im, 9, 58, 21, 63, WOOD); rect(im, 14, 60, 16, 61, WOOD_D)
    rect(im, 8, 68, 22, 76, WOOD_D); rect(im, 9, 69, 21, 75, WOOD); rect(im, 14, 71, 16, 72, WOOD_D)
    rect(im, 13, 44, 17, 49, DARK); rect(im, 9, 36, 21, 44, C('f1e3b0')); rect(im, 9, 36, 21, 37, C('fff6cf'))

    rect(im, 62, 52, 120, 56, WOOD_L); rect(im, 62, 57, 120, 57, WOOD_D)
    rect(im, 62, 58, 66, 80, WOOD); rect(im, 62, 58, 62, 80, WOOD_D)
    rect(im, 67, 58, 98, 78, DARK); rect(im, 67, 58, 98, 59, C('3b2a24'))
    rect(im, 99, 58, 120, 80, WOOD); rect(im, 99, 58, 99, 80, WOOD_D); rect(im, 120, 58, 120, 80, WOOD_D)
    rect(im, 102, 61, 117, 69, WOOD_D); rect(im, 103, 62, 116, 68, WOOD); rect(im, 108, 64, 111, 65, WOOD_D)
    rect(im, 102, 71, 117, 78, WOOD_D); rect(im, 103, 72, 116, 77, WOOD); rect(im, 108, 74, 111, 75, WOOD_D)
    rect(im, 70, 47, 98, 52, C('c0407a')); rect(im, 70, 47, 98, 48, C('d95f98'))
    pts(im, [(70, 47), (98, 47)], T)

    rect(im, 132, 30, 148, 36, WOOD_D); rect(im, 133, 31, 147, 35, WOOD)
    for y in range(37, 80):
        rect(im, 137, y, 143, y, ROPE if (y // 2) % 2 == 0 else ROPE_D)
    rect(im, 130, 80, 150, 84, WOOD_D); rect(im, 131, 80, 149, 82, WOOD)

    rect(im, 34, 82, 100, 97, GREEN_D); rect(im, 35, 83, 99, 96, GREEN)
    rect(im, 38, 85, 96, 94, GREEN_L); rect(im, 40, 87, 94, 92, GREEN)
    for x in range(41, 94, 6): pts(im, [(x, 89), (x + 1, 88), (x + 1, 90)], GREEN_L)
    return im

def font(size):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', size)
    except Exception: return ImageFont.load_default()

def build_scene():
    room = living_room()
    sl = cat_sleep(); room.alpha_composite(sl, (74, 37)); room.alpha_composite(zzz(), (100, 33))
    walker = cat_walk(0); room.alpha_composite(walker, (44, 68))
    room.alpha_composite(cat_peek(), (76, 68))
    return room

def build_sheet():
    S = 6
    items = [
        ('Walking (frame 1)', cat_walk(0)),
        ('Walking (frame 2)', cat_walk(1)),
        ('Sitting', cat_sit_front()),
        ('Sleeping', cat_sleep()),
        ('Feeling sick', cat_walk(0, sick=True)),
        ('Hiding under desk', cat_peek()),
    ]
    cell_w, cell_h = 230, 190
    cols = 3
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell_w, rows * cell_h), WALL)
    d = ImageDraw.Draw(sheet)
    f = font(15)
    for i, (label, spr) in enumerate(items):
        cx = (i % cols) * cell_w; cy = (i // cols) * cell_h
        big = scale(spr, 5)
        sheet.alpha_composite(big, (cx + (cell_w - big.width) // 2, cy + 20 + (125 - big.height) // 2))
        tw = d.textlength(label, font=f)
        d.text((cx + (cell_w - tw) / 2, cy + 160), label, fill=C('3a2a22'), font=f)
    ex = scale(bubble_exclaim(), 5)
    sheet.alpha_composite(ex, (2 * 0 + cell_w * 1 + 150, cell_h + 8))
    return sheet

if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/art'
    scale(build_scene(), 6).save(f'{out}/living_room_preview.png')
    build_sheet().save(f'{out}/cat_poses_preview.png')
    print('ok')
