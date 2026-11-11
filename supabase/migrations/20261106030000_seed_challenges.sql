-- Starter food challenges (4.1 / 4.9 / 4.10) so the Community screens have something to show.
-- Dates are relative to when this runs: two running, one starting soon, one ended.
insert into challenges (slug, title, description, rule, tag, country, starts_at, ends_at) values
  ('midnight-ramyeon-hack', 'Midnight Ramyeon Hack', 'One leftover from the fridge. That’s the rule. Post a photo before the clock runs out.',
   'Ramyeon + one leftover', 'MidnightRamyeon', 'KR', now() - interval '4 days', now() + interval '2 days 22 hours'),
  ('onigiri-shape-off', 'Onigiri Shape-Off', 'Triangle, bear or cloud — the cutest wins.',
   'Any filling, any shape', 'OnigiriShapeOff', 'JP', now() - interval '2 days', now() + interval '5 days'),
  ('pasta-in-15', 'Pasta in 15', 'Start the water, start the timer. Fifteen minutes, one pan.',
   'Done in 15 minutes', 'PastaIn15', 'IT', now() - interval '1 day', now() + interval '7 days'),
  ('taco-by-the-weather', 'Taco by the Weather', 'Fill your taco with what today’s weather asks for.',
   'One taco, today’s weather', 'TacoWeather', 'MX', now() + interval '2 days', now() + interval '12 days'),
  ('pancake-sunday', 'Pancake Sunday', 'Jeon, hotteok or pancakes — anything from a flat pan.',
   'Something from a flat pan', 'PancakeSunday', 'KR', now() - interval '14 days', now() - interval '11 days')
on conflict (slug) do nothing;
