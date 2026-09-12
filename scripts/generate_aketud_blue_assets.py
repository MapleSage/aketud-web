from pathlib import Path
from PIL import Image
import cairosvg

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
SOURCE_LOGO = PUBLIC / 'brand' / 'aketud-logo-source.png'
SOURCE_FAVICON = PUBLIC / 'brand' / 'aketud-favicon-source.svg'

PLATFORM_BLUE = (8, 49, 75, 255)
WHITE = (255, 255, 255, 255)


def extract_art_alpha(image: Image.Image) -> Image.Image:
    """Convert black artwork on supplied white paper into a soft transparent mask."""
    rgb = image.convert('RGB')
    alpha = Image.new('L', rgb.size)
    alpha.putdata([
        max(0, min(255, round((252 - ((r * 299 + g * 587 + b * 114) / 1000)) * 255 / 252)))
        for r, g, b in rgb.getdata()
    ])
    return alpha


def pad_mask(mask: Image.Image, horizontal: int = 42, vertical: int = 18) -> Image.Image:
    bounds = mask.getbbox()
    if not bounds:
        raise RuntimeError('The supplied logo source contains no detectable artwork.')
    crop = mask.crop(bounds)
    padded = Image.new('L', (crop.width + horizontal * 2, crop.height + vertical * 2), 0)
    padded.paste(crop, (horizontal, vertical))
    return padded


def colour(mask: Image.Image, rgba: tuple[int, int, int, int]) -> Image.Image:
    output = Image.new('RGBA', mask.size, rgba)
    output.putalpha(mask)
    return output


logo_alpha = pad_mask(extract_art_alpha(Image.open(SOURCE_LOGO)))
colour(logo_alpha, PLATFORM_BLUE).save(PUBLIC / 'aketud-logo-blue.png')
colour(logo_alpha, WHITE).save(PUBLIC / 'aketud-logo-white.png')

# Keep the exact supplied favicon geometry as the single icon source of truth.
favicon_svg = SOURCE_FAVICON.read_text(encoding='utf-8')
(PUBLIC / 'favicon.svg').write_text(favicon_svg, encoding='utf-8')
(PUBLIC / 'aketud-mark.svg').write_text(favicon_svg, encoding='utf-8')

for size in (16, 32, 48, 64, 180, 512):
    output = PUBLIC / (f'favicon-{size}.png' if size in (16, 32, 48, 64) else ('apple-touch-icon.png' if size == 180 else 'icon-512.png'))
    cairosvg.svg2png(bytestring=favicon_svg.encode('utf-8'), write_to=str(output), output_width=size, output_height=size)

# Use native favicon entries; do not downscale the 512px app asset for the tab.
ico_frames = [Image.open(PUBLIC / f'favicon-{size}.png').convert('RGBA') for size in (16, 32, 48, 64)]
ico_frames[-1].save(PUBLIC / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

Image.open(PUBLIC / 'icon-512.png').convert('RGBA').save(PUBLIC / 'pwa-maskable-512x512.png')
Image.open(PUBLIC / 'icon-512.png').convert('RGBA').save(PUBLIC / 'favicon.png')

print({'lockup': logo_alpha.size, 'favicon_source': str(SOURCE_FAVICON)})
