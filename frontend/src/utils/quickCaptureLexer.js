/**
 * Deterministic client-side lexer for Quick Capture live preview.
 * Matches the backend QuickCaptureParserService rules without making network calls while typing.
 */

const NUMERIC_AMOUNT_PATTERN = /^([₹$€£]|INR|Rs\.?\s*)?(\d{1,3}(,\d{3})*|\d+)(\.\d{1,2})?$/i;

export function parseQuickCapturePreview(input, availableCategories = []) {
  if (!input || !input.trim()) {
    return {
      amount: null,
      amountStr: null,
      type: 'EXPENSE',
      category: null,
      transactionDate: getTodayIsoString(),
      dateLabel: 'Today',
      description: '',
      isReady: false,
      missingFields: ['amount', 'category'],
    };
  }

  const normalized = input.trim().replace(/\s+/g, ' ');
  const tokens = normalized.split(' ');

  // 1. Transaction Type
  let type = 'EXPENSE';
  const typeIndex = tokens.findIndex((t) => t.toLowerCase() === 'income');
  if (typeIndex !== -1) {
    type = 'INCOME';
    tokens.splice(typeIndex, 1);
  } else {
    const expenseIndex = tokens.findIndex((t) => t.toLowerCase() === 'expense');
    if (expenseIndex !== -1) {
      tokens.splice(expenseIndex, 1);
    }
  }

  // 2. Amount Detection
  let amount = null;
  let amountStr = null;
  let amountTokenIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (NUMERIC_AMOUNT_PATTERN.test(token)) {
      const clean = token.replace(/[₹$€£,]|INR|Rs\.?\s*/gi, '').trim();
      const num = parseFloat(clean);
      if (!isNaN(num) && num > 0 && amount === null) {
        amount = num;
        amountStr = clean;
        amountTokenIndex = i;
      }
    }
  }

  if (amountTokenIndex !== -1) {
    tokens.splice(amountTokenIndex, 1);
  }

  // 3. Date Detection
  let transactionDate = getTodayIsoString();
  let dateLabel = 'Today';
  const dateTokenIndex = tokens.findIndex((t) => {
    const lower = t.toLowerCase();
    return lower === 'today' || lower === 'yesterday';
  });

  if (dateTokenIndex !== -1) {
    const word = tokens[dateTokenIndex].toLowerCase();
    if (word === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      transactionDate = d.toISOString().split('T')[0];
      dateLabel = 'Yesterday';
    } else {
      transactionDate = getTodayIsoString();
      dateLabel = 'Today';
    }
    tokens.splice(dateTokenIndex, 1);
  }

  // 4. Category Resolution
  let matchedCategory = null;
  let categoryTokenIndex = -1;

  // Try 1-token match
  for (let i = 0; i < tokens.length; i++) {
    const tokenLower = tokens[i].toLowerCase();
    const found = availableCategories.find(
      (c) => c.name.toLowerCase() === tokenLower || c.slug.toLowerCase() === tokenLower
    );
    if (found) {
      matchedCategory = found;
      categoryTokenIndex = i;
      break;
    }
  }

  // Try 2-token match if not found
  if (!matchedCategory && tokens.length >= 2) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const twoTokenLower = `${tokens[i]} ${tokens[i + 1]}`.toLowerCase();
      const found = availableCategories.find(
        (c) => c.name.toLowerCase() === twoTokenLower || c.slug.toLowerCase() === twoTokenLower
      );
      if (found) {
        matchedCategory = found;
        tokens.splice(i, 2);
        break;
      }
    }
  } else if (categoryTokenIndex !== -1) {
    tokens.splice(categoryTokenIndex, 1);
  }

  // 5. Description Construction
  let description = '';
  if (tokens.length > 0) {
    description = tokens.join(' ').substring(0, 255);
  } else if (matchedCategory) {
    description = matchedCategory.name;
  }

  const missingFields = [];
  if (amount === null) missingFields.push('amount');
  if (!matchedCategory) missingFields.push('category');

  const isReady = missingFields.length === 0;

  return {
    amount,
    amountStr,
    type,
    category: matchedCategory,
    transactionDate,
    dateLabel,
    description,
    isReady,
    missingFields,
  };
}

function getTodayIsoString() {
  return new Date().toISOString().split('T')[0];
}
