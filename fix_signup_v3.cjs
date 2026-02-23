const fs = require('fs');
const path = 'c:/Users/USER/Desktop/humanpartner/pages/SignUp.tsx';

let content = fs.readFileSync(path, 'utf8');

// Fix h1 (line 386)
// Using a slightly more relaxed regex to catch the mojibake
content = content.replace(/<h1 className=\"text-2xl font-bold text-gray-900\">.*<\/h1>/, '<h1 className=\"text-2xl font-bold text-gray-900\">회원가입</h1>');

// Fix p (line 387)
content = content.replace(/<p className=\"text-gray-500 text-sm mt-2\">.*<\/p>/, '<p className=\"text-gray-500 text-sm mt-2\">행사어때의 회원이 되어 다양한 혜택을 누리세요.</p>');

// Fix submit button (line 706) - Fixing the mess from v2
content = content.replace(/{loading \? '가입 처리 중\.\.\.' : '가입하기'}.*?}/, "{loading ? '가입 처리 중...' : '가입하기'}");
// Just in case it's still broken in some other way
content = content.replace(/{loading \? '.*?'.*?: '.*?媛€.*?\}/, "{loading ? '가입 처리 중...' : '가입하기'}");

// Fix login link (line 711)
content = content.replace(/이미 계정이 있으신가요\? <Link to=\"\/login\" className=\"text-\[#FF5B60\] font-bold hover:underline\">.*?<\/Link>/, '이미 계정이 있으신가요? <Link to="/login" className="text-[#FF5B60] font-bold hover:underline">로그인</Link>');
// Fix trailing garbage if link was double-replaced or something
content = content.replace(/濡쒓렇\?\?\/Link>/, '로그인</Link>');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed v3!');
