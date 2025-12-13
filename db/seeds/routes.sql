-- Seed data for the routes table. Adjust column or table names if your schema differs.
-- Designed for PostgreSQL migrations or direct psql execution.

BEGIN;

INSERT INTO routes (
  id,
  origin,
  destination,
  distance_km,
  company,
  departure_time,
  arrival_time,
  duration_minutes,
  price_vnd,
  seats_available,
  bus_type
) VALUES
  ('HN-HCM-0600', 'Hà Nội', 'Hồ Chí Minh', 1730, 'Express Bus Lines', '06:00', '14:00', 1920, 1200000, 18, 'Sleeper'),
  ('HN-HCM-1800', 'Hà Nội', 'Hồ Chí Minh', 1730, 'Night Express', '18:00', '02:00', 1920, 1150000, 12, 'VIP Sleeper'),
  ('HN-DN-0700', 'Hà Nội', 'Đà Nẵng', 766, 'Golden Dragon', '07:00', '21:30', 870, 650000, 22, 'Premium'),
  ('HN-DN-2000', 'Hà Nội', 'Đà Nẵng', 766, 'Vietnam Travel Bus', '20:00', '10:30', 870, 620000, 16, 'Sleeper'),
  ('DN-HCM-0800', 'Đà Nẵng', 'Hồ Chí Minh', 961, 'Coastal Coach', '08:00', '23:30', 930, 700000, 20, 'Premium'),
  ('HCM-KH-0900', 'Hồ Chí Minh', 'Khánh Hòa', 435, 'Luxury Coach', '09:00', '17:00', 480, 430000, 14, 'VIP Sleeper'),
  ('HCM-LD-1000', 'Hồ Chí Minh', 'Lâm Đồng', 305, 'Green Highlands', '10:00', '17:30', 450, 380000, 10, 'Premium'),
  ('HCM-CT-0630', 'Hồ Chí Minh', 'Cần Thơ', 169, 'Mekong Lines', '06:30', '10:30', 240, 220000, 26, 'Standard'),
  ('HN-HP-0630', 'Hà Nội', 'Hải Phòng', 120, 'CityLink', '06:30', '09:30', 180, 150000, 30, 'Express'),
  ('HN-LC-2100', 'Hà Nội', 'Lào Cai', 295, 'Mountain Rider', '21:00', '05:30', 510, 420000, 19, 'Sleeper'),
  ('DN-HUE-1500', 'Đà Nẵng', 'Thừa Thiên Huế', 94, 'Heritage Shuttle', '15:00', '17:30', 150, 160000, 24, 'Standard')
ON CONFLICT (id) DO NOTHING;

COMMIT;
