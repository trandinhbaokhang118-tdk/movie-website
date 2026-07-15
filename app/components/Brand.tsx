import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="CineWave — Trang chủ">
      <span className="brand-mark" aria-hidden="true">
        C
      </span>
      <span>CineWave</span>
    </Link>
  );
}
