window.UC_DATA = {
  "uc": "UC-01",
  "title": "코드로 다이어그램 작성",
  "summary": "코드를 고치면 1초 안에 그림이 따라 바뀝니다. 새 노드는 자동으로 놓이고, 손으로 옮긴 노드는 제자리에 남습니다. 문법 오류가 있으면 그림은 그대로 두고 오류만 보여 줍니다.",
  "pre": "없음(신규) 또는 기존 파일 열림",
  "post": "코드와 GUI가 서로 일치하는 상태로 유지된다.",
  "steps": [
    {
      "no": "1",
      "flow": "main",
      "text": "사용자가 코드 편집 영역에 Mermaid 문법으로 객체와 관계를 입력한다.",
      "msgs": [
        "input",
        "input"
      ],
      "lightBy": [
        "input"
      ]
    },
    {
      "no": "2",
      "flow": "main",
      "text": "시스템이 1초 이내에 GUI 캔버스에 다이어그램을 반영한다.",
      "msgs": [
        "startParse",
        "shown"
      ],
      "lightBy": [
        "apply",
        "render",
        "shown"
      ]
    },
    {
      "no": "3",
      "flow": "main",
      "text": "새로 추가된 객체는 자동 배치되고, 기존에 수동 조정한 객체의 배치는 유지된다.",
      "msgs": [
        "findNew",
        "coords"
      ],
      "lightBy": [
        "findNew",
        "arrange",
        "coords"
      ]
    },
    {
      "no": "2A",
      "flow": "alt",
      "text": "문법 오류가 있으면 반영하지 않고 오류를 표시한다(세부 동작은 추가 확인 필요).",
      "msgs": [
        "showError",
        "showError"
      ],
      "lightBy": [
        "showError"
      ]
    }
  ],
  "parts": [
    "U",
    "Ed",
    "P",
    "M",
    "L",
    "C"
  ],
  "seq": [
    {
      "id": "input",
      "from": "U",
      "to": "Ed",
      "text": "Mermaid 코드 입력",
      "owner": "Ed",
      "op": "onInput"
    },
    {
      "id": "startParse",
      "from": "Ed",
      "to": "Ed",
      "text": "입력이 멈추면 해석 시작",
      "owner": "Ed",
      "op": "startParse"
    },
    {
      "id": "parse",
      "from": "Ed",
      "to": "P",
      "text": "코드 해석 요청",
      "owner": "P",
      "op": "parse"
    },
    {
      "id": "parseResult",
      "from": "P",
      "to": "Ed",
      "text": "해석 결과",
      "owner": "P",
      "op": "parse"
    },
    {
      "frame": "alt",
      "label": "[오류 있음]"
    },
    {
      "id": "showError",
      "from": "Ed",
      "to": "Ed",
      "text": "오류 표시, 그림은 그대로",
      "owner": "Ed",
      "op": "showErrors"
    },
    {
      "frame": "else",
      "label": "[오류 없음]"
    },
    {
      "id": "apply",
      "from": "Ed",
      "to": "M",
      "text": "해석 결과 반영",
      "owner": "M",
      "op": "apply"
    },
    {
      "id": "findNew",
      "from": "M",
      "to": "M",
      "text": "새로 생긴 노드 찾기",
      "owner": "M",
      "op": "findNewNodes"
    },
    {
      "id": "arrange",
      "from": "M",
      "to": "L",
      "text": "배치 요청 (옮긴 노드는 고정)",
      "owner": "L",
      "op": "arrange"
    },
    {
      "id": "coords",
      "from": "L",
      "to": "M",
      "text": "좌표",
      "owner": "L",
      "op": "arrange"
    },
    {
      "id": "render",
      "from": "M",
      "to": "C",
      "text": "다시 그리기",
      "owner": "C",
      "op": "render"
    },
    {
      "id": "shown",
      "from": "C",
      "to": "U",
      "text": "반영된 다이어그램",
      "owner": "C",
      "op": "render"
    },
    {
      "frame": "end"
    }
  ],
  "try": {
    "start": "classDiagram\n  Order --> Payment\n  Order --> Customer",
    "hint": "`Payment`를 끌어 옮긴 뒤 줄을 넣어 보세요.",
    "buttons": [
      {
        "label": "줄 넣기 `Order --> Coupon`",
        "op": "code",
        "args": {
          "append": "Order --> Coupon"
        }
      },
      {
        "label": "오류 줄 넣기 `Coupon -->`",
        "op": "code",
        "args": {
          "append": "Coupon -->"
        }
      }
    ]
  },
  "otherOps": [
    {
      "uc": "UC-02",
      "op": "drag",
      "note": "캔버스에서 노드를 끄는 것은 UC-02 조작입니다. 끈 노드는 기본 흐름 3의 “수동 조정한 객체”가 됩니다."
    }
  ],
  "discuss": [
    {
      "id": "d1",
      "title": "오류가 있는 동안 코드와 그림이 다르다",
      "body": "사후조건은 코드와 GUI가 서로 일치하는 상태로 유지된다고 하는데, 대안 흐름 2A는 오류가 있으면 반영하지 않습니다. 오류 줄이 남아 있는 동안에는 둘이 다릅니다. 사후조건을 “오류가 없을 때”의 이야기로 읽을지 확인이 필요합니다.",
      "basis": "UC-01 사후조건, 대안 흐름 2A"
    },
    {
      "id": "d2",
      "title": "옮긴 위치를 어디에 저장하고, 코드에는 무엇을 반영하나",
      "body": "GUI에서 옮긴 위치가 코드에도 반영된다고 하지만, Mermaid 클래스 다이어그램에는 좌표를 적는 문법이 없고 저장 항목에도 좌표가 없습니다. 견본은 이 단계를 비워 둡니다.",
      "basis": "FR-3, UC-02 기본 흐름 3, DR-1"
    },
    {
      "id": "d3",
      "title": "코드가 바뀔 때, 옮기지 않은 노드도 다시 정렬하나",
      "body": "원문은 사용자가 조정한 배치를 “최대한 유지”한다고만 합니다. 새 노드만 놓는 방식이면 옮긴 노드도 어차피 움직이지 않아서 고정 표시가 할 일이 거의 없습니다. 견본은 차이가 보이도록 “다시 정렬”을 기본으로 두었습니다.",
      "basis": "FR-3, 자동배치와 수동 배치 보존 규칙"
    },
    {
      "id": "d4",
      "title": "“입력 완료”를 무엇으로 볼까",
      "body": "견본은 입력이 0.5초 멈추면 입력 완료로 봅니다('입력이 멈추면 해석 시작'). 적용 버튼을 둘지도 아직 확인되지 않았습니다.",
      "basis": "NFR-1, FR-3 근거"
    }
  ]
};
