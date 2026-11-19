import { useState, useEffect } from 'react';
import { SiteIcon } from './Icons.jsx';

const PACKING_CATEGORIES = [
  {
    id: 'clothing',
    title: 'Safari Clothing & Layers',
    icon: 'shirt',
    note: 'Neutral bush colors (khaki, olive, beige) are practical for dust and sun. Long sleeves also help with sun and insect protection.',
    items: [
      { id: 'c1', name: 'Lightweight neutral long-sleeve shirts (sun & insect protection)', essential: true },
      { id: 'c2', name: 'Comfortable safari pants / zip-off cargo trousers', essential: true },
      { id: 'c3', name: 'Warm fleece jacket or light down jacket (early morning 6 AM game drives are chilly)', essential: true },
      { id: 'c4', name: 'Wide-brim safari sun hat with chin strap', essential: true },
      { id: 'c5', name: 'Sturdy walking shoes or light hiking boots (broken in)', essential: true },
      { id: 'c6', name: 'Casual lodge footwear / sandals for evening dining', essential: false },
      { id: 'c7', name: 'Swimwear (most safari lodges have viewing pools)', essential: false },
      { id: 'c8', name: 'Buff / neck gaiter (invaluable on dusty savanna tracks)', essential: true },
    ],
  },
  {
    id: 'optics',
    title: 'Photography & Optics',
    icon: 'camera',
    note: 'Wildlife can be distant; good optics transform your safari experience completely.',
    items: [
      { id: 'p1', name: 'High-quality binoculars (8x42 or 10x42 recommended — one pair per traveler)', essential: true },
      { id: 'p2', name: 'Camera with telephoto lens (200mm–400mm or 100-400mm zoom)', essential: true },
      { id: 'p3', name: 'Extra camera batteries & high-capacity SD cards (dusty environment)', essential: true },
      { id: 'p4', name: 'Lens cleaning blower & microfiber cloths (essential for savanna dust)', essential: true },
      { id: 'p5', name: 'High-capacity power bank (20,000 mAh) for mobile devices on all-day drives', essential: true },
      { id: 'p6', name: 'Compatible plug adapter (Tanzania commonly uses D/G; Kenya commonly uses G)', essential: true },
      { id: 'p7', name: 'Beanbag camera support (useful on open Land Cruiser roof hatches)', essential: false },
    ],
  },
  {
    id: 'health',
    title: 'Health, Medical & Sun Protection',
    icon: 'pill',
    note: 'Check with your travel clinic 6–8 weeks before departure for personal advice.',
    items: [
      { id: 'h1', name: 'Prescribed Malaria prophylaxis (consult your travel doctor)', essential: true },
      { id: 'h2', name: 'High-strength insect repellent with 30%+ DEET', essential: true },
      { id: 'h3', name: 'Broad-spectrum SPF 50+ sunscreen & lip balm with SPF', essential: true },
      { id: 'h4', name: 'Personal first-aid kit (Ibuprofen, Imodium, antihistamines, band-aids)', essential: true },
      { id: 'h5', name: 'Hydration electrolyte tablets or powder sachets', essential: true },
      { id: 'h6', name: 'Eye drops (lubricating drops for dry, dusty game drives)', essential: false },
      { id: 'h7', name: 'Hand sanitizer & biodegradable wet wipes', essential: true },
    ],
  },
  {
    id: 'documents',
    title: 'Travel Documents & Money',
    icon: 'passport',
    note: 'Keep physical copies and digital cloud backups of all vital documents.',
    items: [
      { id: 'd1', name: 'Passport with at least 6 months validity & 2 blank pages', essential: true },
      { id: 'd2', name: 'Check current entry and visa requirements for your nationality; carry approval if required', essential: true },
      { id: 'd3', name: 'Check whether a Yellow Fever certificate is required for your route and recent travel history', essential: true },
      { id: 'd4', name: 'Review your included travel insurance policy certificate and carry its emergency contact details', essential: true },
      { id: 'd5', name: 'Some local currency or cash accepted by your operator for tips and small purchases', essential: true },
      { id: 'd6', name: 'Credit card with zero foreign transaction fees', essential: true },
    ],
  },
  {
    id: 'gear',
    title: 'Bush & Luggage Essentials',
    icon: 'backpack',
    note: 'Baggage allowances vary by carrier and itinerary. Confirm weight limits and soft-bag rules before packing.',
    items: [
      { id: 'g1', name: 'Soft-sided duffel bag if required by your bush-flight operator', essential: true },
      { id: 'g2', name: 'Daypack / small backpack (20-30L) to keep in the vehicle during game drives', essential: true },
      { id: 'g3', name: 'Compact LED headlamp or small torch for tented camps at night', essential: true },
      { id: 'g4', name: 'Reusable water bottle (confirm refill arrangements with your operator)', essential: true },
      { id: 'g5', name: 'Dry bag or zip-lock bags to protect phones and electronics from fine dust', essential: true },
    ],
  },
];

const STORAGE_KEY = 'jebri_safari_packing_checklist';

export default function PackingChecklist({ className = '' }) {
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems));
    } catch (e) {
      console.warn('Could not save checklist state:', e);
    }
  }, [checkedItems]);

  const toggleItem = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Calculate totals
  const allItems = PACKING_CATEGORIES.flatMap(c => c.items);
  const totalCount = allItems.length;
  const packedCount = allItems.filter(item => Boolean(checkedItems[item.id])).length;
  const progressPercent = Math.round((packedCount / totalCount) * 100);

  const resetChecklist = () => {
    if (window.confirm('Reset all checked items in your packing checklist?')) {
      setCheckedItems({});
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const displayedCategories = activeCategory === 'all'
    ? PACKING_CATEGORIES
    : PACKING_CATEGORIES.filter(c => c.id === activeCategory);

  return (
    <div className={`rounded-3xl border border-savanna-200 bg-cream-50 p-5 sm:p-8 shadow-card ${className}`}>
      {/* Header & Progress Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-savanna-100">
        <div>
          <span className="eyebrow">Pre-Departure Preparation</span>
          <h3 className="font-display text-2xl sm:text-3xl text-teal-700 mt-1">
            Safari Packing Checklist
          </h3>
          <p className="text-sm text-teal-700/75 mt-1">
            General reminders for a Tanzania or Kenya safari. Confirm current entry, health, airline and operator requirements before departure.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="btn-ghost text-xs px-3.5 py-1.5 border border-savanna-200 bg-white"
          >
            <SiteIcon name="printer" className="mr-1.5 align-[-2px]" />Print list
          </button>
          <button
            type="button"
            onClick={resetChecklist}
            className="text-xs text-teal-600 hover:text-terracotta-400 underline px-2 py-1"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Progress Bar Banner */}
      <div className="mt-6 bg-white rounded-2xl border border-savanna-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-teal-800">
            Packing Progress: <strong className="text-terracotta-400">{packedCount}</strong> of {totalCount} items packed
          </span>
          <span className="font-mono text-terracotta-400 font-bold">{progressPercent}% Ready</span>
        </div>
        <div className="w-full bg-cream-100 rounded-full h-3 overflow-hidden border border-savanna-200">
          <div
            className="bg-gradient-to-r from-terracotta-300 to-terracotta-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
            activeCategory === 'all'
              ? 'bg-teal-700 text-cream-50 shadow-sm'
              : 'bg-white border border-savanna-200 text-teal-800 hover:bg-cream-100'
          }`}
        >
          All Items ({totalCount})
        </button>
        {PACKING_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? 'bg-teal-700 text-cream-50 shadow-sm'
                : 'bg-white border border-savanna-200 text-teal-800 hover:bg-cream-100'
            }`}
          >
            <SiteIcon name={cat.icon} />
            <span>{cat.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Category Groups */}
      <div className="mt-6 space-y-6">
        {displayedCategories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl border border-savanna-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-1.5">
              <SiteIcon name={cat.icon} className="text-xl text-terracotta-500" />
              <h4 className="font-display text-xl text-teal-800">{cat.title}</h4>
            </div>
            <p className="text-xs text-teal-600/90 mb-4 bg-cream-50 p-2.5 rounded-xl border border-savanna-100">
              <SiteIcon name="lightbulb" className="mr-1 align-[-2px]" />{cat.note}
            </p>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {cat.items.map(item => {
                const isChecked = Boolean(checkedItems[item.id]);
                return (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
                      isChecked
                        ? 'bg-sage-50/70 border-sage-200 text-teal-700'
                        : 'bg-white border-savanna-200 hover:bg-cream-50/80 text-teal-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(item.id)}
                      className="mt-0.5 w-4 h-4 rounded border-savanna-300 text-terracotta-400 focus:ring-terracotta-300 rounded cursor-pointer"
                    />
                    <div className="text-xs flex-1">
                      <span className={isChecked ? 'line-through opacity-70' : 'font-medium'}>
                        {item.name}
                      </span>
                      {item.essential && (
                        <span className="ml-1.5 inline-block text-[10px] font-bold text-terracotta-400 uppercase tracking-wide">
                          (Must-Have)
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
