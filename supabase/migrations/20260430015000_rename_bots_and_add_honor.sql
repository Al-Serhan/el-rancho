UPDATE cards SET name = 'One-Eyed Mossy' WHERE name = 'One-Eyed Pete';
UPDATE cards SET name = 'Feller Epilex' WHERE name = 'Rusty Red';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS honor INTEGER DEFAULT 0;
