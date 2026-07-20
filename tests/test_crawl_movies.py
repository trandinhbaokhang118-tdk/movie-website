import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "tools" / "crawl_movies.py"
SPEC = importlib.util.spec_from_file_location("crawl_movies", MODULE_PATH)
assert SPEC and SPEC.loader
crawler = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(crawler)


class MovieCrawlerTests(unittest.TestCase):
    def test_clean_text_removes_markup_and_compacts_space(self):
        self.assertEqual(crawler.clean_text("<p>Hello&nbsp; world</p>\n"), "Hello world")

    def test_choose_stream_rejects_samples_and_large_files(self):
        selected = crawler.choose_stream(
            [
                {"name": "sample.mp4", "size": "20000000", "length": "60"},
                {"name": "huge.mp4", "size": "900000000", "length": "600"},
                {"name": "movie-1080p.mp4", "size": "90000000", "length": "600"},
                {"name": "movie-720p.mp4", "size": "60000000", "length": "600"},
            ]
        )
        self.assertEqual(selected["name"], "movie-720p.mp4")

    def test_selected_stream_preserves_upstream_checksum(self):
        selected = crawler.choose_stream(
            [{"name": "movie.mp4", "size": "60000000", "length": "600", "sha1": "abc123"}]
        )
        self.assertEqual(selected["sha1"], "abc123")

    def test_archive_url_encodes_spaces_but_preserves_folders(self):
        url = crawler.archive_url("Example", "folder/movie title.mp4")
        self.assertEqual(url, "https://archive.org/download/Example/folder/movie%20title.mp4")

    def test_curated_sources_define_open_license_metadata(self):
        self.assertGreaterEqual(len(crawler.CURATED_ARCHIVE_ITEMS), 5)
        for item in crawler.CURATED_ARCHIVE_ITEMS.values():
            self.assertIn("title", item)
            self.assertIn("posterFile", item)
            self.assertIn("backdropFile", item)


if __name__ == "__main__":
    unittest.main()
