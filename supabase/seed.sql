do $cinewave_seed$
begin

drop table if exists private.cinewave_seed;

create unlogged table private.cinewave_seed (
  external_id text,
  slug text,
  title text,
  original_title text,
  synopsis text,
  release_year smallint,
  duration_seconds integer,
  maturity_rating text,
  poster_url text,
  backdrop_url text,
  video_path text,
  genres text[],
  source_url text,
  license_name text,
  license_url text
);

insert into private.cinewave_seed values
  ('ia-bigbuckbunny_124', 'big-buck-bunny', 'Big Buck Bunny', 'Big Buck Bunny', 'Một chú thỏ hiền lành quyết định dạy cho ba kẻ bắt nạt trong khu rừng một bài học đầy hài hước.', 2008, 596, 'P', '/media/artwork/big-buck-bunny-poster.jpg', '/media/artwork/big-buck-bunny-backdrop.jpg', 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4', array['Hoạt hình','Hài','Gia đình'], 'https://archive.org/details/BigBuckBunny_124', 'Creative Commons Attribution', 'http://creativecommons.org/licenses/by/3.0/'),
  ('ia-sintel', 'sintel', 'Sintel', 'Sintel', 'Một nữ chiến binh trẻ băng qua vùng đất khắc nghiệt để tìm lại người bạn rồng đã mất.', 2010, 888, 'T13', '/media/artwork/sintel-poster.jpg', '/media/artwork/sintel-backdrop.jpg', 'https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4', array['Hoạt hình','Kỳ ảo','Phiêu lưu'], 'https://archive.org/details/Sintel', 'Creative Commons Attribution', 'http://creativecommons.org/licenses/by/3.0/'),
  ('ia-tears-of-steel', 'tears-of-steel', 'Tears of Steel', 'Tears of Steel', 'Một nhóm chiến binh và nhà khoa học tái hiện một khoảnh khắc tình cảm trong quá khứ để cứu thế giới khỏi robot hủy diệt.', 2012, 734, 'T13', '/media/artwork/tears-of-steel-poster.jpg', '/media/artwork/tears-of-steel-backdrop.jpg', 'https://archive.org/download/Tears-of-Steel/tears_of_steel_1080p.mp4', array['Khoa học viễn tưởng','Hành động','Chính kịch'], 'https://archive.org/details/Tears-of-Steel', 'Creative Commons Attribution', 'http://creativecommons.org/licenses/by/3.0/'),
  ('ia-elephantsdream', 'elephants-dream', 'Elephants Dream', 'Elephants Dream', 'Hai nhân vật kỳ lạ khám phá một cỗ máy sống khổng lồ, nơi niềm tin và thực tại liên tục đổi chỗ.', 2006, 654, 'T13', '/media/artwork/elephants-dream-poster.jpg', '/media/artwork/elephants-dream-backdrop.jpg', 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4', array['Hoạt hình','Khoa học viễn tưởng','Siêu thực'], 'https://archive.org/details/ElephantsDream', 'Creative Commons Attribution', 'http://creativecommons.org/licenses/by/3.0/us/'),
  ('ia-cosmoslaundromatfirstcycle', 'cosmos-laundromat', 'Cosmos Laundromat', 'Cosmos Laundromat: First Cycle', 'Trên một hòn đảo hoang vắng, chú cừu Franck gặp một người bán hàng kỳ quặc và nhận món quà có thể thay đổi cả đời mình.', 2015, 731, 'T13', '/media/artwork/cosmos-laundromat-poster.jpg', '/media/artwork/cosmos-laundromat-backdrop.jpg', 'https://archive.org/download/CosmosLaundromatFirstCycle/Cosmos%20Laundromat%20-%20First%20Cycle%20%281080p%29.mp4', array['Hoạt hình','Kỳ ảo','Hài đen'], 'https://archive.org/details/CosmosLaundromatFirstCycle', 'Creative Commons Attribution', 'http://creativecommons.org/licenses/by/4.0/'),
  ('ia-sprite-fright-2021', 'sprite-fright', 'Sprite Fright', 'Sprite Fright', 'Một nhóm thiếu niên ồn ào bước vào khu rừng biệt lập và chạm trán những sinh vật nấm nhỏ bé nhưng không hề vô hại.', 2021, 630, 'T13', '/media/artwork/sprite-fright-poster-3d.jpg', '/media/artwork/sprite-fright-hero.jpg', '/media/sprite-fright-2021.mp4', array['Hoạt hình','Kinh dị hài','Phiêu lưu'], 'https://archive.org/details/sprite-fright-2021', 'Creative Commons Attribution', 'https://creativecommons.org/licenses/by/4.0/'),
  ('ia-springopenmovie', 'spring', 'Spring', 'Spring Open Movie', 'Một cô bé chăn cừu cùng chú chó trung thành đánh thức mùa xuân và đối đầu với những linh hồn cổ xưa của mùa đông.', 2019, 464, 'P', 'https://archive.org/download/springopenmovie/__ia_thumb.jpg', 'https://archive.org/download/springopenmovie/springopenmovie.thumbs/springopenmovie_000358.jpg', 'https://archive.org/download/springopenmovie/springopenmovie.ia.mp4', array['Hoạt hình','Kỳ ảo','Phiêu lưu'], 'https://archive.org/details/springopenmovie', 'Creative Commons Attribution', 'https://creativecommons.org/licenses/by/4.0/'),
  ('ia-wing_it', 'wing-it', 'Wing It!', 'Wing It!', 'Một kỹ sư trẻ trên tàu vũ trụ phải ứng biến thật nhanh khi vị khách ngoài hành tinh làm đảo lộn ca trực tưởng như bình thường.', 2023, 238, 'P', 'https://archive.org/download/wing_it/__ia_thumb.jpg', 'https://archive.org/download/wing_it/wing_it.thumbs/wing_it_000182.jpg', 'https://archive.org/download/wing_it/wing_it.ia.mp4', array['Hoạt hình','Hài','Khoa học viễn tưởng'], 'https://archive.org/details/wing_it', 'Creative Commons Attribution', 'https://creativecommons.org/licenses/by/4.0/'),
  ('ia-hero_20260106', 'hero', 'Hero', 'Hero', 'Một nghệ sĩ phác thảo nên người hùng bằng nét vẽ 2D rồi dẫn nhân vật của mình bước qua một cuộc chiến giàu nhịp điệu và cảm xúc.', 2018, 237, 'T13', 'https://archive.org/download/hero_20260106/__ia_thumb.jpg', 'https://archive.org/download/hero_20260106/hero_20260106.thumbs/hero_000057.jpg', 'https://archive.org/download/hero_20260106/hero.ia.mp4', array['Hoạt hình','Hành động','Kỳ ảo'], 'https://archive.org/details/hero_20260106', 'Creative Commons Attribution', 'https://creativecommons.org/licenses/by/4.0/'),
  ('ia-caminandes2grandillama', 'caminandes-2-gran-dillama', 'Caminandes 2: Gran Dillama', 'Caminandes 2: Gran Dillama', 'Chú lạc đà Koro bày đủ cách vượt qua hàng rào để chạm tới món ăn yêu thích giữa vùng Patagonia đầy gió.', 2013, 146, 'P', 'https://archive.org/download/Caminandes2GranDillama/__ia_thumb.jpg', 'https://archive.org/download/Caminandes2GranDillama/Caminandes2GranDillama.thumbs/02_gran_dillama_1080p_000117.jpg', 'https://archive.org/download/Caminandes2GranDillama/02_gran_dillama_1080p.mp4', array['Hoạt hình','Hài','Gia đình'], 'https://archive.org/details/Caminandes2GranDillama', 'Creative Commons Attribution', 'http://creativecommons.org/licenses/by/3.0/'),
  ('ia-caminandesllamigos', 'caminandes-3-llamigos', 'Caminandes 3: Llamigos', 'Caminandes 3: Llamigos', 'Koro gặp một chú chim cánh cụt láu lỉnh, mở đầu cho màn tranh giành quả mọng vừa tinh quái vừa đáng yêu.', 2016, 150, 'P', 'https://archive.org/download/CaminandesLlamigos/__ia_thumb.jpg', 'https://archive.org/download/CaminandesLlamigos/CaminandesLlamigos.thumbs/Caminandes_%20Llamigos-1080p_000117.jpg', 'https://archive.org/download/CaminandesLlamigos/Caminandes_%20Llamigos-1080p.mp4', array['Hoạt hình','Hài','Gia đình'], 'https://archive.org/details/CaminandesLlamigos', 'Creative Commons Attribution', 'http://creativecommons.org/licenses/by/3.0/');

insert into public.movies (
  external_id, slug, title, original_title, synopsis, release_year, duration_seconds,
  maturity_rating, poster_url, backdrop_url, video_path, storage_provider, status,
  popularity_score, metadata, published_at
)
select
  external_id, slug, title, original_title, synopsis, release_year, duration_seconds,
  maturity_rating, poster_url, backdrop_url, video_path, 'external', 'published', 0,
  jsonb_build_object(
    'provider', 'Internet Archive',
    'source_url', source_url,
    'license_name', license_name,
    'license_url', license_url
  ), now()
from private.cinewave_seed
on conflict (external_id) do update set
  slug = excluded.slug,
  title = excluded.title,
  original_title = excluded.original_title,
  synopsis = excluded.synopsis,
  release_year = excluded.release_year,
  duration_seconds = excluded.duration_seconds,
  maturity_rating = excluded.maturity_rating,
  poster_url = excluded.poster_url,
  backdrop_url = excluded.backdrop_url,
  video_path = excluded.video_path,
  storage_provider = excluded.storage_provider,
  status = excluded.status,
  metadata = excluded.metadata,
  published_at = coalesce(public.movies.published_at, excluded.published_at);

insert into public.genres (slug, name)
select distinct
  lower(regexp_replace(trim(name), '\s+', '-', 'g')),
  name
from private.cinewave_seed
cross join lateral unnest(genres) as genre(name)
on conflict (name) do update set updated_at = now();

insert into public.movie_genres (movie_id, genre_id)
select m.id, g.id
from private.cinewave_seed s
join public.movies m on m.external_id = s.external_id
cross join lateral unnest(s.genres) as genre(genre_name)
join public.genres g on g.name = genre.genre_name
on conflict (movie_id, genre_id) do nothing;

insert into public.content_rights (
  movie_id, territory, starts_at, ends_at, status, license_reference, license_url
)
select
  m.id, 'GLOBAL', timestamptz '2000-01-01 00:00:00+00', timestamptz '2200-01-01 00:00:00+00',
  'approved', s.source_url, s.license_url
from private.cinewave_seed s
join public.movies m on m.external_id = s.external_id
on conflict (movie_id, territory, starts_at) do update set
  status = excluded.status,
  ends_at = excluded.ends_at,
  license_reference = excluded.license_reference,
  license_url = excluded.license_url;

drop table private.cinewave_seed;

end
$cinewave_seed$;
