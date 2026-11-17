# Image Upload Guide for Jebri Safaris

## Quick Summary
Save your images to: **`/public/assets/uploads/`**

The site is now configured to automatically use local images when available, with Unsplash fallback if a file isn't found.

---

## Image Filenames & Locations

### Kilimanjaro Trek (Priority: HIGH)
```
kilimanjaro-summit-sign.jpg       → Hero image (Mount Kilimanjaro congratulations sign)
kilimanjaro-snowy-peak-1.jpg      → Gallery image 1 (snowy peak at sunrise)
kilimanjaro-snowy-peak-2.jpg      → Gallery image 2 (snowy peak from different angle)
kilimanjaro-trekkers-summit.jpg   → Gallery image 3 (trekkers near summit)
```

### Serengeti Classic Safari (Priority: HIGH)
```
serengeti-dry-landscape.jpg       → Hero image (wide dry savanna landscape)
serengeti-acacia-tree.jpg         → Gallery image 1 (iconic acacia tree)
serengeti-safari-vehicle.jpg      → Gallery image 2 (safari vehicle in field)
serengeti-road.jpg                → Gallery image 3 (dirt road through savanna)
serengeti-landscape.jpg           → Additional (for balloon activity)
serengeti-sunrise.jpg             → Additional (sunrise/golden light)
```

### Great Migration - Mara River (Priority: HIGH)
```
mara-lioness.jpg                  → Hero image (lioness in grassland - CRITICAL)
mara-elephant-bw.jpg              → Gallery image 1 (elephant in black & white)
mara-herd.jpg                     → Gallery image 2 (wildebeest/zebra herd)
mara-jeep.jpg                     → Gallery image 3 (safari vehicle with extended canopy)
mara-landscape.jpg                → Additional (wide Mara landscape)
mara-jeep-2.jpg                   → Additional variant
```

### Maasai Mara Luxury (Honeymoon-focused)
```
zanzibar-wedding.jpg              → Hero image (romantic wedding/couple on island cliff)
```

### Cultural Activities
```
maasai-group.jpg                  → Maasai Village Visit (group in traditional dress)
maasai-warrior.jpg                → Hadzabe Hunt & cultural shots (warrior/elder portrait)
maasai-cultural-group.jpg         → Additional cultural imagery
man-with-kettle.jpg               → Zanzibar Spice Tour (local pouring tea/coffee)
hadzabe-hunting.jpg               → Hunting/bushcraft activity
cultural-moment.jpg               → Generic cultural moment
```

### Water Activities (HIGH PRIORITY - 8 images)
```
snorkel-reef-1.jpg                → Snorkeling: underwater coral reef
snorkel-reef-2.jpg                → Snorkeling: colorful fish school
snorkel-reef-3.jpg                → Snorkeling: snorkeler with reef
diver-1.jpg                       → Deep-sea diving: diver in full gear (coral)
diver-2.jpg                       → Deep-sea diving: alternative diver shot
zanzibar-island.jpg               → Dhow & water activities: scenic island/water view
ocean-view.jpg                    → Water scene: ocean horizon
water-scene.jpg                   → Water: generic water activity
ocean-boat.jpg                    → Boat/fishing context
```

### Adventure & Wellness
```
hiker-savanna.jpg                 → Walking Safari (hiker with backpack on trail)
walking-trail.jpg                 → Walking activity: trail through vegetation
mountain-biker.jpg                → Mountain Biking (biker on dirt trail)
trail-herd.jpg                    → Adventure: trail with animals
adventure-camp.jpg                → Fly-camping: camp under stars
backpacker-forest.jpg             → General trekking image
giraffe-landscape.jpg             → Giraffe encounter or wellness in nature
rock-climbing.jpg                 → Rock climbing activity (if available)
```

---

## How Image Fallback Works

Each image reference in the code now uses this pattern:
```javascript
img('/assets/uploads/filename.jpg', 'unsplash-id')
```

**Behavior:**
1. First tries to load from `/assets/uploads/filename.jpg`
2. If file doesn't exist (404), falls back to Unsplash URL
3. This means the site works perfectly even if images aren't uploaded yet
4. As you upload images, they automatically replace Unsplash ones

---

## Upload Instructions

1. **Create folder** (if not exists): `public/assets/uploads/`
2. **Save images** with exact filenames listed above
3. **Restart dev server** (Vite will hot-reload)
4. **Check website** – images should load from `/assets/uploads/`

---

## Priority Order (If uploading incrementally)

1. **CRITICAL (Hero images):**
   - kilimanjaro-summit-sign.jpg
   - serengeti-dry-landscape.jpg
   - mara-lioness.jpg
   - zanzibar-wedding.jpg

2. **HIGH (Water activities):**
   - snorkel-reef-1.jpg, snorkel-reef-2.jpg, snorkel-reef-3.jpg
   - diver-1.jpg, diver-2.jpg

3. **MEDIUM (Galleries & secondary):**
   - All other Kilimanjaro, Serengeti, Mara variants
   - Cultural activities

4. **OPTIONAL (Fallback to Unsplash):**
   - Wellness, adventure secondary images

---

## File Size & Format Notes

**Recommended:**
- Format: JPEG or WebP
- Size: 1200–1600px wide for gallery, 1600px for hero
- Quality: 70–80% compression for fast load
- Max file size: ~500KB per image

**Naming rules:**
- Lowercase only
- Use hyphens for spaces: `my-image.jpg` (not `my_image.jpg`)
- No special characters
- Be specific: `serengeti-acacia-tree.jpg` (not `tree.jpg`)

---

## Testing

After upload, check:
1. **Homepage** – Featured tours load with new hero images
2. **/tours** – All tour detail pages show gallery images
3. **/activities** – Activity cards display local images
4. **DevTools** – Network tab shows `/assets/uploads/*` requests (not Unsplash)

---

## Questions?

- Images not loading? Check browser DevTools → Network tab for 404s
- Want to swap an image? Just replace the file and hard-refresh (Ctrl+Shift+R)
- Unsplash still showing? Clear cache or check filename matches exactly
