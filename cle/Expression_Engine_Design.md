# Tài Liệu Thiết Kế: Expression Calculation Engine

## 1. Tổng quan hệ thống
Hệ thống tính toán biểu thức (Expression Calculation Engine) đóng vai trò nhận các công thức được cấu hình động từ người dùng (Frontend), sau đó kết hợp với dữ liệu đầu vào (Variables/Context) để thực thi và trả về kết quả một cách an toàn, chính xác. 

Giải pháp này hoàn toàn loại bỏ việc sử dụng các hàm chạy mã động trực tiếp (như `eval()`) để đảm bảo an ninh hệ thống, tránh các cuộc tấn công Code Injection.

## 2. Danh sách tính năng (Features & Operators)
Hệ thống hỗ trợ đầy đủ các nhóm tính toán sau:

### 2.1. Toán tử cơ bản (Basic Operators)
* **Toán học:** `+` (Cộng), `-` (Trừ), `*` (Nhân), `/` (Chia), `%` (Chia lấy dư / Modulo)
* **Gộp nhóm:** `( )` (Dấu ngoặc đơn để xác định độ ưu tiên)
* **So sánh:** `>`, `<`, `>=`, `<=`, `=`, `<>` (hoặc `!=`)

### 2.2. Toán tử Logic (Logical Operators)
* `AND` (hoặc `&&`)
* `OR` (hoặc `||`)
* `NOT` (hoặc `!`)

### 2.3. Cấu trúc điều kiện & Hàm Excel cơ bản
* `IF(condition, value_if_true, value_if_false)`
* `MIN(a, b, ...)`
* `MAX(a, b, ...)`
* `ROUND(value, decimals)`
* `CEILING(value)`
* `FLOOR(value)`

### 2.4. Hàm Toán học Nâng cao (Advanced Mathematics)
* **Lượng giác (Trigonometry):** `SIN(x)`, `COS(x)`, `TAN(x)` (trong đó x thường được tính bằng radian)
* **Lũy thừa & Căn:** `SQRT(x)`, `x ^ y` (Lũy thừa)
* **Logarit:** `LOG(x)` (cơ số 10), `LN(x)` (tự nhiên/cơ số e)
* **Hàm trị tuyệt đối:** `ABS(x)`
* **Giai thừa:** `FACT(x)` (hoặc `x!`)
* **Hằng số toán học:** `PI` ($\pi$), `E` (Euler)

---

## 3. Kiến trúc luồng dữ liệu (Data Flow)

1. **Frontend:** Người dùng tạo công thức qua UI (Sử dụng Monaco Editor để có gợi ý từ khóa). Giao diện cho phép test thử công thức với dữ liệu giả lập.
2. **API Payload:** Frontend gửi xuống Backend JSON:
   ```json
   {
     "formula": "IF(SALARY > 1000, SALARY * 1.5 + SIN(PI/2) * 100, FACT(3) * E)",
     "variables": { "SALARY": 1200 }
   }
   ```
3. **Backend Validator:** Kiểm tra lỗi cú pháp (Syntax Error) bằng cách biên dịch thử công thức với dữ liệu rỗng trước khi cho phép lưu Database.
4. **Backend Evaluator:** Parse -> AST (Abstract Syntax Tree) -> Truyền Variables -> Calculate -> Trả kết quả.

---

## 4. Các Thư viện Đề xuất

* **Node.js**: `mathjs` (Hỗ trợ toán học cực mạnh), `expr-eval`.
* **Java**: `Apache Commons JEXL` (Mạnh mẽ, dễ map hàm), `exp4j` (Chuyên toán học).
* **C# / .NET**: `NCalc` (Hỗ trợ IF và các hàm chuẩn).

---

## 5. Ví dụ Cài đặt (Node.js với mathjs)

```javascript
const { create, all } = require('mathjs');
const math = create(all);

// Thêm hàm IF
math.import({
  IF: function (cond, trueVal, falseVal) { return cond ? trueVal : falseVal; },
  LN: math.log, 
  FACT: math.factorial
});

const formula = "IF(A > 50, ROUND(A * E, 2) + SIN(PI/2), FACT(3) + SQRT(16) + B % 3)";
const scope = { A: 100, B: 10 };

const result = math.evaluate(formula, scope);
console.log("Kết quả:", result);
```

## 6. Các khuyến nghị Best Practices
1. **Precision Control:** Cấu hình dùng `BigNumber` / `BigDecimal` thay cho `Float` mặc định để tránh sai số (0.1 + 0.2 = 0.3000...4).
2. **Quản lý Radian/Degree:** Hàm lượng giác thường dùng Radian. Custom lại hàm `SIN_DEG()` nếu nghiệp vụ tính bằng Độ.
3. **Caching:** Cache lại Cây AST (Abstract Syntax Tree) của công thức để tối ưu CPU.
