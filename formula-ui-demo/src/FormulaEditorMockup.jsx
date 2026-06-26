import React, { useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

// Danh sách các hàm hỗ trợ và biến ngữ cảnh (Nên fetch từ API backend)
const SUGGESTIONS = [
  // Các hàm điều kiện và toán học
  { label: 'IF', insertText: 'IF(${1:condition}, ${2:true_val}, ${3:false_val})', detail: 'Hàm điều kiện logic', kind: 'Function' },
  { label: 'SIN', insertText: 'SIN(${1:number})', detail: 'Hàm lượng giác (Radian)', kind: 'Function' },
  { label: 'COS', insertText: 'COS(${1:number})', detail: 'Hàm lượng giác (Radian)', kind: 'Function' },
  { label: 'ROUND', insertText: 'ROUND(${1:number}, ${2:decimals})', detail: 'Làm tròn số', kind: 'Function' },
  { label: 'MAX', insertText: 'MAX(${1:value1}, ${2:value2})', detail: 'Tìm giá trị lớn nhất', kind: 'Function' },
  { label: 'MIN', insertText: 'MIN(${1:value1}, ${2:value2})', detail: 'Tìm giá trị nhỏ nhất', kind: 'Function' },
  { label: 'SQRT', insertText: 'SQRT(${1:number})', detail: 'Căn bậc 2', kind: 'Function' },
  { label: 'FACT', insertText: 'FACT(${1:number})', detail: 'Tính Giai thừa', kind: 'Function' },
  { label: 'LOG', insertText: 'LOG(${1:number})', detail: 'Logarit cơ số 10', kind: 'Function' },
  { label: 'LN', insertText: 'LN(${1:number})', detail: 'Logarit tự nhiên', kind: 'Function' },
  { label: 'ABS', insertText: 'ABS(${1:number})', detail: 'Trị tuyệt đối', kind: 'Function' },
  
  // Hằng số
  { label: 'PI', insertText: 'PI', detail: 'Hằng số Pi (3.14159...)', kind: 'Constant' },
  { label: 'E', insertText: 'E', detail: 'Hằng số Euler (2.718...)', kind: 'Constant' },

  // Biến nghiệp vụ (Context Variables)
  { label: 'SALARY', insertText: 'SALARY', detail: 'Lương cơ bản', kind: 'Variable' },
  { label: 'CREDIT_SCORE', insertText: 'CREDIT_SCORE', detail: 'Điểm tín dụng', kind: 'Variable' },
  { label: 'AGE', insertText: 'AGE', detail: 'Tuổi khách hàng', kind: 'Variable' },
  { label: 'LOAN_AMOUNT', insertText: 'LOAN_AMOUNT', detail: 'Khoản vay', kind: 'Variable' }
];

const FormulaEditorMockup = () => {
  const monaco = useMonaco();
  const [formula, setFormula] = useState('IF(SALARY > 1000, SALARY * 1.5 + SIN(PI/2) * 100, FACT(3) * E)');

  // Hàm setup Editor khi khởi tạo
  const handleEditorWillMount = (monaco) => {
    // 1. Đăng ký một ngôn ngữ mới cho Editor
    monaco.languages.register({ id: 'customFormulaLanguage' });

    // 2. Cấu hình Autocomplete / Gợi ý code
    monaco.languages.registerCompletionItemProvider('customFormulaLanguage', {
      provideCompletionItems: (model, position) => {
        const suggestions = SUGGESTIONS.map(item => ({
          label: item.label,
          kind: monaco.languages.CompletionItemKind[item.kind],
          insertText: item.insertText,
          // Cho phép gõ Tab để chuyển qua lại giữa các tham số (Snippet)
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: item.detail,
        }));
        return { suggestions };
      }
    });

    // 3. Cấu hình Syntax Highlighting (Tô màu cho code)
    monaco.languages.setMonarchTokensProvider('customFormulaLanguage', {
      tokenizer: {
        root: [
          // Tô màu xanh dương in đậm cho các hàm
          [/\b(IF|SIN|COS|TAN|ROUND|MAX|MIN|SQRT|LOG|LN|ABS|FACT)\b/, 'keyword'],
          // Tô màu cam cho hằng số
          [/\b(PI|E)\b/, 'constant'],
          // Tô màu xanh lá cho biến nghiệp vụ
          [/\b(SALARY|CREDIT_SCORE|AGE|LOAN_AMOUNT)\b/, 'variable'],
          // Tô màu số
          [/[0-9]+(\.[0-9]+)?/, 'number'],
          // Tô màu toán tử
          [/[()+\-*/<>=%,]/, 'operator'],
        ]
      }
    });

    // 4. Define Theme riêng cho dễ nhìn
    monaco.editor.defineTheme('formulaTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0984E3', fontStyle: 'bold' },
        { token: 'constant', foreground: 'D63031', fontStyle: 'bold' },
        { token: 'variable', foreground: '00B894', fontStyle: 'italic' },
        { token: 'operator', foreground: '2D3436' }
      ],
      colors: {
        'editor.background': '#F8F9FA'
      }
    });
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#2d3436', marginBottom: '16px' }}>Cấu hình công thức tính toán</h2>
      
      <div style={{ 
        border: '1px solid #dfe6e9', 
        borderRadius: '8px', 
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        {/* Component Editor chính */}
        <Editor
          height="250px"
          language="customFormulaLanguage"
          theme="formulaTheme"
          value={formula}
          onChange={(value) => setFormula(value)}
          beforeMount={handleEditorWillMount}
          options={{
            minimap: { enabled: false }, // Tắt minimap bên phải cho gọn
            lineNumbers: 'on',           // Hiển thị số dòng
            scrollBeyondLastLine: false, // Không cuộn lố xuống dưới
            wordWrap: 'on',              // Tự động xuống dòng nếu công thức dài
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,      // Bật tự động gợi ý khi gõ
            fontSize: 15,
            padding: { top: 16 }
          }}
        />
      </div>
      
      <div style={{ marginTop: '24px', padding: '16px', background: '#e9ecef', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Payload sẽ gửi xuống Backend:</h4>
        <pre style={{ margin: 0, color: '#212529', whiteSpace: 'pre-wrap' }}>
          {formula}
        </pre>
      </div>
    </div>
  );
};

export default FormulaEditorMockup;
