/**
 * Maps MobileNet/ImageNet class names (from camera image) to our inventory categories and suggested items.
 * Used so "Scan with Camera (AI)" suggests the item that best matches what the camera sees.
 */

// Order matters: first matching rule wins. Put more specific categories first.
export const IMAGE_CLASS_TO_CATEGORY = [
  { keywords: ['notebook', 'book', 'envelope', 'pen', 'ballpoint', 'paper', 'folder', 'staple', 'pencil', 'eraser', 'calculator'], category: 'Office Supplies' },
  { keywords: ['printer', 'computer', 'monitor', 'screen', 'keyboard', 'laptop', 'mouse', 'projector', 'webcam', 'modem', 'laminat'], category: 'ICT Equipment' },
  { keywords: ['soap', 'sponge', 'mop', 'bucket', 'bleach', 'detergent', 'cleaning', 'dishwash'], category: 'Cleaning Materials' },
  { keywords: ['stethoscope', 'syringe', 'pill', 'medicine', 'bandage', 'bottle', 'dispenser', 'first aid', 'alcohol'], category: 'Medical Supplies' },
  { keywords: ['vest', 'helmet', 'glove', 'goggle', 'extinguisher', 'fire'], category: 'Personal Protective Equipment' },
  { keywords: ['lamp', 'light', 'bulb', 'flashlight', 'battery', 'plug', 'cord', 'switch', 'clock', 'watch', 'timer'], category: 'Electrical Equipment' },
  { keywords: ['chair', 'desk', 'table', 'cabinet', 'shelf', 'filing', 'bookcase', 'couch', 'armchair', 'office chair'], category: 'Furniture & Fixtures' },
  { keywords: ['basketball', 'volleyball', 'soccer', 'ball', 'sport', 'tennis', 'racket'], category: 'Sports Equipment' },
];

/**
 * Given MobileNet predictions [{ className, probability }], return the best-matching category.
 */
export function getCategoryFromPredictions(predictions) {
  if (!predictions || !predictions.length) return null;
  const lower = (s) => (s || '').toLowerCase();
  for (const p of predictions) {
    const name = lower(p.className);
    for (const rule of IMAGE_CLASS_TO_CATEGORY) {
      if (rule.keywords.some((kw) => name.includes(kw))) return rule.category;
    }
  }
  return null;
}

/**
 * Given a category, return the first item id from that category in the items list.
 */
export function getSuggestedItemIdForCategory(category, items) {
  if (!category || !items?.length) return null;
  const found = items.find((i) => i.category === category);
  return found ? found.id : null;
}
