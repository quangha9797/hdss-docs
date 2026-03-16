# Sơ đồ Luồng Nghiệp vụ (Flowcharts) - Tra soát Giao dịch Thẻ

Tài liệu này sử dụng Mermaid.js để trực quan hóa các luồng xử lý chính trong hệ thống thông qua sơ đồ tuần tự (Sequence Diagram).

---

## 1. Luồng Khách Hàng tự Tra Cứu trên Website
Luồng này mô tả cách khách hàng truy cập cổng thông tin công khai để xem tình trạng xử lý vé tra soát của mình.

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách Hàng (Website)
    participant API as Cổng API Public
    participant DB as CSDL (dispute_tickets)

    KH->>API: Nhập form (CCCD, 4 số thẻ, Ngày GD)
    activate API
    API->>DB: Query theo điều kiện
    activate DB
    
    alt Không có dữ liệu
        DB-->>API: Trả về rỗng (0 dòng)
        API-->>KH: Thông báo: "Không có thông tin tra soát cho lần đầu."
    else Đang xử lý
        DB-->>API: Trả về 1 dòng Status: PROCESSING
        API-->>KH: Thông báo: "Đang xử lý tra soát - NV tiếp nhận: [risk_assignee_name]"
    else Có dữ liệu bảng
        DB-->>API: Trả về list Ticket Status: N/A
        deactivate DB
        API-->>KH: Render bảng DS (LOC, Ngày, Số tiền, Trạng thái...)
    end
    deactivate API
```

---

## 2. Luồng Tổng Đài Viên (CTE) Báo cáo & Tạo Ticket
Luồng mô tả cách CTE thao tác khi khách hàng gọi điện nhờ báo cáo xử lý. Sơ đồ thể hiện cả 2 nhánh (Tích hợp Auto-fill và Nhập tay).

```mermaid
sequenceDiagram
    autonumber
    actor CTE as Tổng đài viên (Customer Service)
    actor KH as Khách Hàng
    participant Core as Core Thẻ (Napas/Visa)
    participant API as API Nội bộ (Ticket System)
    participant DB as CSDL (dispute_tickets)

    KH->>CTE: Gọi điện báo cáo có giao dịch bất thường
    
    alt Nhánh A: Tích hợp Lịch sử
        CTE->>Core: Lấy LSGD theo Số thẻ & Ngày
        activate Core
        Core-->>CTE: Trả về danh sách giao dịch
        deactivate Core
        CTE->>CTE: Tick chọn dòng bị nghi ngờ
        CTE->>CTE: Click "Tạo Yêu cầu Tra soát" (Hệ thống Auto-fill 7 trường dữ liệu)
    else Nhánh B: Nhập tay (Core lỗi / Không tích hợp)
        CTE->>CTE: Mở form Nhập tay thủ công
        CTE->>KH: "Anh/Chị đọc giúp mã tham chiếu, số tiền..."
        KH-->>CTE: Cung cấp thông tin SMS/App
        CTE->>CTE: Gõ dữ liệu vào các ô
    end

    CTE->>CTE: Chọn 'Lý do tra soát' từ Dropdown, Nhập Số tiền bồi hoàn
    CTE->>API: Submit Tạo Ticket mới
    activate API
    API->>DB: Insert bản ghi mới 
    activate DB
    DB-->>API: OK (ticket_id)
    API->>DB: Insert log vào 'ticket_history'
    deactivate DB
    API-->>CTE: Trả kết quả: "Tạo Ticket thành công"
    deactivate API
    CTE->>KH: "Đã ghi nhận, mã tra soát của quý khách là TS-xxx"
```

---

## 3. Luồng Bộ phận RISK Tiếp nhận & Xử lý
Sơ đồ minh họa quá trình của NV RISK từ lúc mở Dashboard xem ca chờ đến lúc đưa ra quyết định Hủy/Hoàn tất.

```mermaid
sequenceDiagram
    autonumber
    actor RISK as NV Rủi Ro (Risk Team)
    participant API as API Nội bộ
    participant DB as CSDL
    participant Ext as Tool Đối soát (External)

    RISK->>API: Load Dashboard "Hàng chờ"
    API->>DB: Lay list ticket (status = 'NEW')
    DB-->>API: Trả danh sách ca mới
    API-->>RISK: Hiển thị bảng

    RISK->>API: Bấm "Tiếp nhận" Ticket #TS-xxx
    API->>DB: Update status='PROCESSING', assignee, start_time
    DB-->>API: Cập nhật thành công
    API-->>RISK: Mở form Chi tiết (Bắt đầu đếm giờ TAT)

    Note over RISK,Ext: NV Risk dùng hệ thống ngoài tra soát giao dịch
    RISK->>Ext: Check camera, log NAPAS, chứng từ...
    Ext-->>RISK: Xác nhận đây là giao dịch gian lận thật
    Note over RISK,Ext: Off-system flow

    RISK->>API: Chọn "Xử lý hoàn tất", nhập "Lý do", Bấm Chốt
    activate API
    API->>DB: Update status='COMPLETED', resolution_reason, completion_time
    DB-->>API: OK
    API-->>RISK: Đóng Ticket trên màn hình RISK
    deactivate API
```

---

## 4. Luồng CTE Thông báo cho KH và Hoàn tất Vòng đời
Sau khi RISK chốt hồ sơ, hệ thống báo về cho CTE để CTE gọi xác nhận lại lần cuối cho Khách hàng.

```mermaid
sequenceDiagram
    autonumber
    actor CTE as Tổng đài viên (CS Queue)
    participant API as Cổng Notification/Ticket
    participant DB as CSDL
    actor KH as Khách Hàng

    Note left of CTE: Hệ thống có thể gửi Email báo cho CTE khi RISK chốt
    CTE->>API: Vào Tab "Vé chờ báo KH"
    API->>DB: Load Ticket (status IN ('COMPLETED', 'CANCELLED'))
    DB-->>API: Trả danh sách ca cần follow-up
    API-->>CTE: Hiển thị danh sách gọi

    CTE->>API: Xem chi tiết "Lý do từ RISK" (Ví dụ: Chấp nhận hoàn 500k)
    CTE->>KH: Gọi outbound: "Chào anh/chị, giao dịch hoàn tất, mai em banh lại tiền..."
    KH-->>CTE: "Cảm ơn em"

    CTE->>API: Bấm "Đóng Ticket (Đã gọi KH)" trên Dashboard
    activate API
    API->>DB: Update status='CLOSED'
    API->>DB: Ghi log hoàn tất chu kỳ
    DB-->>API: OK
    API-->>CTE: Gỡ Ticket khỏi hàng chờ
    deactivate API
```
