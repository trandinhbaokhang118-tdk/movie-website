import licensedCatalog from "@/data/licensed_catalog.json";

export type MovieSource = {
  provider: string;
  itemUrl: string;
  licenseName: string;
  licenseUrl: string;
  attribution: string;
  rightsHolder?: string;
  evidenceCapturedAt?: string;
  territory?: string;
  validFrom?: string | null;
  validUntil?: string | null;
  commercialUse?: boolean;
  checksumAlgorithm?: string;
  checksum?: string;
  creditLine?: string;
  localMirror?: string | null;
};

export type MovieVideo = {
  src: string;
  fallbackSrc?: string | null;
  type: string;
  durationSeconds: number;
  attribution: string;
};

export type Movie = {
  id: string;
  title: string;
  originalTitle?: string;
  year: number;
  duration: string;
  maturity: string;
  match: number;
  genres: string[];
  synopsis: string;
  director: string;
  cast: string[];
  poster: string;
  backdrop: string;
  accent: string;
  featured?: boolean;
  trending?: boolean;
  newRelease?: boolean;
  series?: { season: number; episodes: number };
  durationSeconds?: number;
  source?: MovieSource;
  video?: MovieVideo;
};

const image = (id: string, width: number, height: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=86`;

const curatedMovies: Movie[] = [
  {
    id: "echoes-of-tomorrow",
    title: "Dư Âm Ngày Mai",
    originalTitle: "Echoes of Tomorrow",
    year: 2026,
    duration: "2 giờ 08 phút",
    maturity: "T16",
    match: 98,
    genres: ["Khoa học viễn tưởng", "Bí ẩn", "Chính kịch"],
    synopsis:
      "Một kỹ sư âm thanh phát hiện những bản ghi được gửi về từ tương lai và phải lựa chọn giữa việc cứu thành phố hay bảo vệ người duy nhất còn nhớ cô.",
    director: "An Nguyễn",
    cast: ["Linh Phạm", "Minh Trần", "Khoa Lê"],
    poster: image("photo-1519608487953-e999c86e7455", 640, 960),
    backdrop: image("photo-1519608487953-e999c86e7455", 1800, 1000),
    accent: "#6d8cff",
    featured: true,
    trending: true,
  },
  {
    id: "the-last-signal",
    title: "Tín Hiệu Cuối",
    year: 2025,
    duration: "1 giờ 54 phút",
    maturity: "T13",
    match: 96,
    genres: ["Phiêu lưu", "Khoa học viễn tưởng"],
    synopsis:
      "Một phi hành đoàn đơn độc lần theo tín hiệu lạ ở rìa hệ Mặt Trời, nơi mọi ký ức đều có thể bị viết lại.",
    director: "Mai Vũ",
    cast: ["Hà Đỗ", "Quân Bùi", "Vy Lâm"],
    poster: image("photo-1451187580459-43490279c0fa", 640, 960),
    backdrop: image("photo-1451187580459-43490279c0fa", 1800, 1000),
    accent: "#4cc9f0",
    trending: true,
  },
  {
    id: "midnight-district",
    title: "Phố Nửa Đêm",
    year: 2026,
    duration: "8 tập",
    maturity: "T18",
    match: 95,
    genres: ["Tội phạm", "Neo-noir", "Series"],
    synopsis:
      "Một nữ phóng viên lần theo mạng lưới bí mật đang điều khiển thành phố từ dưới những biển hiệu neon.",
    director: "Huy Phan",
    cast: ["Ngọc Anh", "Sơn Võ", "Tú Uyên"],
    poster: image("photo-1514565131-fce0801e5785", 640, 960),
    backdrop: image("photo-1514565131-fce0801e5785", 1800, 1000),
    accent: "#ff4d8d",
    trending: true,
    newRelease: true,
    series: { season: 1, episodes: 8 },
  },
  {
    id: "after-the-rain",
    title: "Sau Cơn Mưa",
    year: 2024,
    duration: "1 giờ 46 phút",
    maturity: "T13",
    match: 94,
    genres: ["Tình cảm", "Chính kịch"],
    synopsis:
      "Hai người xa lạ trú mưa trong một tiệm sách cũ và vô tình tìm thấy những lá thư chưa từng được gửi.",
    director: "Thảo Trương",
    cast: ["Yến Nhi", "Tuấn Kiệt", "Bảo Hân"],
    poster: image("photo-1519692933481-e162a57d6721", 640, 960),
    backdrop: image("photo-1519692933481-e162a57d6721", 1800, 1000),
    accent: "#8ab4a8",
  },
  {
    id: "wild-horizon",
    title: "Chân Trời Hoang Dã",
    year: 2025,
    duration: "2 giờ 01 phút",
    maturity: "P",
    match: 93,
    genres: ["Tài liệu", "Thiên nhiên"],
    synopsis:
      "Hành trình qua những hệ sinh thái đang thay đổi nhanh nhất Đông Nam Á, được kể từ góc nhìn của người bảo tồn trẻ.",
    director: "CineWave Nature",
    cast: ["Huyền Trang"],
    poster: image("photo-1464822759023-fed622ff2c3b", 640, 960),
    backdrop: image("photo-1464822759023-fed622ff2c3b", 1800, 1000),
    accent: "#8dcf77",
    newRelease: true,
  },
  {
    id: "paper-moons",
    title: "Những Mặt Trăng Giấy",
    year: 2023,
    duration: "1 giờ 39 phút",
    maturity: "T13",
    match: 91,
    genres: ["Hoạt hình", "Gia đình", "Kỳ ảo"],
    synopsis:
      "Một cô bé gấp những mặt trăng giấy để dẫn đường cho cha trở về từ thế giới của những giấc mơ thất lạc.",
    director: "Lam Studio",
    cast: ["Khánh An", "Bình Minh"],
    poster: image("photo-1419242902214-272b3f66ee7a", 640, 960),
    backdrop: image("photo-1419242902214-272b3f66ee7a", 1800, 1000),
    accent: "#a78bfa",
  },
  {
    id: "silent-current",
    title: "Dòng Chảy Lặng Im",
    year: 2025,
    duration: "1 giờ 52 phút",
    maturity: "T16",
    match: 90,
    genres: ["Tâm lý", "Bí ẩn"],
    synopsis:
      "Sau khi trở về làng chài, một thợ lặn nhận ra biển đang trả lại những bí mật mà cả làng muốn chôn vùi.",
    director: "Quỳnh Lê",
    cast: ["Nam Anh", "Diệu Linh"],
    poster: image("photo-1500530855697-b586d89ba3ee", 640, 960),
    backdrop: image("photo-1500530855697-b586d89ba3ee", 1800, 1000),
    accent: "#38bdf8",
    newRelease: true,
  },
  {
    id: "the-architects",
    title: "Những Kiến Trúc Sư",
    year: 2024,
    duration: "6 tập",
    maturity: "T16",
    match: 89,
    genres: ["Chính kịch", "Series"],
    synopsis:
      "Ba kiến trúc sư trẻ cạnh tranh cho dự án lớn nhất đời mình trong khi thành phố dần hé lộ một bản thiết kế bị che giấu.",
    director: "Hoàng Đặng",
    cast: ["Thu Hà", "Đức Long", "Nhật Vy"],
    poster: image("photo-1487958449943-2429e8be8625", 640, 960),
    backdrop: image("photo-1487958449943-2429e8be8625", 1800, 1000),
    accent: "#f59e0b",
    series: { season: 1, episodes: 6 },
  },
  {
    id: "summer-frequency",
    title: "Tần Số Mùa Hạ",
    year: 2026,
    duration: "1 giờ 48 phút",
    maturity: "T13",
    match: 88,
    genres: ["Âm nhạc", "Tuổi trẻ"],
    synopsis:
      "Một nhóm bạn mở lại đài phát thanh bỏ hoang và phát hiện chương trình cuối cùng chưa bao giờ được lên sóng.",
    director: "Trí Vương",
    cast: ["Gia Hân", "Khôi Nguyên"],
    poster: image("photo-1470225620780-dba8ba36b745", 640, 960),
    backdrop: image("photo-1470225620780-dba8ba36b745", 1800, 1000),
    accent: "#fb7185",
    newRelease: true,
  },
  {
    id: "northbound",
    title: "Về Phía Bắc",
    year: 2022,
    duration: "2 giờ 12 phút",
    maturity: "T13",
    match: 87,
    genres: ["Hành trình", "Chính kịch"],
    synopsis:
      "Hai anh em lái chiếc xe cũ xuyên miền núi để hoàn thành lời hứa cuối cùng với mẹ.",
    director: "Duy Hồ",
    cast: ["Tấn Phát", "Mạnh Hùng"],
    poster: image("photo-1464278533981-50106e6176b1", 640, 960),
    backdrop: image("photo-1464278533981-50106e6176b1", 1800, 1000),
    accent: "#eab308",
  },
];

export const licensedMovies = licensedCatalog.items as Movie[];
export const licensedCatalogInfo = {
  generatedAt: licensedCatalog.generatedAt,
  source: licensedCatalog.source,
  licensePolicy: licensedCatalog.licensePolicy,
};
export const movies: Movie[] = [...licensedMovies, ...curatedMovies];

export const featuredMovie = movies.find((movie) => movie.featured)!;

export function findMovie(id: string) {
  return movies.find((movie) => movie.id === id);
}

export function searchMovies(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return movies;
  const queryTokens = normalized.split(/\s+/).filter((token) => token.length > 1);
  return movies.map((movie) => {
    const haystack = normalizeSearchText([
      movie.title,
      movie.originalTitle ?? "",
      movie.director,
      ...movie.genres,
      ...movie.cast,
      movie.synopsis,
    ].join(" "));
    if (haystack.includes(normalized)) return { movie, score: 100 };
    const words = haystack.split(/\s+/);
    const matched = queryTokens.filter((token) => words.some((word) =>
      word.includes(token) || token.includes(word) || editDistanceWithin(token, word, token.length > 5 ? 2 : 1),
    )).length;
    return { movie, score: queryTokens.length ? matched / queryTokens.length : 0 };
  }).filter(({ score }) => score >= .6).sort((a, b) => b.score - a.score).map(({ movie }) => movie);
}

function editDistanceWithin(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return false;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const value = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      current.push(value); rowMin = Math.min(rowMin, value);
    }
    if (rowMin > limit) return false;
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length] <= limit;
}

export function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d");
}

export function maturityAllows(movie: Movie, profileMaturity = "T18") {
  const rank: Record<string, number> = { P: 0, K: 7, T13: 13, T16: 16, T18: 18 };
  return (rank[movie.maturity] ?? 18) <= (rank[profileMaturity] ?? 18);
}

export function filterMoviesForMaturity(catalog: Movie[], profileMaturity = "T18") {
  return catalog.filter((movie) => maturityAllows(movie, profileMaturity));
}

export const demoVideo = {
  mp4: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  attribution: "Big Buck Bunny — Blender Foundation, Creative Commons",
  durationSeconds: 596,
};

export function movieVideo(movie: Movie): MovieVideo {
  return movie.video ?? {
    src: demoVideo.mp4,
    type: "video/mp4",
    durationSeconds: movie.durationSeconds ?? demoVideo.durationSeconds,
    attribution: demoVideo.attribution,
  };
}

export function viewingProgressPercent(movie: Movie, positionSeconds: number) {
  const duration = movieVideo(movie).durationSeconds;
  return Math.min(100, Math.max(1, Math.round((positionSeconds / duration) * 100)));
}
