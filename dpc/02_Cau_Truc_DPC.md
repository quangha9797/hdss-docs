# Cấu trúc Chuỗi DPC

Chuỗi DPC bao gồm **6 vị trí**, mỗi vị trí (1 ký tự từ `0-9` hoặc `A-Z`) phản ánh một thuộc tính dữ liệu cụ thể của khách hàng. Việc kết hợp 6 vị trí này tạo ra một "hồ sơ thu nhỏ" cho từng người dùng.

---

## 1. Bảng tóm tắt thông tin các Vị trí DPC

| Vị trí | Tên gọi Thuộc tính | Ý nghĩa Ghi chú |
| :---: | :--- | :--- |
| **1** | **Phân khúc Khách hàng** (Segment) | Phân loại dựa trên nghề nghiệp, tiềm năng tài chính và dòng tiền. |
| **2** | **Tình trạng Sản phẩm** (Product Mix) | Định vị được những sản phẩm/dịch vụ nào KH đang sử dụng tại công ty. |
| **3** | **Hạng Ưu tiên** (Customer Tier) | Mức độ quan trọng (VIP/Standard) để ưu tiên phục vụ và áp dụng biểu phí. |
| **4** | **Kênh tiếp cận lần đầu** (Source Channel)| Nguồn kênh Onboard của KH, giúp đo lường Marketing & Hành vi KH. |
| **5** | **Xếp hạng Rủi ro nội bộ** (Internal Risk) | Hỗ trợ cho hệ thống quyết định duyệt luồng (Từ Credit Scoring). |
| **6** | **Trạng thái tương tác** (Engagement) | Đo lường mức độ "nóng" (Mới, Đang hoạt động, Ngủ đông...). |

---

## 2. Chi tiết các Giá trị theo từng Vị trí

### Vị trí 1: Phân khúc Khách hàng (Segment)
Ý nghĩa: Phân loại dựa trên nghề nghiệp và tiềm năng tài chính.
* **`1`**: Sinh viên (Có tiềm năng dư nợ giao dịch trong tương lai).
* **`2`**: Công nhân / Lao động phổ thông (Nguồn thu nhập ổn định, rủi ro trung bình).
* **`3`**: Nhân viên văn phòng (Nguồn thu nhập khá, rủi ro thấp).
* **`4`**: Chủ hộ kinh doanh / Tiểu thương (Dòng tiền giao dịch lớn, nhưng thường khó xác minh thu nhập).
* **`5`**: Tự doanh / Freelancer (Thu nhập có thể cao nhưng bấp bênh).
* **`0`**: Khác / Chưa xác định.

### Vị trí 2: Tình trạng Sản phẩm (Product Mix)
Ý nghĩa: Khách hàng đang sử dụng sản phẩm gì tại công ty.
* **`0`**: Chưa có khoản vay/thẻ (Lead/Prospect).
* **`1`**: Chỉ vay tiền mặt (Cash Loan).
* **`2`**: Chỉ sử dụng Thẻ tín dụng (Credit Card).
* **`3`**: Có cả Vay tiền mặt và Thẻ tín dụng.
* **`4`**: Vay trả góp sản phẩm (Sản phẩm điện máy, xe máy...).
* **`S`**: Khách hàng đã tất toán (Settled) - **Chưa có thẻ**, là khách hàng rất tiềm năng để tư vấn mời vay lại.
* **`U`**: Khách hàng đã tất toán (Settled) - **Tiềm năng mời vay lại** (KH đã có đơn vay kèm thẻ, hoặc hiện tại thẻ vẫn còn đang hoạt động).

### Vị trí 3: Hạng Ưu tiên (Customer Tier)
Ý nghĩa: Xác định mức độ quan trọng để ưu tiên phục vụ đồng thời cho việc áp dụng chính sách ưu đãi, phí/lãi.
* **`N`**: Standard (Khách hàng phổ thông thông thường).
* **`S`**: Silver (Khách hàng phân hạng Bạc).
* **`G`**: Gold (Khách hàng phân hạng Vàng).
* **`D`**: Diamond (Kim cương - Khai thác như là khách hàng VIP, cần phục vụ ngay lập tức khi vào hệ thống).
* **`P`**: Priority (Khách hàng được ưu tiên theo các chiến dịch Marketing đặc biệt cụ thể).

### Vị trí 4: Kênh tiếp cận lần đầu (Source Channel)
Ý nghĩa: Giúp bộ phận Marketing định lượng và đo lường được hiệu quả chạy chiến dịch ở từng kênh, CSKH hiểu được hành vi ban đầu của User.
* **`A`**: App Chạm Vay (Mobile App).
* **`D`**: DVCN Web.
* **`V`**: VIKKI.
* **`H`**: HPO.
* **`C`**: Credit4Tomorrow.

### Vị trí 5: Xếp hạng Rủi ro nội bộ (Internal Risk Grade)
Ý nghĩa: Là kết quả trả về từ hệ thống chấm điểm tín dụng (Credit Scoring). Vị trí này **cực kỳ quan trọng** cho luồng quyết định để Auto Approval (Phê duyệt tự động).
* **`A`**: Rủi ro rất thấp (Ưu tiên cho quy trình duyệt tự động nhanh, có thể áp dụng lãi suất ưu đãi thấp nhất).
* **`B`**: Rủi ro thấp.
* **`C`**: Rủi ro trung bình.
* **`D`**: Rủi ro cao (Khách có rủi ro này cần đưa qua bước đánh giá Thẩm định lại kỹ hơn theo Manual process).
* **`F`**: Danh sách đen / Nợ xấu (Blacklist / Bad debt).
* **`X`**: Chưa có điểm (Thường là khách hàng mới hoàn toàn, chưa thể chấm điểm từ Credit Scoring).

### Vị trí 6: Trạng thái tương tác (Engagement Status)
Ý nghĩa: Đo lường mức độ tương tác, hoạt động và độ "nóng" với các dịch vụ của công ty từ phía khách hàng.
* **`1`**: Mới (New - KH mới vừa mở tài khoản/CIF trong vòng 30 ngày).
* **`2`**: Đang hoạt động (Active - Có phát sinh giao dịch hoặc thanh toán gần đây).
* **`3`**: Ngủ đông (Inactive - KH thực hiện thanh toán xong và không phát sinh giao dịch mới trên 90 ngày).
* **`4`**: Nguy cơ rời bỏ (Churn Risk - KH có các dấu hiệu chậm thanh toán hoặc đã từng yêu cầu đóng thẻ).
* **`5`**: Đã đóng tài khoản (Closed).

---
### 💡 Phân tích Ví dụ Minh họa: `01XHX1`
- `0` *(Product Segment)*: Phân khúc chung khác/chưa xác định
- `1` *(Product Mix)*: Khách hàng chỉ vay tiền mặt
- `X` *(Customer Tier)*: Hạng phổ thông hoặc chưa phân hạng.
- `H` *(Source Channel)*: Khách tiếp cận ban đầu qua nhánh HPO.
- `X` *(Internal Risk)*: Chưa có định mức điểm hệ thống đánh rủi ro
- `1` *(Engagement)*: Khách hàng ở trạng thái tương tác mới (Dưới 30 ngày)
