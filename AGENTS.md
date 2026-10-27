# 유지보수

- 원본 `science_4-2-3.pdf`, `science_silhum_4-2-3.pdf`를 수정하거나 삭제하지 않는다.
- 과학 상태와 완료 판정은 `src/science.ts`에 둔다. 장면 애니메이션이 독립적으로 성공을 만들어서는 안 된다.
- 변경 후 `npm test`, `npm run build`를 실행한다. 상호작용 변경은 `tools/playthrough.mjs`의 실제 클릭·드래그 경로로 검수한다.
- `window.__lab`은 개발 모드에서만 허용한다. 배포 HTML에서 개발 우회 기능을 노출하지 않는다.
- 새 외부 에셋은 배포 권한과 출처를 확인하고 `ASSET_CREDITS.md`에 기록한다.
- `npm run package:offline`으로 오프라인 HTML을 다시 만든 뒤 파일 URL에서 실제 실행을 확인한다.
- 테스트 캡처는 `qa/`에 저장하고 실제 이미지를 확인한다. 자동 테스트의 가속된 시간을 예상 학생 플레이 시간으로 주장하지 않는다.
