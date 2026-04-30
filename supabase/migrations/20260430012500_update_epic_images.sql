INSERT INTO cards (name, rarity, image_url, special_attribute, description)
VALUES 
  ('Ghost Town Map', 'Epic', '/cards/ghost_town_map.png', 'Unlocks Secrets', 'X marks a spot that hasn’t existed for fifty years.'),
  ('Desert Rose', 'Epic', '/cards/desert_rose.png', 'Charisma +10', 'A rare bloom that survives the harshest winters.'),
  ('Ace of Spades', 'Epic', '/cards/ace_of_spades.png', 'Instant Win', 'The death card. Use it wisely.'),
  ('Buffalo Skull', 'Epic', '/cards/buffalo_skull.png', 'Intimidation +8', 'A bleached reminder of the old ways.'),
  ('Dynamite', 'Epic', '/cards/dynamite.png', 'Blast Damage 50', 'Handle with care. Or don’t. We aren’t your parents.')
ON CONFLICT (name) DO UPDATE 
SET 
  image_url = EXCLUDED.image_url,
  rarity = EXCLUDED.rarity,
  special_attribute = EXCLUDED.special_attribute,
  description = EXCLUDED.description;
