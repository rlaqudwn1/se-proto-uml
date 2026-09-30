window.UC_DATA = {
  "uc": "UC-05",
  "title": "기존 Mermaid 코드 불러오기",
  "summary": "이미 있는 Mermaid 코드를 불러오면 편집기에 코드가 들어가고 캔버스에 그림이 그려집니다. 클래스와 시퀀스 다이어그램만 그리고, 그 밖의 문법을 어떻게 처리할지는 아직 정하지 않았습니다. 불러온 클래스 그림은 코드를 고치거나 노드를 끌어 이어서 편집할 수 있습니다.",
  "pre": "유효한 Mermaid 코드(파일 또는 텍스트)가 있음",
  "post": "불러온 다이어그램이 편집 가능한 상태가 된다.",
  "steps": [
    {
      "no": "1",
      "flow": "main",
      "text": "사용자가 불러오기를 실행한다.",
      "msgs": [
        "open",
        "open"
      ],
      "lightBy": [
        "open"
      ]
    },
    {
      "no": "2",
      "flow": "main",
      "text": "기존 Mermaid 코드를 입력/선택한다.",
      "msgs": [
        "choose",
        "toEditor"
      ],
      "lightBy": [
        "choose",
        "toEditor"
      ]
    },
    {
      "no": "3",
      "flow": "main",
      "text": "시스템이 해당 다이어그램을 캔버스에 렌더링한다.",
      "msgs": [
        "apply",
        "shown"
      ],
      "lightBy": [
        "apply",
        "render",
        "shown"
      ]
    },
    {
      "no": "2A",
      "flow": "alt",
      "text": "지원하지 않는 문법(클래스/시퀀스 외)이 포함되면 처리 방법을 정의해야 한다(미정).",
      "msgs": [
        "unsupported",
        "unsupported"
      ],
      "lightBy": [
        "unsupported"
      ]
    }
  ],
  "parts": [
    "U",
    "Im",
    "P",
    "Ed",
    "M",
    "L",
    "C"
  ],
  "seq": [
    {
      "id": "open",
      "from": "U",
      "to": "Im",
      "text": "불러오기 실행",
      "owner": "Im",
      "op": "open"
    },
    {
      "id": "choose",
      "from": "U",
      "to": "Im",
      "text": "코드 붙여 넣기 또는 파일 고르기",
      "owner": "Im",
      "op": "read"
    },
    {
      "id": "parse",
      "from": "Im",
      "to": "P",
      "text": "코드 해석 요청",
      "owner": "P",
      "op": "parse"
    },
    {
      "id": "parseResult",
      "from": "P",
      "to": "Im",
      "text": "해석 결과 (다이어그램 종류 포함)",
      "owner": "P",
      "op": "parse"
    },
    {
      "frame": "alt",
      "label": "[클래스·시퀀스 외 문법]"
    },
    {
      "id": "unsupported",
      "from": "Im",
      "to": "Im",
      "text": "처리 방법 미정 (2A)",
      "owner": "Im",
      "op": "handleUnsupported"
    },
    {
      "frame": "else",
      "label": "[클래스 또는 시퀀스]"
    },
    {
      "id": "toEditor",
      "from": "Im",
      "to": "Ed",
      "text": "불러온 코드 넣기",
      "owner": "Ed",
      "op": "onInput"
    },
    {
      "id": "apply",
      "from": "Im",
      "to": "M",
      "text": "해석 결과로 새 다이어그램",
      "owner": "M",
      "op": "apply"
    },
    {
      "id": "arrange",
      "from": "M",
      "to": "L",
      "text": "배치 요청 (좌표 없음, 모두 자동)",
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
      "text": "그리기",
      "owner": "C",
      "op": "render"
    },
    {
      "id": "shown",
      "from": "C",
      "to": "U",
      "text": "불러온 다이어그램",
      "owner": "C",
      "op": "render"
    },
    {
      "frame": "end"
    }
  ],
  "try": {
    "start": "classDiagram",
    "hint": "예시를 불러온 뒤 코드를 고치거나 노드를 끌어 보세요.",
    "buttons": [
      {
        "label": "클래스 불러오기",
        "op": "import",
        "args": {
          "code": "classDiagram\n  Library o-- Book\n  Member --> Loan\n  Loan --> Book"
        }
      },
      {
        "label": "시퀀스 불러오기",
        "op": "import",
        "args": {
          "code": "sequenceDiagram\n  actor 고객\n  participant 주문\n  participant 결제\n  고객->>주문: 주문하기\n  주문->>결제: 결제 요청\n  결제-->>주문: 결제 완료\n  주문-->>고객: 주문 확인",
          "preview": {
            "participants": [
              {
                "id": "A",
                "name": "고객",
                "actor": true
              },
              {
                "id": "B",
                "name": "주문"
              },
              {
                "id": "C",
                "name": "결제"
              }
            ],
            "seq": [
              {
                "id": "m1",
                "from": "A",
                "to": "B",
                "text": "주문하기",
                "owner": "B",
                "op": "m1"
              },
              {
                "id": "m2",
                "from": "B",
                "to": "C",
                "text": "결제 요청",
                "owner": "C",
                "op": "m2"
              },
              {
                "id": "m3",
                "from": "C",
                "to": "B",
                "text": "결제 완료",
                "owner": "C",
                "op": "m2"
              },
              {
                "id": "m4",
                "from": "B",
                "to": "A",
                "text": "주문 확인",
                "owner": "B",
                "op": "m1"
              }
            ]
          }
        }
      },
      {
        "label": "flowchart 불러오기",
        "op": "import",
        "args": {
          "code": "flowchart LR\n  A[주문] --> B[결제]\n  B --> C[완료]"
        }
      }
    ]
  },
  "otherOps": [
    {
      "uc": "UC-01",
      "op": "code",
      "note": "편집기에서 코드를 고치는 것은 UC-01 조작입니다. 사후조건 “불러온 다이어그램이 편집 가능한 상태가 된다”를 확인할 수 있습니다."
    },
    {
      "uc": "UC-02",
      "op": "drag",
      "note": "캔버스에서 노드를 끄는 것은 UC-02 조작입니다. 클래스 그림만 끌 수 있고, 시퀀스 그림은 끌리지 않습니다."
    }
  ],
  "discuss": [
    {
      "id": "d1",
      "title": "클래스·시퀀스 외 문법을 어떻게 처리할까",
      "body": "대안 흐름 2A는 처리 방법을 정의해야 한다고만 적혀 있습니다. 모두 거부하기, 편집기에만 넣고 그리지 않기, 지원하는 부분만 그리기 등을 고를 수 있습니다. 견본은 코드를 받아들이지 않은 것으로 보고 편집기와 캔버스를 그대로 두며, 2단계를 켜지 않습니다. “포함되면”이 코드 종류(첫 줄)만 뜻하는지, 클래스 코드 안의 지원하지 않는 줄도 뜻하는지도 확인이 필요합니다.",
      "basis": "UC-05 대안 흐름 2A, FR-5"
    },
    {
      "id": "d2",
      "title": "옮긴 위치를 어디에 저장하고, 코드에는 무엇을 반영하나",
      "body": "불러온 Mermaid 코드에는 좌표가 없어서 처음 불러오면 모든 노드가 자동 배치됩니다. 그 뒤 GUI에서 옮긴 위치가 코드에도 반영된다고 하지만, Mermaid 클래스 다이어그램에는 좌표를 적는 문법이 없고 저장 항목에도 좌표가 없습니다. 견본은 이 단계를 비워 둡니다.",
      "basis": "FR-3, UC-02 기본 흐름 3, DR-1"
    },
    {
      "id": "d3",
      "title": "Mermaid 코드 불러오기와 작업 파일 불러오기는 같은 기능인가",
      "body": "FR-6은 Mermaid 코드를 불러와 편집을 시작하는 기능이고, FR-8은 코드·배치·스타일을 담은 작업 파일을 저장하고 불러오는 기능입니다. 작업 파일을 불러오면 배치가 복원되지만, Mermaid 코드만 불러오면 자동 배치됩니다. 두 기능을 한 메뉴와 한 부품으로 둘지 정해야 합니다. 또 FR-8은 배치를 저장한다고 하지만 DR-1의 저장 항목에는 좌표가 없어, 논의할 점 2와 함께 정해야 합니다.",
      "basis": "FR-6, FR-8, DR-1, UC-05 사전조건"
    },
    {
      "id": "d4",
      "title": "문법 오류가 있는 코드를 불러오면",
      "body": "사전조건이 유효한 Mermaid 코드를 가정하므로, 오류가 있는 코드를 불러올 때의 흐름이 없습니다. UC-01의 2A처럼 오류를 보이고 편집기에는 넣을지, 불러오기를 거부할지 정해야 합니다. 견본의 예시는 모두 유효한 코드입니다.",
      "basis": "UC-05 사전조건, UC-01 대안 흐름 2A"
    },
    {
      "id": "d5",
      "title": "불러온 시퀀스 그림은 어떻게 편집하나",
      "body": "사후조건은 불러온 다이어그램이 편집 가능한 상태가 된다고 합니다. 시퀀스 다이어그램도 지원 대상이지만, 마우스 배치와 스냅이 시퀀스 그림에서 무엇을 뜻하는지(참여자 순서 바꾸기 등)는 원문에 없습니다. 견본은 시퀀스 그림을 끌 수 없게 두었습니다.",
      "basis": "UC-05 사후조건, FR-5, FR-2"
    }
  ]
};
