# Luồng Xử lý và Cập nhật DPC theo Sự kiện (Use Case Flows)

Tùy thuộc vào ứng dụng Onboard dành cho khách hàng (ví dụ quyết định bằng **Vị trí 4** trong DPC) và các sự kiện nghiệp vụ phát sinh sau đó mà chuỗi DPC sẽ được tạo mới và luân chuyển cập nhật định kỳ vào trong hệ thống. Dưới đây là 2 luồng ví dụ tiêu biểu thể hiện rõ chức năng này.

---

## Luồng 1: Khách hàng đến cửa hàng tạo tiếp nhận đơn vay 

**Ngữ cảnh (Kịch bản):** Khách hàng *Nguyễn Văn A* đến cửa hàng của Công ty để tạo một hợp đồng/đơn vay mua hàng.

### 1. Sơ đồ các luồng xử lý (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách hàng Nguyễn Văn A
    participant TQ as Thao tác Cửa hàng/Web
    participant APP as App HPO 
    participant BE as HPO Backend
    participant IND as Hệ thống Indus (Core)
    participant CUT as Hệ thống CU Tools
    participant SYS as HT Theo dõi Tất toán

    note over KH, BE: Xử lý thao tác trên Ứng dụng
    KH->>TQ: Yêu cầu mở đơn vay mua hàng
    TQ->>TQ: NV nhập thông tin vay & Tạo mã QR
    TQ-->>KH: Hiển thị mã QR xác nhận
    KH->>APP: Dùng Mobile app quét QR & eKYC

    note over APP, BE: Xử lý bảo mật thông tin nội bộ
    APP->>BE: Truyền dữ liệu eKYC (CCCD...)
    
    alt CCCD đã tồn tại trong Hệ thống
        BE->>BE: Cache dữ liệu (Profile) vào Hệ thống để Tư vấn viên sử dụng
        note right of BE: Giúp TVV nhận diện & hỗ trợ ngay
    else CCCD kiểm tra mới / chưa có
        BE->>BE: Cấp mã UUIDv7 tham chiếu mới
        note right of BE: Khởi tạo giá trị DPC:<br/>00XHX1
    end

    BE->>IND: Gọi API Tạo mã truy xuất & Hợp đồng DB
    IND->>IND: Tạo đối tượng Hợp đồng Vay trên Core
    IND-->>BE: Map mã khoản vay (Contract) với UUIDv7 tương ứng

    BE->>CUT: Đẩy đơn chạy qua Thẩm định
    CUT->>CUT: Duyệt đơn & Xác định lại Loai đơn Vay
    note over CUT: Do là đơn Vay Tiền Mặt:<br/>Cập nhật [Vị trí 2] = 1<br/>=> DPC mới nhất: 01XHX1 
    
    note over SYS: Sự kiện về dài hạn (Thanh toán định kỳ)
    loop Quá trình theo dõi Thanh toán / Tất toán khoản vay
        SYS->>SYS: Chấm điểm lại dư nợ & Cập nhật rủi ro khách hàng
        alt Thanh toán Tất toán đủ số dư
            SYS->>SYS: Cập nhật chỉ số tốt
            note over SYS: Do tất toán chu đáo, ít rủi ro:<br/>Cập nhật [Vị trí 5] = A (Rất thấp)<br/>Cập nhật [Vị trí 2] = S (Đã settled, để mời lại)
            note over SYS: => DPC chuẩn sẽ chuyển thành: 0SXHA1
        else Tình huống thanh toán thiếu / Chậm nợ
            SYS->>SYS: Cập nhật chỉ số rủi ro
            note over SYS: Cập nhật [Vị trí 5] thay đổi linh động thành B, C, D, hoặc F (Nợ xấu)
        end
    end
```

### 2. Sự tiến hóa chuỗi DPC trong Luồng 1
1. Khởi tạo đầu vào: **`00XHX1`** — Khách hàng sau khi eKYC hoàn tất nhưng lại chưa được thiết định DB khoản vay (`H` = Từ HPO).
2. Khi hợp đồng sinh ra: **`01XHX1`** — Khi hệ thống nội bộ duyệt đơn vay là loại Vay (Vị trí 2 thay đổi bằng `1`).
3. Khách hàng đã Tất toán xong: **`0SXHA1`** — Tất toán chu đáo làm Vị trí 5 thành `A` (Rating Rất tuyệt vời) và Vị trí 2 bằng `S` (Mời tiếp tục Vay - Cho luồng sau).

---

## Luồng 2: Khách hàng Mở Ứng dụng Tạo đơn Mở thẻ 

**Ngữ cảnh (Kịch bản):** Khách hàng *Nguyễn Văn A* quyết định tải ứng dụng Mobile để đăng ký thêm một Hợp đồng Mở Thẻ mới (Với giả định KH này là KH được thừa hưởng từ quy trình Luồng 1 đã có sẵn DPC sau khi Tất Toán chu đáo là: `0SXHA1`).

### 1. Sơ đồ các luồng xử lý (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách hàng Nguyễn Văn A
    participant CV as App Chạm Vay 
    participant BE as Chạm Vay Backend
    participant IND as Hệ thống Indus (Core)
    participant CUT as Hệ thống CU Tools
    participant CC as Hệ thống Thẻ

    note over KH, BE: Xử lý thao tác trên Ứng dụng
    KH->>CV: Tải App, Đăng ký mở Thẻ
    CV->>CV: Hoàn tất eKYC cho KH
    CV->>BE: Đẩy thông tin xác nhận qua BE
    
    note over CV, BE: Xử lý bảo mật thông tin nội bộ
    alt CCCD kiểm tra có tồn tại trong hệ thống cũ
        BE->>BE: Trích xuất UUIDv7 và Cache lại Thông tin cho TVV
        note right of BE: DPC hiện tại thừa hưởng từ lần vay trước là: 0SXHA1
    else CCCD kiểm tra mới / chưa có (Trường hợp ngoài kịch bản)
        BE->>BE: Generate UUIDv7 + DPC mặc định 00XXA1
    end

    BE->>IND: Yêu cầu xử lý tạo giao kèo
    IND->>IND: Tạo đối tượng Hợp đồng Mở thẻ trên Core
    IND-->>BE: Map đối tượng (Contract) với UUIDv7 tương ứng

    BE->>CUT: Đẩy đơn chạy qua Thẩm định
    CUT->>CUT: Duyệt đơn Thẻ & Xác nhận lại DPC Profile cũ
    note over CUT: Khách đang có DPC là 0SXHA1<br/>(Đoạn này xác nhận KH đã settle đơn vị vay trước)
    
    CUT->>CC: Ủy quyền Yêu cầu Phát hành Thẻ tín dụng
    CC->>CC: Xử trị nghiệp vụ Phát hành Thẻ
    note over CC: Thẻ được phê duyệt & Issue:<br/>Hệ thống cập nhật [Vị trí 2] = U<br/>(Đã tất toán vay cũ + Có thẻ mới)<br/>=> DPC mới nhất Update thành: 0UXHA1
```

### 2. Sự tiến hóa chuỗi DPC trong Luồng 2
Trong kịch bản KH **đã** tồn tại từ Luồng 1 có lịch sử:
1. Thông tin thừa hưởng: **`0SXHA1`** — Backend check CCCD thấy khách hàng này đã tất toán đợt vay cũ từ nhánh `HPO`. Kênh `H` sẽ được kế thừa trên Profile. Tình trạng cũ cũng là đã thanh toán (`S`) và Rating Nội bộ là (`A`). 
2. Có đơn mở thẻ cập nhật mới: **`0UXHA1`** — Ngay khi xử lý phát hành Thẻ mới diễn ra tại Core backend, Hệ thống Thẻ thay đổi Vị trí 2 thành trạng thái (`U`) thể hiện KH tiềm năng đã rải vay cũ xong mà có Thẻ đã và đang hoạt động.
*(Trong trường hợp KH mới hoàn toàn không qua vay lần 1, thường mã DPC sinh qua App Chạm Vay sẽ là 00XXA1 - Kênh App là `A`)*.
