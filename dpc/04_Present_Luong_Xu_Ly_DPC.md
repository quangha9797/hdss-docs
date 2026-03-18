# Trình bày Luồng xử lý DPC (Flowchart Mở Rộng)

Tài liệu này trình bày luồng xử lý DPC theo định dạng **Cấu trúc Thuyết trình**.
- **Chiều ngang**: Giao tiếp và tương tác giữa các hệ thống (Services / Actors).
- **Chiều dọc**: Trình tự các bước xử lý chi tiết bên trong từng hệ thống.
- **Tính năng Mở rộng (Expandable)**: Ứng dụng các block `<details>` kết hợp với `<summary>` để người thuyết trình có thể tự do thu gọn hoặc phóng to từng cụm tính năng theo tiến độ báo cáo.

---

## Luồng 1: Khách hàng đến cửa hàng tạo tiếp nhận đơn vay

*(💡 Click vào từng phần để mở rộng cụm quy trình tương ứng)*

<details open>
<summary><b>1️⃣ Phần 1: Tiếp nhận yêu cầu & Định danh eKYC</b></summary>

```mermaid
flowchart LR
    subgraph KH [👤 Khách Hàng Nguyễn Văn A]
        direction TB
        K1(Đến cửa hàng) --> K2(Yêu cầu mở đơn vay)
        K2 --> K3(Dùng App quét QR)
        K3 --> K4(Thực hiện eKYC)
    end

    subgraph CH [🏪 Cửa Hàng / Web]
        direction TB
        C1(NV nhập thông tin) --> C2(Tạo mã QR)
        C2 --> C3(Hiển thị QR xác nhận)
    end

    subgraph APP [📱 App HPO]
        direction TB
        A1(Xử lý bảo mật nội bộ) --> A2(Truyền dữ liệu eKYC)
    end

    K2 -. Yêu cầu .-> C1
    C3 -. Phản hồi .-> K3
    K4 -. Data .-> A1
```
</details>

<details>
<summary><b>2️⃣ Phần 2: Xử lý Backend & Sinh DPC Ban Đầu</b></summary>

```mermaid
flowchart LR
    subgraph APP [📱 App HPO]
        direction TB
        A2(Truyền dữ liệu eKYC)
    end

    subgraph BE [⚙️ HPO Backend]
        direction TB
        B1{Kiểm tra CCCD có tồn tại?}
        B2(Tồn tại: Cache Profile cho TVV)
        B3(Chưa có: Cấp mã UUIDv7 tham chiếu mới)
        B4[🎯 Khởi tạo DPC: 00XHX1]
        
        B1 -->|Đã có CCCD| B2
        B1 -->|CCCD mới| B3
        B3 --> B4
        
        %% Note giải thích Trigger
        note1[📌 Trigger: Tạo mới Profile<br/>- Vị trí 1: 0 KH mới<br/>- Vị trí 2: 0 Chưa vay<br/>- Vị trí 4: H Nguồn HPO<br/>- Vị trí 6: 1 Ver 1]
        B4 -.- note1
    end

    A2 -. API .-> B1
```
</details>

<details>
<summary><b>3️⃣ Phần 3: Tạo hợp đồng & Cập nhật DPC Thẩm định</b></summary>

```mermaid
flowchart LR
    subgraph BE [⚙️ HPO Backend]
        direction TB
        B5(Gọi API Core Indus) --> B6(Đẩy đơn qua Thẩm định CU)
    end

    subgraph INDUS [🏦 Hệ thống Core Indus]
        direction TB
        I1(Tạo Hợp đồng Vay DB) --> I2(Map Contract với UUIDv7)
    end

    subgraph CU [⚖️ Hệ thống CU Tools]
        direction TB
        C1(Tiếp nhận đơn) --> C2(Duyệt đơn: Xác định Vay Tiền Mặt)
        C3[🔥 Cập nhật DPC mới: 01XHX1]
        
        C1 --> C2 --> C3
        
        %% Note giải thích Trigger
        note2[📌 Trigger: Duyệt đơn vay Tiền mặt<br/>- Vị trí 2: Update thành 1<br/> Đang có 1 khoản vay tiền mặt ]
        C3 -.- note2
    end

    BE -. Giao tiếp API .-> INDUS
    B6 -. Truyền Data .-> C1
```
</details>

<details>
<summary><b>4️⃣ Phần 4: Thanh toán dài hạn & Tất toán</b></summary>

```mermaid
flowchart LR
    subgraph SYS [💰 HT Theo dõi Thanh toán / Tất toán]
        direction TB
        S1(Chấm điểm dư nợ/Rủi ro) --> S2{Tình trạng thanh toán}
        S3(Tất toán chu đáo / Ổn định)
        S4(Đánh giá Vị trí 5 = A, Vị trí 2 = S)
        S5[🌟 Cập nhật DPC: 0SXHA1]
        
        S6(Nợ thiếu / Chậm trễ)
        S7(Đánh giá rủi ro Vị trí 5 = B,C,D,F)
        
        S2 -->|Đủ số dư| S3 --> S4 --> S5
        S2 -->|Thiếu nợ| S6 --> S7
        
        %% Note giải thích Trigger
        note3[📌 Trigger: Tất toán thành công<br/>- Vị trí 2: Update thành S Settled<br/>- Vị trí 5: Update thành A Rủi ro rất thấp]
        S5 -.- note3
    end
```
</details>

<details>
<summary><b>🗺️ Hiển thị Sơ đồ Toàn cảnh (Luồng 1 Tóm Tắt)</b></summary>

```mermaid
flowchart LR
    subgraph KH [👥 Khách Hàng]
        direction TB
        K1(Yêu cầu) --> K2(Quét QR)
    end
    subgraph CH [🏪 Cửa Hàng]
        direction TB
        C1(Tạo mã QR)
    end
    subgraph BE [⚙️ Backend]
        direction TB
        B1(Xử lý mã DPC: 00XHX1)
    end
    subgraph CORE [🏛️ Thẩm định]
        direction TB
        C_1(Duyệt vay: 01XHX1)
    end
    subgraph SYS [💰 Theo Dõi]
        direction TB
        S1(Tất toán: 0SXHA1)
    end
    
    K1 -.-> C1 -.-> K2 -.-> B1 -.-> CORE -.-> SYS
```
</details>

---

## Luồng 2: Khách hàng Mở Ứng dụng Tạo đơn Mở thẻ

*(Giả định Khách hàng ở Luồng 1 đã tất toán xong ứng dụng)*

<details>
<summary><b>1️⃣ Phần 1: Tải App, eKYC & Kế thừa DPC</b></summary>

```mermaid
flowchart LR
    subgraph KH [👤 Khách Hàng Nguyễn Văn A]
        direction TB
        K1(Tải App Chạm Vay) --> K2(Đăng ký Mở Thẻ)
    end

    subgraph APP [📱 App Chạm Vay]
        direction TB
        A1(Thực hiện eKYC) --> A2(Truyền xác nhận lên Server)
    end

    subgraph BE [⚙️ Chạm Vay Backend]
        direction TB
        B1{Quét đối chiếu CCCD}
        B2(KH Cũ từ luồng 1: Trích xuất UUIDv7)
        B3[🔄 Kế thừa DPC cũ: 0SXHA1]
        
        B1 -->|Khớp TT Hệ thống| B2 --> B3
        
        %% Note giải thích Trigger
        note4[📌 Trigger: Nhận diện KH cũ<br/>- Vị trí 2: S Kế thừa trạng thái đã thanh toán<br/>- Vị trí 5: A Kế thừa Rating hiện tại]
        B3 -.- note4
    end

    K2 -. Thao tác .-> A1
    A2 -. API .-> B1
```
</details>

<details>
<summary><b>2️⃣ Phần 2: Core Thẩm định & Phát hành Thẻ tín dụng</b></summary>

```mermaid
flowchart LR
    subgraph BE [⚙️ Backend & CU Thẩm định]
        direction TB
        B4(Yêu cầu Hệ thống Core xử lý) --> B5(Duyệt đơn Thẻ: Kế thừa profile 0SXHA1)
        B5 --> B6(Ủy quyền Phát hành Thẻ)
    end

    subgraph INDUS [🏦 Hệ thống Core Indus]
        direction TB
        I1(Tạo Hợp đồng Mở Thẻ DB) --> I2(Map đối tượng Contract vs UUIDv7)
    end

    subgraph CC [💳 Hệ thống Thẻ Phát hành]
        direction TB
        CC1(Tiếp nhận nghiệp vụ Phát hành) --> CC2(Phê duyệt Thẻ & Issue Status)
        CC3[🔥 Cập nhật DPC Thẻ: 0UXHA1]
        
        CC1 --> CC2 --> CC3
        
        %% Note giải thích Trigger
        note5[📌 Trigger: Thẻ được phê duyệt<br/>- Vị trí 2: Update thành U<br/> Đã tất toán khoản trước và Đang có thẻ ]
        CC3 -.- note5
    end

    B4 -. API Request .-> I1
    B6 -. Cấp thẩm quyền .-> CC1
```
</details>
