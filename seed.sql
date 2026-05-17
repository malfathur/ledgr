-- ── Wipe all non-user data (FK order) ──────────────────────────────────────
DELETE FROM commitment_payments;
DELETE FROM commitments;
DELETE FROM transactions;
DELETE FROM monthly_budgets;
DELETE FROM categories;

-- ── Root groups ──────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Income', 'income', NULL, 0, 'income');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Bills', 'bills', NULL, 0, 'expense');

-- ── Income leaves (level 1) ──────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Primary Income',   'primary-income',   (SELECT id FROM categories WHERE slug = 'income'), 1, 'income');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Secondary Income', 'secondary-income', (SELECT id FROM categories WHERE slug = 'income'), 1, 'income');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Passive Income',   'passive-income',   (SELECT id FROM categories WHERE slug = 'income'), 1, 'income');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Other Income',     'other-income',     (SELECT id FROM categories WHERE slug = 'income'), 1, 'income');

-- ── Bills sub-groups (level 1) ───────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Housing',        'housing',        (SELECT id FROM categories WHERE slug = 'bills'), 1, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Transport',      'transport',      (SELECT id FROM categories WHERE slug = 'bills'), 1, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Food',           'food',           (SELECT id FROM categories WHERE slug = 'bills'), 1, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Health & Family','health-family',  (SELECT id FROM categories WHERE slug = 'bills'), 1, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Debts',          'debts',          (SELECT id FROM categories WHERE slug = 'bills'), 1, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Lifestyle',      'lifestyle',      (SELECT id FROM categories WHERE slug = 'bills'), 1, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Savings',        'savings',        (SELECT id FROM categories WHERE slug = 'bills'), 1, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Investment',     'investment',     (SELECT id FROM categories WHERE slug = 'bills'), 1, 'expense');

-- ── Housing leaves (level 2) ─────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Rent / Mortgage',   'rent-mortgage',   (SELECT id FROM categories WHERE slug = 'housing'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Utilities',         'utilities',       (SELECT id FROM categories WHERE slug = 'housing'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Internet',          'internet',        (SELECT id FROM categories WHERE slug = 'housing'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Home Maintenance',  'home-maintenance',(SELECT id FROM categories WHERE slug = 'housing'), 2, 'expense');

-- ── Transport leaves (level 2) ───────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Car Loan',             'car-loan',          (SELECT id FROM categories WHERE slug = 'transport'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Petrol & Toll',        'petrol-toll',       (SELECT id FROM categories WHERE slug = 'transport'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Public Transport',     'public-transport',  (SELECT id FROM categories WHERE slug = 'transport'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Vehicle Maintenance',  'vehicle-maintenance',(SELECT id FROM categories WHERE slug = 'transport'), 2, 'expense');

-- ── Food leaves (level 2) ────────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Groceries',       'groceries',    (SELECT id FROM categories WHERE slug = 'food'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Dining Out',      'dining-out',   (SELECT id FROM categories WHERE slug = 'food'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Coffee & Snacks', 'coffee-snacks',(SELECT id FROM categories WHERE slug = 'food'), 2, 'expense');

-- ── Health & Family leaves (level 2) ─────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Medical',    'medical',   (SELECT id FROM categories WHERE slug = 'health-family'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Insurance',  'insurance', (SELECT id FROM categories WHERE slug = 'health-family'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Childcare',  'childcare', (SELECT id FROM categories WHERE slug = 'health-family'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Education',  'education', (SELECT id FROM categories WHERE slug = 'health-family'), 2, 'expense');

-- ── Debts leaves (level 2) ───────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Personal Loan', 'personal-loan', (SELECT id FROM categories WHERE slug = 'debts'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Credit Card',   'credit-card',   (SELECT id FROM categories WHERE slug = 'debts'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Study Loan',    'study-loan',    (SELECT id FROM categories WHERE slug = 'debts'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Other Debt',    'other-debt',    (SELECT id FROM categories WHERE slug = 'debts'), 2, 'expense');

-- ── Lifestyle leaves (level 2) ───────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Subscriptions',  'subscriptions', (SELECT id FROM categories WHERE slug = 'lifestyle'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Entertainment',  'entertainment', (SELECT id FROM categories WHERE slug = 'lifestyle'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Shopping',       'shopping',      (SELECT id FROM categories WHERE slug = 'lifestyle'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Travel',         'travel',        (SELECT id FROM categories WHERE slug = 'lifestyle'), 2, 'expense');

-- ── Savings leaves (level 2) ─────────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Emergency Fund',   'emergency-fund',   (SELECT id FROM categories WHERE slug = 'savings'),    2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('General Saving',   'general-saving',   (SELECT id FROM categories WHERE slug = 'savings'),    2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Special Occasion', 'special-occasion', (SELECT id FROM categories WHERE slug = 'savings'),    2, 'expense');

-- ── Investment leaves (level 2) ───────────────────────────────────────────────
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Investment A',     'investment-a',     (SELECT id FROM categories WHERE slug = 'investment'), 2, 'expense');
INSERT OR IGNORE INTO categories (name, slug, parent_id, level, type)
  VALUES ('Investment B',     'investment-b',     (SELECT id FROM categories WHERE slug = 'investment'), 2, 'expense');
