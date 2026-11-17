const COMMONS = 'https://commons.wikimedia.org/wiki';
const CC_BY = 'https://creativecommons.org/licenses/by/4.0/';
const CC_BY_20 = 'https://creativecommons.org/licenses/by/2.0/';
const CC_BY_SA_20 = 'https://creativecommons.org/licenses/by-sa/2.0/';
const CC_BY_SA_30 = 'https://creativecommons.org/licenses/by-sa/3.0/';
const CC_BY_SA_40 = 'https://creativecommons.org/licenses/by-sa/4.0/';
const GFDL_12 = 'https://www.gnu.org/licenses/old-licenses/fdl-1.2.html';
const PUBLIC_DOMAIN = 'https://creativecommons.org/publicdomain/mark/1.0/';
const CC0_LICENSE = 'https://creativecommons.org/publicdomain/zero/1.0/';
const CC_BY_30 = 'https://creativecommons.org/licenses/by/3.0/';

function commonsImage(file, width = 1200) {
  return `${COMMONS}/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

function commonsPage(file) {
  return `${COMMONS}/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
}

// Videos live at a stable Commons path; the poster frame is the first-second
// still, which Special:FilePath renders from the video itself.
function commonsVideo(file) {
  return `${COMMONS}/Special:FilePath/${encodeURIComponent(file)}`;
}

function commonsVideoPoster(file, seconds = 1) {
  return `${COMMONS}/Special:Redirect/file/${encodeURIComponent(file)}?width=1200&thumbtime=${seconds}`;
}

function photo(id, category, title, location, caption, file, credit, license, licenseUrl, imageUrl, sourceUrl) {
  return {
    id,
    category,
    title,
    location,
    caption,
    image: imageUrl || commonsImage(file),
    source: sourceUrl || commonsPage(file),
    credit,
    license,
    licenseUrl,
  };
}

export const GALLERY_CATEGORIES = [
  { id: 'wildlife', label: 'Wildlife', description: 'Savannah species photographed across Tanzania and Zanzibar.' },
  { id: 'parks', label: 'National parks', description: 'Landscapes and wildlife scenes from Tanzania’s protected areas.' },
  { id: 'zanzibar', label: 'Zanzibar', description: 'Island culture, ocean activities, and local life.' },
  { id: 'videos', label: 'Videos', description: 'Moving footage of Kilimanjaro, Serengeti wildlife and the coast.' },
];

export const GALLERY_PHOTOS = [
  photo('lion', 'wildlife', 'African lion', 'Serengeti National Park', 'A male lion surveys the grasslands from a rocky kopje.', '011 The lion king Tryggve in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('leopard', 'wildlife', 'African leopard', 'Serengeti National Park', 'A young leopard rests among the trees.', '001 Juvenile leopard in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('cheetah', 'wildlife', 'Cheetah', 'Serengeti National Park', 'A close look at one of the plains’ most agile hunters.', '037 Cheetah close-up in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('elephant', 'wildlife', 'African bush elephant', 'Tarangire National Park', 'A Tarangire elephant moving through dry woodland.', 'Elefante africano de sabana (Loxodonta africana), parque nacional de Tarangire, Tanzania, 2024-05-24, DD 32.jpg', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('buffalo', 'wildlife', 'African buffalo', 'Tarangire National Park', 'A Cape buffalo photographed in Tarangire.', '', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/B%C3%BAfalo_cafre_%28Syncerus_caffer%29%2C_parque_nacional_de_Tarangire%2C_Tanzania%2C_2024-05-24%2C_DD_31.jpg/960px-B%C3%BAfalo_cafre_%28Syncerus_caffer%29%2C_parque_nacional_de_Tarangire%2C_Tanzania%2C_2024-05-24%2C_DD_31.jpg', 'https://commons.wikimedia.org/wiki/File:B%C3%BAfalo_cafre_(Syncerus_caffer),_parque_nacional_de_Tarangire,_Tanzania,_2024-05-24,_DD_31.jpg'),
  photo('black-rhino', 'wildlife', 'Black rhinoceros', 'Ngorongoro Conservation Area', 'A rare rhino grazing inside the Ngorongoro Crater.', 'Ngorongoro Spitzmaulnashorn.jpg', 'Ikiwaner', 'GFDL 1.2', GFDL_12),
  photo('giraffe', 'wildlife', 'Masai giraffe', 'Serengeti National Park', 'A Masai giraffe walks across the Serengeti.', '042 Masai giraffe in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('zebra', 'wildlife', 'Plains zebra', 'Ngorongoro Conservation Area', 'Plains zebras graze on the crater floor.', 'Zebras Ngorongoro Crater.jpg', 'Muhammad Mahdi Karim', 'GFDL 1.2', GFDL_12),
  photo('wildebeest', 'wildlife', 'Blue wildebeest', 'Serengeti National Park', 'Aerial view of the migration moving across the Serengeti.', 'Wildebeest Migration in Serengeti National Park, Tanzania.jpg', 'Daniel Rosengren', 'CC BY 4.0', CC_BY),
  photo('hippo', 'wildlife', 'Hippopotamus', 'Serengeti National Park', 'Hippos meet in a Serengeti river pool.', '048 Hippopotamus fight in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('crocodile', 'wildlife', 'Nile crocodile', 'Serengeti National Park', 'A crocodile rests along a Serengeti riverbank.', 'Nile crocodile (Crocodylus niloticus) and Egyptian geese Serengeti.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('flamingo', 'wildlife', 'Lesser flamingo', 'Lake Natron', 'Flamingos gather along the alkaline lake.', 'Lesser flamingo - Lake Natron 2023-07-07 01.jpg', 'Bajcetic', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('ostrich', 'wildlife', 'Masai ostrich', 'Serengeti National Park', 'A female ostrich crosses open grassland.', 'Masai ostrich (Struthio camelus massaicus) female Serengeti.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('hyena', 'wildlife', 'Spotted hyena', 'Serengeti National Park', 'A spotted hyena feeds after a night hunt.', 'Spotted hyena (Crocuta crocuta) gnawing bones Serengeti.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('wild-dog', 'wildlife', 'African wild dog', 'Tanzania', 'A pack of wild dogs, also known as painted wolves.', 'Wild Dogs (Lycaon pictus) (16394165128).jpg', 'Bernard Dupont', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('warthog', 'wildlife', 'Common warthog', 'Serengeti National Park', 'A warthog forages through the Serengeti grass.', '027 Common warthog in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('impala', 'wildlife', 'Impala', 'Mikumi National Park', 'A male impala stands alert in the bush.', 'Male impala profile.jpg', 'Muhammad Mahdi Karim', 'GFDL 1.2', GFDL_12),
  photo('gazelle', 'wildlife', 'Thomson’s gazelle', 'Serengeti National Park', 'A Thomson’s gazelle in the Serengeti.', 'Serengeti Thomson\'s gazelle (Eudorcas thomsonii nasalis) male Serengeti.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('baboon', 'wildlife', 'Olive baboon', 'Serengeti National Park', 'An olive baboon carries its young through the park.', '044 Olive baboon with baby on the back in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('red-colobus', 'wildlife', 'Zanzibar red colobus', 'Jozani Chwaka Bay National Park', 'An endemic red colobus feeds in Jozani Forest.', 'Zanzibar Red Colobus Monkey.jpg', 'Hasin Shakur', 'GFDL 1.2', GFDL_12),

  photo('serengeti-park', 'parks', 'Serengeti National Park', 'Northern Tanzania', 'Kopjes and open plains across the Serengeti landscape.', 'Kopjes on the serengeti national park tanzania africa landscape.jpg', 'Serengeti Landscapes', 'Public domain', PUBLIC_DOMAIN),
  photo('ngorongoro-park', 'parks', 'Ngorongoro Crater', 'Ngorongoro Conservation Area', 'A panoramic view across the volcanic caldera.', '', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/Cr%C3%A1ter_volc%C3%A1nico%2C_zona_de_conservaci%C3%B3n_de_Ngorongoro%2C_Tanzania%2C_2024-05-27%2C_DD_11.jpg/1280px-Cr%C3%A1ter_volc%C3%A1nico%2C_zona_de_conservaci%C3%B3n_de_Ngorongoro%2C_Tanzania%2C_2024-05-27%2C_DD_11.jpg', 'https://commons.wikimedia.org/wiki/File:Cr%C3%A1ter_volc%C3%A1nico,_zona_de_conservaci%C3%B3n_de_Ngorongoro,_Tanzania,_2024-05-27,_DD_11.jpg'),
  photo('tarangire-park', 'parks', 'Tarangire National Park', 'Northern Tanzania', 'Tarangire at the height of the dry season.', 'Pogled na Nacionalni park Tarangire na vrhuncu sušne sezone.jpg', 'Nikola Smarčić', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('manyara-park', 'parks', 'Lake Manyara National Park', 'Northern Tanzania', 'Look out over Lake Manyara and the Rift Valley escarpment.', 'Overlooking Lake Manyara NP.jpg', 'LoJallen', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('nyerere-park', 'parks', 'Nyerere National Park', 'Southern Tanzania', 'A lion photographed in the former Selous Game Reserve.', 'Nyerere National Park (1).jpg', 'Erasmus Kamugisha', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('ruaha-park', 'parks', 'Ruaha National Park', 'Southern Tanzania', 'Baobab-studded wilderness in Tanzania’s southern circuit.', 'Ruaha National Park landscape (1) (28746421030).jpg', 'Richard Mortel', 'CC BY 2.0', CC_BY_20),

  photo('stone-town', 'zanzibar', 'Walk through Stone Town', 'Zanzibar City', 'A wide view of Zanzibar’s historic waterfront and old town.', 'Zanzibar Panorama.jpg', 'Muhammad Mahdi Karim', 'GFDL 1.2', GFDL_12),
  photo('dhow-sailing', 'zanzibar', 'Sail on a traditional dhow', 'Zanzibar coast', 'A dhow sails across the Indian Ocean near Zanzibar.', 'Dhow znz.jpg', 'Muhammad Mahdi Karim', 'GFDL 1.2', GFDL_12),
  photo('dolphin-trip', 'zanzibar', 'Dolphin watching by boat', 'Indian Ocean near Zanzibar', 'A local boat tour heads out to observe dolphins.', 'Dolphin tour in Zanzibar.jpg', 'Prof. Chen Hualin', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('seaweed-farm', 'zanzibar', 'Visit a seaweed farm', 'Jambiani, Zanzibar', 'Women harvest seaweed from shallow coastal plots at low tide.', 'Harvesting seaweed in Jambiani.jpg', 'Yann Macherez', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('jozani-walk', 'zanzibar', 'Explore Jozani Forest', 'Jozani Chwaka Bay National Park', 'Follow forest paths through Zanzibar’s protected woodland.', 'Jozani forest.png', 'Esculapio', 'Public domain', PUBLIC_DOMAIN),
  photo('kitesurfing', 'zanzibar', 'Kitesurf along the island coast', 'Zanzibar', 'A kiteboarder rides the wind off Zanzibar.', 'Zanzibar island Copia (22).jpg', 'Gianfranco Gori', 'CC BY-SA 3.0', CC_BY_SA_30),

  // ---- wildlife (added) ----
  photo('male-lion-on-the-prowl', 'wildlife', 'Male lion on the prowl', 'Serengeti National Park', 'A male lion moves through open grassland on the Serengeti plains.', '002 Male Lion prowling in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('the-lion-king', 'wildlife', 'The lion king', 'Serengeti National Park', 'A full-maned lion rests in the long grass of Seronera.', '002 The lion king Snyggve in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('masai-giraffe', 'wildlife', 'Giraffe on the Serengeti skyline', 'Serengeti National Park', 'A giraffe stands tall against the Serengeti skyline.', '014 Giraffe in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('wildebeest-and-starlings', 'wildlife', 'Wildebeest and starlings', 'Serengeti National Park', 'Wattled starlings ride the back of a grazing wildebeest.', '040 Blue wildebeest with wattled starlings in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('giraffe-on-the-move', 'wildlife', 'Giraffe on the move', 'Serengeti National Park', 'A giraffe walks a line of acacia across the plains.', '007 Giraffe walking in the Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('antelope-in-lake-manyara', 'wildlife', 'Antelope in Lake Manyara', 'Lake Manyara National Park', 'Antelope graze in the groundwater forest below the escarpment.', 'Antelope, Lake Manyara National Park - 2015-01-13 - 02-34-49.jpg', 'John Mackenzie Burke', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('antelope-on-the-crater-floor', 'wildlife', 'Antelope on the crater floor', 'Ngorongoro Conservation Area', 'Small antelope shelter on the open crater plain.', 'Antelope, Ngorongoro (2015) - 2015-01-14 - 00-50-32.jpg', 'John Mackenzie Burke', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('eland-antelope', 'wildlife', 'Eland antelope', 'Northern Serengeti', 'The largest antelope species, an eland bull in open country.', 'Eland Antelope, Northern Serengeti, Tanzania.jpg', 'Christoph Strässler', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('tarangire-elephant', 'wildlife', 'Tarangire elephant', 'Tarangire National Park', 'An elephant crosses the Tarangire dry riverbed.', 'Elephant - Tarangire National Park - Tanzania (35111633125).jpg', 'Gary Bembridge from London, UK', 'CC BY 2.0', CC_BY_20),
  photo('elephant-at-dusk', 'wildlife', 'Elephant at dusk', 'Tarangire National Park', 'An elephant comes in close to camp as the light fades.', 'Elephant visitor at dusk at Tarangire Treetops Lodge (1) (28394906710).jpg', 'Richard Mortel from Riyadh, Saudi Arabia', 'CC BY 2.0', CC_BY_20),
  photo('elephant-at-tarangire-treetops', 'wildlife', 'Elephant at Tarangire Treetops', 'Tarangire National Park', 'A visitor noses around the lodge grounds at golden hour.', 'Elephant visitor at Tarangire Treetops (1) (28677922765).jpg', 'Richard Mortel from Riyadh, Saudi Arabia', 'CC BY 2.0', CC_BY_20),
  photo('giraffe-among-the-trees', 'wildlife', 'Giraffe among the trees', 'Serengeti National Park', 'A giraffe browses between scattered trees on the plains.', 'Giraffe in Serengeti National Park with Trees.jpg', 'Maximilian Staub', 'CC BY 4.0', CC_BY),
  photo('leopard-at-rest', 'wildlife', 'Leopard at rest', 'Serengeti National Park', 'A leopard rests low in the grass, perfectly still.', 'Leopard Serengeti.jpg', 'Naturedata', 'CC0', CC0_LICENSE),
  photo('leopard-in-a-tree', 'wildlife', 'Leopard in a tree', 'Serengeti National Park', 'A leopard keeps watch from the fork of a tree.', 'Leopard tree Serengeti-1.jpg', 'David Berkowitz', 'CC BY 2.0', CC_BY_20),
  photo('serengeti-leopard', 'wildlife', 'Serengeti leopard', 'Serengeti National Park', 'A wild leopard photographed in the Serengeti.', 'Leopard-Serengeti.jpg', 'Tobi 87', 'CC BY-SA 3.0', CC_BY_SA_30),
  photo('lioness', 'wildlife', 'Lioness', 'Serengeti National Park', 'A lioness scans the plain from the long grass.', 'Lion (Panthera leo) female Serengeti 2.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('the-migration', 'wildlife', 'The migration', 'Serengeti National Park', 'Wildebeest herds thicken across the open plains.', 'Serengeti wildebeest migration JF2.jpg', 'Wolves201', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('blue-wildebeest', 'wildlife', 'Blue wildebeest in full coat', 'Serengeti National Park', 'A blue wildebeest in full coat, Serengeti.', 'Western white-bearded wildebeest (Connochaetes taurinus mearnsi) Serengeti.jpg', 'Charles J. Sharp', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('zebra-on-the-move', 'wildlife', 'Zebra on the move', 'Serengeti National Park', 'A zebra keeps pace with the migrating herds.', 'Zebra in the Serengeti Wildebeest Migration.jpg', 'David Dennis from Pozuelo de Alarcón, Madrid, Spain', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('zanzibar-red-colobus', 'wildlife', 'Endemic red colobus in Jozani Forest', 'Jozani Chwaka Bay National Park', 'The island\'s endemic red colobus, found nowhere else on Earth.', 'Colobo rojo de Zanzíbar (Piliocolobus kirkii), parque nacional de la Bahía Jozani Chwaka, Zanzíbar, Tanzania, 2024-06-02, DD 05.jpg', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('vervet-monkey', 'wildlife', 'Vervet monkey', 'Tanzania', 'A black-faced vervet sits alert in the bush.', 'Black faced vervet monkey Chlorocebus pygerythrus in Tanzania 0737 Nevit.jpg', 'Nevit Dilmen ( talk )', 'CC BY-SA 3.0', CC_BY_SA_30),
  photo('blue-monkey', 'wildlife', 'Blue monkey', 'Mount Meru', 'A blue monkey in the forested slopes of Mount Meru.', 'Blue Monkey - Mount Meru - Tanzania (30251961678).jpg', 'Andy Witchger', 'CC BY 2.0', CC_BY_20),
  photo('buffalo-herd', 'wildlife', 'Buffalo herd', 'Tanzania', 'A herd of Cape buffalo shelter together beneath a large tree.', 'Buffalo Herd Under Big Tree.jpg', 'Eric Kilby', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('cape-buffalo', 'wildlife', 'Cape buffalo', 'Tarangire National Park', 'A heavy-horned Cape buffalo watches from the open ground.', 'Cape Buffalo in Tarangire - Flickr - gailhampshire.jpg', 'gailhampshire from Cradley, Malvern, U.K', 'CC BY 2.0', CC_BY_20),
  photo('hippo-and-crocodile', 'wildlife', 'Hippo and crocodile', 'Tanzania', 'A hippo shares the water with a waiting crocodile.', 'Hippo and croco.jpg', 'Stig Nygaard from Copenhagen, Denmark', 'CC BY 2.0', CC_BY_20),
  photo('hippo-in-floodwater', 'wildlife', 'Hippo in floodwater', 'Tanzania', 'Hippos hold station in a river swollen by the rains.', 'HIPPO HOME DURING RIVER FLOODING.jpg', 'Scripturethinker', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('hyena-and-zebra', 'wildlife', 'Hyena and zebra', 'Maasai Mara, Kenya', 'A spotted hyena confronts a Grant\'s zebra on the plain.', 'Spotted Hyena vs Grant\'s Zebra, Maasai Mara (46982289172).jpg', 'Ray in Manila', 'CC BY 2.0', CC_BY_20),
  photo('cheetah-and-hyena', 'wildlife', 'Cheetah and hyena', 'Serengeti National Park', 'A cheetah keeps a wary eye on a passing hyena.', 'Wary Cheetah and Passing Hyena.jpg', 'Eric Kilby', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('zebra-herd', 'wildlife', 'Zebra herd', 'Serengeti National Park', 'A close-packed herd of plains zebra.', 'Zebra Herd Michael makalundwa.jpg', 'Michael Mwakalundwa', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('cheetah-hissing', 'wildlife', 'Cheetah hissing', 'Serengeti National Park', 'A cheetah hisses to hold off a hyena circling its kill.', 'Cheetah Hissing at Hyena.jpg', 'Eric Kilby', 'CC BY-SA 2.0', CC_BY_SA_20),

  // ---- parks (added) ----
  photo('baobab-of-tarangire', 'parks', 'Baobab of Tarangire', 'Tarangire National Park', 'An ancient baobab stands in Tarangire\'s baobab country.', 'Baobab (Adansonia digitata), parque nacional de Tarangire, Tanzania, 2024-05-24, DD 21.jpg', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('sunrise-over-the-serengeti', 'parks', 'Sunrise over the Serengeti', 'Serengeti National Park', 'First light breaks across the Serengeti plains.', '004 Sunrise at Serengeti National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('giraffe-portrait', 'parks', 'Giraffe portrait', 'Lake Manyara National Park', 'A close portrait of a giraffe beside Lake Manyara.', '006 Giraffe portrait in the Lake Manyara National Park Photo by Giles Laurent.jpg', 'Giles Laurent', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('tarangire-landscape', 'parks', 'Tarangire landscape', 'Tarangire National Park', 'Open Tarangire country under a wide sky.', '2024-06-06 Tarangire landscape 0095.jpg', 'Bärbel Miemietz', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('arusha-to-tarangire', 'parks', 'Arusha to Tarangire', 'Tarangire National Park', 'The baobab-studded road out of Arusha toward Tarangire.', '27-12-\'71 Tanzania - Arusha Tarangire - Baobabs.jpg', 'Guus Gorter', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('lake-masek-from-the-air', 'parks', 'Lake Masek from the air', 'Ngorongoro Conservation Area', 'The shallow soda lake of Masek inside the conservation area.', 'Aerial view of Lake Masek, Ngorongoro Conservation Area, Tanzania.jpg', 'Arnold Tibaijuka', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('ngorongoro-highlands', 'parks', 'Ngorongoro highlands', 'Ngorongoro Conservation Area', 'Volcanic highlands rise above the crater rim.', 'Aerial view of Tanzania’s volcanic highlands in Ngorongoro.jpg', 'Arnold Tibaijuka', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('baobab', 'parks', 'Baobab', 'Tarangire National Park', 'A solitary baobab marks the Tarangire landscape.', 'Baobab in Tarangire NP.jpg', 'Jorge Láscar from Melbourne, Australia', 'CC BY 2.0', CC_BY_20),
  photo('elephants-at-lake-manyara', 'parks', 'Elephants at Lake Manyara', 'Lake Manyara National Park', 'Elephants move through Manyara\'s forested western shore.', 'Elephants, Lake Manyara National Park (2015).jpg', 'John Mackenzie Burke', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('forest-elephant', 'parks', 'Forest elephant', 'Lake Manyara National Park', 'A forest elephant in Lake Manyara\'s mature woodland.', 'Forest elephant Lake Manyara National Park (2015).jpg', 'John Mackenzie Burke', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('giraffe-in-ruaha', 'parks', 'Giraffe in Ruaha', 'Ruaha National Park', 'A giraffe stands tall in Ruaha\'s riverine bush.', 'Giraffe, Ruaha National Park (10) (28121529844).jpg', 'Richard Mortel from Riyadh, Saudi Arabia', 'CC BY 2.0', CC_BY_20),
  photo('zebras-and-buffalo', 'parks', 'Zebras and buffalo', 'Ngorongoro Conservation Area', 'Zebra and buffalo herds share the crater floor.', 'Landscape with zebras and buffalos in ngorongoro crater.jpg', 'Rasheedhrasheed', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('crater-herds', 'parks', 'Crater herds', 'Ngorongoro Conservation Area', 'Plains zebra and buffalo graze together inside the caldera.', 'Plains Zebras and African Buffalo Herd in Ngorongoro Crater.jpg', 'Rasheedhrasheed', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('young-elephant', 'parks', 'Young elephant', 'Lake Manyara National Park', 'A calf keeps pace beside its herd in Manyara.', 'Young elephant, Lake Manyara National Park (2015).jpg', 'John Mackenzie Burke', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('zebras-at-the-water', 'parks', 'Zebras at the water', 'Tarangire National Park', 'Zebra line up to drink during the dry season.', 'Zebras drinking in Tarangire National Park.JPG', 'Jorge Láscar from Melbourne, Australia', 'CC BY 2.0', CC_BY_20),
  photo('cape-buffalo-2', 'parks', 'Buffalo at the crater rim', 'Ngorongoro Conservation Area', 'A buffalo rests near the crater rim road.', 'Buffalo at Ngorongoro Crater Residence Office.jpg', 'Erasmus Kamugisha', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('wildebeest-at-lake-natron', 'parks', 'Wildebeest at Lake Natron', 'Lake Natron', 'Wildebeest graze on the flats around the alkaline lake.', 'Common wildebeest - Lake Natron 2023-07-07 01.jpg', 'Eliaking12', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('flamingos-at-lake-natron', 'parks', 'Flamingos at Lake Natron', 'Lake Natron', 'A shallow of pink across Lake Natron\'s edge.', 'Flamingos at Lake Natron (1) (28552154096).jpg', 'Richard Mortel from Riyadh, Saudi Arabia', 'CC BY 2.0', CC_BY_20),
  photo('flamingo-shoreline', 'parks', 'Flamingo shoreline', 'Lake Natron', 'Flamingos wade the shallows of the Rift Valley lake.', 'Flamingos at Lake Natron, Tanzania - 33293778933.jpg', 'Christoph Strässler', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('lesser-flamingo', 'parks', 'Flamingos at the lake shore', 'Lake Natron', 'Lesser flamingos gather where the lake water meets the shore.', 'Lesser flamingo - Lake Natron 2023-07-07 02.jpg', 'Bajcetic', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('giraffes-near-arusha', 'parks', 'Giraffes near Arusha', 'Arusha Region', 'Giraffes in open country on the Arusha plain.', 'Giraffes Arusha Tanzania.jpg', 'Geir Kiste', 'CC BY-SA 3.0', CC_BY_SA_30),
  photo('lioness-at-the-water', 'parks', 'Lioness at the water', 'Ngorongoro Conservation Area', 'A lioness comes down to drink inside the crater.', 'Lioness by the Water in Ngorongoro Crater.jpg', 'Rasheedhrasheed', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('sleeping-lion', 'parks', 'Sleeping lion', 'Lake Manyara National Park', 'A lion sleeps off in the shade of a Manyara fig tree.', 'Sleeping lion, Lake Manyara National Park (2015).jpg', 'John Mackenzie Burke', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('giraffes-and-kilimanjaro', 'parks', 'Giraffes and Kilimanjaro', 'Kilimanjaro Region', 'Giraffes graze with the mountain rising behind them.', 'Giraffes And Kilimanjaro (35248776).jpeg', 'Jalil Arfaoui', 'CC BY 3.0', CC_BY_30),
  photo('ngorongoro-from-the-air', 'parks', 'Ngorongoro from the air', 'Ngorongoro Conservation Area', 'The crater and its rim seen from above.', 'Aerial view of the Ngorongoro volcanic landscape, Tanzania.jpg', 'Arnold Tibaijuka', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('savannah-and-highlands', 'parks', 'Savannah and highlands', 'Ngorongoro Conservation Area', 'Open savannah gives way to the volcanic highlands.', 'Aerial view of the savannah and volcanic highlands of Ngorongoro.jpg', 'Arnold Tibaijuka', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('baobab-and-blue-sky', 'parks', 'Baobab and blue sky', 'Tarangire National Park', 'A baobab framed against Tarangire\'s clear sky.', 'Baobab Tree in Tarangire National Park with blue sky.jpg', 'Maximilian Staub', 'CC BY 4.0', CC_BY),
  photo('tarangire-baobab', 'parks', 'Tarangire baobab', 'Tarangire National Park', 'One of Tarangire\'s many giant baobabs.', 'Baobab Tree in Tarangire National Park.jpg', 'Maximilian Staub', 'CC BY 4.0', CC_BY),
  photo('ruaha-baobab', 'parks', 'Ruaha baobab', 'Ruaha National Park', 'Baobabs punctuate the drier country of Ruaha.', 'Baobab tree, Ruaha National Park (1) (28645686611).jpg', 'Richard Mortel from Riyadh, Saudi Arabia', 'CC BY 2.0', CC_BY_20),
  photo('ruaha-baobab-country', 'parks', 'Ruaha baobab country', 'Ruaha National Park', 'A lone baobab stands over the Ruaha plains.', 'Baobab tree, Ruaha National Park (2) (28645552981).jpg', 'Richard Mortel from Riyadh, Saudi Arabia', 'CC BY 2.0', CC_BY_20),

  // ---- zanzibar (added) ----
  photo('stone-town-architecture', 'zanzibar', 'Stone Town architecture', 'Stone Town, Zanzibar', 'Carved doors and coral-rag walls in Stone Town\'s old quarter.', 'Departamento de museos y antigüedades, Stone Town, Zanzíbar, Tanzania, 2024-05-31, DD 33-35 HDR.jpg', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('the-old-fort', 'zanzibar', 'The Old Fort', 'Stone Town, Zanzibar', 'Stone Town\'s old fort, built over the slave trade\'s trading post.', 'Fuerte Viejo, Stone Town, Zanzíbar, Tanzania, 2024-05-31, DD 32.jpg', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('the-sultan-s-palace', 'zanzibar', 'The Sultan\'s Palace', 'Stone Town, Zanzibar', 'Mirrored palace facades on the seafront in Stone Town.', 'Palacio del Sultán, Stone Town, Zanzíbar, Tanzania, 2024-05-31, DD 24.jpg', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('bamnara-mosque', 'zanzibar', 'Bamnara Mosque', 'Stone Town, Zanzibar', 'A carved door of Zanzibar\'s oldest surviving mosque.', 'Bamnara Mosque, Unguja Zanzibar.jpg', 'LUCY MBUNGO', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('beach-life-at-low-tide', 'zanzibar', 'Beach life at low tide', 'Zanzibar coast', 'Zanzibar\'s tidal flats empty as the water draws back.', 'Beach life - Zanzibar - Low water time (33952871105).jpg', 'Mussi Katz from Israel', 'Public domain', PUBLIC_DOMAIN),
  photo('mtoni-marine', 'zanzibar', 'Mtoni Marine', 'Zanzibar coast', 'Waves break on the reef just outside Stone Town.', 'Beach Scene at Mtoni Marine - Outside Stone Town - Zanzibar - Tanzania (8869338564).jpg', 'Adam Jones from Kelowna, BC, Canada', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('zanzibar-beach', 'zanzibar', 'Zanzibar beach', 'Zanzibar coast', 'White sand and shallow turquoise water off the coast.', 'Beach, Zanzibar (17196898138).jpg', 'Rod Waddington', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('jozani-coastal-forest', 'zanzibar', 'Jozani coastal forest', 'Jozani Chwaka Bay National Park', 'Rare coastal forest surviving on Zanzibar\'s south coast.', 'Coastal forest at Jozani Chwaka Bay National Park, Kusini DC, South Zanzibar, Tanzania.jpg', 'Mnazini', 'CC BY 4.0', CC_BY),
  photo('dhow-under-sail', 'zanzibar', 'Dhow under sail', 'Zanzibar coast', 'A wooden dhow carries sail across Zanzibar waters.', 'Dhow boat Zanzibar.jpg', 'This photo was taken by Anton Zelenov . Please credit this w', 'CC BY-SA 3.0', CC_BY_SA_30),
  photo('dhow-at-sunset', 'zanzibar', 'Dhow at sunset', 'Zanzibar coast', 'Dhows return to shore as the sun drops.', 'Dhow Sunset, Zanzibar (10164046475).jpg', 'Rod Waddington from Kergunyah, Australia', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('dhow', 'zanzibar', 'Dhow', 'Zanzibar coast', 'The traditional sailing boat of the Zanzibar coast.', 'Dhow, Zanzibar.jpg', 'Raf24~commonswiki', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('fishing-on-the-indian-ocean', 'zanzibar', 'Fishing on the Indian Ocean', 'Zanzibar coast', 'Fishermen work the reef beyond Zanzibar\'s shore.', 'Fishermen Indian Ocean Zanzibar (21729128745).jpg', 'Esin Üstün from Istanbul, Turkey', 'CC BY 2.0', CC_BY_20),
  photo('zanzibar-fishermen', 'zanzibar', 'Zanzibar fishermen', 'Zanzibar coast', 'Local fishermen bring a catch in off the coast.', 'Fishermen, Zanzibar (17178010487).jpg', 'Rod Waddington', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('fishing-boat', 'zanzibar', 'Fishing boat', 'Zanzibar coast', 'A wooden fishing boat moored off the Zanzibar shore.', 'Fishing Boat in Zanzibar.jpg', 'Natalie Carberi', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('jozani-forest', 'zanzibar', 'Jozani Forest', 'Jozani Chwaka Bay National Park', 'The forest that shelters Zanzibar\'s endemic red colobus.', 'Jozani Forest at Jozani Chwaka Bay National Park, Kusini DC, South Zanzibar, Tanzania.jpg', 'Mnazini', 'CC BY 4.0', CC_BY),
  photo('jozani-mangroves', 'zanzibar', 'Jozani mangroves', 'Jozani Chwaka Bay National Park', 'Mangrove roots line the tidal edge of the bay.', 'Magrove forest, Jozani Chwaka Bay National Park, Kusini DC, South Zanzibar, Tanzania.jpg', 'Mnazini', 'CC BY 4.0', CC_BY),
  photo('bamnara-mosque-door', 'zanzibar', 'Bamnara Mosque door', 'Stone Town, Zanzibar', 'Studded timber and carved plaster on the mosque door.', 'Bamnara Mosque in Zanzibar ,stone town.jpg', 'Erasmus Kamugisha', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('forodhani-gardens', 'zanzibar', 'Forodhani Gardens', 'Stone Town, Zanzibar', 'The night food market set up in Forodhani Gardens by the port.', 'Parque Forodhani, Stone Town, Zanzíbar, Tanzania, 2024-05-31, DD 29-31 HDR.jpg', 'Diego Delso', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('approaching-zanzibar', 'zanzibar', 'Approaching Zanzibar', 'Zanzibar coast', 'The island seen on the run in from the open sea.', 'Approaching Zanzibar.jpg', 'Rob from United Kingdom', 'CC BY 2.0', CC_BY_20),
  photo('beach-football', 'zanzibar', 'Beach football', 'Zanzibar coast', 'A game of football on the sand at low tide.', 'Boys playing on a Zanzibar beach.jpg', 'Simionescu Victor', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('cattle-on-the-beach', 'zanzibar', 'Cattle on the beach', 'Zanzibar coast', 'Zanzibar\'s iconic Zanzibar cattle graze the tidal flats.', 'Cattle on a beach in Zanzibar.jpg', 'AmyAbroad', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('nudibranch', 'zanzibar', 'Nudibranch', 'Zanzibar coast', 'A colour-changing sea slug on Zanzibar\'s reef.', 'Chromodoris quadricolor, Zanzibar.jpg', 'Olivier Lejade', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('zanzibar-cows', 'zanzibar', 'Zanzibar cows', 'Zanzibar coast', 'Free-ranging cattle on Zanzibar\'s wide sand flats.', 'Cows on a beach in Zanzibar.jpg', 'AmyAbroad', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('fishing-boat-ashore', 'zanzibar', 'Fishing boat ashore', 'Zanzibar coast', 'A fishing boat pulled up on the Zanzibar shoreline.', 'Fishing Boat, Zanzibar (17198860090).jpg', 'Rod Waddington', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('sail-and-fishing-boat', 'zanzibar', 'Sail and fishing boat', 'Zanzibar coast', 'A small sail works alongside fishing craft off Zanzibar.', 'Fishing sail boat in Zanzibar.jpg', 'Sarvesh Lutchmun', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('fishing-from-a-boat', 'zanzibar', 'Fishing from a boat', 'Zanzibar coast', 'Fishermen work their lines from a boat off Zanzibar.', 'Guys fishes on a boat in Zanzibar.jpg', 'Avishai Winiwarter', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('young-fishermen', 'zanzibar', 'Young fishermen', 'Zanzibar coast', 'Children learn to fish from a boat off the coast.', 'Kids fish in Zanzibar on a boat.jpg', 'Avishai Winiwarter', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('hauling-in-the-dory', 'zanzibar', 'Hauling in the dory', 'Zanzibar coast', 'Boys push a fishing boat up the beach together.', 'Kids pushing fishing boat to shore in Zanzibar.jpg', 'Avishai Winiwarter', 'CC BY-SA 4.0', CC_BY_SA_40),
  photo('stone-town-beach', 'zanzibar', 'Stone Town beach', 'Stone Town, Zanzibar', 'The shoreline that fronts Stone Town\'s old harbour.', 'Stone Town Beach, Zanzibar (16794828306).jpg', 'Rod Waddington', 'CC BY-SA 2.0', CC_BY_SA_20),
  photo('zanzibar-sunset', 'zanzibar', 'Zanzibar sunset', 'Zanzibar coast', 'The sun drops into the Indian Ocean off Zanzibar.', 'Sunset in Zanzibar.JPG', 'Manu Sánchez', 'CC BY-SA 3.0', CC_BY_SA_30),

];

// --- Videos ---
// Commons has only a handful of freely-licensed Tanzanian clips, so this list
// is deliberately short rather than padded with unrelated footage. Every entry
// links to its source page so the licence and attribution stay checkable.
//
// Wikimedia serves these as .webm (VP8/VP9), which Chrome, Edge and Firefox
// play natively. Safari on older macOS/iOS cannot decode VP8/VP9, so the card
// shows a poster frame plus a direct link to the file rather than a dead box.
function video(id, title, location, caption, file, credit, license, licenseUrl, posterUrl) {
  return {
    id,
    category: 'videos',
    type: 'video',
    title,
    location,
    caption,
    image: posterUrl || commonsVideoPoster(file),
    video: commonsVideo(file),
    source: commonsPage(file),
    credit,
    license,
    licenseUrl,
  };
}

export const GALLERY_VIDEOS = [
  video('video-serengeti-crocodile', 'Crocodile ambushes a wildebeest', 'Grumeti River, Serengeti', 'A Nile crocodile takes down a blue wildebeest at the Grumeti.', 'Nile crocodile ambushes a wildebeest.webm', 'Bettina May', 'CC BY 3.0', CC_BY_30),
  video('video-kilimanjaro-climb', 'Summiting Mount Kilimanjaro', 'Mount Kilimanjaro', 'The climb to Africa\u2019s highest mountain, filmed by a 2008 team.', 'Kilimanjaro.webm', 'wclep', 'CC BY 3.0', CC_BY_30),
  video('video-kilimanjaro-summit', 'On the summit of Kilimanjaro', 'Mount Kilimanjaro', 'A climber reaches Uhuru Peak on the 7 Summits climb.', 'KIlimanjaro Summit-zfJAgd3kSzk.webm', 'Alan Arnette', 'CC BY 3.0', CC_BY_30),
  video('video-flamingo-dance', 'Lesser flamingo courtship', 'East African Rift lakes', 'Lesser flamingos perform their synchronised dawn display.', 'Lesser flamingos courtship display dance.webm', 'Shiv\u2019s fotografia', 'CC BY 4.0', CC_BY),
  video('video-cheetah-family', 'Cheetah family at a kill', 'Kruger National Park, South Africa', 'A mother cheetah and four cubs feed on an impala.', 'Cheetah family at a kill.webm', 'Lennart Hessel', 'CC BY 3.0', CC_BY_30),
  video('video-leopard-cubs', 'Leopard with two cubs', 'Kruger National Park, South Africa', 'A female leopard moves through the bush with her cubs.', 'Female leopard (Panthera pardus) with two cubs.webm', 'Bernard DUPONT', 'CC BY-SA 2.0', CC_BY_SA_20),
  video('video-cheetah-feeding', 'Cheetah feeding on a springbok', 'Kgalagadi, South Africa', 'A male cheetah feeds on a springbok in the Auob riverbed.', 'Cheetah (Acinonyx jubatus) male eating its prey, a male springbok ....webm', 'Bernard DUPONT', 'CC BY-SA 2.0', CC_BY_SA_20),
  video('video-cheetah-resting', 'Cheetah resting in the shade', 'Kgalagadi, South Africa', 'A cheetah cooling off in the shade of the riverbed.', 'Cheetah (Acinonyx jubatus) male resting in the shade ....webm', 'Bernard DUPONT', 'CC BY-SA 2.0', CC_BY_SA_20),
  video('video-giraffe-feeding', 'Giraffe feeding', 'Kruger National Park, South Africa', 'A giraffe browses on leaves in the bush.', 'Giraffe eating leaves.webm', 'Lennart Hessel', 'CC BY 3.0', CC_BY_30),
];

// Photos and videos in one array so the page can render them uniformly.
export const GALLERY_ITEMS = [...GALLERY_PHOTOS, ...GALLERY_VIDEOS];
