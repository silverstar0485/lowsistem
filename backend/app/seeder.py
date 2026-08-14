import sqlite3
import random
import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, init_db
from gap_analyzer import analyze_busan_gap

BUSAN_MASTER_ORDINANCES = [
    {"title": "부산광역시 청년 기본 조례", "dept_name": "청년산학국", "enact_date": "2018-05-09", "keywords": "청년, 일자리, 주거"},
    {"title": "부산광역시 해양산업 육성 및 지원 조례", "dept_name": "해양농수산국", "enact_date": "2016-11-02", "keywords": "해양, 물류, 항만"},
    {"title": "부산광역시 소상공인 지원 조례", "dept_name": "소상공인지원과", "enact_date": "2015-08-05", "keywords": "소상공인, 금융, 점포"},
    {"title": "부산광역시 인구정책 기본 조례", "dept_name": "기획조정실", "enact_date": "2021-03-24", "keywords": "인구, 저출생, 고령화"},
    {"title": "부산광역시 스마트도시 조성 및 운영 조례", "dept_name": "디지털경제혁신실", "enact_date": "2020-07-15", "keywords": "스마트도시, ICT, 데이터"},
    {"title": "부산광역시 기후위기 대응을 위한 탄소중립·녹색성장 기본 조례", "dept_name": "환경물정책실", "enact_date": "2022-09-21", "keywords": "탄소중립, 기후, 온실가스"},
    {"title": "부산광역시 고독사 예방 및 사회적 고립 가구 지원 조례", "dept_name": "복지건강국", "enact_date": "2019-12-25", "keywords": "고독사, 1인가구, 복지"},
    {"title": "부산광역시 야간관광 활성화 조례", "dept_name": "관광마이스국", "enact_date": "2023-04-12", "keywords": "관광, 야간, 축제"},
    {"title": "부산광역시 수소산업 육성 및 지원 조례", "dept_name": "미래산업국", "enact_date": "2021-11-10", "keywords": "수소, 에코, 에너지"},
    {"title": "부산광역시 반려동물 보호 및 문화조성에 관한 조례", "dept_name": "해양농수산국", "enact_date": "2020-02-19", "keywords": "반려동물, 동물복지, 펫"}
]

REGIONS = [
    "서울특별시", "경기도", "인천광역시", "대구광역시", "대전광역시", 
    "광주광역시", "울산광역시", "세종특별자치시", "강원특별자치도", "충청북도", 
    "충청남도", "전북특별자치도", "전라남도", "경상북도", "경상남도", "제주특별자치도"
]

SAMPLE_ORDINANCE_TEMPLATES = [
    # 1. AI & 미래기술
    {
        "title": "{region} 생성형 인공지능(AI) 기술 활용 및 안전관리 조례",
        "change_type": "제정",
        "dept_name": "디지털혁신담당관 / 기획재경위원회",
        "reason": "생성형 AI 기술의 행정 업무 활용 증대에 따라 데이터 보안, 개인정보 보호 및 딥페이크 등 부작용을 예방하고 안전한 AI 활용 기반을 조성하고자 함.",
        "summary": "생성형 AI 가이드라인 수립, 행정서비스 도입 시 안전성 평가, AI 윤리교육 의무화 및 관련 스타트업 육성 지원 근거 마련.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90001"
    },
    {
        "title": "{region} 자율주행자동차 상용화 및 안전운행 지원 조례",
        "change_type": "제정",
        "dept_name": "교통국 / 건설교통위원회",
        "reason": "자율주행 시범운행지구 내 안전점검 체계 구축 및 자율주행 기반 대중교통 인프라 확충 지원.",
        "summary": "자율주행 시범지구 지정 지원, 사고 대응 안전기준 수립, 자율버스 및 셔틀 운행 보조금 지급 조항 신설.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90002"
    },
    {
        "title": "{region} 딥페이크 등 디지털 성범죄 예방 및 피해자 지원 조례",
        "change_type": "제정",
        "dept_name": "여성가족국 / 보건복지위원회",
        "reason": "최근 청소년 대상 딥페이크 합성물 유포 피해 급증에 따라 긴급 영상 삭제 지원 및 디지털 피해자 심리치료 지원체계 강화.",
        "summary": "디지털성범죄 피해지원센터 설치, 24시간 긴급 상담 및 영상 삭제 지원, 초·중·고 딥페이크 예방 교육 지원.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90003"
    },
    
    # 2. 인구감소 & 청년/가족
    {
        "title": "{region} 인구감소지역 맞춤형 정주 여건 개선 지원 조례",
        "change_type": "제정",
        "dept_name": "균형발전국 / 행정안전위원회",
        "reason": "지방소멸 위기 지역의 정주 인구 및 생활인구 확대를 위해 주택 정비, 생활 인프라 및 전입 지원금 확대.",
        "summary": "생활인구 지원 시책 수립, 빈집 정비 지원사업, 청년 및 귀농귀촌인 맞춤형 주택 제공 및 일자리 연계 지원.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90004"
    },
    {
        "title": "{region} 청년 주거비 부담 완화 및 월세 지원 조례",
        "change_type": "일부개정",
        "dept_name": "청년정책관 / 기획재경위원회",
        "reason": "청년 가구의 주거비 부담 경감을 위해 한시적 월세 지원 대상을 확대하고 주거보증금 이자 지원 한도 증액.",
        "summary": "월세 지원 소득 요건 완화(중위소득 150% 이하), 무이자 보증금 대출 대상 확대 및 청년 공공임대 입주 우대 가점 신설.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90005"
    },
    {
        "title": "{region} 신혼부부 및 다자녀 가구 주택 마련 이자 지원 조례",
        "change_type": "제정",
        "dept_name": "주택토지국 / 도시환경위원회",
        "reason": "저출생 극복을 위해 신혼부부 및 2자녀 이상 다자녀 가구의 전세자금 대출 이자 지원 및 주택 구입 이자 보전.",
        "summary": "신혼부부 최대 연 300만원 이자 지원, 다자녀 가구 자녀수에 비례한 추가 금리 우대 보조금 지원 체계 구축.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90006"
    },

    # 3. 소상공인 & 지역경제
    {
        "title": "{region} 소상공인 배달수수료 및 디지털 전환 지원 조례",
        "change_type": "제정",
        "dept_name": "소상공인과 / 경제산업위원회",
        "reason": "고물가·고금리 속 배달 플랫폼 중개수수료 부담 완화를 위해 공공배달앱 연동 배달비 지원 및 스마트 결제 단말기 보급.",
        "summary": "소상공인 1곳당 연 최대 30만원 배달료 지원, 키오스크 및 AI 주문 시스템 도입 보조금 지원 근거 마련.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90007"
    },
    {
        "title": "{region} 전통시장 및 상권활성화 구역 야간 마켓 육성 조례",
        "change_type": "제정",
        "dept_name": "소상공인지원과 / 경제산업위원회",
        "reason": "지역 대표 전통시장의 야간 특화 거리 조성을 통해 침체된 상권 활성화 및 관광객 유치 도모.",
        "summary": "야시장 설치 및 도로점용 허가 특례, 조명 및 안전시설 개선 보조금 지급, 문화 공연 지원 규정 조항 포함.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90008"
    },

    # 4. 해양 & 신산업 / 기후
    {
        "title": "{region} 스마트항만 및 해양물류 산업 육성 지원 조례",
        "change_type": "제정",
        "dept_name": "해양수산국 / 농수산해양위원회",
        "reason": "자동화 항만 크레인, 스마트 물류 센서 및 친환경 선박 항만 인프라 조성을 통한 해양물류 경쟁력 강화.",
        "summary": "스마트물류 R&D 사업 보조금, 항만 빅데이터 공유 플랫폼 구축, 친환경 육상전원공급장치(AMP) 설치 지원.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90009"
    },
    {
        "title": "{region} 친환경 수소모빌리티 및 충전 인프라 보급 촉진 조례",
        "change_type": "전부개정",
        "dept_name": "기후환경국 / 환경복지위원회",
        "reason": "수소 버스, 수소 트럭 등 상용차 수소 전환 가속화를 위해 충전소 우선 부지 확보 및 가스요금 일부 보조.",
        "summary": "수소충전소 공공부지 무상 임대 범위 확대, 수소 상용차 구매 보조금 신설, 수소 안전관리 모니터링 강화.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90010"
    },
    {
        "title": "{region} 공동주택 전기자동차 충전시설 화재예방 및 안전 지원 조례",
        "change_type": "제정",
        "dept_name": "소방본부 / 행정안전위원회",
        "reason": "지하주차장 전기차 화재 발생 시 대형 재난 방지를 위해 질식소화포, 열화상 카메라, 스프링클러 개선 보조금 제공.",
        "summary": "전기차 지하 충전소 소화 설비 보조금 자금 지원, 지상 충전 시설 이전 지원금지급, 소방당국과 연계한 철저한 화재훈련 의무화.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90011"
    },

    # 5. 복지 & 돌봄 / 문화
    {
        "title": "{region} 어르신 스마트 돌봄 로봇 및 AI 안부 확인 서비스 지원 조례",
        "change_type": "제정",
        "dept_name": "복지국 / 보건복지위원회",
        "reason": "독거노인 고독사 방지 및 건강 관리를 위해 AI 케어콜 및 반려로봇을 활용한 24시간 스마트 돌봄망 구축.",
        "summary": "독거 어르신 스마트 로봇 보급 사업, AI 안부전화 플랫폼 구축, 응급 상황 긴급출동 연계 시스템 마련.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90012"
    },
    {
        "title": "{region} 반려동물 친화도시 조성 및 복지 지원 조례",
        "change_type": "일부개정",
        "dept_name": "농축산과 / 농수산해양위원회",
        "reason": "반려동물 인구 1,500만 시대를 맞아 공공 반려동물 테마파크 조성 및 유기동물 입양 시 수의료 지원.",
        "summary": "반려동물 공원 규제 완화, 유기동물 중성화(TNR) 수술비 지원 확대, 펫티켓 모니터링단 운영 조항.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90013"
    },
    {
        "title": "{region} 야간 경제 활성화 및 야간문화 특구 지정 조례",
        "change_type": "제정",
        "dept_name": "문화체육관광국 / 문화복지위원회",
        "reason": "일몰 후 도심 활력을 창출하고 체류형 관광을 촉진하기 위한 야간 문화 특구 지정 및 야간 대중교통 운행 확충.",
        "summary": "야간문화 특구 지정 절차 규정, 야간 도심 셔틀버스 운영 예산 지원, 야간 예술 공연 및 팝업스토어 허가 간소화.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90014"
    },
    {
        "title": "{region} 드론 및 유무인 항공교통(AAM) 산업 육성 조례",
        "change_type": "제정",
        "dept_name": "미래전략과 / 기획재경위원회",
        "reason": "도심항공교통(UAM/AAM) 버티포트 구축 및 긴급 물품 드론 배송 시범사업 규제 혁신 지원.",
        "summary": "도심항공 전용 버티포트 부지 확보, 드론 배송 시범 구역 지정, 관련 항공 전문인력 양성기관 지정 지원.",
        "url_path": "ordin/ordinDetail.do?ordinSeq=90015"
    }
]

def seed_database():
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. 부산시 Master 조례 입력
    cursor.execute("DELETE FROM busan_ordinances;")
    for b_ord in BUSAN_MASTER_ORDINANCES:
        cursor.execute(
            "INSERT INTO busan_ordinances (title, dept_name, enact_date, keywords) VALUES (?, ?, ?, ?)",
            (b_ord['title'], b_ord['dept_name'], b_ord['enact_date'], b_ord['keywords'])
        )
    conn.commit()
    
    # 부산시 조례 마스터 재조회
    cursor.execute("SELECT id, title, dept_name, enact_date, keywords FROM busan_ordinances")
    busan_list = [dict(row) for row in cursor.fetchall()]
    
    # 2. 타시도 조례 sample 110건 생성
    cursor.execute("DELETE FROM ordinances;")
    cursor.execute("DELETE FROM scraps_memos;")
    
    today = datetime.now()
    count = 0
    
    # Generate 110 sample items spanning across last 365 days
    for i in range(115):
        region = REGIONS[i % len(REGIONS)]
        tmpl = SAMPLE_ORDINANCE_TEMPLATES[i % len(SAMPLE_ORDINANCE_TEMPLATES)]
        
        title = tmpl["title"].format(region=region)
        change_type = tmpl["change_type"]
        dept_name = tmpl["dept_name"]
        reason = tmpl["reason"]
        summary = tmpl["summary"]
        
        # Random date within last 365 days
        days_ago = random.randint(1, 350)
        promul_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        promul_no = f"제{random.randint(1100, 3900)}호"
        full_text_url = f"https://www.law.go.kr/{tmpl['url_path']}&region={region}"
        
        # Busan Gap Analysis
        gap_res = analyze_busan_gap(title, reason, summary, busan_list)
        
        cursor.execute("""
            INSERT INTO ordinances (
                org_name, title, change_type, promul_date, promul_no,
                dept_name, reason, summary, full_text_url,
                is_busan_enacted, busan_match_reason, legislative_points
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            region, title, change_type, promul_date, promul_no,
            dept_name, reason, summary, full_text_url,
            gap_res["is_busan_enacted"], gap_res["busan_match_reason"], gap_res["legislative_points"]
        ))
        
        ord_id = cursor.lastrowid
        
        # Add sample scraps/memos for ~12 items
        if i % 9 == 0:
            review_statuses = ["검토예정", "검토중", "발굴완료", "보류"]
            status = review_statuses[i % len(review_statuses)]
            memo = f"【2026년 정책지원관 검토의견】 {region} 사례 참고하여 부산시의회 상임위 발굴 안건으로 제출 예정 (우선도: 상)"
            cursor.execute("""
                INSERT INTO scraps_memos (ordinance_id, is_scrapped, memo, review_status)
                VALUES (?, 1, ?, ?)
            """, (ord_id, memo, status))
            
        count += 1
        
    # Initial Sync log
    cursor.execute("""
        INSERT INTO sync_logs (status, items_added, items_updated, message)
        VALUES ('SUCCESS', ?, 0, '최초 시드 데이터 115건 수집 및 부산시 조례 Gap 분석 완료')
    """, (count,))
    
    conn.commit()
    conn.close()
    print(f"Successfully seeded database with {count} ordinances and Busan master ordinances!")

if __name__ == "__main__":
    seed_database()
