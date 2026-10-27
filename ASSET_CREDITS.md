# 에셋 출처와 라이선스

확인 및 다운로드: 2026-10-20. 모든 런타임 자산은 `public/assets/`에 포함되어 있습니다. 오프라인 HTML에도 내장됩니다.

## 1. Quaternius — Modular Sci-Fi MegaKit, Standard 무료판

- 원본: https://quaternius.com/packs/modularscifimegakit.html
- 정식 배포: https://quaternius.itch.io/modular-sci-fi-megakit
- 다운로드 파일: `Modular SciFi MegaKit[Standard].zip`, 무료 업로드 ID 13454739.
- 라이선스: **CC0 1.0 Universal**. 무료판 압축 파일의 원본 라이선스는 `public/assets/environment/LICENSE.txt`.
- 보관 위치: `public/assets/environment/`.
- 실제 환경 구성에 사용: `WallAstra_Straight_Window`, `WallBand_Straight`, `Platform_Metal`, `Platform_CenterPlate`, `Door_Frame_SquareTall`, `Door_DarkMetal`, `TopCables_Straight`, `Prop_Light_Wide`, `Prop_Vent_Wide`, `Prop_Computer`, `Prop_Crate3`, `Prop_Barrel_Large`.
- 함께 보관한 검토용 모듈: `WallAstra_Straight`, `Prop_Cable_3`.
- 수정: 공유 텍스처를 최대 1024픽셀로 축소, 게임에서 크기·배치 조정, 정적 메시를 재질별로 병합.
- 무료판에 실제 포함된 벽, 출입문, 바닥, 소품을 사용했습니다. Pro/Source 유료판은 사용하지 않았습니다.

## 2. MilkAndBanana — Lab Assets

- 원본 및 라이선스: https://opengameart.org/content/lab-assets
- 직접 다운로드: https://opengameart.org/sites/default/files/lab_assets.zip
- 라이선스: **CC0**.
- 보관 위치: `public/assets/lab/`.
- 사용: `counter_counter.glb`, `cabinet_cabinet.glb`, `bottle_glassware_erlenmeyer_flask_medium.glb`, `bottle_test_tube_rack.glb`, `heating_equipment_bunsen_burner.glb`.
- 검토·보관: `machine_microscope.glb`, `machine_hot_plate.glb`.
- 수정: 실험대·수납장·버너의 색/재질을 연구소의 금속·흑연색으로 변경. 교과서의 핵심 조작 기구 대신 단순화된 소품을 쓰지 않도록, 이 팩은 가구와 주변 소품 위주로 사용했습니다.

## 3. Poly Haven

- 라이선스: **CC0** — https://polyhaven.com/license
- `studio_small_09`: https://polyhaven.com/a/studio_small_09
  - 공식 파일 API: https://api.polyhaven.com/files/studio_small_09
  - 사용 파일: `public/assets/studio.hdr` (1K).
- `metal_plate`: https://polyhaven.com/a/metal_plate
  - 공식 파일 API: https://api.polyhaven.com/files/metal_plate
  - 사용 파일: `metal-Diffuse.jpg`, `metal-nor_gl.jpg`, `metal-Rough.jpg`, `metal-Metal.jpg` (1K).
- 용도: 반사 환경광과 실험대의 PBR 표면.

## 4. 프로젝트에서 새로 만든 정밀 장비

`public/assets/instruments/*.glb`와 `tools/build-instruments.py`.

페트병, 전자저울, 공기 펌프, 집기병, 수조, 주사기, 진공 용기, 기체 카트리지, 밸브, 피스톤, 지렛대, 관찰 셀, 포장 봉지, 잠금 볼트, 모니터 하우징과 지지대, 수건.

외부에서 내려받은 장비라고 주장하지 않습니다. 공급처 조사 후, 교과서의 입구 마개·고무막·피스톤 등 조작 부품 구조를 재현하기 위해 Blender로 새로 제작했습니다. 곡면 회전 프로파일, 베벨, 눈금, 나사, 플랜지, 실링, 별도 움직이는 부품을 포함합니다. 모델은 교육용 표현이며 실측 CAD는 아닙니다.

텍스트 라벨, UI, 연결관, 물 표면, 설명용 입자, 풍선·불꽃의 변형 표현과 효과음은 프로젝트 코드에서 생성합니다. 기존 게임의 시각 자산을 복제하지 않았습니다.

## 5. 조사했으나 적용하지 않은 공급처

- **3DAssets.dev** 지정 연구실:
  - https://3dassets.dev/assets/science-laboratory-and-cleanroom-laborat-fe14c4c6-starter-scene
  - https://cdn.3dassets.dev/assets/37185/v1/model.glb
  - 페이지 요청 503, CDN 호스트 DNS 조회 실패. 실제 파일을 받거나 시각 검증하지 못해 사용하지 않았습니다.
- **Blendkit**: https://www.blendkit.com/
  - 라이선스 문서: https://www.blendkit.com/docs/licenses/
  - 이 작업에 맞는 인증 없는 직접 다운로드 경로를 확보하지 못했습니다. 로그인이나 유료 구매를 하지 않았습니다.
- **Sketchfab**: 실험기구 후보를 검색했으나 로그인 전제 다운로드를 이용하지 않았습니다.
- **기타 저폴리/PSX 주사기 후보**: 원하는 근접 조작 표현에 적합하지 않아 사용하지 않았습니다.

## 소프트웨어

Three.js — MIT, https://github.com/mrdoob/three.js

Vite — MIT, https://github.com/vitejs/vite

원본 고지문은 `licenses/`에 보관합니다. 한국어 글꼴은 아래 Pretendard 원본을 로컬에 포함하며 외부 글꼴 서버에 연결하지 않습니다.

## Pretendard 로컬 폰트

- Kil Hyung-jin, Pretendard v1.3.9. 공식 소스: https://github.com/orioncactus/pretendard/tree/v1.3.9
- 원본 가변 웹폰트, 수정 없음. SIL Open Font License 1.1. `licenses/Pretendard-OFL.txt`에 전문 포함.
- 웹 배포는 로컬 WOFF2, PC 단일 HTML은 폰트를 내부에 포함합니다. 외부 CDN 요청 없음.
- 새 고무막 메시·실험실 표지·개념 정리 UI는 프로젝트 코드로 직접 제작했습니다. 교과서 페이지 이미지는 게임에 배포하지 않습니다.


## 리부트 기구 모델 (2026-10-21)

src/instruments.ts에서 전자저울, 압력 저장통, 가열 코일 용기, 산업용 밸브, 피스톤 잠금 장치를 직접 재제작했습니다. 곡면 회전체, 둥근 모서리, 코일 튜브, 링·커플러·고정 볼트, 금속·에나멜 재질을 사용합니다. 외부 모델 구매·다운로드 없음. Three.js의 MIT 라이선스 코드(RoundedBoxGeometry 포함)를 사용합니다. 기존 모델 파일을 수정하거나 재배포 조건을 변경하지 않았습니다.


그림 패널의 SVG 주사기·병·고무막·기체 쓰임·배관도는 프로젝트용 직접 제작 벡터입니다. 외부 이미지 생성물이나 외부 CDN을 사용하지 않습니다. 기존 로컬 Pretendard와 OFL 라이선스를 그대로 사용합니다.


## 이번 이미지 자산 리디자인 (2026-10-21)
`public/assets/illustrations/`의 mass.png, temperature.png, pressure.png, gases.png, blueprint.png, poster.png, snack.png는 이 작업에서 OpenAI 내장 이미지 생성 도구로 제작했습니다. 외부 브랜드·웹 이미지·기존 작가 그림을 사용하지 않았습니다. 생성물은 교육용 그림이며 실제 측정 수치는 이미지에 임의로 그리지 않고 과학 엔진의 기록을 별도로 표시합니다. pressure.png는 주사기 방향과 마개를 수정 생성했습니다. 원본 생성 PNG를 픽셀 편집 없이 통합했습니다. 생성 조건과 검수 내용은 `qa/IMAGE_ASSET_PROMPTS.md`를 참고하세요.


## 2026-10-23 게임플레이 보강
기존 허가된 3D 모델, 과자봉지 PNG와 7개 설명 일러스트를 재사용했습니다. 외부 다운로드 자산은 추가하지 않았습니다. 봉지의 세분화 메시 변형, 밀봉 턱·지지대, 고정 조건 비교 모형, 피스톤 축·가이드 보강은 프로젝트 내 Three.js 지오메트리입니다. 금속 잠금음은 Web Audio 합성음으로 외부 음원 파일을 사용하지 않습니다. 포스터의 개인 기록은 이미지에 굳혀 넣지 않고 Pretendard 텍스트로 합성하며 PDF에는 텍스트로 남깁니다.

## 2026.10.23-r3 기구와 연출
새 외부 다운로드 자산은 없습니다. 기존 연구소·실험 기구·일러스트의 출처와 권리는 유지합니다. 추가 압력계는 자체 제작한 금속 케이스/베젤/체결 너트/연결관 및 768px 계기판 텍스처이며, 바늘은 기존 과학 엔진의 절대압력에 연결했습니다. 불꽃은 자체 작성한 GLSL 절차적 셰이더, 연기는 방사형 투명 텍스처 기반 효과입니다. 문 연결 막대·가이드·잠금핀·수신부와 mechanism.svg 설명 그림은 이번 프로젝트용으로 직접 제작했습니다. 외부 사진이나 화염 영상을 재사용하지 않았습니다.


## r4 불꽃 방식 조사 및 선택 (2026-10-23)
- Kenney Particle Pack: https://kenney.nl/assets/particle-pack — 공식 페이지에서 512×512 입자 80종, CC0 확인. 정적인 입자 스프라이트는 연기/폭발에 적합하지만 이번 촛불의 연속적인 산소 반응에는 별도 애니메이션이 필요해 채택하지 않음.
- Three.js volumetric fire example: https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_volume_fire.html ; MIT https://github.com/mrdoob/three.js/blob/dev/LICENSE . WebGPU 볼륨 표현을 검토했으나 기존 WebGL 단일 HTML과 모바일 범위를 유지하기 위해 렌더러 이식은 하지 않음.
- 최종 선택: 자체 작성 WebGL ShaderMaterial 불꽃. 곡선형 하부, 휘는 끝, 청색 밑불, 밝은 중심, 연한 외곽광을 한 평면에서 계산. 연기는 기존 자체 제작 128px 텍스처 7개 입자로 유지. 외부 코드나 이미지의 무단 복제 없음. Three.js 라이선스는 기존 licenses에 보존.
- 촛농 몸체/심지, 탈출 통로와 조명은 이 프로젝트에서 직접 제작. 기존 3D 모델과 이미지 패널의 출처/권리는 이전 항목과 같음.

## 2026-10-26 fc2 실제 화면 수정
새 탈출 도착 구역은 기존 Quaternius Modular Sci-Fi MegaKit CC0 에셋을 재배치했습니다(src/exit-scene.ts). 외부 유료 에셋이나 기본 도형 복도 대체물은 추가하지 않았습니다. nitrogen-principles.png는 OpenAI 내장 image_gen으로 기존 snack.png를 참조하여 생성·화살표 수정한 그림입니다. 프롬프트는 qa/FC2_IMAGE_PROMPTS.md. 성공 화음은 Web Audio 합성입니다.


## r4-fc3 연결 구조
기존 실험기구 자산을 유지하고 필요한 중공 피팅, 커플러, 노즐 가이드, 전열선 절연 단자 및 내부 작동 부품을 프로젝트 코드로 제작했습니다. 신규 외부 모델을 사용하거나 출처 없는 에셋을 추가하지 않았습니다.

## r4-fc4
기존 자산 유지. 주입구 슬라이더, 수평 벌크헤드 피팅, 환형 가이드 베어링/로드 씰, 자동문 벨트·클램프는 프로젝트 코드로 제작한 기능 부품입니다. 새 외부 자산은 추가하지 않았습니다.
