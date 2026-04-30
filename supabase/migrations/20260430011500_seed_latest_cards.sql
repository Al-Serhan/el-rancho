INSERT INTO cards (name, rarity, image_url, special_attribute, description)
VALUES 
  ('One-Eyed Pete', 'Rare', '/avatars/pete.png', '+5 Intimidation', 'A seasoned player of the Saloon. Missing an eye, but never misses a bluff.'),
  ('Rusty Red', 'Rare', '/avatars/rusty.png', '+3 Luck', 'He sweats bullets when the stakes get high. Mostly plays to feed his mule.'),
  ('AI Silas', 'Rare', '/avatars/silas.png', '100% Logic', 'A mechanical marvel built to calculate the odds perfectly. Rarely folds.'),
  ('Calamity Jane Rifle', 'Legendary', '/cards/calamity_jane_rifle.png', 'Sure-Shot', 'An ornate wood and polished silver rifle. It never misses its mark.'),
  ('The Saloon Clanker', 'Legendary', '/cards/the_saloon_clanker.png', 'Iron Grip', 'A heavy mechanical arm retrofitted with brass gears. Perfect for saloon brawls.'),
  ('Golden Key', 'Legendary', '/cards/golden_key.png', 'Opens All Doors', 'A glowing, magical skeleton key that opens anything in the frontier.'),
  ('Common squid', 'Common', '/cards/common_squid.png', 'Server Veteran', 'Despite the name, this cosmic space fish is an original member of the Discord server. Floats through the cosmos with quiet authority.')
ON CONFLICT (name) DO UPDATE 
SET 
  image_url = EXCLUDED.image_url,
  rarity = EXCLUDED.rarity,
  special_attribute = EXCLUDED.special_attribute,
  description = EXCLUDED.description;
