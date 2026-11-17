#!/usr/bin/env node

/**
 * Image Setup Script
 * 
 * This script prepares image references for Jebri Safaris tours/activities.
 * Since images are provided, this maps them to the correct locations and
 * updates all data files to use local paths instead of Unsplash URLs.
 */

const fs = require('fs');
const path = require('path');

// Image mapping: tour/activity ID → image filenames
const IMAGE_ASSIGNMENTS = {
  // Tour hero images
  'kilimanjaro-lemosho': {
    hero: 'kilimanjaro-summit-sign.jpg',
    gallery: ['kilimanjaro-snowy-peak-1.jpg', 'kilimanjaro-snowy-peak-2.jpg', 'kilimanjaro-trekkers-summit.jpg']
  },
  'serengeti-classic': {
    hero: 'serengeti-dry-landscape.jpg',
    gallery: ['serengeti-acacia-tree.jpg', 'serengeti-safari-vehicle.jpg', 'serengeti-road.jpg']
  },
  'great-migration-mara': {
    hero: 'mara-lioness.jpg',
    gallery: ['mara-elephant-bw.jpg', 'mara-herd.jpg', 'mara-jeep.jpg']
  },
  'maasai-mara-luxury': {
    hero: 'zanzibar-wedding.jpg',
    gallery: ['mara-landscape.jpg', 'mara-jeep-2.jpg']
  },
  
  // Activity images
  'maasai-village': ['maasai-group.jpg'],
  'hadzabe-hunt': ['maasai-warrior.jpg'],
  'night-game-drive': ['mara-lioness.jpg'],
  'walking-safari': ['hiker-savanna.jpg'],
  'balloon-serengeti': [],
  'giraffe-centre': ['giraffe-landscape.jpg'],
  'sunset-dhow': ['zanzibar-island.jpg'],
  'mnemba-snorkel': ['snorkel-reef-1.jpg', 'snorkel-reef-2.jpg', 'snorkel-reef-3.jpg'],
  'deep-sea-fishing': ['diver-1.jpg', 'diver-2.jpg'],
};

console.log('✓ Image mapping configuration ready');
console.log('✓ Next: Move images to /public/assets/uploads/ with the filenames listed above');
console.log('✓ Then run: npm run update-images');
