import re

def analyze_busan_gap(ordinance_title: str, reason: str, summary: str, busan_ordinances_list: list):
    """
    타시도 조례와 부산시 기제정 조례 목록을 비교하여 Gap 분석 및 입법 시사점 생성
    """
    clean_title = re.sub(r'\(.*?\)', '', ordinance_title).strip()
    
    # 조례 핵심 키워드 추출 (조례/지원/육성/관리에 관한/개정/제정 등 서술어 제거)
    core_keywords = re.sub(r'(서울특별시|경기도|인천광역시|대구광역시|대전광역시|광주광역시|울산광역시|세종특별자치시|강원특별자치도|충청북도|충청남도|전북특별자치도|전라남도|경상북도|경상남도|제주특별자치도|부산광역시)', '', clean_title)
    core_keywords = re.sub(r'(조례|일부개정조례|전부개정조례|제정안|개정안|지원|육성|관리|설치|운영|촉진|활성화|에 관한|에 관한 조례)', '', core_keywords).strip()
    
    matched_busan_title = None
    similarity_score = 0
    
    # 부산시 기존 조례와 유사도 검사
    for b_ord in busan_ordinances_list:
        b_title = b_ord['title']
        b_clean = re.sub(r'\(.*?\)', '', b_title).replace('부산광역시', '').replace('조례', '').strip()
        
        # 완전 일치 또는 주요 단어 포함 여부 체크
        if core_keywords and len(core_keywords) >= 2:
            if core_keywords in b_clean or b_clean in core_keywords:
                matched_busan_title = b_title
                similarity_score = 0.9
                break
            
            # 단어 집합 매칭
            words_target = set(re.findall(r'\w{2,}', core_keywords))
            words_busan = set(re.findall(r'\w{2,}', b_clean))
            overlap = words_target.intersection(words_busan)
            if len(overlap) >= 2 or (len(words_target) == 1 and len(overlap) == 1):
                matched_busan_title = b_title
                similarity_score = 0.75
                break

    is_busan_enacted = 1 if matched_busan_title else 0
    
    if is_busan_enacted == 1:
        match_reason = f"부산시 유사 조례 보유: 『{matched_busan_title}』"
    else:
        match_reason = f"부산시 미제정 (유사 조례 미검색) - 신규 입법 발굴 검토 권장"
        
    # 입법 시사점 3줄 요약 생성
    legislative_points = generate_legislative_points(clean_title, reason, summary, is_busan_enacted)

    return {
        "is_busan_enacted": is_busan_enacted,
        "busan_match_reason": match_reason,
        "legislative_points": legislative_points
    }

def generate_legislative_points(title: str, reason: str, summary: str, is_enacted: int) -> str:
    """
    정책지원관용 3줄 입법 포인트 요약 생성
    """
    point1 = f"1. [입법 배경] {reason[:120]}..." if len(reason) > 120 else f"1. [입법 배경] {reason}"
    point2 = f"2. [주요 내용] {summary[:130]}..." if len(summary) > 130 else f"2. [주요 내용] {summary}"
    
    if is_enacted == 0:
        point3 = f"3. [부산시 시사점] 해당 분야는 부산시 미제정 상태로, 부산의 지역 특성에 맞춘 조례 제정 추진 시 선제적 정책 효과 기대."
    else:
        point3 = f"3. [부산시 시사점] 부산시에 이미 유사 조례가 존재하나, 타 지자체의 최신 개정 사항 및 지원책을 모니터링하여 기존 조례 개정 검토에 활용 가능."

    return f"{point1}\n{point2}\n{point3}"
