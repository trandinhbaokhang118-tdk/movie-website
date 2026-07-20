import type { MovieSource } from "@/lib/catalog";

export function RightsTransparency({ title, source, importedAt }: { title: string; source: MovieSource; importedAt: string }) {
  const evidenceDate = formatEvidenceDate(source.evidenceCapturedAt ?? importedAt);
  const creditLine = source.creditLine ?? `${title} — ${source.attribution} — ${source.provider} — ${source.licenseName}`;
  return (
    <section className="rights-record" aria-labelledby="rights-record-title">
      <div className="rights-record-heading">
        <div><p className="eyebrow">MINH BẠCH BẢN QUYỀN</p><h2 id="rights-record-title">Hồ sơ quyền phát và nguồn gốc</h2></div>
        <span className="rights-verified"><i aria-hidden="true" /> Đã có bằng chứng nguồn mở</span>
      </div>
      <dl className="rights-record-grid">
        <div><dt>Tên phim</dt><dd>{title}</dd></div>
        <div><dt>Tác giả/chủ sở hữu được công bố</dt><dd>{source.rightsHolder ?? source.attribution}</dd></div>
        <div><dt>Nguồn gốc</dt><dd><a href={source.itemUrl} target="_blank" rel="noreferrer">{source.provider} ↗</a></dd></div>
        <div><dt>Giấy phép</dt><dd><a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.licenseName} ↗</a></dd></div>
        <div><dt>Bằng chứng tại ngày nhập</dt><dd>{evidenceDate} · <a href={source.itemUrl} target="_blank" rel="noreferrer">Xem hồ sơ nguồn ↗</a></dd></div>
        <div><dt>Phạm vi lãnh thổ</dt><dd>{source.territory ?? "Theo điều khoản giấy phép nguồn mở"}</dd></div>
        <div><dt>Thời hạn</dt><dd>{formatRightsWindow(source.validFrom, source.validUntil)}</dd></div>
        <div><dt>Quyền sử dụng thương mại</dt><dd>{source.commercialUse === true ? "Được phép, kèm điều kiện ghi công" : source.commercialUse === false ? "Không được phép" : "Cần kiểm tra điều khoản giấy phép"}</dd></div>
        <div className="rights-checksum"><dt>Checksum file video</dt><dd><span>{source.checksumAlgorithm ?? "Chưa xác định"}</span><code>{source.checksum || "Nguồn chưa công bố checksum"}</code></dd></div>
      </dl>
      <div className="credit-line"><p>TASL · Title — Author — Source — License</p><strong>{creditLine}</strong></div>
      <p className="rights-disclaimer">Hồ sơ này lưu dấu vết nguồn và điều khoản tại thời điểm nhập. CineWave vẫn có trách nhiệm rà soát lại trước khi phát hành thương mại hoặc khi nguồn thay đổi thông tin.</p>
    </section>
  );
}

function formatEvidenceDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "long", timeZone: "Asia/Ho_Chi_Minh" }).format(parsed);
}

function formatRightsWindow(from?: string | null, until?: string | null) {
  if (!from && !until) return "Không giới hạn thời gian theo giấy phép nguồn mở";
  return `${from ? formatEvidenceDate(from) : "Không ghi ngày bắt đầu"} – ${until ? formatEvidenceDate(until) : "Không ghi ngày kết thúc"}`;
}
