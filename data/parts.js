window.UC_PARTS = {
  "U": {
    "name": "사용자",
    "code": "액터",
    "proposed": false,
    "actor": true,
    "short": "코드를 입력하고 결과를 보는 사람",
    "summary": "시스템 바깥에서 코드를 입력하고 결과를 보는 사람입니다. 클래스가 아니라서 기능이 없습니다.",
    "attrs": [],
    "ops": [],
    "discuss": [
      "코드를 모르는 사용자는 이 흐름 대신 GUI로만 작업합니다(NFR-3). 그 흐름은 UC-02 이후 페이지에서 봅니다."
    ]
  },
  "Im": {
    "name": "불러오기 창",
    "code": "ImportDialog",
    "proposed": true,
    "short": "코드를 받아 해석을 맡기고, 편집기와 모델에 넘김",
    "summary": "불러오기를 실행하면 열려서 파일이나 붙여 넣은 코드를 받습니다. 파서에게 해석을 맡기고, 결과를 편집기와 모델에 넘깁니다.",
    "attrs": ["불러온 코드"],
    "ops": [
      {"key": "open", "sig": "open()", "desc": "불러오기 창 열기"},
      {"key": "read", "sig": "read(source)", "desc": "파일이나 붙여 넣은 글에서 코드 읽기"},
      {"key": "handleUnsupported", "sig": "handleUnsupported()", "desc": "클래스·시퀀스 외 문법 처리 (미정)"}
    ],
    "discuss": [
      "파일 고르기와 붙여 넣기를 한 창에서 받을지",
      "작업 파일 불러오기(FR-8)와 같은 창을 쓸지",
      "불러오기 전 캔버스의 그림을 바꿔 버릴지, 저장을 먼저 물을지"
    ]
  },
  "Ed": {
    "name": "코드 편집기",
    "code": "CodeEditor",
    "proposed": false,
    "short": "코드를 받고, 해석을 맡기고, 오류를 보여 줌",
    "summary": "코드를 입력받고, 해석을 맡기고, 결과에 따라 오류를 보이거나 모델에 넘깁니다.",
    "attrs": ["코드 텍스트"],
    "ops": [
      {"key": "onInput", "sig": "onInput()", "desc": "입력 받기"},
      {"key": "startParse", "sig": "startParse()", "desc": "입력이 멈추면 해석 시작"},
      {"key": "showErrors", "sig": "showErrors()", "desc": "오류 보여 주기"}
    ],
    "discuss": [
      "오류를 코드 줄 옆에 보일지, 따로 목록으로 보일지",
      "편집기를 직접 만들지, 이미 있는 부품을 쓸지"
    ]
  },
  "P": {
    "name": "파서",
    "code": "Parser",
    "proposed": true,
    "short": "Mermaid 코드를 노드·관계로 바꿈",
    "summary": "Mermaid 코드를 읽어 노드와 관계로 바꿉니다. 오류가 있으면 오류를 돌려줍니다.",
    "attrs": [],
    "ops": [
      {"key": "parse", "sig": "parse(code)", "desc": "코드를 노드·관계로 바꾸기"}
    ],
    "discuss": [
      "Mermaid 라이브러리의 해석 기능을 쓸지, 필요한 문법만 직접 해석할지",
      "결과와 오류를 한 번에 돌려주는 방식으로 충분한지",
      "시퀀스 다이어그램의 메시지 순서를 노드·관계로 담을 수 있는지 (FR-5)"
    ]
  },
  "M": {
    "name": "다이어그램 모델",
    "code": "DiagramModel",
    "proposed": true,
    "short": "지금 열린 다이어그램을 들고 있음",
    "summary": "지금 열린 다이어그램 한 장을 들고 있습니다. 해석 결과를 반영하고, 배치와 화면 갱신을 부탁합니다.",
    "attrs": ["현재 다이어그램"],
    "ops": [
      {"key": "apply", "sig": "apply(result)", "desc": "해석 결과 반영"},
      {"key": "findNewNodes", "sig": "findNewNodes()", "desc": "새로 생긴 노드 찾기"},
      {"key": "move", "sig": "move(id, x, y)", "desc": "노드 위치 바꾸기"},
      {"key": "pin", "sig": "pin(id)", "desc": "옮긴 노드로 고정"}
    ],
    "discuss": [
      "새 노드를 무엇으로 구별할지. 노드 ID로 한다면 이름을 바꾼 노드는 새 노드인가?"
    ]
  },
  "L": {
    "name": "배치 엔진",
    "code": "LayoutEngine",
    "proposed": true,
    "short": "노드 자리를 정하고, 옮긴 노드는 그대로 둠",
    "summary": "노드의 자리를 자동으로 정하고, 손으로 옮긴 노드는 그대로 둡니다.",
    "attrs": [],
    "ops": [
      {"key": "arrange", "sig": "arrange()", "desc": "자리 정하기, 옮긴 노드는 고정"}
    ],
    "discuss": [
      "“최대한 보존”에 예외가 있는지. 새 노드 자리가 없으면 옮긴 노드도 밀리는가?",
      "자동 배치를 직접 만들지, 라이브러리를 쓸지"
    ]
  },
  "C": {
    "name": "캔버스",
    "code": "Canvas",
    "proposed": false,
    "short": "다이어그램을 화면에 그림",
    "summary": "다이어그램을 화면에 그립니다.",
    "attrs": [],
    "ops": [
      {"key": "render", "sig": "render()", "desc": "다시 그리기"},
      {"key": "onDrag", "sig": "onDrag(id, x, y)", "desc": "노드 끌기 받기"},
      {"key": "snapTo", "sig": "snapTo(id, x, y)", "desc": "가까운 노드 중심선에 맞추기"}
    ],
    "discuss": [
      "노드 끌기와 스냅(FR-2)을 캔버스가 맡을지, 별도 부품으로 둘지",
      "무엇으로 그릴지 (SVG, HTML Canvas 등)"
    ]
  },
  "Ex": {
    "name": "내보내기 창",
    "code": "ExportDialog",
    "proposed": true,
    "short": "형식을 묻고 내보내기를 이끎",
    "summary": "내보내기를 실행하면 열려서 형식을 묻고, 고른 형식으로 이미지 변환과 저장을 차례로 맡깁니다.",
    "attrs": ["고른 형식"],
    "ops": [
      {"key": "open", "sig": "open()", "desc": "내보내기 창 열기, 형식 묻기"},
      {"key": "choose", "sig": "choose(format)", "desc": "고른 형식 받기"}
    ],
    "discuss": [
      "창을 따로 띄울지, 툴바의 형식 버튼만으로 끝낼지",
      "형식을 PNG·JPG 두 가지로 고정할지, 나중에 늘릴 자리를 둘지 (FR-4)"
    ]
  },
  "Enc": {
    "name": "이미지 변환기",
    "code": "ImageEncoder",
    "proposed": true,
    "short": "지금 그림을 PNG·JPG 이미지로 바꿈",
    "summary": "지금 캔버스의 그림을 고른 형식의 이미지 데이터로 바꿉니다.",
    "attrs": [],
    "ops": [
      {"key": "encode", "sig": "encode(format)", "desc": "그림을 이미지로 바꾸기"}
    ],
    "discuss": [
      "그림을 캔버스에서 그대로 떠 올지, 모델로 다시 그릴지",
      "이미지 크기와 배율을 무엇에 맞출지"
    ]
  },
  "Fsv": {
    "name": "파일 저장기",
    "code": "FileSaver",
    "proposed": true,
    "short": "이미지를 로컬 파일로 저장함",
    "summary": "이미지 데이터를 로컬 파일로 저장합니다.",
    "attrs": [],
    "ops": [
      {"key": "save", "sig": "save(name, data)", "desc": "로컬 파일로 저장"}
    ],
    "discuss": [
      "작업 파일 저장(FR-8)과 같은 부품을 쓸지",
      "같은 이름의 파일이 있으면 덮어쓸지"
    ]
  },
  "Pal": {
    "name": "색상 팔레트",
    "code": "ColorPalette",
    "proposed": true,
    "short": "흑백 포함 색 목록을 보이고 고른 색을 넘김",
    "summary": "흑백을 포함한 색 목록을 보이고, 사용자가 고른 색을 선택 도구에 넘깁니다.",
    "attrs": ["색 목록"],
    "ops": [
      {"key": "pick", "sig": "pick(color)", "desc": "고른 색 받기"}
    ],
    "discuss": [
      "색 목록을 고정할지, 사용자가 색을 더할 수 있게 할지",
      "색이 몇 개인지: 흑백 포함 4개인지 흑백 더하기 4개인지 (FR-7, AC-7)"
    ]
  },
  "Sel": {
    "name": "선택 도구",
    "code": "SelectionTool",
    "proposed": true,
    "short": "누른 도형을 기억하고 그 도형에 색을 칠함",
    "summary": "캔버스에서 누른 도형을 선택으로 기억하고, 팔레트에서 넘어온 색을 그 도형에 칠합니다.",
    "attrs": ["선택한 도형"],
    "ops": [
      {"key": "select", "sig": "select(id)", "desc": "누른 도형을 선택으로 두기"},
      {"key": "applyColor", "sig": "applyColor(color)", "desc": "선택한 도형에 색 칠하기"}
    ],
    "discuss": [
      "색을 실제로 들고 있을 곳이 다이어그램 모델인지, 따로 둔 스타일 자료인지",
      "고른 도형을 캔버스에 어떻게 표시할지. 다중 선택 편집은 범위에서 빠져 있어 하나씩 고릅니다(FR-8)"
    ]
  }
};
