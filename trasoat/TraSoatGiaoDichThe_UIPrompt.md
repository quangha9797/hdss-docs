# Prompts Thiết kế UI: Chức năng Tra soát Giao dịch Thẻ (dành cho Stitch/AI UI Designer)

Tài liệu này cung cấp các prompt chi tiết để đưa vào các công cụ GenAI thiết kế UI (như Stitch, v0.dev, hay Lovable). Các prompt được chia theo từng màn hình (Screen) trong luồng nghiệp vụ.

---

## 1. Màn hình Khách hàng (User-Facing)

### 1.1. Màn hình Tra cứu Tra soát
**Prompt:**
> "Design a modern, clean, and responsive public web page for a Bank's Customer Portal. The purpose is for customers to check the status of their credit card dispute (Tra soát giao dịch). 
> 
> **Layout:**
> - Header: Bank Logo, a simple title 'Tra cứu trạng thái Tra soát thẻ' (Check Dispute Status).
> - Main Content Area: A centralized card containing a form with 3 input fields:
>   1. `Số CCCD/CMND` (National ID) - Text input.
>   2. `4 số cuối của thẻ` (Last 4 digits of card) - Number input (max length 4).
>   3. `Ngày giao dịch nghi ngờ` (Suspected transaction date) - Date picker.
> - A prominent primary button: 'Tra cứu' (Search).
> 
> **States to design (Mockups for search results below the form):**
> - *Empty State / Not Found*: A friendly illustration or alert box returning the message 'Không có thông tin tra soát cho lần đầu' (No dispute information found).
> - *Processing State*: An alert or banner showing 'Đang xử lý tra soát' (Dispute is currently being processed) along with a subtle text 'Người tiếp nhận: [risk_assignee_name]'.
> - *Table Result State*: A clean data table displaying the dispute history if multiple records exist. Columns: `Số khế ước (LOC)`, `Ngày giao dịch`, `Số tiền giao dịch`, `Số tiền tra soát`, `Đơn vị tiếp nhận`, `Tình trạng xử lý (Status badge: NEW, PROCESSING, COMPLETED, CANCELLED, CLOSED)`.
> 
> **Style Requirements:** Use a professional banking UI theme. Trustworthy colors (deep blues, whites, light grays). Use modern typography (Inter or Roboto). Ensure the inputs have clear validation states (focus, error)."

---

## 2. Nhóm Màn hình Dành cho Tổng đài viên (CTE / Customer Service Dashboard)

### 2.1. Màn hình Tạo Ticket Tra soát (Tích hợp Lịch sử Giao dịch)
**Prompt:**
> "Design an internal Customer Support CRM dashboard screen for a bank agent (CTE) to create a new Credit Card Dispute Ticket. The screen should look like a professional, data-dense internal admin panel.
> 
> **Layout & Components:**
> - **Top Section (Customer Info)**: Display basic customer details (Name, CCCD = 079201012345).
> - **Middle Section (Transaction History Table)**: A table showing the customer's recent transactions. Columns: `Checkbox` (to select), `Ngày giờ` (Date), `Số thẻ` (Card Mask), `Số tiền` (Amount), `Mã chuẩn chi` (Auth Code), `Địa điểm` (Merchant Location), `Loại` (Type: ATM/Retail). 
>   - *Interaction*: Show one row checked to simulate the agent selecting a disputed transaction.
> - **Bottom Section / Modal (Dispute Creation Form)**: When a transaction is selected, a form appears (or a slide-over panel) to finalize the ticket. It should have:
>   - Auto-filled disabled fields (pulled from the selected transaction): LOC, Card Mask, Date, Amount, Auth Code, Merchant, Type.
>   - A Number Input for `Số tiền yêu cầu tra soát` (Disputed Amount) - defaults to transaction amount but editable.
>   - A Dropdown Select for `Lý do tra soát` (Dispute Reason). Options should include things like 'Giao dịch không chính chủ', 'ATM không nhả tiền', 'Trừ tiền 2 lần'.
> - A primary submit button: 'Tạo Yêu cầu Tra soát' (Create Dispute Ticket).
> 
> **Style:** High information density, neutral gray backgrounds, clear visual hierarchy, emphasis on readability. Use a sidebar navigation on the left typical of CRM admins."

### 2.2. Màn hình Nhập Ticket Thủ công (Fallback Mode)
**Prompt:**
> "Design an alternative 'Manual Creation' popup or page in the CRM dashboard for creating a Dispute Ticket when the core system is down and transaction history cannot be fetched.
> 
> **Components:**
> - A clean, structured form asking the agent to manually input all details reported by the customer.
> - Form Fields: `LOC`, `4 số cuối thẻ`, `Ngày giờ giao dịch` (Datetime picker), `Số tiền giao dịch`, `Số lượng tiền yêu cầu bồi hoàn`, `Mã chuẩn chi (Auth Code)`, `Địa điểm giao dịch (Merchant)`, `Loại giao dịch` (Radio button: RETAIL / ATM), `Lý do tra soát` (Dropdown).
> - Bottom actions: 'Hủy' (Cancel) and 'Tạo Ticket' (Submit).
> 
> **Style:** Standard enterprise form design. Groups related fields together (e.g., Card Info in one row, Transaction Info in another). Ensure required fields are marked with asterisks."

---

## 3. Nhóm Màn hình Dành cho Khối Rủi Ro (RISK Operations Dashboard)

### 3.1. Màn hình Hàng chờ & Tiếp nhận Ticket (RISK Queue)
**Prompt:**
> "Design an internal Admin Dashboard specialized for the Bank's Risk & Fraud Operations Team. The purpose is to view and manage incoming dispute tickets.
> 
> **Layout & Components:**
> - Left Sidebar: Navigation (Dashboard, Dispute Queue, Completed, Settings).
> - Top Navigation: Search bar, User Profile (Risk Agent).
> - Main Area: 
>   - A metric cards section at the top (e.g., 'Tickets Mới: 15', 'Đang xử lý: 8').
>   - A filter bar: Filter by `Date`, `Status` (Default showing 'NEW'), `Reason Code`.
>   - A Data Table (The Queue): Showing incoming tickets. Columns: `Mã Ticket (Ticket Code)`, `CCCD`, `Ngày tạo`, `Số tiền dispute`, `Lý do`, `Hành động`.
>   - *Action Button in Table*: The 'Hành động' column should have a primary button called 'Tiếp nhận' (Assign to me / Start Processing).
> 
> **Style:** Clean, grid-based, using data-table best practices. Status columns should use color-coded badges (e.g., 'NEW' in light blue). Highlight the 'Tiếp nhận' action clearly so agents know what to click."

### 3.2. Màn hình Xử lý Chi tiết & Trả kết quả (RISK Detail View)
**Prompt:**
> "Design the 'Ticket Detail' view for a Risk Agent who is currently processing a dispute. 
> 
> **Layout & Components:**
> - Header: Ticket Code (e.g., TS-20231024-001) and a Status Badge showing 'PROCESSING' (Đang xử lý).
> - **Left Column (2/3 width) - Information:** 
>   - Display all transaction and dispute details clearly in a card (Card Mask, LOC, Merchant, Reason, Auth Code). 
>   - Below it, an 'Audit Log / History' timeline showing when it was created by the CTE and when it was picked up by the Risk agent.
> - **Right Column (1/3 width) - Action Panel (Trả kết quả):**
>   - A form for the Risk Agent to close the case.
>   - Radio buttons or Select for Final Verdict: 'Xử lý hoàn tất' (Completed/Approved) or 'Hủy Tra soát' (Cancelled/Rejected).
>   - A mandatory Textarea for `Lý do / Ghi chú giải quyết` (Resolution note). Example placeholder: 'Describe the verification outcome with VISA/Mastercard...'.
>   - A large primary button: 'Chốt Kết Quả' (Submit Resolution).
> 
> **Style:** Split-screen or card-based layout to separate read-only data from the interactive action form. Professional, clear typography. timeline component should look sleek."

---

## 4. Màn hình CTE Đóng vòng đời (Post-Resolution)

### 4.1. Màn hình Danh sách Vé chờ Báo KH (CTE Outbound Queue)
**Prompt:**
> "Design a tab or view in the Customer Service (CTE) CRM Dashboard called 'Vé chờ báo KH' (Tickets pending customer notification).
> 
> **Layout & Components:**
> - A filtered data table showing only tickets where Status is 'COMPLETED' or 'CANCELLED'.
> - Columns: `Mã Ticket`, `Tên KH`, `SĐT` (Phone number for outbound call), `Trạng thái cuối` (Badge: Completed/Cancelled), `Lý do từ RISK` (Truncated text).
> - **Interaction/Modal:** When the agent clicks a row, a simple modal pops up.
>   - The modal summarizes the Risk team's findings.
>   - It provides a prominent button to be clicked *after* the agent finishes the phone call: 'Đóng Ticket (Đã gọi KH)' (Close Ticket - Customer Notified).
> 
> **Style:** Focus on task-completion. The 'Close Ticket' button should stand out to encourage agents to clear the queue."
