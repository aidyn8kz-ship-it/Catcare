import os, sys
from pixelart import *
from pixelart import _icon

W, H = 160, 100

def floor_wood(im, y0=63):
    rect(im, 0, 59, W - 1, 62, BASE); rect(im, 0, 62, W - 1, 62, BASE_D)
    for y in range(y0, H):
        for x in range(W):
            tile = ((x // 14) + ((y - y0) // 8)) % 2
            px(im, x, y, FLOOR1 if tile == 0 else FLOOR2)
    for y in range(y0, H, 8): rect(im, 0, y, W - 1, y, FLOOR_LINE)

def floor_tiles(im, a, b, line, y0=63, size=10):
    rect(im, 0, 59, W - 1, 62, BASE); rect(im, 0, 62, W - 1, 62, BASE_D)
    for y in range(y0, H):
        for x in range(W):
            t = ((x // size) + ((y - y0) // 8)) % 2
            px(im, x, y, a if t == 0 else b)
    for y in range(y0, H, 8): rect(im, 0, y, W - 1, y, line)

def kitchen():
    im = canvas(W, H, C('cfe5d0'))
    for x in range(0, W, 8): rect(im, x, 0, x, 58, C('c3dcc6'))
    floor_tiles(im, C('e9d9b4'), C('dcc79a'), C('c7ae7e'))
    rect(im, 4, 34, 78, 47, C('bfe0dc'))
    for x in range(4, 79, 7): rect(im, x, 34, x, 47, C('a6cfca'))
    for y in range(34, 48, 6): rect(im, 4, y, 78, y, C('a6cfca'))
    rect(im, 4, 8, 76, 30, WOOD); rect(im, 4, 8, 76, 9, WOOD_L); rect(im, 4, 30, 76, 30, WOOD_D)
    for x0 in (4, 28, 52):
        rect(im, x0, 10, x0 + 24, 29, WOOD_D); rect(im, x0 + 1, 11, x0 + 23, 28, WOOD)
        rect(im, x0 + 20, 24, x0 + 21, 26, YELLOW)
    rect(im, 4, 48, 78, 52, C('f0e8d6')); rect(im, 4, 52, 78, 52, C('cfc3a8'))
    rect(im, 4, 53, 78, 82, WOOD); rect(im, 4, 53, 4, 82, WOOD_D); rect(im, 78, 53, 78, 82, WOOD_D)
    for x0 in (7, 31, 55):
        rect(im, x0, 56, x0 + 20, 79, WOOD_D); rect(im, x0 + 1, 57, x0 + 19, 78, WOOD)
        rect(im, x0 + 15, 58, x0 + 17, 59, YELLOW)
    rect(im, 30, 46, 52, 48, C('c9d3d9')); rect(im, 40, 38, 41, 46, C('9aa6ae')); rect(im, 40, 38, 44, 39, C('9aa6ae'))
    rect(im, 60, 38, 70, 47, RED); rect(im, 60, 38, 70, 39, RED_D); rect(im, 71, 41, 73, 44, RED_D)
    rect(im, 8, 40, 14, 47, ORANGE); rect(im, 8, 38, 14, 40, WOOD_L)
    rect(im, 80, 12, 88, 20, WOOD_D); rect(im, 81, 13, 87, 19, CREAM)
    pts(im, [(84, 14), (84, 15), (84, 16), (85, 16), (86, 16)], DARK)
    rect(im, 90, 14, 114, 42, WOOD_D); rect(im, 92, 16, 112, 40, GLASS)
    rect(im, 101, 16, 102, 40, WOOD_D); rect(im, 92, 27, 112, 28, WOOD_D); rect(im, 93, 17, 96, 21, GLASS_L)
    rect(im, 88, 11, 116, 17, BLUE); rect(im, 88, 11, 116, 12, C('5c82c8'))
    rect(im, 88, 43, 116, 45, WOOD_L)
    rect(im, 118, 16, 152, 82, C('e6ecef')); rect(im, 150, 16, 152, 82, C('c4ccd2')); rect(im, 118, 16, 118, 82, C('c4ccd2'))
    rect(im, 118, 38, 152, 39, C('9aa6ae'))
    rect(im, 123, 20, 124, 32, C('7d8a93')); rect(im, 123, 44, 124, 60, C('7d8a93'))
    rect(im, 132, 24, 135, 27, RED); rect(im, 140, 28, 143, 31, YELLOW); rect(im, 134, 46, 137, 49, BLUE)
    rect(im, 138, 50, 146, 58, CREAM); pts(im, [(140, 52), (141, 52), (142, 52), (140, 54), (143, 54), (141, 56)], DARK)
    rect(im, 22, 86, 76, 97, C('2f4f94')); rect(im, 23, 87, 75, 96, C('5b83c4')); rect(im, 26, 89, 72, 94, C('7aa0dc'))
    rect(im, 36, 90, 46, 95, RED); rect(im, 36, 90, 46, 91, C('e8636f')); rect(im, 38, 91, 44, 92, C('d6a15e'))
    rect(im, 54, 90, 64, 95, C('4f78c0')); rect(im, 54, 90, 64, 91, C('7aa0dc')); rect(im, 56, 91, 62, 92, C('9fd3ee'))
    return im

def bedroom():
    im = canvas(W, H, C('d3d8f0'))
    for x in range(0, W, 10): rect(im, x, 0, x, 58, C('c8cee8'))
    floor_wood(im)
    rect(im, 4, 18, 34, 82, WOOD); rect(im, 4, 18, 34, 20, WOOD_L); rect(im, 4, 18, 4, 82, WOOD_D); rect(im, 34, 18, 34, 82, WOOD_D)
    rect(im, 18, 22, 19, 80, WOOD_D)
    rect(im, 14, 48, 15, 54, YELLOW); rect(im, 22, 48, 23, 54, YELLOW)
    rect(im, 7, 24, 16, 46, WOOD_D); rect(im, 8, 25, 15, 45, WOOD); rect(im, 21, 24, 31, 46, WOOD_D); rect(im, 22, 25, 30, 45, WOOD)
    rect(im, 44, 12, 68, 40, WOOD_D); rect(im, 46, 14, 66, 38, C('8fc3e8'))
    rect(im, 55, 14, 56, 38, WOOD_D); rect(im, 46, 25, 66, 26, WOOD_D); rect(im, 47, 15, 50, 19, GLASS_L)
    rect(im, 40, 10, 72, 12, WOOD_D)
    rect(im, 40, 12, 46, 42, C('f0d79a')); rect(im, 40, 12, 41, 42, C('d9bd77'))
    rect(im, 66, 12, 72, 42, C('f0d79a')); rect(im, 71, 12, 72, 42, C('d9bd77'))
    rect(im, 42, 41, 70, 43, WOOD_L)
    rect(im, 38, 54, 58, 56, WOOD_L); rect(im, 39, 57, 57, 82, WOOD); rect(im, 39, 57, 39, 82, WOOD_D); rect(im, 57, 57, 57, 82, WOOD_D)
    rect(im, 42, 61, 54, 70, WOOD_D); rect(im, 43, 62, 53, 69, WOOD); rect(im, 47, 65, 49, 66, YELLOW)
    rect(im, 46, 48, 50, 53, DARK); rect(im, 42, 41 + 0, 54, 41, T)
    rect(im, 42, 44, 54, 49, C('f6d27a')); rect(im, 42, 44, 54, 45, C('ffe9a8'))
    rect(im, 92, 20, 114, 38, WOOD_D); rect(im, 94, 22, 112, 36, C('27315c'))
    rect(im, 106, 25, 109, 28, YELLOW); pts(im, [(98, 26), (100, 30), (104, 24), (97, 33), (108, 33)], C('ffffff'))
    rect(im, 72, 58, 150, 82, WOOD)
    rect(im, 144, 34, 150, 82, WOOD_D); rect(im, 145, 35, 149, 60, WOOD)
    rect(im, 72, 76, 150, 82, WOOD_D)
    rect(im, 74, 52, 144, 66, BLUE); rect(im, 74, 52, 144, 53, C('5d83cf'))
    rect(im, 74, 66, 144, 70, C('2c4a8c'))
    for x in range(78, 142, 8): rect(im, x, 56, x + 3, 59, C('5d83cf'))
    rect(im, 126, 44, 142, 53, C('f4f4f0')); rect(im, 126, 44, 142, 45, C('ffffff'))
    pts(im, [(126, 44), (142, 44), (126, 53), (142, 53)], T)
    rect(im, 74, 52, 76, 70, C('2c4a8c'))
    rect(im, 40, 86, 110, 97, C('b9506b')); rect(im, 41, 87, 109, 96, C('e58aa0')); rect(im, 44, 89, 106, 94, C('f2b1c0'))
    for x in range(47, 105, 7): pts(im, [(x, 91), (x + 1, 90), (x + 1, 92)], C('e58aa0'))
    return im

def bathroom():
    im = canvas(W, H, C('bfe3e6'))
    for x in range(0, W, 8): rect(im, x, 0, x, 58, C('a8d1d6'))
    for y in range(0, 59, 8): rect(im, 0, y, W - 1, y, C('a8d1d6'))
    floor_tiles(im, C('eef3f5'), C('d5e1e6'), C('b9c9d0'))
    rect(im, 4, 48, 72, 52, C('f4f8fa')); rect(im, 4, 52, 72, 52, C('c9d7dd'))
    rect(im, 5, 53, 71, 78, C('e6eef2')); rect(im, 5, 53, 71, 55, C('d3dfe5'))
    rect(im, 8, 58, 68, 72, C('d8e6ec'))
    rect(im, 6, 79, 10, 83, C('9aa6ae')); rect(im, 66, 79, 70, 83, C('9aa6ae'))
    rect(im, 8, 38, 10, 47, C('9aa6ae')); rect(im, 8, 38, 14, 40, C('9aa6ae')); rect(im, 14, 40, 15, 42, C('7d8a93'))
    rect(im, 56, 43, 62, 47, YELLOW); rect(im, 60, 40, 63, 43, YELLOW); pts(im, [(64, 41), (65, 41)], ORANGE); px(im, 62, 41, DARK)
    rect(im, 90, 14, 114, 38, WOOD_L); rect(im, 92, 16, 112, 36, C('cfe9f2')); rect(im, 94, 18, 99, 22, C('f2fbff'))
    rect(im, 88, 48, 116, 54, C('f4f8fa')); rect(im, 88, 54, 116, 54, C('c9d7dd'))
    rect(im, 100, 40, 102, 48, C('9aa6ae')); rect(im, 100, 40, 105, 41, C('9aa6ae'))
    rect(im, 94, 55, 110, 82, C('e6eef2')); rect(im, 94, 55, 110, 56, C('d3dfe5'))
    rect(im, 76, 20, 80, 21, C('7d8a93')); rect(im, 76, 22, 84, 40, RED); rect(im, 76, 22, 77, 40, RED_D)
    for y in range(26, 40, 4): rect(im, 76, y, 84, y, C('e8636f'))
    rect(im, 122, 38, 136, 50, C('f4f8fa')); rect(im, 122, 38, 136, 39, C('d3dfe5'))
    rect(im, 120, 52, 138, 66, C('f4f8fa')); rect(im, 120, 64, 138, 66, C('d3dfe5'))
    rect(im, 124, 67, 134, 82, C('e6eef2'))
    rect(im, 14, 88, 62, 97, C('2f8d8a')); rect(im, 15, 89, 61, 96, C('4fb3b0')); rect(im, 18, 91, 58, 94, C('7fd0cc'))
    rect(im, 130, 86, 156, 97, C('6f7f96')); rect(im, 130, 86, 156, 87, C('9aabc2'))
    rect(im, 132, 88, 154, 95, C('e6d6a8'))
    pts(im, [(136, 90), (142, 92), (148, 89), (150, 93), (139, 94), (145, 91)], C('cdbb88'))
    return im

SPRITES = {
    'cat_walk0': lambda: cat_walk(0), 'cat_walk1': lambda: cat_walk(1),
    'cat_sick0': lambda: cat_walk(0, sick=True), 'cat_sick1': lambda: cat_walk(1, sick=True),
    'cat_sleep': cat_sleep, 'cat_sit': cat_sit_front, 'cat_peek': cat_peek,
    'bubble_exclaim': bubble_exclaim, 'bubble_sneeze': bubble_sneeze, 'zzz': zzz, 'book_closed': book_closed,
}

def clean_living():
    return living_room()

ROOMS = {'living': clean_living, 'kitchen': kitchen, 'bedroom': bedroom, 'bathroom': bathroom}

def export(out_root):
    os.makedirs(f'{out_root}/rooms', exist_ok=True); os.makedirs(f'{out_root}/sprites', exist_ok=True)
    for name, fn in ROOMS.items(): fn().save(f'{out_root}/rooms/{name}.png')
    for name, fn in SPRITES.items(): fn().save(f'{out_root}/sprites/{name}.png')
    os.makedirs(f'{out_root}/items', exist_ok=True)
    for name, fn in ICONS.items(): _icon(fn).save(f'{out_root}/items/{name}.png')

def contact_sheet(path, overlay=None):
    S = 3
    names = list(ROOMS)
    sheet = Image.new('RGBA', (W * S * 2 + 12, H * S * 2 + 12), C('2a1d1a'))
    for i, n in enumerate(names):
        r = ROOMS[n]()
        if overlay: overlay(n, r)
        sheet.alpha_composite(scale(r, S), ((i % 2) * (W * S + 12), (i // 2) * (H * S + 12)))
    sheet.save(path)

if __name__ == '__main__':
    out = sys.argv[1]
    export(out)
    contact_sheet('/home/claude/art/rooms_contact.png')
    print('exported to', out)
