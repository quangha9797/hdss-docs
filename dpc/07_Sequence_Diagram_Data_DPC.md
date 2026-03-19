# Phân Tích Sequence Diagram & Logic Database Theo Luồng

Trả lời câu hỏi của bạn: **Việc kết hợp Sequence Diagram (Sơ đồ tuần tự) và Table Dữ liệu là cách tiếp cận TUYỆT VỜI NHẤT dành cho đội ngũ Kỹ thuật (Dev/BA/SA)**. Sơ đồ tuần tự sẽ giải quyết bài toán "Thứ tự gọi hàm / API thế nào", trong khi Table dữ liệu sẽ giải quyết bài toán "Trạng thái lưu trữ DB ra sao sau mỗi lệnh gọi".

Để trực quan nhất, phần **Trạng thái Database (`dpc_tmp` và `dpc_master`) đã được nhúng trực tiếp vào Từng Điểm Chạm (Touchpoint)** ngay trong thân sơ đồ.

---

## Luồng 1: Khách Hàng Mới (Chưa có CCCD trong CSDL)

Đây là kịch bản khách hàng lần đầu tiên sử dụng dịch vụ thông qua HPO Web/App.

### 1.1 Sơ đồ tuần tự kèm Dữ liệu (Sequence Diagram + DB State)

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách Hàng (Mới)
    participant APP as HPO App/Web
    participant BE as Backend (HPO BE)
    participant DB as Database
    participant CRON as Tiến trình Cronjob
    participant CORE as Hệ thống Core / Card
    
    KH->>APP: Nhập CCCD & Liveness
    APP->>APP: Hoàn tất eKYC (Thu thập Data)
    APP->>BE: Gửi thông tin định danh
    
    note over BE, DB: Gọi Procedure: Init_dpc()
    BE->>DB: Truy vấn kiểm tra CCCD
    DB-->>BE: Trả về Null (Khách mới)
    
    BE->>BE: Khởi tạo mã định danh UUIDv7<br/>Khởi tạo DPC = 000XX1
    
    note over BE, DB: Gọi Procedure: dpc_log()
    BE->>DB: Insert dòng log mới vào bảng [dpc_tmp]
    note right of DB: 🔴 LƯU VÀO BẢNG dpc_tmp (Row 1):<br/>- uuid_v7: 12a...<br/>- dpc_code: 000XX1<br/>- status: PENDING<br/>- action: INSERT
    
    loop Chạy định kỳ
        CRON->>DB: Quét bảng [dpc_tmp] tìm log mới
        CRON->>DB: Insert sang bảng gốc [dpc_master]
        note right of DB: 🟢 ĐỒNG BỘ dpc_master (Row 1):<br/>- uuid_v7: 12a...<br/>- current_dpc: 000XX1<br/>- note: Khách mới tinh
    end
    
    BE->>CORE: Gửi luồng xử lý HD/Thẻ tiếp theo
```

### 1.2 Giải thích hành vi Dữ liệu
Ở luồng này, hệ thống sẽ thực thi lệnh **INSERT** ở cả 2 bảng. Tại bước 6, do là khách hàng mới hoàn toàn, DPC khởi tạo là `000XX1` được ghi nhận lập tức vào log `dpc_tmp`. Sau đó, tiến trình định kỳ của hệ thống (Cronjob) quét qua, lấy đúng log mới đó để **INSERT** làm bản ghi gốc (`dpc_master`) đại diện cho người dùng thông qua UUIDv7.

---

## Luồng 2: Khách Hàng Cũ (Đã có CCCD trong CSDL)

Đây là kịch bản khách hàng cũ quay lại, ví dụ để mở mới khoản vay tiền mặt hoặc thẻ tín dụng.

### 2.1 Sơ đồ tuần tự kèm Dữ liệu (Sequence Diagram + DB State)

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách Hàng (Cũ)
    participant APP as HPO App/Web
    participant BE as Backend (HPO BE)
    participant DB as Database
    participant CRON as Tiến trình Cronjob
    participant CORE as Hệ thống Core / Card
    
    KH->>APP: Nhập lại CCCD
    APP->>APP: Khớp thông tin cũ
    APP->>BE: Request xử lý dịch vụ mới
    
    note over BE, DB: Gọi Procedure: Init_dpc()
    BE->>DB: Truy vấn kiểm tra CCCD
    DB-->>BE: KH Tồn tại! Trả về `UUIDv7` cũ<br/>Cùng DPC cũ là 000XX1
    
    BE->>BE: Xử lý Logic Nghiệp vụ Vay<br/>Nâng cấp DPC từ 000XX1 -> 010XX1
    
    note over BE, DB: Gọi Procedure: dpc_log()
    BE->>DB: Insert THÊM DÒNG LOG MỚI vào [dpc_tmp]
    note right of DB: 🔴 INSERT LOG BẢNG dpc_tmp (Row 2):<br/>- uuid_v7: 12a... (Giữ nguyên cũ)<br/>- dpc_code: 010XX1 (DPC đã lên cấp)<br/>- status: PENDING<br/>- action: UPDATE_LOG
    
    loop Chạy định kỳ
        CRON->>DB: Quét bảng [dpc_tmp] tìm dữ liệu DPC thay đổi
        CRON->>DB: Logic Nâng cấp (UPDATE ghi đè) [dpc_master]
        note right of DB: 🟢 CẬP NHẬT dpc_master (Ghi đè Row 1):<br/>- uuid_v7: 12a...<br/>- current_dpc: 010XX1 (Thay thế số cũ)<br/>- note: KH đã Vay thành công
    end
    
    BE->>CORE: Kế thừa Profile DPC mới, duyệt nghiệp vụ
```

### 2.2 Giải thích hành vi Dữ liệu
Khác với luồng 1, luồng quay lại này sẽ tiếp tục dùng hàm **INSERT** để thảy vào thêm một dòng báo cáo ở bảng Tạm (`dpc_tmp` row 2) tạo thành vết log thứ hai.
Tuy nhiên, khi tiến trình Cronjob chạy, nó không tạo mới mà thực hiện lệnh **UPDATE** - Tức là tìm bảng `dpc_master` tại dòng chứa mã uuid_v7 `12a...`, rồi **GHI ĐÈ** DPC mới `010XX1` đè lên con số DPC cũ. Nhờ vậy, trạng thái khách hàng luôn được Update Status mới nhất vào trong lõi.

---

## 🎯 Tại sao cách biểu diễn này tối ưu?

Việc trực tiếp đưa ghi chú **Table Data States (Trạng thái dữ liệu)** vào những điểm giao kết Database (Bước 6 và Bước 8) giúp:
1. **Liên kết luồng chạy - kết quả lưu trữ:** Người đọc không cần kéo xuống dưới để xem hệ quả của một API Call là gì nữa. Mọi thứ được phơi bày tức thời (Real-time tracking of DB State). 
2. **Khắc họa triết lý Design của hệ thống:** Trực quan thấy được cơ chế Insert nhồi thêm dữ liệu ở bảng log lịch sử (`dpc_tmp`), so với cơ chế Cập nhật ghi đè chốt số tại bảng Trạng thái (Master Data `dpc_master`). Trang bị đầy đủ cho Dev và Test/QA cách debug lỗi (nếu có).
