Ứng dụng react chạy trong electron

Ứng dụng này mang ý tưởng là một "Thư viện học tập cá nhân offline", giúp người dùng tổ chức, quản lý và học tập các tài liệu (đặc biệt là học ngoại ngữ) một cách gọn gàng, tập trung và trực quan nhất ngay trên máy tính cá nhân.

1. Quản lý Thư viện Học tập (Dashboard / My Library)
Quét và Tự động nhận diện thư mục (Folder Scanning): Cho phép người dùng chỉ định các thư mục gốc có sẵn trên máy tính. Ứng dụng sẽ tự động "quét" toàn bộ bên trong để tìm các tài liệu học tập và file nghe.
Giao diện cấu trúc cây (Tree View): Giữ nguyên cấu trúc thư mục gốc của người dùng. Các thư mục lớn, thư mục con được tổ chức theo dạng cây lồng nhau để dễ dàng theo dõi.
Tổng hợp thông minh: Tự động thống kê số lượng file đọc (PDF/Word), số lượng file nghe (Audio) và tổng dung lượng hiển thị ngay trực tiếp trên từng thư mục.
Chế độ hiển thị linh hoạt (List/Grid View):
Danh sách (List): Hiển thị chi tiết theo hàng dọc, có thể mở/đóng các nhánh thư mục lồng nhau.
Dạng lưới (Grid): Chế độ mới hiển thị dưới dạng các thẻ (card) lớn, trực quan, giống như một tủ sách.
Ảnh đại diện (Thumbnail): Tự động nhận diện các file hình ảnh bên trong để làm hình đại diện (cover) cho từng bộ tài liệu.
Tìm kiếm nhanh: Thanh tìm kiếm tích hợp giúp lọc và tìm kiếm tên khóa học/tài liệu ngay lập tức.
2. Không gian Học tập Tương tác (Learning View)
Khi người dùng bấm vào một bộ tài liệu, ứng dụng chuyển sang màn hình học tập chuyên dụng với cách bố trí tối ưu sự tập trung:

Bố cục chia vùng (Split Layout): Khu vực ở giữa (trái) chiếm diện tích lớn nhất để hiển thị nội dung tài liệu và tùy chỉnh file nghe; bên phải là danh sách chi tiết cấu trúc bài học.
Danh sách điều hướng thông minh (Sidebar Contents): Liệt kê toàn bộ file đọc và audio hiện có, được gom nhóm gọn gàng theo từng thư mục con để người dùng có thể dễ dàng chuyển đổi qua lại giữa bài đọc và bài nghe đang học.
Trình tự động mở tài liệu (Document Viewer):
Hỗ trợ đọc file PDF chèn trực tiếp ngay bên trong lòng ứng dụng một cách mượt mà.
Với định dạng DOCX (Word), ứng dụng đưa ra hướng dẫn và nút bấm để điều hướng mở trực tiếp bằng Microsoft Word ngoài máy tính nhằm giữ nguyên định dạng chuẩn nhất.
3. Trình phát Audio Đa năng (Audio Player)
Được thiết kế dành riêng cho việc học ngoại ngữ, gắn liền ở ngay mép dưới của khu vực đọc tài liệu:

Đầy đủ tính năng cơ bản: Phát/Dừng, Chuyển bài trước/sau, Thanh kéo tiến trình, Thanh kéo điều chỉnh âm lượng (icon loa sẽ tự động đổi tùy the mức âm lượng).
Tua thông minh (Smart Skip):
Nhấn nút tua 1 lần: Tua nhanh 5 giây.
Nhấn đúp (Double-click): Tua nhanh 10 giây.
Trở về từ đầu (Long Press): Ấn giữ nút tua lùi sẽ lập tức đưa file nghe quay về giây số 0.
Tự động phát chuyển sang bài (track) tiếp theo khi bài hiện tại kết thúc.
4. Trải nghiệm UX/UI Hiện đại
Giao diện theo thiên hướng tối giản, bo cong, có hiệu ứng đổ bóng mờ và sử dụng tone màu bắt mắt.
Sử dụng nhiều icon trực quan ở từng công cụ hay danh mục để giúp người dùng nắm bắt nhanh thông tin.
Các hiệu ứng (Micro-animations) mờ dần, mở rộng hay chuyển màu mượt mà giúp trải nghiệm app giống như một ứng dụng phần mềm cao cấp.
Giao diện cấu hình (Settings) cực kì dễ thao tác để thêm/bớt các thư mục học tập.
Tóm lại, Learning App đóng vai trò xử lý tính "phân mảnh" tài liệu chuyên biệt. Người dùng không cần phải vừa mở một cửa sổ PDF, vừa mở một cửa sổ trình phát nhạc để học ngôn ngữ nữa; tất cả được quy tụ cực kỳ ngăn nắp vào bên trong một cửa sổ duy nhất với cảm giác sử dụng rất "pro".

Các vấn đề còn tồn tại:
chế độ hiển thị grid chưa hỗ trợ đóng/mở các thư mục con. nếu expand thư mục con thì hiển thị các items trong thư mục con đó trong group hoặc thay màu khác để dễ nhìn. Thư mục cha hiển thị thumbnail là mũi tên <. Khi bấm vào thư mục cha 1 lần nữa thì đóng các thư mục con lại.
Thumbnail đang lấy cover.jpg là không đúng. vì hầu hết là file pdf hoặc docx. nên không có cover.jpg. Cần phải lấy ảnh đầu tiên của file pdf hoặc docx để làm thumbnail.
audio player không phát được file 01 Title Information.wma . Có cách đơn giản hơn là chạy các loại file âm thanh bằng trình phát mặc định của hệ thống nhưng embed control vào app


Với các vấn đề còn tồn tại, bạn hãy đề xuất cách giải quyết để app chạy trên windows