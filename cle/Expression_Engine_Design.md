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
2. **API Payload:** Frontend gửi xuống Backend JSON bao gồm ID Khách hàng hoặc trực tiếp bộ Variable giả lập để Test.
   ```json
   {
     "formula": "IF(SALARY > 1000, SALARY * 1.5 + SIN(PI/2) * 100, FACT(3) * E)",
     "variables": { "SALARY": 1200 }
   }
   ```
3. **Chi tiết Quy trình xử lý tại Backend:**
   * **B1. Tiếp nhận & Tiền xử lý (Pre-processing):** Nhận công thức (dạng text) từ DB (hoặc payload). Map các hàm toán học viết hoa (như `SIN`, `FLOOR`) sang các hàm chuẩn của thư viện.
   * **B2. Phân tích & Validate (Parsing):** Dùng engine dịch chuỗi text thành cây cấu trúc AST (Abstract Syntax Tree). Ở bước lưu công thức, Backend sẽ *Compile* thử để phát hiện lỗi cú pháp (thiếu ngoặc, sai tên hàm).
   * **B3. Nhúng biến số (Inject Context):** Backend truy xuất dữ liệu hồ sơ thật của khách hàng (lương, tuổi, điểm tín dụng...), nhúng vào scope của AST.
   * **B4. Thực thi (Evaluation):** Engine tính toán kết quả số học dựa trên cây AST và Context đã nhúng.
   * **B5. Hậu xử lý (Post-processing):** Backend bẫy lỗi các trường hợp chia cho 0 (`Infinity`), `NaN`, hoặc format lại kết quả thành dạng số nguyên tròn tiền tệ trước khi trả về.

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

---

## 7. Ví dụ Thực tế: Tính toán Hạn Mức Tín Dụng (Credit Limit)
Giả sử quy tắc nghiệp vụ để cấp hạn mức thẻ cho khách hàng dựa trên Lương (SALARY) như sau:
* **Các khoảng lương và Hệ số:**
  1. Lương < 5.000.000đ: Từ chối cấp thẻ (Hạn mức = 0).
  2. 5.000.000đ <= Lương < 15.000.000đ: Hệ số 1.5x.
  3. 15.000.000đ <= Lương < 30.000.000đ: Hệ số 2.0x.
  4. Lương >= 30.000.000đ: Hệ số 2.5x.
* **Các ràng buộc bổ sung:**
  * **Trần (MAX) - Sàn (MIN):** Nếu khách hàng đủ điều kiện cấp thẻ, hạn mức cấp tối thiểu phải là 10.000.000đ và tối đa không được vượt quá 100.000.000đ.
  * **Làm tròn (FLOOR):** Hạn mức cuối cùng phải được làm tròn xuống bội số của 1.000đ (cắt bỏ phần tiền lẻ).

**Công thức biểu diễn tương ứng trên Editor:**
```text
IF(SALARY < 5000000, 
   0, 
   FLOOR(
      MIN(
         MAX(
            IF(SALARY < 15000000, 
               SALARY * 1.5,
               IF(SALARY < 30000000, 
                  SALARY * 2.0, 
                  SALARY * 2.5
               )
            ), 
            10000000  /* Chặn dưới: Sàn 10 triệu */
         ), 
         100000000    /* Chặn trên: Trần 100 triệu */
      ) / 1000        /* Chia 1000 để làm tròn */
   ) * 1000           /* Nhân lại 1000 để ra số thực tế */
)
```

**Phân tích quá trình Backend xử lý công thức này:**
1. **Frontend** gửi công thức (dạng text) và biến giả lập `{"SALARY": 18500600}` xuống Backend.
2. **Backend Engine** tạo cây AST và bắt đầu tính toán từ trong ra ngoài:
   * Bước 1 (IF lồng): Kiểm tra lương `18500600` rơi vào dải `< 30tr`. Tính ra Hạn mức cơ sở = `18500600 * 2.0 = 37001200`.
   * Bước 2 (MAX): `MAX(37001200, 10000000)` -> Kết quả: `37001200`.
   * Bước 3 (MIN): `MIN(37001200, 100000000)` -> Kết quả: `37001200`.
   * Bước 4 (FLOOR): Lấy `37001200 / 1000 = 37001.2`. `FLOOR(37001.2) = 37001`. Cuối cùng lấy `37001 * 1000 = 37001000`.
   * Bước 5 (IF ngoài cùng): Lương thỏa mãn `>= 5tr`, nên lấy kết quả từ nhánh True.
3. **Kết quả trả về:** Hạn mức cuối cùng cấp cho khách hàng là **37.001.000đ**.

---

## 8. Phụ Lục: Cấu trúc Cây Cú pháp Trừu tượng (AST - Abstract Syntax Tree)
Để giúp đội ngũ phát triển hình dung rõ cách Backend Engine (ví dụ `mathjs`) biên dịch chuỗi công thức nhận được từ Frontend, dưới đây là cấu trúc AST của biểu thức sau khi được parse:

**Biểu thức đầu vào:**
```text
SALARY * 1.5 + 100
```

### 8.1. Sơ đồ cây logic
```text
            +  (OperatorNode: Phép cộng)
           / \
          /   \
         *     100 (ConstantNode: Hằng số)
        / \
       /   \
  SALARY    1.5 (ConstantNode: Hằng số)
(SymbolNode: Biến)
```

### 8.2. Cấu trúc JSON AST thực tế của Engine (mathjs)
Khi gọi `math.parse('SALARY * 1.5 + 100')`, đối tượng AST trả về có cấu trúc JSON như dưới đây. Backend sẽ duyệt qua cây này để map dữ liệu và tính toán:

```json
{
  "type": "OperatorNode",
  "op": "+",
  "fn": "add",
  "args": [
    {
      "type": "OperatorNode",
      "op": "*",
      "fn": "multiply",
      "args": [
        {
          "type": "SymbolNode",
          "name": "SALARY"
        },
        {
          "type": "ConstantNode",
          "value": 1.5
        }
      ],
      "implicit": false
    },
    {
      "type": "ConstantNode",
      "value": 100
    }
  ]
}
```

**Ý nghĩa các loại Nút chính trong AST:**
* **`SymbolNode`**: Đại diện cho các biến số (`SALARY`, `AGE`...). Backend sẽ tìm trong Object context được gửi lên để thay thế giá trị thực tế vào nút này.
* **`ConstantNode`**: Đại diện cho các hằng số cố định (`100`, `1.5`, `PI`, `E`...).
* **`OperatorNode`**: Đại diện cho các toán tử số học/so sánh (`+`, `-`, `*`, `/`, `>`, `<`...).
* **`FunctionNode`**: Đại diện cho các hàm nghiệp vụ (`IF`, `MIN`, `MAX`, `FLOOR`...). Nút này sẽ có thuộc tính `name` để gọi hàm logic tương ứng và mảng `args` chứa các tham số truyền vào hàm.
