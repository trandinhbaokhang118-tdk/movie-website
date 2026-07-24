import type { AppLocale } from "./config";
import generatedTranslations from "./generated-translations.json";

type Dictionary = Record<string, string>;

const en: Dictionary = {
  "Bỏ qua đến nội dung chính": "Skip to main content",
  "CINEWAVE · RẠP PHIM SAU NỬA ĐÊM": "CINEWAVE · AFTER-MIDNIGHT CINEMA",
  "Phim thật để xem.": "Real films to watch.", "Không gian để đắm chìm.": "A place to get immersed.",
  "Những phim mở được tuyển chọn, trải nghiệm cá nhân hóa và mọi bằng chứng bản quyền đều minh bạch.": "Curated open films, a personalized experience, and transparent rights records.",
  "Sẵn sàng bước vào? Nhập email để tạo tài khoản miễn phí.": "Ready to enter? Add your email to create a free account.",
  "Địa chỉ email": "Email address", "Bắt đầu": "Get started", "Xem phim demo thật ngay": "Watch a real demo film",
  "TUYỂN CHỌN HỢP PHÁP": "LICENSED PICKS", "Đang thịnh hành": "Trending now", "Danh sách phim thịnh hành": "Trending films",
  "VÌ SAO CHỌN CINEWAVE": "WHY CINEWAVE", "Một rạp phim được xây quanh bạn": "A cinema built around you",
  "Xem phim thật, miễn phí": "Watch real films for free", "Phát trực tiếp các phim mở đã xác minh từ Internet Archive, không dùng nguồn lậu.": "Stream verified open films from Internet Archive — never pirated sources.",
  "Tiếp tục trên mọi màn hình": "Continue on every screen", "Tiến độ xem được lưu theo hồ sơ trong database và sẵn sàng khi bạn quay lại.": "Viewing progress is saved to your profile and ready when you return.",
  "Chọn phim theo đêm": "Choose films for your night", "Night Compass gợi ý nội dung theo tâm trạng và khoảng thời gian bạn còn lại.": "Night Compass recommends films for your mood and the time left tonight.",
  "Hồ sơ riêng cho gia đình": "Profiles for the whole family", "Tách danh sách, lịch sử, độ tuổi và tùy chọn phát cho từng người xem.": "Separate lists, history, maturity limits, and playback preferences for each viewer.",
  "GIẢI ĐÁP": "HELP", "Câu hỏi thường gặp": "Frequently asked questions", "CineWave là gì?": "What is CineWave?",
  "CineWave là không gian xem phim ban đêm với catalog tuyển chọn, hồ sơ cá nhân, danh sách lưu và tiến độ xem đồng bộ.": "CineWave is a night-time cinema with curated films, personal profiles, watchlists, and synced progress.",
  "Tôi có phải trả phí không?": "Do I have to pay?", "Không. Bản localhost hiện phát các phim Creative Commons hoặc nội dung thuộc phạm vi công cộng đã được kiểm chứng.": "No. This version streams verified Creative Commons and public-domain films.",
  "Phim có xem thật được không?": "Can I really watch the films?", "Có. Các tựa phim có nút Xem ngay phát tệp MP4 thật từ nguồn được ghi rõ trên trang minh bạch bản quyền.": "Yes. Titles with a Watch button stream real MP4 files from the source shown in their rights record.",
  "Tôi có thể xem ở đâu?": "Where can I watch?", "Bạn có thể mở CineWave trên trình duyệt máy tính, máy tính bảng hoặc điện thoại cùng mạng với máy chủ localhost.": "Open CineWave on a computer, tablet, or phone connected to the same network as the local server.",
  "CineWave lưu dữ liệu gì?": "What data does CineWave store?", "Tài khoản, hồ sơ, danh sách, tiến độ và phiên đăng nhập được lưu trong database D1 cục bộ. Mật khẩu không được lưu dưới dạng văn bản.": "Accounts, profiles, lists, progress, and sessions are stored in the local D1 database. Passwords are never stored as plain text.",
  "Nội dung có phù hợp với trẻ em?": "Is the content suitable for children?", "Mỗi hồ sơ có giới hạn độ tuổi. CineWave kiểm tra phân loại trước khi cấp quyền phát phim.": "Every profile has a maturity limit. CineWave checks it before authorizing playback.",
  "ĐÊM NAY XEM GÌ?": "WHAT TO WATCH TONIGHT?", "Bắt đầu câu chuyện đầu tiên.": "Start your first story.",
  "Tạo tài khoản để lưu danh sách, hồ sơ và tiến độ xem.": "Create an account to save lists, profiles, and viewing progress.", "Tạo tài khoản": "Create account",
  "Phim mở. Đêm sâu. Mọi quyền đều minh bạch.": "Open films. Deep nights. Transparent rights.", "Liên kết cuối trang": "Footer links",
  "Về CineWave": "About CineWave", "Kho phim": "Film library", "Gói xem": "Plans", "Tài khoản": "Account", "Đăng nhập": "Sign in", "Đăng ký": "Register",
  "Vận hành độc lập trên localhost.": "Runs independently on localhost.", "Điều hướng chính": "Main navigation",
  "Trang chủ": "Home", "Phim": "Films", "Đêm nay": "Tonight", "Danh sách của tôi": "My list", "Lịch sử": "History", "Đăng xuất": "Sign out",
  "Tìm phim, series hoặc diễn viên": "Search films, series, or cast", "Tìm phim, series, diễn viên…": "Search films, series, cast…", "Mở tìm kiếm": "Open search", "Tìm kiếm từ khóa": "Search", "Xóa từ khóa": "Clear search",
  "Những câu chuyện đáng nhớ, phát theo cách bạn muốn.": "Memorable stories, played your way.", "Khám phá": "Explore", "Phim & series": "Films & series", "Tìm kiếm": "Search", "Thông tin": "Information", "Nội dung demo hợp pháp": "Licensed demo content", "Bản dựng production MVP.": "Production MVP build.",
  "TÀI KHOẢN CINEWAVE": "CINEWAVE ACCOUNT", "Quản lý trải nghiệm xem và dữ liệu của bạn.": "Manage your viewing experience and data.",
  "NGÔN NGỮ": "LANGUAGE", "Ngôn ngữ hiển thị": "Display language", "Chọn ngôn ngữ cho toàn bộ giao diện CineWave. Lựa chọn này được đồng bộ với hồ sơ đang dùng.": "Choose the language for the entire CineWave interface. This preference syncs with the active profile.",
  "RIÊNG TƯ": "PRIVACY", "Dữ liệu cải thiện trải nghiệm": "Data that improves your experience", "Dữ liệu vận hành thiết yếu luôn được tối thiểu hóa. Bạn quyết định có cho phép phân tích hành vi để cải thiện đề xuất hay không.": "Essential operational data is minimized. You decide whether behavior analytics may improve recommendations.",
  "Cho phép analytics cá nhân hóa": "Allow personalized analytics", "Lưu lựa chọn": "Save choice", "Hồ sơ": "Profiles", "Phim đã lưu": "Saved films", "Đang xem": "In progress",
  "THÔNG TIN": "INFORMATION", "Trạng thái": "Status", "Đã xác thực": "Verified", "CÀI ĐẶT": "SETTINGS", "Trải nghiệm xem": "Viewing experience", "Quản lý hồ sơ": "Manage profiles", "Lịch sử xem": "Viewing history", "Gói thành viên": "Membership plans", "Không gian vận hành": "Operations workspace",
  "BẢO MẬT": "SECURITY", "Phiên đăng nhập": "Sign-in sessions", "Đăng xuất thiết bị khác": "Sign out other devices", "thiết bị đang đăng nhập. Phiên được lưu an toàn bằng token băm trong database.": "signed-in devices. Sessions are securely stored as hashed tokens in the database.",
  "Tất cả": "All", "Chi tiết": "Details", "Xem phim": "Watch film", "Xem ngay": "Watch now", "Sắp công bố": "Coming soon", "Đang cập nhật": "Updating", "Có trailer": "Trailer available", "Tìm kiếm nâng cao": "Advanced search", "Khám phá ngay": "Explore now",
};

const fr: Dictionary = {
  "Trang chủ":"Accueil","Phim":"Films","Đêm nay":"Ce soir","Danh sách của tôi":"Ma liste","Lịch sử":"Historique","Đăng nhập":"Connexion","Đăng xuất":"Déconnexion","Tài khoản":"Compte","Tìm kiếm":"Rechercher","Bắt đầu":"Commencer","Tạo tài khoản":"Créer un compte","Địa chỉ email":"Adresse e-mail","Đang thịnh hành":"Tendances","Khám phá":"Explorer","Thông tin":"Informations","Cài đặt":"Paramètres","CÀI ĐẶT":"PARAMÈTRES","NGÔN NGỮ":"LANGUE","Ngôn ngữ hiển thị":"Langue d’affichage","Lưu lựa chọn":"Enregistrer","Quản lý hồ sơ":"Gérer les profils","Lịch sử xem":"Historique de visionnage","Gói thành viên":"Abonnements","BẢO MẬT":"SÉCURITÉ","Phiên đăng nhập":"Sessions de connexion","Đăng xuất thiết bị khác":"Déconnecter les autres appareils","RIÊNG TƯ":"CONFIDENTIALITÉ","Hồ sơ":"Profils","Phim đã lưu":"Films enregistrés","Đang xem":"En cours","Câu hỏi thường gặp":"Questions fréquentes","Về CineWave":"À propos de CineWave","Kho phim":"Catalogue","Gói xem":"Offres","Đăng ký":"S’inscrire","Xem phim":"Regarder","Chi tiết":"Détails","Tất cả":"Tout",
};
const ja: Dictionary = {
  "Trang chủ":"ホーム","Phim":"映画","Đêm nay":"今夜","Danh sách của tôi":"マイリスト","Lịch sử":"履歴","Đăng nhập":"ログイン","Đăng xuất":"ログアウト","Tài khoản":"アカウント","Tìm kiếm":"検索","Bắt đầu":"始める","Tạo tài khoản":"アカウント作成","Địa chỉ email":"メールアドレス","Đang thịnh hành":"トレンド","Khám phá":"見つける","Thông tin":"情報","CÀI ĐẶT":"設定","NGÔN NGỮ":"言語","Ngôn ngữ hiển thị":"表示言語","Lưu lựa chọn":"保存","Quản lý hồ sơ":"プロフィール管理","Lịch sử xem":"視聴履歴","Gói thành viên":"メンバーシップ","BẢO MẬT":"セキュリティ","Phiên đăng nhập":"ログインセッション","Đăng xuất thiết bị khác":"他の端末からログアウト","RIÊNG TƯ":"プライバシー","Hồ sơ":"プロフィール","Phim đã lưu":"保存した映画","Đang xem":"視聴中","Câu hỏi thường gặp":"よくある質問","Về CineWave":"CineWaveについて","Kho phim":"映画ライブラリ","Gói xem":"プラン","Đăng ký":"登録","Xem phim":"映画を見る","Chi tiết":"詳細","Tất cả":"すべて",
};
const ko: Dictionary = {
  "Trang chủ":"홈","Phim":"영화","Đêm nay":"오늘 밤","Danh sách của tôi":"내 목록","Lịch sử":"기록","Đăng nhập":"로그인","Đăng xuất":"로그아웃","Tài khoản":"계정","Tìm kiếm":"검색","Bắt đầu":"시작하기","Tạo tài khoản":"계정 만들기","Địa chỉ email":"이메일 주소","Đang thịnh hành":"인기 콘텐츠","Khám phá":"탐색","Thông tin":"정보","CÀI ĐẶT":"설정","NGÔN NGỮ":"언어","Ngôn ngữ hiển thị":"표시 언어","Lưu lựa chọn":"저장","Quản lý hồ sơ":"프로필 관리","Lịch sử xem":"시청 기록","Gói thành viên":"멤버십","BẢO MẬT":"보안","Phiên đăng nhập":"로그인 세션","Đăng xuất thiết bị khác":"다른 기기 로그아웃","RIÊNG TƯ":"개인정보","Hồ sơ":"프로필","Phim đã lưu":"저장한 영화","Đang xem":"시청 중","Câu hỏi thường gặp":"자주 묻는 질문","Về CineWave":"CineWave 소개","Kho phim":"영화 보관함","Gói xem":"요금제","Đăng ký":"가입","Xem phim":"영화 보기","Chi tiết":"상세 정보","Tất cả":"전체",
};
const zh: Dictionary = {
  "Trang chủ":"首页","Phim":"电影","Đêm nay":"今晚","Danh sách của tôi":"我的片单","Lịch sử":"观看记录","Đăng nhập":"登录","Đăng xuất":"退出登录","Tài khoản":"账户","Tìm kiếm":"搜索","Bắt đầu":"开始使用","Tạo tài khoản":"创建账户","Địa chỉ email":"电子邮箱","Đang thịnh hành":"热门内容","Khám phá":"探索","Thông tin":"信息","CÀI ĐẶT":"设置","NGÔN NGỮ":"语言","Ngôn ngữ hiển thị":"显示语言","Lưu lựa chọn":"保存","Quản lý hồ sơ":"管理个人资料","Lịch sử xem":"观看记录","Gói thành viên":"会员方案","BẢO MẬT":"安全","Phiên đăng nhập":"登录会话","Đăng xuất thiết bị khác":"退出其他设备","RIÊNG TƯ":"隐私","Hồ sơ":"个人资料","Phim đã lưu":"已收藏电影","Đang xem":"正在观看","Câu hỏi thường gặp":"常见问题","Về CineWave":"关于 CineWave","Kho phim":"电影库","Gói xem":"方案","Đăng ký":"注册","Xem phim":"观看电影","Chi tiết":"详情","Tất cả":"全部",
};

// Kept temporarily as migration input for tools/generate_translations.mjs.
void en; void fr; void ja; void ko; void zh;

export const dictionaries: Record<AppLocale, Dictionary> = {
  "vi-VN": {},
  "en-US": generatedTranslations["en-US"] as Dictionary,
  "fr-FR": generatedTranslations["fr-FR"] as Dictionary,
  "ja-JP": generatedTranslations["ja-JP"] as Dictionary,
  "ko-KR": generatedTranslations["ko-KR"] as Dictionary,
  "zh-CN": generatedTranslations["zh-CN"] as Dictionary,
};
