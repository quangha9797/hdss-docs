import React, { useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { create, all } from 'mathjs';

// Khởi tạo mathjs để chạy thử nghiệm công thức ở Frontend
const math = create(all);

// Bổ sung các hàm tuỳ chỉnh và hằng số viết hoa vào mathjs để nó hiểu được
math.import({
  IF: function (condition, trueVal, falseVal) {
    return condition ? trueVal : falseVal;
  },
  LN: math.log,
  FACT: math.factorial,
  SIN: math.sin,
  COS: math.cos,
  TAN: math.tan,
  ROUND: math.round,
  FLOOR: math.floor,
  CEILING: math.ceil,
  MAX: math.max,
  MIN: math.min,
  SQRT: math.sqrt,
  LOG: math.log10,
  ABS: math.abs,
  PI: math.pi,
  E: math.e
}, { override: true });

// Danh sách từ khóa (Hàm, Hằng số, Biến) để hiển thị Auto-complete
const SUGGESTIONS = [
  // Functions
  { label: 'IF', insertText: 'IF(${1:condition}, ${2:true_val}, ${3:false_val})', detail: 'Hàm điều kiện logic', kind: 'Function' },
  { label: 'SIN', insertText: 'SIN(${1:number})', detail: 'Hàm lượng giác (Radian)', kind: 'Function' },
  { label: 'COS', insertText: 'COS(${1:number})', detail: 'Hàm lượng giác (Radian)', kind: 'Function' },
  { label: 'TAN', insertText: 'TAN(${1:number})', detail: 'Hàm lượng giác (Radian)', kind: 'Function' },
  { label: 'ROUND', insertText: 'ROUND(${1:number}, ${2:decimals})', detail: 'Làm tròn số', kind: 'Function' },
  { label: 'FLOOR', insertText: 'FLOOR(${1:number})', detail: 'Làm tròn xuống', kind: 'Function' },
  { label: 'CEILING', insertText: 'CEILING(${1:number})', detail: 'Làm tròn lên', kind: 'Function' },
  { label: 'MAX', insertText: 'MAX(${1:value1}, ${2:value2})', detail: 'Tìm giá trị lớn nhất', kind: 'Function' },
  { label: 'MIN', insertText: 'MIN(${1:value1}, ${2:value2})', detail: 'Tìm giá trị nhỏ nhất', kind: 'Function' },
  { label: 'SQRT', insertText: 'SQRT(${1:number})', detail: 'Căn bậc 2', kind: 'Function' },
  { label: 'FACT', insertText: 'FACT(${1:number})', detail: 'Tính Giai thừa', kind: 'Function' },
  { label: 'LOG', insertText: 'LOG(${1:number})', detail: 'Logarit cơ số 10', kind: 'Function' },
  { label: 'LN', insertText: 'LN(${1:number})', detail: 'Logarit tự nhiên', kind: 'Function' },
  { label: 'ABS', insertText: 'ABS(${1:number})', detail: 'Trị tuyệt đối', kind: 'Function' },
  
  // Constants
  { label: 'PI', insertText: 'PI', detail: 'Hằng số Pi (3.14159...)', kind: 'Constant' },
  { label: 'E', insertText: 'E', detail: 'Hằng số Euler (2.718...)', kind: 'Constant' },

  // Context Variables
  { label: 'SALARY', insertText: 'SALARY', detail: 'Lương cơ bản', kind: 'Variable' },
  { label: 'CREDIT_SCORE', insertText: 'CREDIT_SCORE', detail: 'Điểm tín dụng', kind: 'Variable' },
  { label: 'AGE', insertText: 'AGE', detail: 'Tuổi khách hàng', kind: 'Variable' },
  { label: 'LOAN_AMOUNT', insertText: 'LOAN_AMOUNT', detail: 'Khoản vay', kind: 'Variable' }
];

// Trích xuất danh sách tên các biến nghiệp vụ để render UI
const variablesList = SUGGESTIONS.filter(s => s.kind === 'Variable').map(s => s.label);

const FormulaEditorMockup = () => {
  const monaco = useMonaco();
  // State 1: Lưu trữ chuỗi công thức
  const [formula, setFormula] = useState(
`IF(SALARY < 1000, 
   0,
   IF(SALARY < 2000, 
      SALARY * 0.1,
      IF(SALARY < 3000, 
         SALARY * 0.2,
         IF(SALARY < 5000,
            SALARY * 0.3,
            SALARY * 0.5
         )
      )
   )
)`);
  
  // State 2: Quản lý giá trị Demo của các biến
  const [variableValues, setVariableValues] = useState({
    SALARY: 1200,
    CREDIT_SCORE: 650,
    AGE: 30,
    LOAN_AMOUNT: 50000
  });

  // State 3: Quản lý kết quả sau khi Test
  const [testResult, setTestResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Xử lý thay đổi giá trị biến
  const handleVariableChange = (name, value) => {
    setVariableValues(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  // Kiểm tra cú pháp công thức
  const handleValidateFormula = () => {
    try {
      setErrorMessage(null);
      setTestResult(null);
      
      // Parse công thức để kiểm tra lỗi cú pháp cơ bản
      const parsedNode = math.parse(formula);
      
      // Biên dịch thử nghiệm (sẽ báo lỗi nếu dùng hàm chưa được định nghĩa)
      parsedNode.compile();

      setValidationSuccess(true);
      setTimeout(() => setValidationSuccess(false), 3000);
    } catch (error) {
      setValidationSuccess(false);
      setTestResult(null);
      setErrorMessage(error.message);
    }
  };

  // Nút bấm: Chạy thử tính toán
  const handleTestFormula = () => {
    try {
      setValidationSuccess(false);
      setErrorMessage(null);
      // Gọi engine mathjs để evaluate công thức hiện tại, kết hợp với các biến truyền vào
      const result = math.evaluate(formula, variableValues);
      
      // Xử lý làm tròn để hiển thị đẹp hơn
      const displayResult = typeof result === 'number' ? Math.round(result * 10000) / 10000 : result;
      setTestResult(displayResult);
    } catch (error) {
      setTestResult(null);
      setErrorMessage(error.message); // Nếu có lỗi cú pháp (VD thiếu đóng ngoặc) sẽ in ra
    }
  };

  // Cấu hình UI của Editor (Syntax, Theme, Autocomplete)
  const handleEditorWillMount = (monaco) => {
    monaco.languages.register({ id: 'customFormulaLanguage' });

    monaco.languages.registerCompletionItemProvider('customFormulaLanguage', {
      provideCompletionItems: () => {
        const suggestions = SUGGESTIONS.map(item => ({
          label: item.label,
          kind: monaco.languages.CompletionItemKind[item.kind],
          insertText: item.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: item.detail,
        }));
        return { suggestions };
      }
    });

    monaco.languages.setMonarchTokensProvider('customFormulaLanguage', {
      tokenizer: {
        root: [
          [/\b(IF|SIN|COS|TAN|ROUND|FLOOR|CEILING|MAX|MIN|SQRT|LOG|LN|ABS|FACT)\b/, 'keyword'],
          [/\b(PI|E)\b/, 'constant'],
          [/\b(SALARY|CREDIT_SCORE|AGE|LOAN_AMOUNT)\b/, 'variable'],
          [/[0-9]+(\.[0-9]+)?/, 'number'],
          [/[()+\-*/<>=%,]/, 'operator'],
        ]
      }
    });

    monaco.editor.defineTheme('formulaTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0984E3', fontStyle: 'bold' },
        { token: 'constant', foreground: 'D63031', fontStyle: 'bold' },
        { token: 'variable', foreground: '00B894', fontStyle: 'italic' },
        { token: 'operator', foreground: '2D3436' }
      ],
      colors: { 'editor.background': '#F8F9FA' }
    });
  };

  return (
    <div style={{ display: 'flex', gap: '24px', fontFamily: 'Inter, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* CỘT TRÁI: SOẠN THẢO CÔNG THỨC */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#2d3436', marginBottom: '16px', fontSize: '1.25rem' }}>1. Soạn thảo cấu trúc công thức</h2>
        <div style={{ flexGrow: 1, border: '1px solid #dfe6e9', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <Editor
            height="500px"
            language="customFormulaLanguage"
            theme="formulaTheme"
            value={formula}
            onChange={(value) => setFormula(value)}
            beforeMount={handleEditorWillMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              fontSize: 16,
              padding: { top: 20 }
            }}
          />
        </div>
      </div>

      {/* CỘT PHẢI: TEST & BIẾN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Panel 1: Nhập biến đầu vào */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #dfe6e9', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#2d3436', marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>2. Thiết lập Biến Demo</h2>
          
          {variablesList.map(vName => (
            <div key={vName} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: '600', color: '#636e72', fontSize: '14px' }}>{vName}</label>
              <input 
                type="number" 
                value={variableValues[vName]} 
                onChange={(e) => handleVariableChange(vName, e.target.value)}
                style={{ width: '140px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #b2bec3', outline: 'none', fontSize: '14px' }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              onClick={handleValidateFormula}
              style={{ flex: 1, padding: '12px', background: '#fff', color: '#00b894', border: '1px solid #00b894', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.target.style.background = '#eaf8f5'; }}
              onMouseOut={(e) => { e.target.style.background = '#fff'; }}
            >
              ✓ Kiểm tra cú pháp
            </button>

            <button 
              onClick={handleTestFormula}
              style={{ flex: 1, padding: '12px', background: '#0984e3', color: '#fff', border: '1px solid #0984e3', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(9, 132, 227, 0.3)' }}
              onMouseOver={(e) => e.target.style.background = '#74b9ff'}
              onMouseOut={(e) => e.target.style.background = '#0984e3'}
            >
              ▶ Tính toán
            </button>
          </div>
          
          {validationSuccess && (
            <div style={{ marginTop: '12px', color: '#00b894', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
              ✅ Công thức hợp lệ! (Không có lỗi cú pháp)
            </div>
          )}
        </div>

        {/* Panel 2: Kết quả */}
        <div style={{ background: errorMessage ? '#ffeaa7' : '#eaf8f5', padding: '24px', borderRadius: '8px', border: `1px solid ${errorMessage ? '#fdcb6e' : '#55efc4'}` }}>
          <h2 style={{ color: '#2d3436', marginTop: 0, marginBottom: '16px', fontSize: '1.25rem' }}>3. Kết quả (Result)</h2>
          
          {errorMessage ? (
            <div style={{ color: '#d63031', fontWeight: '500', wordBreak: 'break-word', lineHeight: '1.5' }}>
              ⚠️ Lỗi cú pháp:<br/>
              <span style={{ fontSize: '14px' }}>{errorMessage}</span>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '14px', color: '#636e72' }}>Output tính toán:</span>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00b894', marginTop: '12px' }}>
                {testResult !== null ? testResult : '--'}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default FormulaEditorMockup;
