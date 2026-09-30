window.UC_DATA = {
  "uc": "UC-03",
  "title": "스타일(색상) 지정",
  "summary": "캔버스에서 도형을 고르고, 팔레트에서 색을 하나 골라 칠합니다. 색은 흑백을 포함해 여러 가지 중에서 고릅니다. 칠한 색을 어디에 저장할지는 아직 정해지지 않았습니다.",
  "pre": "캔버스에 도형이 존재함",
  "post": "도형에 선택한 색상이 적용된 상태로 저장된다.",
  "steps": [
    {
      "no": "1",
      "flow": "main",
      "text": "사용자가 도형을 선택한다.",
      "msgs": [
        "select",
        "select"
      ],
      "lightBy": [
        "select"
      ]
    },
    {
      "no": "2",
      "flow": "main",
      "text": "흑백 포함 최소 4개 이상의 색상 중 하나를 선택해 적용한다.",
      "msgs": [
        "pick",
        "shown"
      ],
      "lightBy": [
        "pick",
        "applyColor",
        "render",
        "shown"
      ]
    }
  ],
  "parts": [
    "U",
    "Pal",
    "Sel",
    "C"
  ],
  "seq": [
    {
      "id": "select",
      "from": "U",
      "to": "Sel",
      "text": "도형 누르기",
      "owner": "Sel",
      "op": "select"
    },
    {
      "id": "pick",
      "from": "U",
      "to": "Pal",
      "text": "색 고르기",
      "owner": "Pal",
      "op": "pick"
    },
    {
      "id": "applyColor",
      "from": "Pal",
      "to": "Sel",
      "text": "선택한 도형에 색 적용",
      "owner": "Sel",
      "op": "applyColor"
    },
    {
      "id": "render",
      "from": "Sel",
      "to": "C",
      "text": "다시 그리기",
      "owner": "C",
      "op": "render"
    },
    {
      "id": "shown",
      "from": "C",
      "to": "U",
      "text": "색이 바뀐 도형",
      "owner": "C",
      "op": "render"
    }
  ],
  "try": {
    "start": "classDiagram\n  Order --> Payment\n  Order --> Customer",
    "hint": "캔버스에서 도형을 누른 뒤 색을 고르세요.",
    "buttons": [
      {
        "label": "`Payment`를 파랑으로",
        "op": "color",
        "args": {
          "id": "Payment",
          "color": "파랑"
        }
      }
    ]
  },
  "otherOps": [],
  "discuss": [
    {
      "id": "d1",
      "title": "칠한 색을 어디에 저장하나",
      "body": "사후조건은 색이 적용된 상태로 저장된다고 합니다. 로컬 저장 요구사항도 작업 내용에 스타일을 넣지만, 그 충족 기준은 코드와 배치의 복원만 확인하고, 데이터 요구사항의 저장 항목에도 색이 없습니다. Mermaid 문법의 style·classDef 줄로 코드에 색을 적는 방법도 있는데, 그러면 GUI에서 칠한 색을 코드에 반영하는 일이 코드↔GUI 동기화에 들어갑니다. 견본은 저장 단계를 비워 둡니다.",
      "basis": "UC-03 사후조건, FR-8, DR-1, FR-3"
    },
    {
      "id": "d2",
      "title": "색은 모두 몇 개인가: 흑백 포함 4개, 흑백 더하기 4개",
      "body": "유스케이스 2단계, FR-7 충족 기준, 수락 기준은 “흑백 포함 최소 4개”라서 흑백과 컬러 2개로도 됩니다. FR-7 요구사항 문장과 범위는 “흑백 필수, 컬러 최소 4개”라서 6개가 필요합니다. 견본은 두 쪽을 모두 채우도록 흑백과 컬러 4개를 둡니다.",
      "basis": "FR-7, AC-7, UC-03 기본 흐름 2, 범위에 포함"
    },
    {
      "id": "d3",
      "title": "무엇에 색을 칠하나",
      "body": "원문은 “도형”의 색이라고만 합니다. 채우기, 테두리, 글자 중 어디에 칠하는지, 관계선도 도형에 드는지 정해야 합니다. 여러 도형을 한꺼번에 고르는 다중 선택 편집은 범위에서 빠져 있어 한 번에 하나씩 칠합니다. 견본은 도형 하나의 채우기만 바꾸고, 채우기가 어두우면 글자를 밝게 바꿉니다.",
      "basis": "UC-03 기본 흐름 1·2, FR-7, FR-8, 범위에서 제외"
    },
    {
      "id": "d4",
      "title": "도형을 고르지 않고 색을 고르면",
      "body": "대안 흐름은 없음으로 적혀 있습니다. 선택한 도형이 없을 때 색 선택을 막을지, 다음에 그릴 도형의 기본색으로 둘지 정해야 합니다. 견본은 적용하지 않고 도형을 먼저 누르라고 안내합니다.",
      "basis": "UC-03 대안 흐름"
    }
  ]
};
