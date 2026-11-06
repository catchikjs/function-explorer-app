# 프로젝트 작업 규칙

향후 코드 작업 전에 이 문서를 확인합니다.

- Vanilla JavaScript와 Vite를 사용합니다.
- 기존 파일과 설정을 먼저 확인하고 필요한 부분만 수정합니다.
- HTML, CSS, JavaScript는 각각 별도 파일로 작성합니다.
- `index.html`은 프로젝트 루트에 둡니다.
- 애플리케이션 CSS와 JavaScript 파일은 `src/`에 둡니다.
- `vite.config.js` 등 설정 파일은 프로젝트 루트에 둡니다.
- JavaScript 진입 파일은 HTML에서 `type="module"`로 연결합니다.
- CSS는 JavaScript 진입 파일에서 import하여 Vite 빌드에 포함합니다.
- 외부 JavaScript 라이브러리는 npm으로 설치하고 import합니다. CDN은 사용하지 않습니다.
- Vite 기본 진입점인 루트 `index.html`과 기본 빌드 출력 폴더 `dist`를 사용하며 불필요한 설정은 추가하지 않습니다.
- 작업 후 `npm run build`가 정상 완료되는지 확인합니다.
- GitHub 저장소를 Netlify에 연결하여 배포할 때 Build command는 `npm run build`, Publish directory는 `dist`로 설정합니다.
