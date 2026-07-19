#!/usr/bin/env python3
"""Build CineWave catalogs from licensed Internet Archive items or TMDB metadata.

The Archive mode only accepts Creative Commons/Public Domain items and emits
stream URLs; the TMDB mode emits metadata and official trailer identifiers only.
It never downloads or republishes commercial movie files.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


ARCHIVE_METADATA = "https://archive.org/metadata/{identifier}"
ARCHIVE_DOWNLOAD = "https://archive.org/download/{identifier}/{filename}"
TMDB_API = "https://api.themoviedb.org/3"
USER_AGENT = "CineWaveCatalogBot/1.0 (+https://cinewave-screening-room.khanghi.chatgpt.site)"
ALLOWED_LICENSE_MARKERS = (
    "creativecommons.org/licenses/",
    "creativecommons.org/publicdomain/",
)

CURATED_ARCHIVE_ITEMS: dict[str, dict[str, Any]] = {
    "BigBuckBunny_124": {
        "title": "Big Buck Bunny",
        "originalTitle": "Big Buck Bunny",
        "year": 2008,
        "maturity": "P",
        "genres": ["Hoạt hình", "Hài", "Gia đình"],
        "synopsis": "Một chú thỏ hiền lành quyết định dạy cho ba kẻ bắt nạt trong khu rừng một bài học đầy hài hước.",
        "director": "Sacha Goedegebure",
        "cast": ["Blender Animation Studio"],
        "accent": "#77c66e",
        "featured": True,
        "trending": True,
        "posterFile": "__ia_thumb.jpg",
        "backdropFile": "BigBuckBunny_124.thumbs/Content/big_buck_bunny_720p_surround_000165.jpg",
    },
    "Sintel": {
        "title": "Sintel",
        "originalTitle": "Sintel",
        "year": 2010,
        "maturity": "T13",
        "genres": ["Hoạt hình", "Kỳ ảo", "Phiêu lưu"],
        "synopsis": "Một nữ chiến binh trẻ băng qua vùng đất khắc nghiệt để tìm lại người bạn rồng đã mất.",
        "director": "Colin Levy",
        "cast": ["Halina Reijn", "Thom Hoffman"],
        "accent": "#c89058",
        "trending": True,
        "posterFile": "Poster.jpg",
        "backdropFile": "Sintel.thumbs/sintel-2048-stereo_000390.jpg",
    },
    "Tears-of-Steel": {
        "title": "Tears of Steel",
        "originalTitle": "Tears of Steel",
        "year": 2012,
        "maturity": "T13",
        "genres": ["Khoa học viễn tưởng", "Hành động", "Chính kịch"],
        "synopsis": "Một nhóm chiến binh và nhà khoa học tái hiện một khoảnh khắc tình cảm trong quá khứ để cứu thế giới khỏi robot hủy diệt.",
        "director": "Ian Hubert",
        "cast": ["Derek de Lint", "Sergio Hasselbaink", "Vanja Rukavina"],
        "accent": "#6d8cff",
        "trending": True,
        "posterFile": "tos-poster.jpg",
        "backdropFile": "Tears-of-Steel.thumbs/tears_of_steel_1080p_000589.jpg",
    },
    "ElephantsDream": {
        "title": "Elephants Dream",
        "originalTitle": "Elephants Dream",
        "year": 2006,
        "maturity": "T13",
        "genres": ["Hoạt hình", "Khoa học viễn tưởng", "Siêu thực"],
        "synopsis": "Hai nhân vật kỳ lạ khám phá một cỗ máy sống khổng lồ, nơi niềm tin và thực tại liên tục đổi chỗ.",
        "director": "Bassam Kurdali",
        "cast": ["Cas Jansen", "Tygo Gernandt"],
        "accent": "#8a8f98",
        "newRelease": True,
        "posterFile": "__ia_thumb.jpg",
        "backdropFile": "ElephantsDream.thumbs/ed_hd_000300.jpg",
    },
    "CosmosLaundromatFirstCycle": {
        "title": "Cosmos Laundromat",
        "originalTitle": "Cosmos Laundromat: First Cycle",
        "year": 2015,
        "maturity": "T13",
        "genres": ["Hoạt hình", "Kỳ ảo", "Hài đen"],
        "synopsis": "Trên một hòn đảo hoang vắng, chú cừu Franck gặp một người bán hàng kỳ quặc và nhận món quà có thể thay đổi cả đời mình.",
        "director": "Mathieu Auvray",
        "cast": ["Pierre Bokma", "Reinout Scholten van Aschat"],
        "accent": "#a78bfa",
        "newRelease": True,
        "posterFile": "__ia_thumb.jpg",
        "backdropFile": "CosmosLaundromatFirstCycle.thumbs/Cosmos Laundromat - First Cycle (1080p)_000585.jpg",
    },
}


def request_json(url: str, *, bearer: str | None = None, attempts: int = 4) -> dict[str, Any]:
    headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    if bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    for attempt in range(attempts):
        try:
            with urlopen(Request(url, headers=headers), timeout=35) as response:
                return json.load(response)
        except HTTPError as error:
            if error.code not in {429, 500, 502, 503, 504} or attempt == attempts - 1:
                raise RuntimeError(f"HTTP {error.code} khi gọi {url}") from error
        except URLError as error:
            if attempt == attempts - 1:
                raise RuntimeError(f"Không thể kết nối {url}: {error.reason}") from error
        time.sleep(1.5 * (2**attempt))
    raise RuntimeError(f"Không thể tải {url}")


def clean_text(value: Any) -> str:
    if isinstance(value, list):
        value = " ".join(str(item) for item in value)
    text = re.sub(r"<[^>]+>", " ", html.unescape(str(value or "")))
    return re.sub(r"\s+", " ", text).strip()


def parse_number(value: Any, default: float = 0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def archive_url(identifier: str, filename: str) -> str:
    return ARCHIVE_DOWNLOAD.format(identifier=quote(identifier), filename=quote(filename, safe="/"))


def choose_stream(files: list[dict[str, Any]]) -> dict[str, Any]:
    candidates = []
    for entry in files:
        name = str(entry.get("name", ""))
        size = int(parse_number(entry.get("size")))
        if not name.lower().endswith(".mp4") or size < 10_000_000 or size > 400_000_000:
            continue
        if any(marker in name.lower() for marker in ("sample", "trailer", "thumb")):
            continue
        candidates.append(entry)
    if not candidates:
        raise RuntimeError("Không tìm thấy tệp MP4 phù hợp để phát.")
    return min(candidates, key=lambda entry: int(parse_number(entry.get("size"), 10**12)))


def crawl_archive() -> dict[str, Any]:
    movies = []
    for identifier, override in CURATED_ARCHIVE_ITEMS.items():
        payload = request_json(ARCHIVE_METADATA.format(identifier=quote(identifier)))
        metadata = payload.get("metadata", {})
        license_url = str(metadata.get("licenseurl", ""))
        if not any(marker in license_url.lower() for marker in ALLOWED_LICENSE_MARKERS):
            raise RuntimeError(f"{identifier} không có giấy phép mở được chấp nhận: {license_url or 'thiếu license'}")
        stream = choose_stream(payload.get("files", []))
        duration_seconds = round(parse_number(stream.get("length")))
        if duration_seconds <= 0:
            raise RuntimeError(f"{identifier} thiếu thời lượng video.")
        duration_minutes = max(1, round(duration_seconds / 60))
        creator = clean_text(metadata.get("creator")) or "Internet Archive contributor"
        movie = {
            "id": f"ia-{identifier.lower()}",
            **{key: value for key, value in override.items() if not key.endswith("File")},
            "duration": f"{duration_minutes} phút",
            "durationSeconds": duration_seconds,
            "match": 97 - len(movies),
            "poster": archive_url(identifier, override["posterFile"]),
            "backdrop": archive_url(identifier, override["backdropFile"]),
            "source": {
                "provider": "Internet Archive",
                "itemUrl": f"https://archive.org/details/{quote(identifier)}",
                "licenseName": "Creative Commons Attribution",
                "licenseUrl": license_url,
                "attribution": creator,
            },
            "video": {
                "src": archive_url(identifier, str(stream["name"])),
                "type": "video/mp4",
                "durationSeconds": duration_seconds,
                "attribution": f"{override['title']} — {creator}",
            },
        }
        movies.append(movie)
    return {
        "source": "Internet Archive metadata API",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "licensePolicy": "creative-commons-or-public-domain-only",
        "items": movies,
    }


def tmdb_get(path: str, token: str, **parameters: Any) -> dict[str, Any]:
    query = urlencode({key: value for key, value in parameters.items() if value is not None})
    return request_json(f"{TMDB_API}{path}?{query}", bearer=token)


def pick_trailer(videos: list[dict[str, Any]]) -> dict[str, Any] | None:
    youtube = [video for video in videos if video.get("site") == "YouTube" and video.get("key")]
    youtube.sort(key=lambda video: (video.get("type") != "Trailer", not video.get("official", False)))
    return youtube[0] if youtube else None


def crawl_tmdb(token: str, pages: int, language: str, region: str) -> dict[str, Any]:
    discovered: dict[int, dict[str, Any]] = {}
    for page in range(1, pages + 1):
        payload = tmdb_get("/movie/popular", token, page=page, language=language, region=region)
        for movie in payload.get("results", []):
            if not movie.get("adult") and movie.get("id"):
                discovered[int(movie["id"])] = movie

    items = []
    for movie_id, summary in discovered.items():
        details = tmdb_get(
            f"/movie/{movie_id}",
            token,
            language=language,
            append_to_response="videos,credits",
        )
        trailer = pick_trailer(details.get("videos", {}).get("results", []))
        director = next(
            (member.get("name") for member in details.get("credits", {}).get("crew", []) if member.get("job") == "Director"),
            "Đang cập nhật",
        )
        items.append(
            {
                "id": f"tmdb-{movie_id}",
                "providerId": movie_id,
                "title": details.get("title") or summary.get("title"),
                "originalTitle": details.get("original_title") or summary.get("original_title"),
                "year": int(str(details.get("release_date") or "0000")[:4] or 0) or None,
                "overview": clean_text(details.get("overview")),
                "genres": [genre.get("name") for genre in details.get("genres", []) if genre.get("name")],
                "runtimeMinutes": details.get("runtime"),
                "director": director,
                "cast": [member.get("name") for member in details.get("credits", {}).get("cast", [])[:8]],
                "posterUrl": f"https://image.tmdb.org/t/p/w780{details['poster_path']}" if details.get("poster_path") else None,
                "backdropUrl": f"https://image.tmdb.org/t/p/original{details['backdrop_path']}" if details.get("backdrop_path") else None,
                "voteAverage": details.get("vote_average", 0),
                "popularity": details.get("popularity", 0),
                "trailerKey": trailer.get("key") if trailer else None,
                "trailerSite": trailer.get("site") if trailer else None,
            }
        )
        time.sleep(0.08)
    items.sort(key=lambda item: float(item.get("popularity") or 0), reverse=True)
    return {
        "source": "TMDB API",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "notice": "Metadata and trailer identifiers only; no full movie files.",
        "items": items,
    }


def write_catalog(payload: dict[str, Any], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(output)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Cào catalog hợp pháp cho CineWave")
    subparsers = parser.add_subparsers(dest="source", required=True)

    archive = subparsers.add_parser("archive", help="Lấy phim Creative Commons từ Internet Archive")
    archive.add_argument("--output", type=Path, default=Path("data/licensed_catalog.json"))

    tmdb = subparsers.add_parser("tmdb", help="Lấy metadata và trailer từ TMDB")
    tmdb.add_argument("--output", type=Path, default=Path("data/tmdb_catalog.json"))
    tmdb.add_argument("--pages", type=int, default=1, choices=range(1, 6), metavar="1-5")
    tmdb.add_argument("--language", default="vi-VN")
    tmdb.add_argument("--region", default="VN")
    tmdb.add_argument("--token", default=os.getenv("TMDB_ACCESS_TOKEN"))
    return parser


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    args = build_parser().parse_args(argv)
    try:
        if args.source == "archive":
            payload = crawl_archive()
        else:
            if not args.token:
                raise RuntimeError("Thiếu TMDB_ACCESS_TOKEN hoặc --token.")
            payload = crawl_tmdb(args.token, args.pages, args.language, args.region)
        write_catalog(payload, args.output)
        print(f"Đã ghi {len(payload['items'])} mục vào {args.output}")
        return 0
    except (RuntimeError, OSError, ValueError) as error:
        print(f"Lỗi: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
