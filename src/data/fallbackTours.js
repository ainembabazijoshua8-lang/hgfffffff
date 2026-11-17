import { TOUR_CATALOG } from '../../server/tourCatalog.js';

const fallbackFeaturedTours = TOUR_CATALOG.filter(tour => tour.featured);

export { TOUR_CATALOG as fallbackTours, fallbackFeaturedTours };
