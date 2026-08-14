import * as XLSX from 'xlsx';
import { Ordinance } from './types';

export function exportOrdinancesToExcel(items: Ordinance[], fileNamePrefix = "부산시의회_타시도_조례모니터링_보고서") {
  if (!items || items.length === 0) {
    alert("다운로드할 데이터가 없습니다.");
    return;
  }

  const exportData = items.map((item, index) => ({
    "연번": index + 1,
    "시도명": item.org_name,
    "조례명": item.title,
    "제개정구분": item.change_type,
    "공포일자": item.promul_date,
    "공포번호": item.promul_no || "-",
    "소관부서/상임위": item.dept_name || "-",
    "주요내용 요약": item.summary || "-",
    "부산시 유무/발굴 여부": item.is_busan_enacted === 0 ? "부산시 미제정 (발굴 추천)" : "부산시 기제정",
    "부산시 조례 대조결과": item.busan_match_reason || "-",
    "입법 시사점 요약": item.legislative_points || "-",
    "검토상태": item.review_status || "미검토",
    "정책지원관 메모": item.memo || "-",
    "원문URL": item.full_text_url || "-"
  }));

  // Create worksheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // 연번
    { wch: 14 }, // 시도명
    { wch: 38 }, // 조례명
    { wch: 12 }, // 제개정구분
    { wch: 12 }, // 공포일자
    { wch: 12 }, // 공포번호
    { wch: 24 }, // 소관부서
    { wch: 45 }, // 주요내용
    { wch: 22 }, // 부산시 유무
    { wch: 32 }, // 부산시 대조결과
    { wch: 50 }, // 입법 시사점
    { wch: 12 }, // 검토상태
    { wch: 35 }, // 메모
    { wch: 35 }, // 원문URL
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "타시도 조례 발굴 목록");

  // Format timestamp for filename
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
