const fs = require('fs');
const path = 'c:/Users/USER/Desktop/humanpartner/pages/SignUp.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix h1
content = content.replace(/<h1 className=\"text-2xl font-bold text-gray-900\">.*?<\/h1>/, '<h1 className=\"text-2xl font-bold text-gray-900\">회원가입</h1>');

// Fix p
content = content.replace(/<p className=\"text-gray-500 text-sm mt-2\">.*?<\/p>/, '<p className=\"text-gray-500 text-sm mt-2\">행사어때의 회원이 되어 다양한 혜택을 누리세요.</p>');

// Fix h3
content = content.replace(/<h3 className=\"text-sm font-semibold text-gray-800 border-b pb-2\">.*?<\/h3>/, '<h3 className=\"text-sm font-semibold text-gray-800 border-b pb-2\">기본 정보</h3>');

// Fix name label
content = content.replace(/<label className=\"block text-sm font-medium text-gray-700 mb-1\">\s*.*?<span className=\"text-red-500\">\*<\/span>\s*<\/label>/, '<label className=\"block text-sm font-medium text-gray-700 mb-1\">이름 <span className=\"text-red-500\">*</span></label>');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed!');
