const CATEGORIES_EXPENSE = [
  'Food & Beverage',
  'Bills & Utilities',
  'Health & Medical',
  'Shopping',
  'Entertainment',
  'Education',
  'Savings & Investment',
  'Housing',
  'Communication',
  'Pets',
  'Debt & Loans',
  'Donations & Charity',
  'Subscriptions & Memberships',
  'Business Utilities',
  'Miscellaneous'
];

const CATEGORIES_INCOME = [
  'Ad Revenue',
  'Sponsorship & Brand Deals',
  'Affiliate Marketing',
  'Digital Product Sales',
  'Membership & Subscriptions',
  'Courses & Workshops',
  'Consulting & Coaching',
  'Freelance Services',
  'Business Revenue',
  'Licensing & Royalties',
  'Investment Returns',
  'Event & Speaking Fees',
  'Software/SaaS Revenue',
  'Tips & Donations',
  'Miscellaneous'
];

export function buildChatPrompt({ message, image, balance, transactions }) {
  const transactionList = transactions.map(t =>
    `- ${t.date}: ${t.description} (${t.type}) Rp${parseInt(t.amount).toLocaleString('id-ID')}`
  ).join('\n');

  const categoriesExpense = CATEGORIES_EXPENSE.join(', ');
  const categoriesIncome = CATEGORIES_INCOME.join(', ');

  let prompt = `
Role: You are a smart financial assistant for the "Money Tracker" app.
Language: Indonesian (Bahasa Indonesia).

Context:
- Overall Income: Rp ${parseInt(balance.total_income).toLocaleString('id-ID')}
- Overall Expense: Rp ${parseInt(balance.total_expense).toLocaleString('id-ID')}
- Current Balance: Rp ${parseInt(balance.balance).toLocaleString('id-ID')}

RECENT TRANSACTIONS:
${transactionList || 'No transactions yet'}

User Query: "${message}"

TASK:
1. If an IMAGE is provided:
   - Analyze it as a receipt or invoice.
   - Extract: Total Amount, Description (Merchant/Item), Date.
   - Then output a JSON string for adding the transaction.
   - If it's not a receipt, just describe it or answer the user's question about it.

2. If the user wants to ADD a transaction (text or extracted from image):
   You MUST return a JSON string ONLY.
   Format: {"action": "add", "amount": 123, "description": "...", "category": "...", "type": "Expense" | "Income"}
   Rules:
   - Amount must be number (no currency symbols).
   - Type must be 'Expense' or 'Income'.
   - Category must be one of: ${categoriesExpense} (for Expense) OR ${categoriesIncome} (for Income). Pick the closest.

3. If the user asks a question or chats (and no JSON action needed), return a normal helpful text response (NOT JSON).
   - Answer based on the 'RECENT TRANSACTIONS' provided above.
   - Keep it short and friendly.
   - Use bold for key numbers.
`;

  return prompt;
}

export { CATEGORIES_EXPENSE, CATEGORIES_INCOME };
