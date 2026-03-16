# Tài liệu Thiết kế Chức năng Tra soát Giao dịch Thẻ

Tài liệu này mô tả chi tiết thiết kế CSDL và luồng nghiệp vụ cho tính năng Tra soát giao dịch thẻ (báo cáo và yêu cầu hoàn tiền cho giao dịch không chính chủ).

---

## 1. Thiết kế Cơ sở dữ liệu (Database Design)

Để đáp ứng các yêu cầu nghiệp vụ, chúng ta cần xây dựng các bảng (tables) chính sau:

### 1.1. Bảng `dispute_tickets` (Thông tin Yêu cầu Tra soát chính)
Bảng này đóng vai trò quan trọng nhất, lưu trữ toàn bộ thông tin vòng đời của một yêu cầu.

| Tên trường (Field) | Kiểu dữ liệu (Type) | Khóa (Key) | Mô tả & Ý nghĩa (Description) |
|---|---|---|---|
| `id` | BIGINT / UUID | PK | Khóa chính, định danh duy nhất cho Ticket để các bảng khác liên kết. |
| `ticket_code` | VARCHAR(50) | UNIQUE | Mã vé tra soát (VD: `TS-20231024-001`) để nhân viên và KH dễ dàng giao tiếp. |
| `customer_cccd` | VARCHAR(20) | INDEX | Số CCCD/CMND của khách hàng. Phục vụ cho màn hình tra cứu của KH trên Website. |
| `card_mask` | VARCHAR(20) | INDEX | 4 số đuôi (hoặc số thẻ bị che mask, vd `******1234`). Phục vụ việc hiển thị và tra cứu hợp lệ. |
| `loc` | VARCHAR(50) | | Line of Credit / Số tham chiếu / Số khế ước thẻ. Phục vụ hiển thị chi tiết tra soát. |
| `transaction_date` | DATETIME | INDEX | Ngày giờ diễn ra giao dịch bất thường (KH hoặc CTE nhập). Dùng làm tiêu chí tra cứu. |
| `transaction_amount` | DECIMAL(18,2) | | Số tiền của giao dịch gốc bị nghi ngờ. |
| `dispute_amount` | DECIMAL(18,2) | | Số tiền khách hàng yêu cầu tra soát/hoàn lại. |
| `auth_code` | VARCHAR(50) | | Mã chuẩn chi (Authorization Code) của giao dịch sinh ra từ Core Thẻ. |
| `merchant_location` | VARCHAR(255) | | Địa điểm thực hiện giao dịch (Merchant name/location). |
| `transaction_type` | VARCHAR(20) | | Loại giao dịch. Có thể setup Enum: `RETAIL` (quẹt POS/Online), `ATM` (rút tiền). |
| `reason_code` | VARCHAR(50) | FK | Mã lý do tra soát (Liên kết với bảng danh mục `dispute_reasons` bên dưới). |
| `status` | VARCHAR(30) | INDEX | Trạng thái hiện tại: `NEW` (Mới), `PROCESSING` (Đang xử lý), `COMPLETED` (Xử lý hoàn tất), `CANCELLED` (Hủy), `CLOSED` (Đã đóng). |
| `assigned_unit` | VARCHAR(100) | | Đơn vị tiếp nhận công việc (VD: `RISK_TEAM`, `FRAUD_TEAM`). |
| `cte_creator_id` | INT | FK | ID của Tổng đài viên (CTE) đã tạo vé. |
| `risk_assignee_id` | INT | FK | ID của nhân viên Team RISK chọn tiếp nhận xử lý vé này. |
| `risk_assignee_name`| VARCHAR(100) | | Tên nhân viên RISK tiếp nhận (Lưu dạng chuỗi để tra cứu nhanh từ Website trả về cho KH nhanh chóng, k cần JOIN sang bảng Users). |
| `processing_start_time`| DATETIME | | Hệ thống ghi nhận tự động khi RISK bấm tiếp nhận xử lý. |
| `completion_time` | DATETIME | | Thời gian xử lý xong (Hoàn tất hoặc Hủy). |
| `resolution_reason` | TEXT | | Ghi chú/Lý do của RISK khi chuyển trạng thái sang Hoàn tất hoặc Hủy (để báo CTE). |
| `created_at` | DATETIME | | Thời gian Ticket được tạo. |
| `updated_at` | DATETIME | | Thời gian record này được update. |

### 1.2. Bảng `dispute_reasons` (Danh mục Lý do Tra soát)
Lưu danh sách động các lý do để hiển thị trên Dropdown chọn lúc tạo ticket.

| Tên trường (Field) | Kiểu dữ liệu (Type) | Khóa (Key) | Mô tả & Ý nghĩa (Description) |
|---|---|---|---|
| `id` | INT | PK | ID tự tăng. |
| `code` | VARCHAR(50) | UNIQUE | Mã chuẩn của lý do (VD: `UNAUTHORIZED_TXN`, `DUPLICATE_CHARGE`). |
| `description` | VARCHAR(255) | | Mô tả hiển thị (VD: "Giao dịch không chính chủ", "Máy ATM không nhả tiền"). |
| `is_active` | BOOLEAN | | Xác định lý do này còn đang được áp dụng dùng hay không (`True`/`False`). |

### 1.3. Bảng `ticket_history` (Lịch sử Trạng thái) (Khuyến nghị thêm vào để Log Audit)
Giúp theo vết và truy vết vòng đời của Ticket bị can thiệp bởi những ai.

| Tên trường (Field) | Kiểu dữ liệu (Type) | Khóa | Mô tả & Ý nghĩa |
|---|---|---|---|
| `id` | BIGINT | PK | Khóa chính. |
| `ticket_id` | BIGINT | FK | ID của bảng `dispute_tickets`. |
| `previous_status` | VARCHAR(30) | | Trạng thái cũ. |
| `new_status` | VARCHAR(30) | | Trạng thái mới. |
| `changed_by_user` | INT | | User ID của người thực hiện hành động. |
| `note` | TEXT | | Ghi chú thêm ở mỗi bước nếu có. |
| `created_at` | DATETIME | | Giờ thao tác đổi trạng thái. |

---

## 2. Thiết kế Luồng thao tác (Business Flow)

### 2.1. Luồng 1: Khách hàng (KH) Tra cứu trên Website public
- **Website (Frontend)**:
  - KH truy cập trang tra cứu thông tin. Giao diện hiển thị form nhập: `CCCD`, `4 số đuôi của thẻ`, `Ngày nghi ngờ`.
  - KH nhấn "Tra cứu".
- **Hệ thống Backend (API)**:
  - Tiếp nhận Request. Truy vấn bảng `dispute_tickets` với 3 điều kiện tương ứng.
  - **Kịch bản 1 (Mới)**: Nếu không có bản ghi nào => Trả về Msg *"Không có thông tin tra soát cho lần đầu."*
  - **Kịch bản 2 (Đã tạo và RISK đang xử)**: Nếu có bản ghi trạng thái `PROCESSING` => Reponse text *"Đang xử lý tra soát"*, lấy trường `risk_assignee_name` để biết tên người tiếp nhận đẩy ra cho KH (nếu UX yêu cầu).
  - **Kịch bản 3 (Liệt kê theo dạng bảng)**: Nếu tồn tại thông tin vé => Render lên màn hình bảng kết quả với các thông tin: `LOC`, `Ngày giao dịch`, `Số tiền giao dịch`, `Số tiền yêu cầu tra soát`, `Đơn vị tiếp nhận`, `Tình trạng xử lý` (`status`).

### 2.2. Luồng 2: Tổng Đài Viên (CTE) Báo cáo & Tạo Ticket
Khi KH gọi điện lên, CTE sẽ thao tác qua Web (Hệ thống Internal/CRM). Có 2 nhánh rẽ:

#### 2.2.A: Nhánh tích hợp trực tiếp Lịch sử giao dịch 
- **Bước 1 (Search)**: CTE điều hướng đến module Thẻ của KH, gọi API tích hợp Core Card lấy danh sách giao dịch trong "ngày có giao dịch bất thường".
- **Bước 2 (Select)**: Trên màn hình hiển thị danh sách giao dịch, CTE tick checkbox chọn vào các dòng bị KH khiếu nại.
- **Bước 3 (Create Box)**: Bấm "Tạo Yêu cầu Tra soát". Giao diện Web hiển thị pop-up/màn hình điền Ticket. Hệ thống **tự động auto-fill** các tham số: `LOC`, `card_mask`, `transaction_date`, `transaction_amount`, `auth_code`, `merchant_location`, `transaction_type(retail/atm)`. 
- **Bước 4 (Draft Input)**: CTE chọn tham số "Lý do tra soát" từ một Dropdown list (query từ CSDL `dispute_reasons`), điền `dispute_amount` (nếu khác tổng tiền rút).
- **Bước 5 (Submit)**: Backend lưu bản ghi xuống `dispute_tickets` với trạng thái `NEW`.

#### 2.2.B: Nhánh không tích hợp Lịch sử giao dịch (Nhập tay / Fallback Mode)
- **Bước 1 (Manual form)**: Do Core down hoặc không tích hợp, CTE mở màn hình "Tạo Ticket Thủ Công".
- **Bước 2 (Manual input)**: Dựa vào ảnh nài KH cung cấp / SMS của KH, CTE trực tiếp gõ vào các ô trống các trường: `LOC`, `Card_mask`, `transaction_date`, `transaction_amount`, `auth_code`, `merchant_location`, chọn `transaction_type`, chọn `reason_code`.
- **Bước 3 (Submit)**: Backend tạo bản ghi vào CSDL `dispute_tickets` cũng với status `NEW`.

### 2.3. Luồng 3: Team RISK Tiếp nhận & Xử lý (Operations Flow)
- **Bước 1 (Hàng chờ)**: Hàng ngày, NV RISK vào cổng thông tin nội bộ (RISK Dashboard), hệ thống backend lấy tất cả list ticket có status đang là `NEW` hiển thị lên màn hình.
- **Bước 2 (Tiếp nhận)**: NV RISK chọn Ticket, bấm nút "Tiếp nhận". Backend cập nhật: 
  - `status` = `PROCESSING`
  - `risk_assignee_id` = {ID NV RISK Current}
  - `processing_start_time` = Current Time.
  *(Kể từ bước này nếu KH query theo Luồng 1 sẽ trả về Kịch bản 2)*
- **Bước 3 (Off-system Ops)**: RISK kiểm tra chéo bằng các công cụ nội bộ / Verify với Switch (Napas/Visa), Camera ATM...
- **Bước 4 (Trả kết quả)**: Sau khi rõ kết quả xử lý, NV RISK click vào Ticket, chọn Trạng thái cuối: "Xử lý hoàn tất" (`COMPLETED`) hoặc "Hủy Tra soát" (`CANCELLED`). Đồng thời form bắt buộc nhập `Lý do` (`resolution_reason`). Bấm Cập nhật.
- **Bước 5 (Thông báo)**: Backend update trạng thái & `completion_time`, lưu lại lý do. Trigger System một Email Worker bắn thông báo tóm tắt qua email cho (nhóm) CTE.

### 2.4. Luồng 4: CTE hoàn thiện và đóng Vòng đời
- **Bước 1 (Check Alert)**: CTE nhận email báo cáo trạng thái hoàn tất, hoặc đăng nhập vào Dashboard Tab "Vé chờ báo KH" (lọc condition `COMPLETED`/`CANCELLED`).
- **Bước 2 (Outbound)**: Gọi tới KH để thông báo kết quả điều tra và cập nhật tình hình hoàn tiền.
- **Bước 3 (Close Event)**: Nằm trong Ticket đó, CTE sau khi gác máy báo thành công, nhấn thao tác "Đóng Ticket". Backend chuyển `status` sang `CLOSED`, chính thức hoàn thành toàn bộ vòng đời của một tra soát giao dịch thẻ.

---

## 3. SQL Scripts (Tạo bảng & Dữ liệu mẫu)

Dưới đây là các script SQL (hỗ trợ chuẩn phổ biến như PostgreSQL / MySQL) để khởi tạo cấu trúc dữ liệu và một số dữ liệu mẫu nhằm mục đích test.

### 3.1. DDL - Script tạo bảng

```sql
-- 1. Bảng Danh mục Lý do Tra soát
CREATE TABLE dispute_reasons (
    id SERIAL PRIMARY KEY, -- (Nên dùng AUTO_INCREMENT nếu là MySQL)
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Bảng Thông tin Yêu cầu Tra soát
CREATE TABLE dispute_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    customer_cccd VARCHAR(20) NOT NULL,
    card_mask VARCHAR(20) NOT NULL,
    loc VARCHAR(50),
    transaction_date TIMESTAMP NOT NULL,
    transaction_amount DECIMAL(18,2) NOT NULL,
    dispute_amount DECIMAL(18,2) NOT NULL,
    auth_code VARCHAR(50),
    merchant_location VARCHAR(255),
    transaction_type VARCHAR(20),
    reason_code VARCHAR(50) REFERENCES dispute_reasons(code),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    assigned_unit VARCHAR(100),
    cte_creator_id INT,
    risk_assignee_id INT,
    risk_assignee_name VARCHAR(100),
    processing_start_time TIMESTAMP,
    completion_time TIMESTAMP,
    resolution_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo Index hỗ trợ tốc độ truy vấn trên Dashboard và API Website
CREATE INDEX idx_dispute_tickets_cccd_card_date ON dispute_tickets(customer_cccd, card_mask, transaction_date);
CREATE INDEX idx_dispute_tickets_status ON dispute_tickets(status);

-- 3. Bảng Lịch sử Trạng thái
CREATE TABLE ticket_history (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT REFERENCES dispute_tickets(id),
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by_user INT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2. DML - Script dữ liệu mẫu (Dummy Data)

```sql
-- Insert danh mục lý do
INSERT INTO dispute_reasons (code, description, is_active) VALUES
('UNAUTHORIZED_TXN', 'Giao dịch không chính chủ / Không thực hiện giao dịch', TRUE),
('DUPLICATE_CHARGE', 'Giao dịch bị trừ tiền 2 lần', TRUE),
('ATM_NO_CASH', 'Thực hiện rút tiền tại ATM, tài khoản bị trừ nhưng ATM không nhả tiền', TRUE),
('WRONG_AMOUNT', 'Số tiền giao dịch không khớp với hóa đơn', TRUE),
('MERCHANT_REFUND_FAIL', 'Đã hủy giao dịch/trả hàng nhưng chưa nhận được tiền hoàn', TRUE);

-- Insert dữ liệu mẫu Ticket 1: Trạng thái NEW (Giao dịch tạo xong, đang đợi RISK xử lý)
INSERT INTO dispute_tickets (
    ticket_code, customer_cccd, card_mask, loc, transaction_date, 
    transaction_amount, dispute_amount, auth_code, merchant_location, 
    transaction_type, reason_code, status, assigned_unit, cte_creator_id
) VALUES (
    'TS-20231024-001', '079201012345', '1234', 'LOC-999888', '2023-10-23 15:30:00',
    500000.00, 500000.00, 'AUTH123456', 'HIGHLANDS COFFEE - Q1',
    'RETAIL', 'UNAUTHORIZED_TXN', 'NEW', 'RISK_TEAM', 101
);

-- Insert dữ liệu mẫu Ticket 2: Trạng thái PROCESSING (RISK đã tiếp nhận và đang xử lý)
INSERT INTO dispute_tickets (
    ticket_code, customer_cccd, card_mask, loc, transaction_date, 
    transaction_amount, dispute_amount, auth_code, merchant_location, 
    transaction_type, reason_code, status, assigned_unit, cte_creator_id,
    risk_assignee_id, risk_assignee_name, processing_start_time
) VALUES (
    'TS-20231024-002', '079201099888', '5678', 'LOC-111222', '2023-10-24 08:15:00',
    2000000.00, 2000000.00, 'AUTH654321', 'ATM VCB - TRAN HUNG DAO',
    'ATM', 'ATM_NO_CASH', 'PROCESSING', 'RISK_TEAM', 102,
    201, 'Nguyễn Văn RISK', '2023-10-24 09:00:00'
);

-- Insert dữ liệu mẫu Ticket 3: Trạng thái COMPLETED (Đã xử lý xong, chuyển lại trạng thái để CTE báo KH)
INSERT INTO dispute_tickets (
    ticket_code, customer_cccd, card_mask, loc, transaction_date, 
    transaction_amount, dispute_amount, auth_code, merchant_location, 
    transaction_type, reason_code, status, assigned_unit, cte_creator_id,
    risk_assignee_id, risk_assignee_name, processing_start_time,
    completion_time, resolution_reason
) VALUES (
    'TS-20231023-099', '001201055555', '9999', 'LOC-555666', '2023-10-20 19:45:00',
    1500000.00, 1500000.00, 'AUTH987654', 'SHOPEE - ONLINE',
    'RETAIL', 'DUPLICATE_CHARGE', 'COMPLETED', 'RISK_TEAM', 105,
    202, 'Trần Thị FRAUD', '2023-10-22 10:00:00', 
    '2023-10-24 14:30:00', 'Đã xác minh tra soát thành công với Tổ chức thẻ. Kế toán sẽ hoàn khoản tiền vào ngày mai.'
);

-- Dữ liệu mẫu Lịch sử trạng thái cho Ticket 3 để phục vụ Audit
INSERT INTO ticket_history (ticket_id, previous_status, new_status, changed_by_user, note) VALUES
(3, NULL, 'NEW', 105, 'Tạo ticket qua tổng đài'),
(3, 'NEW', 'PROCESSING', 202, 'Tiếp nhận xử lý ca charge tiền 2 lần'),
(3, 'PROCESSING', 'COMPLETED', 202, 'Đã đối soát xong với hệ thống NAPAS, xác nhận KH đúng');
```
