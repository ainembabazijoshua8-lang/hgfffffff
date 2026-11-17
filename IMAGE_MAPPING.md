# Image Mapping Strategy

## Tour/Activity Auto-Matched Images

### Kilimanjaro Trek (kilimanjaro-lemosho)
- kilimanjaro-summit-sign.jpg → Hero image
- kilimanjaro-snowy-peak-1.jpg → Gallery 1
- kilimanjaro-snowy-peak-2.jpg → Gallery 2
- kilimanjaro-trekkers-summit.jpg → Gallery 3

### Serengeti Classic Safari (serengeti-classic)
- serengeti-dry-landscape-1.jpg → Hero image
- serengeti-acacia-tree.jpg → Gallery 1
- serengeti-safari-vehicle.jpg → Gallery 2
- serengeti-road.jpg → Gallery 3

### Great Migration - Mara River (great-migration-mara)
- mara-lioness-grassland.jpg → Hero image
- mara-elephant-bw.jpg → Gallery 1
- mara-landscape.jpg → Gallery 2
- mara-river-area.jpg → Gallery 3

### Maasai Mara Luxury Escape (maasai-mara-luxury)
- zanzibar-wedding-honeymoon.jpg → Hero image (romantic setting)
- mara-herd.jpg → Gallery 1
- mara-jeep.jpg → Gallery 2

### Cultural Activities
- **Maasai Village:** maasai-cultural-group.jpg
- **Hadzabe Hunt:** maasai-warrior-single.jpg
- **Zanzibar Spice Tour:** man-with-kettle.jpg

### Water Activities
- **Snorkeling/Mnemba:** snorkel-reef (3x images)
- **Diving:** dive-deep-sea (2x images)  
- **Dhow Cruise:** island-scenic-view.jpg

### Adventure/Wellness
- **Walking Safari:** hiker-savanna.jpg
- **Trekking General:** backpacker-forest.jpg
- **Yoga/Wellness:** island-retreat-view.jpg

---

## Current Placeholder URLs (to be replaced)

### In `fallbackTours.js`
- serengeti-classic: photo-1486325212027-8081e485255e
- kilimanjaro-lemosho: photo-1518684079-3c830dcef090
- maasai-mara-luxury: photo-1516426122078-c23e76319801

### In `activitiesCatalog.js`
- All activity images use Unsplash URLs that will be replaced with local /assets/uploads/ paths

---

## Implementation Plan
1. Move images to `/public/assets/uploads/` with descriptive names
2. Update `fallbackTours.js` to use local image paths
3. Update `activitiesCatalog.js` to use local image paths
4. Test in dev mode to confirm images load
