export const PRICING_TIER_META = {
  budget: {
    label: 'Budget',
    description: 'Value-first journeys',
    hint: 'Best for cost-conscious travelers',
  },
  mid: {
    label: 'Standard',
    description: 'Balanced comfort',
    hint: 'Best for couples and small groups',
  },
  luxury: {
    label: 'Premium',
    description: 'High-touch experiences',
    hint: 'Best for private, indulgent escapes',
  },
};

export function getTierMeta(tier) {
  return PRICING_TIER_META[tier] || PRICING_TIER_META.mid;
}
