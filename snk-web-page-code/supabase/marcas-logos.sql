-- Marcas de la tienda con su logo (archivos en public/brands/<id>.png).
-- Ejecutar una vez en Supabase > SQL Editor. Se puede repetir sin problema:
-- agrega las marcas que falten y actualiza el logo de las que ya existen.

insert into public.brands (id, name, slug, logo, story, hero_image) values
  ('jordan', 'Jordan', 'jordan', '/brands/jordan.png', 'Creada para Michael Jordan en 1984, la marca de la corona y el Jumpman revolucionó las canchas de baloncesto y definió el streetwear contemporáneo.', ''),
  ('nike', 'Nike', 'nike', '/brands/nike.png', 'Inspiración e innovación para cada atleta del mundo. Just Do It. Pioneros en el diseño de calzado de rendimiento e íconos de la cultura urbana.', ''),
  ('adidas', 'Adidas', 'adidas', '/brands/adidas.png', 'Fundada en Alemania por Adi Dassler, Adidas representa la unión impecable entre la innovación deportiva y el estilo clásico de la herencia Originals.', ''),
  ('newbalance', 'New Balance', 'new-balance', '/brands/newbalance.png', 'Con un enfoque inigualable en el confort, la calidad de los materiales y la artesanía impecable, New Balance une el dad shoe clásico con el estilo moderno.', ''),
  ('puma', 'Puma', 'puma', '/brands/puma.png', 'Nacida en Herzogenaurach, Alemania, en 1948, Puma une la velocidad del deporte con la actitud de la calle en siluetas que cruzan del estadio al streetwear.', ''),
  ('lacoste', 'Lacoste', 'lacoste', '/brands/lacoste.png', 'Fundada en 1933 por el tenista René Lacoste, la marca del cocodrilo lleva la elegancia francesa del tenis a zapatillas limpias y atemporales.', ''),
  ('louisvuitton', 'Louis Vuitton', 'louis-vuitton', '/brands/louisvuitton.png', 'Maison francesa fundada en 1854, referente del lujo. Sus sneakers combinan artesanía de alta gama con el lenguaje de la cultura urbana.', ''),
  ('tommyhilfiger', 'Tommy Hilfiger', 'tommy-hilfiger', '/brands/tommyhilfiger.png', 'Desde 1985, Tommy Hilfiger reinterpreta el estilo clásico americano con un toque preppy, cómodo y versátil para el día a día.', ''),
  ('armaniexchange', 'Armani Exchange', 'armani-exchange', '/brands/armaniexchange.png', 'La línea urbana de Giorgio Armani: diseño italiano minimalista con espíritu metropolitano, pensado para moverse por la ciudad con estilo.', ''),
  ('skechers', 'Skechers', 'skechers', '/brands/skechers.png', 'Nacida en California en 1992, Skechers es sinónimo de comodidad: amortiguación, ligereza y diseños para caminar todo el día.', ''),
  ('lecoqsportif', 'Le Coq Sportif', 'le-coq-sportif', '/brands/lecoqsportif.png', 'Marca francesa con herencia deportiva desde 1882. El gallo representa un estilo retro y sofisticado que vuelve una y otra vez a las calles.', '')
on conflict (id) do update set logo = excluded.logo, updated_at = now();
