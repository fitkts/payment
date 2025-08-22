// =================================================================
//      중요: 이 URL을 자신의 Google Apps Script 배포 URL로 변경하세요!
// =================================================================
// 1. Google Sheets에서 '확장 프로그램 > Apps Script'로 이동합니다.
// 2. 'backend/Code.gs' 파일의 내용을 붙여넣습니다.
// 3. 우측 상단의 '배포 > 새 배포'를 클릭합니다.
// 4. 유형을 '웹 앱'으로 선택합니다.
// 5. '액세스 권한이 있는 사용자'를 '모든 사용자'로 설정합니다.
// 6. '배포' 버튼을 누르고, 표시되는 '웹 앱 URL'을 복사하여 아래에 붙여넣습니다.
const GAS_API_URL = '여기에_배포된_웹_앱_URL을_붙여넣어주세요';
// 예시: const GAS_API_URL = 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec';


export const fetchData = async () => {
    if (GAS_API_URL.startsWith('여기에')) {
        throw new Error('Google Apps Script API URL이 설정되지 않았습니다.');
    }
    const response = await fetch(GAS_API_URL);
    if (!response.ok) {
        throw new Error('네트워크 응답이 올바르지 않습니다.');
    }
    return await response.json();
};

export const saveData = async (data: object) => {
    if (GAS_API_URL.startsWith('여기에')) {
        throw new Error('Google Apps Script API URL이 설정되지 않았습니다.');
    }
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script 웹 앱은 'text/plain'을 권장
            },
            body: JSON.stringify({
                action: 'saveData',
                payload: data
            }),
            redirect: 'follow',
        });
        return await response.json();
    } catch (error) {
        console.error('데이터 저장 중 오류 발생:', error);
        // 에러를 다시 던져서 호출한 쪽에서 처리할 수 있게 함
        throw error;
    }
};
