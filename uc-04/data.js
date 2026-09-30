window.UC_DATA = {
  "uc": "UC-04",
  "title": "이미지로 내보내기",
  "summary": "사용자가 형식을 고르면, 지금 그림을 이미지로 바꿔 로컬 파일로 저장합니다. 견본은 PNG와 JPG를 고르는 모습까지만 보여 주고 파일은 만들지 않습니다.",
  "pre": "완성된(또는 완성 중인) 다이어그램이 있음",
  "post": "지정한 형식의 이미지 파일이 로컬에 생성된다.",
  "steps": [
    {
      "no": "1",
      "flow": "main",
      "text": "사용자가 내보내기를 실행한다.",
      "msgs": [
        "run",
        "askFormat"
      ],
      "lightBy": [
        "run",
        "askFormat"
      ]
    },
    {
      "no": "2",
      "flow": "main",
      "text": "PNG 또는 JPG 형식을 선택한다.",
      "msgs": [
        "choose",
        "choose"
      ],
      "lightBy": [
        "choose"
      ]
    },
    {
      "no": "3",
      "flow": "main",
      "text": "시스템이 이미지 파일을 로컬에 저장한다.",
      "msgs": [
        "encode",
        "saved"
      ],
      "lightBy": [
        "encode",
        "image",
        "save"
      ]
    }
  ],
  "parts": [
    "U",
    "Ex",
    "Enc",
    "Fsv"
  ],
  "seq": [
    {
      "id": "run",
      "from": "U",
      "to": "Ex",
      "text": "내보내기 실행",
      "owner": "Ex",
      "op": "open"
    },
    {
      "id": "askFormat",
      "from": "Ex",
      "to": "U",
      "text": "형식 묻기 (PNG / JPG)",
      "owner": "Ex",
      "op": "open"
    },
    {
      "id": "choose",
      "from": "U",
      "to": "Ex",
      "text": "형식 선택",
      "owner": "Ex",
      "op": "choose"
    },
    {
      "id": "encode",
      "from": "Ex",
      "to": "Enc",
      "text": "지금 그림을 이미지로 바꾸기",
      "owner": "Enc",
      "op": "encode"
    },
    {
      "id": "image",
      "from": "Enc",
      "to": "Ex",
      "text": "이미지 데이터",
      "owner": "Enc",
      "op": "encode"
    },
    {
      "id": "save",
      "from": "Ex",
      "to": "Fsv",
      "text": "파일로 저장",
      "owner": "Fsv",
      "op": "save"
    },
    {
      "id": "saved",
      "from": "Fsv",
      "to": "U",
      "text": "저장된 이미지 파일",
      "owner": "Fsv",
      "op": "save"
    }
  ],
  "try": {
    "start": "classDiagram\n  Order --> Payment\n  Order --> Customer",
    "hint": "형식을 골라 내보내 보세요. 견본은 파일을 만들지 않습니다.",
    "buttons": [
      {
        "label": "PNG로 내보내기",
        "op": "export",
        "args": {
          "format": "PNG"
        }
      },
      {
        "label": "JPG로 내보내기",
        "op": "export",
        "args": {
          "format": "JPG"
        }
      }
    ]
  },
  "otherOps": [],
  "discuss": [
    {
      "id": "d1",
      "title": "JPG로 내보낸 선 그림의 품질을 어디까지 볼까",
      "body": "형식은 PNG 또는 JPG로 정해졌습니다. JPG는 압축 때문에 가는 선과 글자 가장자리가 번질 수 있고, 투명 배경을 담지 못합니다. 논문에 넣을 그림이므로 JPG 품질 값과 배경색(흰색 고정인지)을 정해 둘 필요가 있습니다.",
      "basis": "UC-04 기본 흐름 2, 명세 1.2 프로젝트 목표와 범위"
    },
    {
      "id": "d2",
      "title": "이미지 크기와 글자 크기를 무엇에 맞추나",
      "body": "이 도구는 논문에 넣을 그림을 만드는 도구인데, PNG·JPG로 내보낼 때 픽셀 크기나 배율을 정한 곳이 없습니다. 범위의 “고딕체 단일 크기(최소 32)”가 화면 기준인지 내보낸 이미지 기준인지도 확인이 필요합니다. 견본 기록의 크기는 캔버스 크기를 그대로 적은 것입니다.",
      "basis": "UC-04 사후조건, 명세 1.2 프로젝트 목표와 범위"
    },
    {
      "id": "d3",
      "title": "파일 이름과 저장 위치를 누가 정하나",
      "body": "원문 3단계는 “로컬에 저장한다”고만 합니다. 저장할 때 이름과 위치를 묻는지, 정해진 이름으로 바로 저장하는지, 같은 이름이 있으면 덮어쓰는지 정해지지 않았습니다. 견본 기록의 diagram.png는 예시 이름입니다.",
      "basis": "UC-04 기본 흐름 3, 사후조건"
    },
    {
      "id": "d4",
      "title": "코드에 오류가 있을 때 내보내면 어느 그림이 나가나",
      "body": "사전조건은 “완성 중인” 다이어그램도 내보낼 수 있다고 합니다. 코드에 문법 오류가 있으면 그림은 마지막으로 해석에 성공한 상태로 남으므로(UC-01 2A), 그때 내보낸 이미지는 지금 코드와 다릅니다. 내보내기를 막을지, 알리고 내보낼지 정해야 합니다.",
      "basis": "UC-04 사전조건, UC-01 대안 흐름 2A"
    }
  ]
};
