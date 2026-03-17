# Tài liệu Đặc tả API - Tra soát Giao dịch Thẻ

Tài liệu này định nghĩa danh sách các API cần thiết để phục vụ cho các luồng nghiệp vụ Tra soát giao dịch thẻ.

---

## 1. Nhóm API Public (Dành cho Khách hàng trên Website)

### 1.1. API Tra cứu trạng thái Tra soát thẻ
- **Mục đích**: Cho phép khách hàng nhập thông tin để kiểm tra tình trạng xử lý yêu cầu tra soát.
- **Endpoint**: `GET /api/v1/public/disputes/status`
- **Luồng xử lý (Flow)**:
  1. Frontend gửi request kèm Query Parameters.
  2. Backend validate input (độ dài CCCD, định dạng thẻ, ngày hợp lệ).
  3. Query vào DB `dispute_tickets` theo `customer_cccd`, `card_mask`, `transaction_date`.
  4. Nếu không có data -> Trả về kết quả rỗng kèm message.
  5. Nếu có data đang `PROCESSING` -> Trả về thông báo đang xử lý và tên nhân viên tiếp nhận.
  6. Nếu có từ 1 data trở lên -> Trả về danh sách object để render dạng bảng.
- **Request (Query Params)**:
  ```json
  {
    "cccd": "079201012345",       // string, required
    "card_mask": "1234",          // string, required (4 số đuôi)
    "transaction_date": "2023-10-23" // YYYY-MM-DD, required
  }
  ```
- **Response (Thành công - Có dữ liệu trả về dạng mảng)**:
  ```json
  {
    "code": "SUCCESS",
    "message": "Tra cứu thành công",
    "data": [
      {
        "ticket_code": "TS-20231024-001",
        "loc": "LOC-999888",
        "transaction_date": "2023-10-23T15:30:00Z",
        "transaction_amount": 500000,
        "dispute_amount": 500000,
        "assigned_unit": "RISK_TEAM",
        "status": "PROCESSING",
        "status_display": "Đang xử lý tra soát",
        "assignee_name": "Nguyễn Văn RISK"
      }
    ]
  }
  ```
- **Response (Không có dữ liệu)**:
  ```json
  {
    "code": "NOT_FOUND",
    "message": "Không có thông tin tra soát cho lần đầu."
  }
  ```

---

## 2. Nhóm API Internal (Dành cho Nội bộ - CTE & Team RISK)

*Lưu ý: Các API Internal cần truyền Header Authorization chứa Token của nhân viên đang đăng nhập.*

### 2.1. API Lấy Danh mục Lý do Tra soát
- **Mục đích**: Phục vụ render Dropdown list trên form tạo Ticket cho CTE.
- **Endpoint**: `GET /api/v1/internal/dispute-reasons`
- **Request**: Không có (hoặc phân trang cơ bản).
- **Response**:
  ```json
  {
    "code": "SUCCESS",
    "data": [
      { "code": "UNAUTHORIZED_TXN", "description": "Giao dịch không chính chủ" },
      { "code": "ATM_NO_CASH", "description": "ATM không nhả tiền" }
    ]
  }
  ```

### 2.2. API Lấy Danh mục Phòng ban Phối hợp
- **Mục đích**: Phục vụ render Dropdown list chọn phòng ban khi NV RISK muốn chuyển tiếp ticket.
- **Endpoint**: `GET /api/v1/internal/departments`
- **Request**: Không có.
- **Response**:
  ```json
  {
    "code": "SUCCESS",
    "data": [
      { "code": "CARD_DEPT", "name": "Phòng Thẻ" },
      { "code": "ACCOUNTING", "name": "Phòng Kế toán" }
    ]
  }
  ```

### 2.3. API Tạo mới Yêu cầu Tra soát (Dành cho CTE)
- **Mục đích**: Ghi nhận một Ticket mới xuống DB (Sau khi CTE đã lấy thông tin từ lịch sử GD hoặc nhập tay).
- **Endpoint**: `POST /api/v1/internal/disputes`
- **Luồng xử lý (Flow)**:
  1. Backend nhận Payload. Validation dữ liệu hợp lệ.
  2. Generate `ticket_code` duy nhất hệ thống.
  3. Lấy `user_id` của CTE từ Token.
  4. Build model và `INSERT` record xuống `dispute_tickets` với `status = 'NEW'`.
  5. `INSERT` thêm dòng vào bảng log `ticket_history`.
- **Request Payload**:
  ```json
  {
    "customer_cccd": "079201012345",
    "card_mask": "1234",
    "loc": "LOC-999888",
    "transaction_date": "2023-10-23T15:30:00Z",
    "transaction_amount": 500000,
    "dispute_amount": 500000,
    "auth_code": "AUTH123456",
    "merchant_location": "HIGHLANDS COFFEE - Q1",
    "transaction_type": "RETAIL",
    "reason_code": "UNAUTHORIZED_TXN"
  }
  ```
- **Response**:
  ```json
  {
    "code": "SUCCESS",
    "message": "Tạo vé tra soát thành công",
    "data": {
      "ticket_id": 1,
      "ticket_code": "TS-20231024-001",
      "status": "NEW"
    }
  }
  ```

### 2.4. API Danh sách Ticket (Dành cho Dashboard RISK & CTE)
- **Mục đích**: Lấy danh sách ticket cho các màn hình theo dõi công việc. Hỗ trợ lọc theo trạng thái, ngày tháng, phòng ban.
- **Endpoint**: `GET /api/v1/internal/disputes`
- **Request Params**:
  - `status`: "NEW" (RISK load ca chờ), hoặc "COMPLETED,CANCELLED" (CTE load ca xong chờ báo KH)...
  - `page`: 1, `limit`: 20
- **Response**: Trả về Array Data cấu trúc Pagination chuẩn tương ứng với các cột trên màn hình.

### 2.5. API Tiếp nhận Ticket (Dành cho RISK)
- **Mục đích**: Team RISK quyết định bắt đầu điều tra một Ticket được gán.
- **Endpoint**: `POST /api/v1/internal/disputes/{id}/assign`
- **Luồng xử lý**:
  1. NV Risk click "Tiếp nhận". Backend nhận `{id}`.
  2. Kiểm tra bản ghi phải đang ở trạng thái `NEW`. Nếu khác (vd NV khác đã nhận) -> Quăng lỗi "Ticket đã có người xử lý".
  3. Cập nhật `status = 'PROCESSING'`, lưu thông tin `risk_assignee_id`, `risk_assignee_name`, và `processing_start_time`.
  4. Log vào `ticket_history`.
- **Response**: Chuyển trạng thái thành CÔNG, trả lại Object Ticket đã cập nhật.

### 2.6. API Chuyển tiếp Ticket cho Phòng ban khác (Dành cho RISK)
- **Mục đích**: NV RISK gán/chuyển ca xử lý sang cho một phòng ban khác (VD: Phòng Thẻ, Kế toán) khi cần hỗ trợ.
- **Endpoint**: `POST /api/v1/internal/disputes/{id}/escalate`
- **Request**:
  ```json
  {
    "department_code": "CARD_DEPT" // Mã phòng ban (lấy từ API danh mục)
  }
  ```
- **Luồng xử lý**:
  1. NV Risk chọn phòng ban và bấm chuyển tiếp. Backend validate và cập nhật `assigned_unit` = `department_code`.
  2. Ghi log vào bảng `ticket_history`.
  3. Gửi Email thông báo cho phòng ban được chọn.
- **Response**: Code `SUCCESS`.

### 2.7. API Cập nhật Kết quả Xử lý (Dành cho RISK / Phòng ban khác)
- **Mục đích**: Đóng tác vụ trên cương vị Team RISK hoặc Phòng Thẻ, chốt hướng giải quyết của Case.
- **Endpoint**: `PUT /api/v1/internal/disputes/{id}/resolve`
- **Luồng xử lý**:
  1. NV Risk nhập lý do trả lời, chọn Hủy/Hoàn tất. Request gửi lên Backend.
  2. Map payload `action` ra trạng thái tương ứng (`COMPLETED` hoặc `CANCELLED`).
  3. Update row: cập nhật trạng thái, lưu chuỗi `resolution_reason` người dùng gõ, ghi nhận `completion_time`.
  4. Đẩy một Job Background (Kafka/RabbitMQ hoặc Async Task) để gửi email thông báo cho Team CTE.
  5. Log vào bảng `ticket_history`.
- **Request**:
  ```json
  {
    "action": "COMPLETE", // có thể là 'COMPLETE' hoặc 'CANCEL'
    "resolution_reason": "Đã đối soát xong với hệ thống NAPAS, hoàn tiền ngày T+2."
  }
  ```

### 2.8. API Đóng Vòng đời Ticket (Dành cho CTE)
- **Mục đích**: CTE cập nhật trạng thái Ticket sau khi đã gọi thông báo kết quả cho khách hàng thành công.
- **Endpoint**: `PUT /api/v1/internal/disputes/{id}/close`
- **Luồng xử lý**:
  1. Sau khi call KH, CTE bấm "Đóng Ticket".
  2. DB update dòng ticket sang `status = 'CLOSED'`.
  3. Lưu log hành động vào `ticket_history`.
- **Request**: Body trống hoặc truyền thêm node "note" ghi chú nhỏ nếu yêu cầu.
- **Response**: Phản hồi code thành công `SUCCESS`.

### (Tùy chọn) 2.9. API Integration Lấy Lịch Sử Giao Dịch
- **Mục đích**: Connect hệ thống thẻ để lấy LSGD nhằm auto-fill form khi tạo chức năng. (Chỉ là Proxy API gọi xuống Core).
- **Endpoint**: `GET /api/v1/internal/integration/card/transactions`
- **QueryParams**: `card_number` hoặc `customer_id`, `date`
- **Response**: List các `transactions` tương ứng để render cho CTE tick chọn.
