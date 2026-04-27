-- Create the dish_images_override table
CREATE TABLE IF NOT EXISTS public.dish_images_override (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_name text NOT NULL,
  normalized_dish_name text NOT NULL UNIQUE,
  image_url text NOT NULL,
  source text NOT NULL,
  status text DEFAULT 'approved'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add index for fast exact match lookups
CREATE INDEX IF NOT EXISTS idx_dish_images_normalized_name ON public.dish_images_override (normalized_dish_name);

-- RLS Policies
ALTER TABLE public.dish_images_override ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to dish_images_override"
  ON public.dish_images_override
  FOR SELECT
  TO public
  USING (true);

-- Note: Insert/Update/Delete allowed only by service role (Edge Function) or explicit admin UI


-- Pre-fill with static data
INSERT INTO public.dish_images_override (dish_name, normalized_dish_name, image_url, source, status) VALUES
  ('burger', 'burger', '/dishes/burger.jpg', 'static', 'approved'),
  ('butter chicken', 'butter chicken', '/dishes/butter-chicken.jpg', 'static', 'approved'),
  ('chicken 65', 'chicken 65', '/dishes/chicken-65.jpg', 'static', 'approved'),
  ('chicken biryani', 'chicken biryani', '/dishes/chicken-biryani.jpg', 'static', 'approved'),
  ('chicken dum biryani', 'chicken dum biryani', '/dishes/chicken-biryani.jpg', 'static', 'approved'),
  ('hyderabadi chicken biryani', 'hyderabadi chicken biryani', '/dishes/chicken-biryani.jpg', 'static', 'approved'),
  ('hyderabadi biryani', 'hyderabadi biryani', '/dishes/chicken-biryani.jpg', 'static', 'approved'),
  ('chicken fry biryani', 'chicken fry biryani', '/dishes/chicken-biryani.jpg', 'static', 'approved'),
  ('egg biryani', 'egg biryani', '/dishes/chicken-biryani.jpg', 'static', 'approved'),
  ('chicken fried rice', 'chicken fried rice', '/dishes/chicken-fried-rice.jpg', 'static', 'approved'),
  ('chicken hakka noodles', 'chicken hakka noodles', '/dishes/chicken-hakka-noodles.jpg', 'static', 'approved'),
  ('chicken manchurian', 'chicken manchurian', '/dishes/chicken-manchurian.jpg', 'static', 'approved'),
  ('chocolate truffle pastry', 'chocolate truffle pastry', '/dishes/chocolate-truffle-pastry.jpg', 'static', 'approved'),
  ('cold coffee', 'cold coffee', '/dishes/cold-coffee.jpg', 'static', 'approved'),
  ('fries', 'fries', '/dishes/fries.jpg', 'static', 'approved'),
  ('gulab jamun', 'gulab jamun', '/dishes/gulab-jamun.jpg', 'static', 'approved'),
  ('rose gulab jamun', 'rose gulab jamun', '/dishes/gulab-jamun.jpg', 'static', 'approved'),
  ('idli', 'idli', '/dishes/idli.jpg', 'static', 'approved'),
  ('idly', 'idly', '/dishes/idli.jpg', 'static', 'approved'),
  ('masala dosa', 'masala dosa', '/assets/dish-dosa.svg', 'static', 'approved'),
  ('medu vada', 'medu vada', '/dishes/medu-vada.jpg', 'static', 'approved'),
  ('mutton biryani', 'mutton biryani', '/dishes/mutton-biryani.jpg', 'static', 'approved'),
  ('mutton dum biryani', 'mutton dum biryani', '/dishes/mutton-biryani.jpg', 'static', 'approved'),
  ('paneer butter masala', 'paneer butter masala', '/dishes/paneer-butter-masala.jpg', 'static', 'approved'),
  ('paneer biryani', 'paneer biryani', '/dishes/veg-biryani.jpg', 'static', 'approved'),
  ('paratha', 'paratha', '/dishes/paratha.jpg', 'static', 'approved'),
  ('parotta', 'parotta', '/dishes/parotta.jpg', 'static', 'approved'),
  ('pizza', 'pizza', '/dishes/pizza.jpg', 'static', 'approved'),
  ('poori', 'poori', '/dishes/poori.jpg', 'static', 'approved'),
  ('sandwich', 'sandwich', '/dishes/sandwich.jpg', 'static', 'approved'),
  ('tea', 'tea', '/dishes/tea.jpg', 'static', 'approved'),
  ('apollo fish', 'apollo fish', '/dishes/chicken-65.jpg', 'static', 'approved'),
  ('vada', 'vada', '/dishes/vada.jpg', 'static', 'approved'),
  ('veg biryani', 'veg biryani', '/dishes/veg-biryani.jpg', 'static', 'approved'),
  ('veg dum biryani', 'veg dum biryani', '/dishes/veg-biryani.jpg', 'static', 'approved')
ON CONFLICT (normalized_dish_name) DO NOTHING;
